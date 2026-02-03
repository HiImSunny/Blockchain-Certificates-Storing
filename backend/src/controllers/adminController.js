import { isAdmin, isOfficer, getAdminAddress } from '../services/adminService.js';
import Certificate from '../models/Certificate.js';

/**
 * Check if address is admin
 * GET /api/admin/check-admin/:address
 */
export const checkAdmin = async (req, res) => {
    try {
        const { address } = req.params;
        const isAdminUser = await isAdmin(address);

        res.json({
            success: true,
            isAdmin: isAdminUser,
            address,
        });
    } catch (error) {
        console.error('Check admin error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Check if address is officer
 * GET /api/admin/check-officer/:address
 */
export const checkOfficer = async (req, res) => {
    try {
        const { address } = req.params;
        const isOfficerUser = await isOfficer(address);

        res.json({
            success: true,
            isOfficer: isOfficerUser,
            address,
        });
    } catch (error) {
        console.error('Check officer error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Get admin address
 * GET /api/admin/admin-address
 */
export const getAdmin = async (req, res) => {
    try {
        const adminAddress = await getAdminAddress();

        res.json({
            success: true,
            adminAddress,
        });
    } catch (error) {
        console.error('Get admin error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Get certificate statistics
 * GET /api/admin/stats
 */
export const getStats = async (req, res) => {
    try {
        const total = await Certificate.countDocuments();
        const issued = await Certificate.countDocuments({ status: 'ISSUED' });
        const revoked = await Certificate.countDocuments({ status: 'REVOKED' });

        res.json({
            success: true,
            stats: {
                total,
                issued,
                revoked,
            },
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: error.message });
    }
};
