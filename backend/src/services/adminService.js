import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI, RPC_URL } from '../config/contract.js';

// Read-only provider
const provider = new ethers.JsonRpcProvider(RPC_URL);
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

/**
 * Check if address is admin
 * @param {string} address
 * @returns {Promise<boolean>}
 */
export const isAdmin = async (address) => {
    try {
        const adminAddress = await contract.admin();
        return adminAddress.toLowerCase() === address.toLowerCase();
    } catch (error) {
        console.error('Check admin error:', error);
        return false;
    }
};

/**
 * Check if address is officer
 * @param {string} address
 * @returns {Promise<boolean>}
 */
export const isOfficer = async (address) => {
    try {
        return await contract.officers(address);
    } catch (error) {
        console.error('Check officer error:', error);
        return false;
    }
};

/**
 * Get admin address
 * @returns {Promise<string>}
 */
export const getAdminAddress = async () => {
    try {
        return await contract.admin();
    } catch (error) {
        console.error('Get admin address error:', error);
        throw error;
    }
};
