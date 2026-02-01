import express from 'express';
import upload from '../middleware/upload.js';
import {
    uploadCertificate,
    createCertificate,
    confirmCertificate,
    verifyCertificateById,
    verifyCertificateByFile,
    downloadCertificate,
    listCertificates,
    revokeCertificateById,
} from '../controllers/certificateController.js';

const router = express.Router();

// Upload certificate file and extract data
router.post('/upload', upload.single('file'), uploadCertificate);

// Create certificate with manual input
router.post('/create', createCertificate);

// Confirm blockchain transaction
router.post('/confirm', confirmCertificate);

// Verify certificate by ID
router.get('/verify/:certId', verifyCertificateById);

// Verify certificate by file upload
router.post('/verify-file', upload.single('file'), verifyCertificateByFile);

// Download certificate
router.get('/:certId/download', downloadCertificate);

// Revoke certificate
router.post('/revoke', revokeCertificateById);

// List certificates (optional - for admin)
router.get('/list', listCertificates);

export default router;
