import { isAdmin, isOfficer, getAdminAddress, getOfficersList } from '../services/adminService.js';
import { contract } from '../services/blockchainService.js';

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
        // Fetch all certs from blockchain to count
        const allCerts = await contract.getAllCertificates();

        const total = allCerts.length;
        const revoked = allCerts.filter(c => c.revoked).length;
        const issued = total - revoked;

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

/**
 * Get list of officers
 * GET /api/admin/officers
 */
export const listOfficers = async (req, res) => {
    try {
        const officers = await getOfficersList();
        res.json({
            success: true,
            officers,
        });
    } catch (error) {
        console.error('Get officers list error:', error);
        res.status(500).json({ error: error.message });
    }
};
