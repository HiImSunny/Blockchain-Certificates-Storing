import cloudinary from '../config/cloudinary.js';
import { extractCertificateData } from '../services/geminiService.js';
import { generateCertificatePDF } from '../services/pdfService.js';
import { hashFile } from '../services/hashService.js';
import {
    getCertificateFromBlockchain,
    getAllCertificatesSafe,
    contract,
    provider
} from '../services/blockchainService.js';
import { getFromCache, setCache, CacheKeys } from '../services/cacheService.js';
import { readFileSync, unlinkSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import https from 'https';

const fetchBuffer = (url) => {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode !== 200) {
                reject(new Error(`Failed to fetch file: ${res.statusCode}`));
                return;
            }
            const chunks = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => resolve(Buffer.concat(chunks)));
            res.on('error', (err) => reject(err));
        }).on('error', (err) => reject(err));
    });
};

// Retry helper (5s delay, 3 retries)
const withRetry = async (operation, retries = 3, delay = 5000) => {
    try {
        return await operation();
    } catch (error) {
        if (retries <= 0) throw error;
        console.warn(`Operation failed, retrying in ${delay / 1000}s... (${retries} left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return withRetry(operation, retries - 1, delay);
    }
};

// Helper to find block number by timestamp using binary search
const findBlockNumberByTimestamp = async (targetTimestamp) => {
    try {
        const currentBlock = await withRetry(() => provider.getBlockNumber());
        let min = 0;
        let max = currentBlock;
        let closestBlock = currentBlock;

        // Optimize: if target is very recent, just scan back a bit? 
        // Or if target is very old?
        // Binary search is O(log N), very fast.

        while (min <= max) {
            const mid = Math.floor((min + max) / 2);
            const block = await withRetry(() => provider.getBlock(mid));

            if (!block) {
                // If block is missing (rare), try next one
                min = mid + 1;
                continue;
            }

            if (block.timestamp === targetTimestamp) {
                return mid;
            } else if (block.timestamp < targetTimestamp) {
                min = mid + 1;
            } else {
                max = mid - 1;
                closestBlock = mid; // We want the block AFTER or AT the timestamp (issuance happens after timestamp creation usually)
            }
        }
        return closestBlock;
    } catch (e) {
        console.warn("Error finding block by timestamp:", e);
        // Fallback to estimation if binary search fails heavily
        const currentBlock = await provider.getBlockNumber();
        return Math.max(0, currentBlock - Math.floor((Date.now() / 1000 - targetTimestamp) / 5.8));
    }
};

// Helper to get TxHash from events with precise window search
const getIssuanceTxHash = async (certId, issuedAt) => {
    try {
        // 1. Check Cache
        const cacheKey = `${CacheKeys.TX_HASH_PREFIX}ISSUED_${certId}`;
        const cachedHash = getFromCache(cacheKey);
        if (cachedHash) return cachedHash;

        const estimatedBlock = await findBlockNumberByTimestamp(issuedAt);
        const currentBlock = await withRetry(() => provider.getBlockNumber());
        const filter = contract.filters.CertificateIssued(certId);

        // Search radius (blocks)
        // Drastically reduce search range to avoid RPC limits
        // We expect the tx to be very close to the timestamp.
        const startBlock = Math.max(0, estimatedBlock - 50);
        const endBlock = Math.min(currentBlock, estimatedBlock + 500);

        // Smaller chunk size to be safe with free RPCs
        const CHUNK_SIZE = 500;
        let cursor = startBlock;

        while (cursor < endBlock) {
            const chunkTo = Math.min(endBlock, cursor + CHUNK_SIZE);
            try {
                // Add specific delay between chunks to avoid rate limiting
                const events = await withRetry(() => contract.queryFilter(filter, cursor, chunkTo));
                if (events && events.length > 0) {
                    const txHash = events[0].transactionHash;
                    // 2. Set Cache (Long TTL: 24 hours, effectively immutable)
                    setCache(cacheKey, txHash, 86400);
                    return txHash;
                }
            } catch (e) {
                console.warn(`Search failed ${cursor}-${chunkTo}:`, e.message);
            }
            cursor = chunkTo + 1;
        }

    } catch (e) {
        console.warn(`Failed to fetch txHash for certId ${certId}:`, e.message);
    }
    return null;
};

// Helper to get Revocation TxHash from events
const getRevocationTxHash = async (certId, issuedAt) => {
    try {
        // 1. Check Cache
        const cacheKey = `${CacheKeys.TX_HASH_PREFIX}REVOKED_${certId}`;
        const cachedHash = getFromCache(cacheKey);
        if (cachedHash) return cachedHash;

        if (!provider) return null;
        const currentBlock = await withRetry(() => provider.getBlockNumber());
        const estimatedBlock = await findBlockNumberByTimestamp(issuedAt);

        const filter = contract.filters.CertificateRevoked(certId);

        // Search from issuance time onwards
        const startBlock = Math.max(0, estimatedBlock - 50);

        // Optimistically search only recent history if likely to be recently revoked? 
        // Or search efficiently. 
        // For revocation, it could happen ANYTIME after issuance.
        // We MUST search to HEAD. However, this is expensive.
        // Strategy: Search in larger chunks but RETRY if batch limit hit.

        const CHUNK_SIZE = 1000;
        let cursor = startBlock;

        while (cursor <= currentBlock) {
            const chunkTo = Math.min(currentBlock, cursor + CHUNK_SIZE);
            try {
                const events = await withRetry(() => contract.queryFilter(filter, cursor, chunkTo));
                if (events && events.length > 0) {
                    const txHash = events[0].transactionHash;
                    // 2. Set Cache (Standard TTL: 1 hour, or until re-checked)
                    // Revocation is also immutable event once happened.
                    setCache(cacheKey, txHash, 3600);
                    return txHash;
                }
            } catch (e) {
                console.warn(`Revocation search failed ${cursor}-${chunkTo}:`, e.message);
            }
            if (cursor === currentBlock) break;
            cursor = chunkTo + 1;
        }

    } catch (e) {
        console.warn(`Failed to fetch revokeTxHash for certId ${certId}:`, e.message);
    }
    return null;
};

/**
 * Upload certificate file and extract data
 * POST /api/cert/upload
 */
export const uploadCertificate = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Chưa có file được tải lên' });
        }

        const filePath = req.file.path;
        const mimeType = req.file.mimetype;

        // Upload to Cloudinary with retry
        const cloudinaryResult = await withRetry(() => cloudinary.uploader.upload(filePath, {
            folder: 'certificates',
            resource_type: 'auto',
            type: 'upload',       // Explicitly set as public
            access_mode: 'public' // Ensure public access
        }));

        // Hash the file
        const fileBuffer = readFileSync(filePath);
        const certHash = hashFile(fileBuffer);

        // Extract data using Gemini AI
        let extractedData = {};
        try {
            const { structuredData } = await extractCertificateData(filePath, mimeType);
            extractedData = structuredData;
        } catch (geminiError) {
            console.warn('Gemini extraction failed, continuing without auto-fill:', geminiError);
        }

        // Clean up local file
        unlinkSync(filePath);

        // Generate certificate ID
        const certificateId = `CERT-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`;

        // Determine file type
        const fileType = mimeType.startsWith('image/') ? 'image' : 'pdf';

        // Generate signed URL for PDF files (raw resource type requires signed URLs)
        let fileUrl = cloudinaryResult.secure_url;
        if (fileType === 'pdf') {
            fileUrl = cloudinary.url(cloudinaryResult.public_id, {
                resource_type: 'raw',
                type: 'upload',
                sign_url: true,
                secure: true,
                expires_at: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60) // 1 year
            });
        }

        res.json({
            success: true,
            certificateId,
            certHash,
            fileUrl,
            cloudinaryPublicId: cloudinaryResult.public_id,
            fileType,
            extractedData,
        });
    } catch (error) {
        console.error('Upload error:', error);

        // Clean up file if it exists
        if (req.file?.path) {
            try {
                unlinkSync(req.file.path);
            } catch (e) {
                // Ignore cleanup errors
            }
        }

        res.status(500).json({ error: error.message });
    }
};

/**
 * Create certificate with manual input and generate PDF
 * POST /api/cert/create
 */
export const createCertificate = async (req, res) => {
    try {
        const certificateData = req.body;

        // Generate certificate ID if not provided
        if (!certificateData.certificateId) {
            certificateData.certificateId = `CERT-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`;
        }

        // Generate PDF
        const pdfBuffer = await generateCertificatePDF(certificateData);

        // Upload PDF to Cloudinary with retry
        // Note: Raw files (PDFs) on Cloudinary require signed URLs or download
        const cloudinaryResult = await withRetry(() => new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'certificates',
                    resource_type: 'raw',
                    public_id: `${certificateData.certificateId}.pdf`,
                    type: 'upload'
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            uploadStream.end(pdfBuffer);
        }));

        // Hash the PDF
        const certHash = hashFile(pdfBuffer);

        res.json({
            success: true,
            certificateId: certificateData.certificateId,
            certHash,
            fileUrl: cloudinaryResult.secure_url,
            cloudinaryPublicId: cloudinaryResult.public_id,
            fileType: 'pdf',
        });
    } catch (error) {
        console.error('Create certificate error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Confirm blockchain transaction
 * POST /api/cert/confirm
 * NOTE: Since we are fully on-chain, this endpoint is mainly for acknowledgement or optional logging.
 */
export const confirmCertificate = async (req, res) => {
    try {
        res.json({
            success: true,
            message: 'Certificate issuance confirmed via Blockchain',
        });
    } catch (error) {
        console.error('Confirm certificate error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Verify certificate by ID
 * GET /api/cert/verify/:certId
 * NOTE: certId here should be the Blockchain numeric ID.
 * If a string ID is passed, we might need to search for it.
 */
export const verifyCertificateById = async (req, res) => {
    try {
        const { certId } = req.params;

        // Try to parse as number
        const numericId = parseInt(certId);

        let certificate = null;

        if (!isNaN(numericId) && numericId > 0) {
            // Fetch directly from blockchain by ID
            try {
                certificate = await getCertificateFromBlockchain(numericId);
                // Check if empty (certId == 0)
                if (certificate.certId === 0) {
                    certificate = null;
                }
            } catch (e) {
                // likely not found or error
                certificate = null;
            }
        }

        // If not found by numeric ID, try searching all certificates by String ID (slower)
        if (!certificate) {
            try {
                // Fetch all and find
                const allCerts = await getAllCertificatesSafe();
                const found = allCerts.find(c => c.certificateId === certId || Number(c.certId) === numericId);
                if (found) {
                    certificate = found;
                }
            } catch (e) {
                console.error("Error searching certificates:", e);
            }
        }

        if (!certificate) {
            return res.status(404).json({
                error: 'Không tìm thấy chứng chỉ trên Blockchain',
            });
        }

        // Augment with status and txHash
        certificate.status = certificate.revoked ? 'REVOKED' : 'ISSUED';

        // Parallel fetch for txHash and revokeTxHash
        const txPromises = [];

        if (!certificate.txHash) {
            txPromises.push(getIssuanceTxHash(certificate.certId, certificate.issuedAt).then(hash => {
                certificate.txHash = hash;
            }));
        }

        if (certificate.revoked) {
            txPromises.push(getRevocationTxHash(certificate.certId, certificate.issuedAt).then(hash => {
                // Only override if the existing strict string is empty or invalid, 
                // OR just trust the event log more.
                // Given user request, we trust the event log.
                if (hash) {
                    certificate.revokeTxHash = hash;
                }
            }));
        }

        await Promise.all(txPromises);

        // Blockchain verification status
        const blockchainValid = !certificate.revoked;

        // Proactive Integrity Check: Verify that the file at fileUrl matches the certHash on Blockchain
        let integrityValid = false;
        let integrityMessage = '';
        let actualHash = null;

        try {
            if (certificate.fileUrl) {
                const fileBuffer = await fetchBuffer(certificate.fileUrl);
                actualHash = hashFile(fileBuffer);

                // Normalize hashes for comparison
                const expectedHash = certificate.certHash.toLowerCase().startsWith('0x') ? certificate.certHash.toLowerCase() : `0x${certificate.certHash.toLowerCase()}`;
                const computedHash = actualHash.toLowerCase().startsWith('0x') ? actualHash.toLowerCase() : `0x${actualHash.toLowerCase()}`;

                if (computedHash === expectedHash) {
                    integrityValid = true;
                    integrityMessage = '✅ Khớp: File thực tế trùng khớp hoàn toàn với mã Hash trên Blockchain.';
                } else {
                    integrityValid = false;
                    integrityMessage = '❌ Cảnh báo: File trên kho lưu trữ đã bị sửa đổi hoặc tráo đổi!';
                }
            } else {
                integrityMessage = 'Không tìm thấy URL file để kiểm tra tính toàn vẹn.';
            }
        } catch (error) {
            console.error('Integrity check failed:', error.message);
            integrityMessage = '⚠️ Không thể tải file để kiểm tra tính toàn vẹn (Cloudinary).';
        }

        // Regenerate signed URL for PDFs before returning
        if (certificate.fileUrl && certificate.fileType === 'pdf') {
            certificate.fileUrl = regenerateSignedUrl(certificate.fileUrl, certificate.fileType);
        }

        res.json({
            success: true,
            certificate, // Return the full data from blockchain
            blockchain: {
                valid: blockchainValid,
                data: certificate,
            },
            integrity: {
                valid: integrityValid,
                message: integrityMessage,
                actualHash: actualHash
            }
        });
    } catch (error) {
        console.error('Verify certificate error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Verify certificate by uploading file
 * POST /api/cert/verify-file
 */
export const verifyCertificateByFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Chưa có file được tải lên' });
        }

        const filePath = req.file.path;

        // Hash the uploaded file
        const fileBuffer = readFileSync(filePath);
        const certHash = hashFile(fileBuffer);

        // Clean up local file
        unlinkSync(filePath);

        // Find certificate by hash on Blockchain
        // We iterate through all certificates
        let certificate = null;
        try {
            const allCerts = await getAllCertificatesSafe();
            // Assuming certHash on chain is stored as bytes32, and our hash is hex string.
            // We might need to handle '0x' prefix.
            const targetHash = certHash.startsWith('0x') ? certHash : `0x${certHash}`;

            const found = allCerts.find(c => c.certHash === targetHash);

            if (found) {
                certificate = found;
            }
        } catch (e) {
            console.error("Error searching by hash:", e);
        }

        if (!certificate) {
            return res.status(404).json({
                error: 'Không tìm thấy chứng chỉ với mã hash này trên Blockchain',
                certHash,
            });
        }

        // Augment with status and txHash
        certificate.status = certificate.revoked ? 'REVOKED' : 'ISSUED';

        const txPromises = [];

        if (!certificate.txHash) {
            txPromises.push(getIssuanceTxHash(certificate.certId, certificate.issuedAt).then(hash => {
                certificate.txHash = hash;
            }));
        }

        if (certificate.revoked) {
            txPromises.push(getRevocationTxHash(certificate.certId, certificate.issuedAt).then(hash => {
                if (hash) {
                    certificate.revokeTxHash = hash;
                }
            }));
        }

        await Promise.all(txPromises);

        res.json({
            success: true,
            certificate,
            blockchain: {
                valid: !certificate.revoked,
                data: certificate,
            },
            integrity: {
                valid: true,
                message: 'Data sourced directly from Blockchain.'
            }
        });
    } catch (error) {
        console.error('Verify by file error:', error);

        // Clean up file if it exists
        if (req.file?.path) {
            try {
                unlinkSync(req.file.path);
            } catch (e) {
                // Ignore cleanup errors
            }
        }

        res.status(500).json({ error: error.message });
    }
};

/**
 * Get certificate download URL
 * GET /api/cert/:certId/download
 */
/**
 * Helper to regenerate signed URL for PDF files
 * Extracts public_id from Cloudinary URL and creates new signed URL
 */
const regenerateSignedUrl = (fileUrl, fileType) => {
    if (fileType !== 'pdf') return fileUrl;

    try {
        // Extract public_id from URL, skipping signature and version
        // Split by /upload/ and clean the result
        const urlParts = fileUrl.split('/upload/');
        if (urlParts.length > 1) {
            const afterUpload = urlParts[1];
            // Remove signature (s--xxx--/) and version (v123/) if present
            const cleaned = afterUpload.replace(/^s--[^/]+--\//, '').replace(/^v\d+\//, '');
            // Remove query params
            const publicId = cleaned.split('?')[0];

            // Generate new signed URL
            return cloudinary.url(publicId, {
                resource_type: 'raw',
                type: 'upload',
                sign_url: true,
                secure: true,
                expires_at: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60) // 1 year
            });
        }
    } catch (error) {
        console.error('Failed to regenerate signed URL:', error);
    }

    return fileUrl; // Return original if extraction fails
};

/**
 * Download certificate
 * GET /api/cert/:certId/download
 */
export const downloadCertificate = async (req, res) => {
    try {
        const { certId } = req.params;

        // Re-use verify logic to find cert
        // Simple fetch by numeric ID preferred
        const numericId = parseInt(certId);
        let certificate = null;
        if (!isNaN(numericId) && numericId > 0) {
            try {
                const cert = await getCertificateFromBlockchain(numericId);
                if (cert && cert.certId > 0) certificate = cert;
            } catch (e) { }
        }

        if (!certificate) {
            // Try search
            try {
                const allCerts = await getAllCertificatesSafe();
                const found = allCerts.find(c => c.certificateId === certId || Number(c.certId) === numericId);
                if (found) {
                    certificate = {
                        fileUrl: found.fileUrl,
                        certificateId: found.certificateId,
                        fileType: found.fileType
                    };
                }
            } catch (e) { }
        }


        if (!certificate) {
            return res.status(404).json({ error: 'Không tìm thấy chứng chỉ' });
        }

        // Regenerate signed URL for PDFs
        const downloadUrl = regenerateSignedUrl(certificate.fileUrl, certificate.fileType);

        res.json({
            success: true,
            downloadUrl,
            certificateId: certificate.certificateId,
            fileType: certificate.fileType,
        });
    } catch (error) {
        console.error('Download certificate error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Revoke certificate
 * POST /api/cert/revoke
 * Note: Revocation should mostly be done via Wallet on Frontend.
 * This can be used to just check status or log.
 */
export const revokeCertificateById = async (req, res) => {
    try {
        // Just return success, assuming frontend did the tx.
        res.json({
            success: true,
            message: 'Revocation handled on-chain',
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Get all certificates (for admin dashboard)
 * GET /api/cert/list
 */
export const listCertificates = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, issuerAddress } = req.query;

        // Fetch all from blockchain SAFE
        const allCerts = await getAllCertificatesSafe();

        // 1. Map to basic JS objects (cheap) -> ALREADY MAPPED BY SERVICE
        let processedCerts = allCerts.map(cert => ({
            ...cert,
            status: cert.revoked ? 'REVOKED' : 'ISSUED'
        })); //.sort((a, b) => b.issuedAt - a.issuedAt); // Already sorted by blockchainService

        // 2. Filter
        if (status) {
            processedCerts = processedCerts.filter(c => c.status === status);
        }

        if (issuerAddress) {
            processedCerts = processedCerts.filter(c => c.issuer.toLowerCase() === issuerAddress.toLowerCase());
        }

        const count = processedCerts.length;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        // 3. Slice (Pagination)
        const paginatedCerts = processedCerts.slice(startIndex, endIndex);

        // 4. Enrich
        // OPTIMIZATION: We do NOT fetch TxHash for the list view to ensure speed (< 5s).
        // TxHash will be fetched on-demand in the detail view.
        const enrichedCerts = paginatedCerts.map(cert => ({
            ...cert,
            // Explicitly set these to null or empty to indicate they weren't fetched
            // Frontend should handle this by showing "View Details to see Hash" or fetching it then.
            txHash: cert.txHash || null,
            revokeTxHash: cert.revokeTxHash || null
        }));

        res.json({
            success: true,
            certificates: enrichedCerts,
            totalPages: Math.ceil(count / limit),
            currentPage: Number(page),
            total: count,
        });
    } catch (error) {
        console.error('List certificates error:', error);

        // Sanitize error for frontend
        let clientMessage = error.message;
        if (error.code === 'TIMEOUT' || error.message.includes('timeout')) {
            clientMessage = 'Connection to Blockchain is slow. Please try again later.';
        }

        res.status(500).json({ error: clientMessage });
    }
};

/**
 * Delete certificate file from Cloudinary
 * DELETE /api/cert/delete-file
 * Used when user cancels preview without issuing
 */
export const deleteCertificateFile = async (req, res) => {
    try {
        const { cloudinaryPublicId } = req.body;

        if (!cloudinaryPublicId) {
            return res.status(400).json({ error: 'Missing cloudinaryPublicId' });
        }

        console.log(`Deleting file from Cloudinary: ${cloudinaryPublicId}`);

        // Try deleting as raw resource (for PDFs)
        try {
            await cloudinary.uploader.destroy(cloudinaryPublicId, {
                resource_type: 'raw'
            });
            console.log(`Deleted as raw resource: ${cloudinaryPublicId}`);
        } catch (rawError) {
            console.warn('Failed to delete as raw:', rawError.message);
        }

        // Also try deleting as image resource (for images)
        try {
            await cloudinary.uploader.destroy(cloudinaryPublicId, {
                resource_type: 'image'
            });
            console.log(`Deleted as image resource: ${cloudinaryPublicId}`);
        } catch (imageError) {
            console.warn('Failed to delete as image:', imageError.message);
        }

        res.json({
            success: true,
            message: 'File deletion attempted (may have already been deleted)'
        });
    } catch (error) {
        console.error('Delete file error:', error);
        // Don't fail the request even if deletion fails
        res.json({
            success: true,
            message: 'Cleanup completed with warnings',
            warning: error.message
        });
    }
};

/**
 * Proxy PDF file from Cloudinary
 * GET /api/cert/proxy-pdf/:publicId
 * This endpoint downloads PDF from Cloudinary and streams it to client
 * Bypasses Cloudinary's CORS restrictions for raw files
 */
export const proxyPDF = async (req, res) => {
    try {
        const { publicId } = req.params;

        if (!publicId) {
            return res.status(400).json({ error: 'Missing publicId' });
        }

        console.log(`Proxying PDF: ${publicId}`);
        console.log(`Download mode: ${req.query.download === 'true'}`);

        // Generate a temporary signed URL that works
        console.log('Generating signed URL...');
        const signedUrl = cloudinary.utils.private_download_url(publicId, 'pdf', {
            resource_type: 'raw',
            type: 'upload',
            expires_at: Math.floor(Date.now() / 1000) + 3600 // 1 hour
        });

        console.log(`Using signed URL: ${signedUrl}`);

        // Fetch the file using the signed URL
        console.log('Fetching PDF buffer...');
        const pdfBuffer = await fetchBuffer(signedUrl);
        console.log(`PDF buffer size: ${pdfBuffer.length} bytes`);

        // Check if download mode (for download button) or preview mode (for iframe)
        const isDownload = req.query.download === 'true';
        const disposition = isDownload ? 'attachment' : 'inline';

        // Set headers for PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `${disposition}; filename='${publicId.split('/').pop()}'`);
        res.setHeader('Content-Length', pdfBuffer.length);
        res.setHeader('Cache-Control', 'public, max-age=31536000');

        // Send PDF buffer
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Proxy PDF error:', error);
        res.status(500).json({
            error: 'Failed to load PDF',
            details: error.message,
            publicId: req.params.publicId
        });
    }
};

