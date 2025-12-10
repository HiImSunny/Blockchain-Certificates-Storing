// backend/routes/certificateRoutes.js
const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificateController');
const { verifyToken } = require('../middleware/auth');
const upload = require('../config/multer');

// Public routes (no authentication required)
router.get('/verify/:certificateId', certificateController.verifyCertificate);
router.get('/stats', certificateController.getBlockchainStats);

// Protected routes (require authentication)
router.post(
  '/create',
  verifyToken,
  upload.fields([
    { name: 'studentPhoto', maxCount: 1 },
    { name: 'certificateImage', maxCount: 1 }
  ]),
  certificateController.createCertificate
);

router.get('/all', verifyToken, certificateController.getAllCertificates);
router.get('/my-certificates', verifyToken, certificateController.getCertificatesByOrganization);

module.exports = router;