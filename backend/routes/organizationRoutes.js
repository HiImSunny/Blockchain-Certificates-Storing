// backend/routes/organizationRoutes.js
const express = require('express');
const router = express.Router();
const organizationController = require('../controllers/organizationController');
const { verifyToken } = require('../middleware/auth');

// Public routes
router.post('/login', organizationController.login);
router.get('/check-whitelist/:walletAddress', organizationController.checkWhitelist);

// Protected routes
router.get('/profile', verifyToken, organizationController.getProfile);
router.put('/profile', verifyToken, organizationController.updateProfile);

module.exports = router;