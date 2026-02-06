import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI, RPC_URL } from '../config/contract.js';
import { getFromCache, setCache, CacheKeys } from './cacheService.js';

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
        const isOfficer = await contract.officers(address);
        // officerData is now a boolean based on the updated ABI
        return isOfficer;
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

/**
 * Get list of officers
 * @returns {Promise<object[]>}
 */
export const getOfficersList = async () => {
    try {
        const cachedOfficers = getFromCache(CacheKeys.OFFICERS_LIST);
        if (cachedOfficers) {
            console.log('Serving officers from cache');
            return cachedOfficers;
        }

        const officers = await contract.getOfficers();
        // Map struct to JS object
        const mappedOfficers = officers.map(o => ({
            name: o.name,
            address: o.officerAddress,
            addedAt: Number(o.addedAt),
            isActive: o.isActive
        }));

        setCache(CacheKeys.OFFICERS_LIST, mappedOfficers);
        return mappedOfficers;
    } catch (error) {
        console.error('Get officers list error:', error);
        return [];
    }
};
