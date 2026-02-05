import cloudinary from '../config/cloudinary.js';
import { extractCertificateData } from '../services/geminiService.js';
import { generateCertificatePDF } from '../services/pdfService.js';
import { hashFile } from '../services/hashService.js';
import {
    getCertificateFromBlockchain,
    contract,
    provider
} from '../services/blockchainService.js';
import { readFileSync, unlinkSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';

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
        // Find the block where specific time happened
        const estimatedBlock = await findBlockNumberByTimestamp(issuedAt);
        const currentBlock = await withRetry(() => provider.getBlockNumber());

        const filter = contract.filters.CertificateIssued(certId);

        // Search radius (blocks)
        // Since we are now accurate with the start time, we don't need huge radii for drift.
        // But we need to account for:
        // 1. Clock skew between backend (generating issuedAt) and Blockchain miner time.
        // 2. Delay between "issuedAt" generation and actual transaction inclusion.
        // Usually tx is included AFTER issuedAt.
        // So we search from (estimatedBlock - small_buffer) to (estimatedBlock + large_buffer)

        const searchRange = 50000; // Search forward reasonably
        const startBlock = Math.max(0, estimatedBlock - 100); // 100 blocks (~10 mins) buffer before
        const endBlock = Math.min(currentBlock, estimatedBlock + searchRange);

        // Chunking loop to respect RPC limit
        const CHUNK_SIZE = 2000;
        let cursor = startBlock;

        while (cursor < endBlock) {
            const chunkTo = Math.min(endBlock, cursor + CHUNK_SIZE);

            try {
                const events = await withRetry(() => contract.queryFilter(filter, cursor, chunkTo));
                if (events && events.length > 0) return events[0].transactionHash;
            } catch (e) {
                console.warn(`Search failed ${cursor}-${chunkTo}:`, e.message);
            }

            cursor = chunkTo;
        }

    } catch (e) {
        console.warn(`Failed to fetch txHash for certId ${certId}:`, e.message);
    }
    return null; // Return null if not found (UI displays as "N/A" or link disabled)
};

