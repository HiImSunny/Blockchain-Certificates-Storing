import { contract } from '../config/blockchain.js';

/**
 * Verify a certificate on the blockchain
 * @param {number} certId - Certificate ID from blockchain
 * @param {string} certHash - Certificate hash to verify
 * @returns {Promise<{valid: boolean, revoked: boolean}>}
 */
export const verifyCertificate = async (certId, certHash) => {
    try {
        const [valid, revoked] = await contract.verifyCertificate(certId, certHash);
        return { valid, revoked };
    } catch (error) {
        console.error('Blockchain verification error:', error);
        throw new Error('Failed to verify certificate on blockchain');
    }
};

/**
 * Get certificate details from blockchain
 * @param {number} certId - Certificate ID
 * @returns {Promise<{issuer: string, certHash: string, issuedAt: number, revoked: boolean}>}
 */
export const getCertificateFromBlockchain = async (certId) => {
    try {
        const [issuer, certHash, issuedAt, revoked] = await contract.getCertificate(certId);

        return {
            issuer,
            certHash,
            issuedAt: Number(issuedAt),
            revoked,
        };
    } catch (error) {
        console.error('Error fetching certificate from blockchain:', error);
        throw new Error('Failed to fetch certificate from blockchain');
    }
};

/**
 * Check if an address is an admin
 * @param {string} address - Wallet address
 * @returns {Promise<boolean>}
 */
export const isAdmin = async (address) => {
    try {
        const adminAddress = await contract.admin();
        return adminAddress.toLowerCase() === address.toLowerCase();
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
};

/**
 * Check if an address is an officer
 * @param {string} address - Wallet address
 * @returns {Promise<boolean>}
 */
export const isOfficer = async (address) => {
    try {
        return await contract.officers(address);
    } catch (error) {
        console.error('Error checking officer status:', error);
        return false;
    }
};

/**
 * Check if an address can issue certificates (admin or officer)
 * @param {string} address - Wallet address
 * @returns {Promise<boolean>}
 */
export const canIssueCertificate = async (address) => {
    const [adminStatus, officerStatus] = await Promise.all([
        isAdmin(address),
        isOfficer(address),
    ]);
    return adminStatus || officerStatus;
};
