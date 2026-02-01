import express from 'express';
import {
    checkAdmin,
    checkOfficer,
    getAdmin,
    getStats,
} from '../controllers/adminController.js';

const router = express.Router();

// Check if address is admin
router.get('/check-admin/:address', checkAdmin);

// Check if address is officer
router.get('/check-officer/:address', checkOfficer);

// Get admin address
router.get('/admin-address', getAdmin);

// Get statistics
router.get('/stats', getStats);

export default router;