// Helper to get Revocation TxHash from events
const getRevocationTxHash = async (certId, issuedAt) => {
    try {
        if (!provider) return null;

        const currentBlock = await withRetry(() => provider.getBlockNumber());

        // Revocation happens strictly AFTER issuance.
        // But we don't know WHEN it was revoked.
        // However, we can start searching from issuance block onwards.
        const issuanceBlock = await findBlockNumberByTimestamp(issuedAt);

        const filter = contract.filters.CertificateRevoked(certId);

        // Search from issuance to HEAD
        const CHUNK_SIZE = 2000;
        let cursor = Math.max(0, issuanceBlock - 100);

        while (cursor <= currentBlock) {
            const chunkTo = Math.min(currentBlock, cursor + CHUNK_SIZE);

            try {
                const events = await withRetry(() => contract.queryFilter(filter, cursor, chunkTo));
                if (events && events.length > 0) {
                    return events[0].transactionHash;
                }
            } catch (e) {
                console.warn(`Revocation search failed ${cursor}-${chunkTo}:`, e.message);
            }

            if (cursor === currentBlock) break;
            cursor = chunkTo;
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

        res.json({
            success: true,
            certificateId,
            certHash,
            fileUrl: cloudinaryResult.secure_url,
            cloudinaryPublicId: cloudinaryResult.public_id,
            fileType: mimeType.startsWith('image/') ? 'image' : 'pdf',
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
        const cloudinaryResult = await withRetry(() => new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'certificates',
                    resource_type: 'auto',
                    format: 'pdf',
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
        // No MongoDB to save to. We just acknowledge success.
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
                const allCerts = await contract.getAllCertificates();
                const found = allCerts.find(c => c.certificateIdString === certId || Number(c.certId) === numericId);
                if (found) {
                    // Map struct to object
                    certificate = {
                        certId: Number(found.certId),
                        issuer: found.issuer,
                        certHash: found.certHash,
                        certificateId: found.certificateIdString,
                        studentName: found.studentName,
                        courseName: found.courseName,
                        courseCode: found.courseCode,
                        trainingType: found.trainingType,
                        duration: found.duration,
                        result: found.result,
                        issuerName: found.issuerName,
                        issuerWebsite: found.issuerWebsite,
                        issuerContact: found.issuerContact,
                        fileUrl: found.fileUrl,
                        fileType: found.fileType,
                        issuedAt: Number(found.issuedAt),
                        revoked: found.revoked,
                        revokeTxHash: found.revokeTxHash
                    };
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

        res.json({
            success: true,
            certificate, // Return the full data from blockchain
            blockchain: {
                valid: blockchainValid,
                data: certificate,
            },
            integrity: {
                valid: true,
                message: 'Data sourced directly from Blockchain.'
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
            const allCerts = await contract.getAllCertificates();
            // Assuming certHash on chain is stored as bytes32, and our hash is hex string.
            // We might need to handle '0x' prefix.
            const targetHash = certHash.startsWith('0x') ? certHash : `0x${certHash}`;

            const found = allCerts.find(c => c.certHash === targetHash);

            if (found) {
                certificate = {
                    certId: Number(found.certId),
                    issuer: found.issuer,
                    certHash: found.certHash,
                    certificateId: found.certificateIdString,
                    studentName: found.studentName,
                    courseName: found.courseName,
                    courseCode: found.courseCode,
                    trainingType: found.trainingType,
                    duration: found.duration,
                    result: found.result,
                    issuerName: found.issuerName,
                    issuerWebsite: found.issuerWebsite,
                    issuerContact: found.issuerContact,
                    fileUrl: found.fileUrl,
                    fileType: found.fileType,
                    issuedAt: Number(found.issuedAt),
                    revoked: found.revoked,
                    revokeTxHash: found.revokeTxHash
                };
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
                const allCerts = await contract.getAllCertificates();
                const found = allCerts.find(c => c.certificateIdString === certId || Number(c.certId) === numericId);
                if (found) {
                    certificate = {
                        fileUrl: found.fileUrl,
                        certificateId: found.certificateIdString,
                        fileType: found.fileType
                    };
                }
            } catch (e) { }
        }


        if (!certificate) {
            return res.status(404).json({ error: 'Không tìm thấy chứng chỉ' });
        }

        res.json({
            success: true,
            downloadUrl: certificate.fileUrl,
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

        // Fetch all from blockchain
        const allCertsStruct = await withRetry(() => contract.getAllCertificates());

        // 1. Map to basic JS objects (cheap)
        let allCerts = allCertsStruct.map(cert => ({
            certId: Number(cert.certId),
            issuer: cert.issuer,
            certHash: cert.certHash,
            certificateId: cert.certificateIdString,
            studentName: cert.studentName,
            courseName: cert.courseName,
            courseCode: cert.courseCode,
            trainingType: cert.trainingType,
            duration: cert.duration,
            result: cert.result,
            issuerName: cert.issuerName,
            issuerWebsite: cert.issuerWebsite,
            issuerContact: cert.issuerContact,
            fileUrl: cert.fileUrl,
            fileType: cert.fileType,
            issuedAt: Number(cert.issuedAt),
            revoked: cert.revoked,
            revokeTxHash: cert.revokeTxHash,
            status: cert.revoked ? 'REVOKED' : 'ISSUED'
        })).sort((a, b) => b.issuedAt - a.issuedAt); // Descending order (newest first)

        // 2. Filter
        if (status) {
            allCerts = allCerts.filter(c => c.status === status);
        }

        if (issuerAddress) {
            allCerts = allCerts.filter(c => c.issuer.toLowerCase() === issuerAddress.toLowerCase());
        }

        const count = allCerts.length;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        // 3. Slice (Pagination)
        const paginatedCerts = allCerts.slice(startIndex, endIndex);

        // 4. Enrich ONLY the paginated results with TxHash
        // This drastically reduces RPC calls from N to 'limit' (10)
        const enrichedCerts = await Promise.all(paginatedCerts.map(async (cert) => {
            // Enriched data
            const enriched = { ...cert };

            const txPromises = [];

            // Issuance Hash
            txPromises.push(getIssuanceTxHash(cert.certId, cert.issuedAt).then(hash => {
                enriched.txHash = hash;
            }));

            // Revocation Hash
            if (cert.revoked) {
                txPromises.push(getRevocationTxHash(cert.certId, cert.issuedAt).then(hash => {
                    if (hash) enriched.revokeTxHash = hash;
                }));
            }

            await Promise.all(txPromises);
            return enriched;
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
