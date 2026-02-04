import { contract, provider } from '../config/blockchain.js';
export { contract, provider };

/**
 * Retry helper for blockchain operations
 * @param {Function} operation - Async function to retry
 * @param {number} - Number of retries (default 3)
 * @param {number} - Delay in ms (default 1000)
 */
const withRetry = async (operation, retries = 3, delay = 5000) => {
    try {
        return await operation();
    } catch (error) {
        if (retries <= 0) throw error;
        console.warn(`Blockchain operation failed, retrying in ${delay}ms... (${retries} left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return withRetry(operation, retries - 1, delay);
    }
};

/**
 * Get certificate details from blockchain
 * @param {number} certId - Certificate ID
 * @returns {Promise<object>}
 */
export const getCertificateFromBlockchain = async (certId) => {
    try {
        const cert = await withRetry(() => contract.getCertificate(certId));

        // Convert struct array/object to standard JS object
        return {
            certId: Number(cert.certId),
            issuer: cert.issuer,
            certHash: cert.certHash,
            certificateId: cert.certificateIdString,
            studentName: cert.studentName,
            courseName: cert.courseName,
            courseCode: cert.courseCode,
            trainingType: cert.trainingType,
            duration: cert.duration,
            result: cert.result,
            issuerName: cert.issuerName,
            issuerWebsite: cert.issuerWebsite,
            issuerContact: cert.issuerContact,
            fileUrl: cert.fileUrl,
            fileType: cert.fileType,
            issuedAt: Number(cert.issuedAt),
            revoked: cert.revoked,
            revokeTxHash: cert.revokeTxHash
        };
    } catch (error) {
        console.error('Error fetching certificate from blockchain:', error);
        throw new Error('Failed to fetch certificate from blockchain');
    }
};

/**
 * Verify a certificate on the blockchain
 * @param {number} certId - Certificate ID from blockchain
 * @param {string} certHash - Certificate hash to verify
 * @returns {Promise<{valid: boolean, revoked: boolean, certDetails: object}>}
 */
export const verifyCertificate = async (certId, certHash) => {
    try {
        const [valid, revoked, certDetails] = await withRetry(() =>
            contract.verifyCertificate(certId, certHash)
        );

        let formattedDetails = null;
        if (certDetails && certDetails.certId > 0) {
            formattedDetails = {
                certId: Number(certDetails.certId),
                issuer: certDetails.issuer,
                certHash: certDetails.certHash,
                certificateId: certDetails.certificateIdString,
                studentName: certDetails.studentName,
                courseName: certDetails.courseName,
                courseCode: certDetails.courseCode,
                trainingType: certDetails.trainingType,
                duration: certDetails.duration,
                result: certDetails.result,
                issuerName: certDetails.issuerName,
                issuerWebsite: certDetails.issuerWebsite,
                issuerContact: certDetails.issuerContact,
                fileUrl: certDetails.fileUrl,
                fileType: certDetails.fileType,
                issuedAt: Number(certDetails.issuedAt),
                revoked: certDetails.revoked,
                revokeTxHash: certDetails.revokeTxHash
            };
        }

        return { valid, revoked, certDetails: formattedDetails };
    } catch (error) {
        console.error('Blockchain verification error:', error);
        throw new Error('Failed to verify certificate on blockchain');
    }
};

/**
 * Check if an address is an admin
 * @param {string} address - Wallet address
 * @returns {Promise<boolean>}
 */
export const isAdmin = async (address) => {
    try {
        const adminAddress = await withRetry(() => contract.admin());
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
        return await withRetry(() => contract.officers(address));
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
