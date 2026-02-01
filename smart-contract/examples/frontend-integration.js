/**
 * Example: How to interact with EduCertificate contract from Frontend
 * 
 * This example shows READ-ONLY operations (no private key needed)
 */

import { ethers } from 'ethers';

// Import ABI (generated from export-abi.js)
import contractABI from './EduCertificate.abi.json';

// Configuration (get from contract-config.json)
const CONFIG = {
    contractAddress: '0x...', // Replace with actual deployed address
    rpcUrl: 'https://evm-t3.cronos.org',
    chainId: 338
};

// Create provider (read-only, no wallet needed)
const provider = new ethers.JsonRpcProvider(CONFIG.rpcUrl);

// Create contract instance (read-only)
const contract = new ethers.Contract(
    CONFIG.contractAddress,
    contractABI,
    provider
);

// ============================================
// READ-ONLY FUNCTIONS (No private key needed)
// ============================================

/**
 * Verify a certificate
 * @param {number} certId - Certificate ID
 * @param {string} certHash - Certificate hash to verify
 */
async function verifyCertificate(certId, certHash) {
    try {
        const [valid, revoked] = await contract.verifyCertificate(certId, certHash);

        console.log(`Certificate #${certId}:`);
        console.log(`- Valid: ${valid}`);
        console.log(`- Revoked: ${revoked}`);

        return { valid, revoked };
    } catch (error) {
        console.error('Error verifying certificate:', error);
        throw error;
    }
}

/**
 * Get certificate details
 * @param {number} certId - Certificate ID
 */
async function getCertificate(certId) {
    try {
        const [issuer, certHash, issuedAt, revoked] = await contract.getCertificate(certId);

        const certificate = {
            id: certId,
            issuer: issuer,
            hash: certHash,
            issuedAt: new Date(Number(issuedAt) * 1000), // Convert timestamp to Date
            revoked: revoked
        };

        console.log('Certificate details:', certificate);
        return certificate;
    } catch (error) {
        console.error('Error getting certificate:', error);
        throw error;
    }
}

/**
 * Check if an address is an officer
 * @param {string} address - Wallet address to check
 */
async function isOfficer(address) {
    try {
        const result = await contract.officers(address);
        console.log(`${address} is officer: ${result}`);
        return result;
    } catch (error) {
        console.error('Error checking officer status:', error);
        throw error;
    }
}

/**
 * Get admin address
 */
async function getAdmin() {
    try {
        const admin = await contract.admin();
        console.log('Admin address:', admin);
        return admin;
    } catch (error) {
        console.error('Error getting admin:', error);
        throw error;
    }
}

/**
 * Get next certificate ID
 */
async function getNextCertId() {
    try {
        const nextId = await contract.nextCertId();
        console.log('Next certificate ID:', nextId.toString());
        return Number(nextId);
    } catch (error) {
        console.error('Error getting next cert ID:', error);
        throw error;
    }
}

// ============================================
// WRITE FUNCTIONS (Requires private key/wallet)
// ============================================
// These should be handled by your BACKEND API
// DO NOT expose private keys in frontend!

/**
 * Example: Issue certificate (BACKEND ONLY)
 * This is just for reference - implement this in your backend API
 */
async function issueCertificateBackend(certHash, privateKey) {
    // Create wallet with private key
    const wallet = new ethers.Wallet(privateKey, provider);

    // Create contract instance with signer
    const contractWithSigner = new ethers.Contract(
        CONFIG.contractAddress,
        contractABI,
        wallet
    );

    try {
        // Send transaction
        const tx = await contractWithSigner.issueCertificate(certHash);
        console.log('Transaction sent:', tx.hash);

        // Wait for confirmation
        const receipt = await tx.wait();
        console.log('Transaction confirmed:', receipt);

        // Get certificate ID from event
        const event = receipt.logs.find(log => {
            try {
                const parsed = contractWithSigner.interface.parseLog(log);
                return parsed.name === 'CertificateIssued';
            } catch {
                return false;
            }
        });

        if (event) {
            const parsed = contractWithSigner.interface.parseLog(event);
            const certId = parsed.args.certId;
            console.log('Certificate issued with ID:', certId.toString());
            return Number(certId);
        }
    } catch (error) {
        console.error('Error issuing certificate:', error);
        throw error;
    }
}

// ============================================
// USAGE EXAMPLES
// ============================================

// Example 1: Verify a certificate
// verifyCertificate(1, '0x1234...');

// Example 2: Get certificate details
// getCertificate(1);

// Example 3: Check if address is officer
// isOfficer('0xABC...');

// Example 4: Get admin
// getAdmin();

// Example 5: Get next cert ID
// getNextCertId();

export {
    verifyCertificate,
    getCertificate,
    isOfficer,
    getAdmin,
    getNextCertId
};
