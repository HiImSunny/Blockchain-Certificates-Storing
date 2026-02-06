import { contract, provider } from '../config/blockchain.js';
import { getFromCache, setCache, CacheKeys } from './cacheService.js';

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
 * Format certificate struct from blockchain to JS object
 * @param {Array|Object} certStruct 
 * @returns {Object}
 */
const formatCertificate = (certStruct) => {
    // Handle both array-like (tuple) and object-like responses
    // Ethers v6 often returns proxies that act like arrays AND objects
    return {
        certId: Number(certStruct.certId || certStruct[0]),
        issuer: certStruct.issuer || certStruct[1],
        certHash: certStruct.certHash || certStruct[2],
        certificateId: certStruct.certificateIdString || certStruct[3],
        studentName: certStruct.studentName || certStruct[4],
        courseName: certStruct.courseName || certStruct[5],
        courseCode: certStruct.courseCode || certStruct[6],
        trainingType: certStruct.trainingType || certStruct[7],
        duration: certStruct.duration || certStruct[8],
        result: certStruct.result || certStruct[9],
        issuerName: certStruct.issuerName || certStruct[10],
        issuerWebsite: certStruct.issuerWebsite || certStruct[11],
        issuerContact: certStruct.issuerContact || certStruct[12],
        fileUrl: certStruct.fileUrl || certStruct[13],
        fileType: certStruct.fileType || certStruct[14],
        issuedAt: Number(certStruct.issuedAt || certStruct[15]),
        revoked: certStruct.revoked || certStruct[16],
        revokeTxHash: certStruct.revokeTxHash || certStruct[17] || ""
    };
};

/**
 * Get certificate details from blockchain
 * @param {number} certId - Certificate ID
 * @returns {Promise<object>}
 */
export const getCertificateFromBlockchain = async (certId) => {
    try {
        // Try cache first for individual certs (optional, but good for performance)
        const cachedCert = getFromCache(`${CacheKeys.CERTIFICATE_PREFIX}${certId}`);
        if (cachedCert) return cachedCert;

        const cert = await withRetry(() => contract.getCertificate(certId));
        const formatted = formatCertificate(cert);

        // Cache individual cert for a while
        setCache(`${CacheKeys.CERTIFICATE_PREFIX}${certId}`, formatted);

        return formatted;
    } catch (error) {
        console.error('Error fetching certificate from blockchain:', error);
        throw new Error('Failed to fetch certificate from blockchain');
    }
};

/**
 * Get ALL certificates safely (with fallback and caching)
 * Strategies:
 * 1. Cache: Check in-memory cache first.
 * 2. Bulk: Try contract.getAllCertificates() (may fail on old contracts).
 * 3. Fallback: Loop 1..nextCertId and fetch individually (slow but reliable).
 */
export const getAllCertificatesSafe = async () => {
    // 1. Check Cache
    const cachedCerts = getFromCache(CacheKeys.ALL_CERTIFICATES);
    if (cachedCerts) {
        console.log('Serving certificates from cache');
        return cachedCerts;
    }

    let allCerts = [];

    // 2. Try Bulk Fetch
    try {
        console.log('Attempting bulk fetch from blockchain...');
        const certsStruct = await withRetry(() => contract.getAllCertificates(), 1, 1000); // Low retry for bulk, fail fast to fallback
        allCerts = certsStruct.map(formatCertificate);
        console.log(`Bulk fetch successful. Got ${allCerts.length} certificates.`);
    } catch (error) {
        console.warn('Bulk fetch failed (likely unsupported by contract). Switching to Fallback Strategy:', error.code || error.message);

        // 3. Fallback Strategy
        try {
            const nextIdBigInt = await withRetry(() => contract.nextCertId());
            const nextId = Number(nextIdBigInt);
            console.log(`Fallback: fetching ${nextId - 1} certificates individually...`);

            const promises = [];
            // Loop from 1 to nextId - 1
            for (let i = 1; i < nextId; i++) {
                promises.push(
                    contract.getCertificate(i)
                        .then(formatCertificate)
                        .catch(e => {
                            console.error(`Failed to fetch cert ${i}:`, e.message);
                            return null;
                        })
                );
            }

            // Wait for all (concurrently)
            const results = await Promise.all(promises);
            allCerts = results.filter(c => c !== null && c.certId !== 0); // Filter out failed or empty
            console.log(`Fallback fetch complete. Got ${allCerts.length} certificates.`);

        } catch (fallbackError) {
            console.error('Critical: Fallback fetch also failed:', fallbackError);
            throw new Error('Could not fetch certificates from Blockchain.');
        }
    }

    // Sort descending by ID or IssuedAt
    allCerts.sort((a, b) => b.certId - a.certId);

    // Update Cache
    setCache(CacheKeys.ALL_CERTIFICATES, allCerts);

    return allCerts;
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
        if (certDetails && Number(certDetails.certId) > 0) {
            formattedDetails = formatCertificate(certDetails);
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
        const isOfficer = await withRetry(() => contract.officers(address));
        return isOfficer;
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
