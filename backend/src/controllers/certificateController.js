import Certificate from '../models/Certificate.js';
import cloudinary from '../config/cloudinary.js';
import { extractCertificateData } from '../services/geminiService.js';
import { generateCertificatePDF } from '../services/pdfService.js';
import { hashFile } from '../services/hashService.js';
import {
    verifyCertificate,
    getCertificateFromBlockchain,
} from '../services/blockchainService.js';
import { readFileSync, unlinkSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';

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

        // Upload to Cloudinary
        const cloudinaryResult = await cloudinary.uploader.upload(filePath, {
            folder: 'certificates',
            resource_type: 'auto',
        });

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

        // Generate certificate ID
        const certificateId = `CERT-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`;
        certificateData.certificateId = certificateId;

        // Generate PDF
        const pdfBuffer = await generateCertificatePDF(certificateData);

        // Upload PDF to Cloudinary
        const cloudinaryResult = await new Promise((resolve, reject) => {
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
        });

        // Hash the PDF
        const certHash = hashFile(pdfBuffer);

        res.json({
            success: true,
            certificateId,
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
 * Confirm blockchain transaction and save to database
 * POST /api/cert/confirm
 */
export const confirmCertificate = async (req, res) => {
    try {
        const {
            certificateId,
            certHash,
            txHash,
            issuerAddress,
            blockchainCertId,
            fileUrl,
            cloudinaryPublicId,
            fileType,
            ...metadata
        } = req.body;

        // Validate required fields
        if (!certificateId || !certHash || !txHash || !issuerAddress) {
            return res.status(400).json({
                error: 'Thiếu các trường bắt buộc: certificateId, certHash, txHash, issuerAddress',
            });
        }

        // Create certificate record in database
        const certificate = new Certificate({
            certificateId,
            certHash,
            txHash,
            issuerAddress: issuerAddress.toLowerCase(),
            blockchainCertId,
            fileUrl,
            cloudinaryPublicId,
            fileType,
            status: 'ISSUED',
            issuedAt: metadata.issuedAt || new Date(),
            ...metadata,
        });

        await certificate.save();

        res.json({
            success: true,
            message: 'Đã xác nhận và lưu chứng chỉ vào cơ sở dữ liệu',
            certificate,
        });
    } catch (error) {
        console.error('Confirm certificate error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Verify certificate by ID
 * GET /api/cert/verify/:certId
 */
export const verifyCertificateById = async (req, res) => {
    try {
        const { certId } = req.params;

        // Get from database
        const certificate = await Certificate.findOne({ certificateId: certId });

        if (!certificate) {
            return res.status(404).json({
                error: 'Không tìm thấy chứng chỉ trong cơ sở dữ liệu',
            });
        }

        // Verify on blockchain
        let blockchainData = null;
        let blockchainValid = false;

        if (certificate.blockchainCertId) {
            try {
                const verification = await verifyCertificate(
                    certificate.blockchainCertId,
                    certificate.certHash
                );
                blockchainValid = verification.valid && !verification.revoked;

                const bcData = await getCertificateFromBlockchain(certificate.blockchainCertId);
                blockchainData = bcData;
            } catch (bcError) {
                console.warn('Blockchain verification failed:', bcError);
            }
        }

        res.json({
            success: true,
            certificate,
            blockchain: {
                valid: blockchainValid,
                data: blockchainData,
            },
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

        // Find certificate by hash
        const certificate = await Certificate.findOne({ certHash });

        if (!certificate) {
            return res.status(404).json({
                error: 'Không tìm thấy chứng chỉ với mã hash này',
                certHash,
            });
        }

        // Verify on blockchain
        let blockchainValid = false;
        let blockchainData = null;

        if (certificate.blockchainCertId) {
            try {
                const verification = await verifyCertificate(
                    certificate.blockchainCertId,
                    certHash
                );
                blockchainValid = verification.valid && !verification.revoked;

                const bcData = await getCertificateFromBlockchain(certificate.blockchainCertId);
                blockchainData = bcData;
            } catch (bcError) {
                console.warn('Blockchain verification failed:', bcError);
            }
        }

        res.json({
            success: true,
            certificate,
            blockchain: {
                valid: blockchainValid,
                data: blockchainData,
            },
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

        const certificate = await Certificate.findOne({ certificateId: certId });

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
 */
export const revokeCertificateById = async (req, res) => {
    try {
        const { certificateId, txHash } = req.body;

        if (!certificateId || !txHash) {
            return res.status(400).json({
                error: 'Thiếu các trường bắt buộc: certificateId, txHash',
            });
        }

        // Update certificate status in database
        const certificate = await Certificate.findOneAndUpdate(
            { certificateId },
            { status: 'REVOKED', revokedAt: new Date(), revokeTxHash: txHash },
            { new: true }
        );

        if (!certificate) {
            return res.status(404).json({ error: 'Không tìm thấy chứng chỉ' });
        }

        res.json({
            success: true,
            message: 'Đã thu hồi chứng chỉ thành công',
            certificate,
        });
    } catch (error) {
        console.error('Revoke certificate error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Get all certificates (optional - for admin dashboard)
 * GET /api/cert/list
 */
export const listCertificates = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, issuerAddress } = req.query;

        const query = {};
        if (status) query.status = status;
        if (issuerAddress) query.issuerAddress = issuerAddress.toLowerCase();

        const certificates = await Certificate.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await Certificate.countDocuments(query);

        res.json({
            success: true,
            certificates,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            total: count,
        });
    } catch (error) {
        console.error('List certificates error:', error);
        res.status(500).json({ error: error.message });
    }
};
