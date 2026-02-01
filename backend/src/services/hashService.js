import { ethers } from 'ethers';
import crypto from 'crypto';

/**
 * Hash a file buffer using keccak256 (compatible with Solidity)
 * @param {Buffer} fileBuffer - File buffer to hash
 * @returns {string} - Hash in hex format (0x...)
 */
export const hashFile = (fileBuffer) => {
    return ethers.keccak256(fileBuffer);
};

/**
 * Hash a string using keccak256
 * @param {string} text - Text to hash
 * @returns {string} - Hash in hex format (0x...)
 */
export const hashText = (text) => {
    return ethers.keccak256(ethers.toUtf8Bytes(text));
};

/**
 * Verify if a file matches a given hash
 * @param {Buffer} fileBuffer - File buffer to verify
 * @param {string} expectedHash - Expected hash (0x...)
 * @returns {boolean} - True if hash matches
 */
export const verifyFileHash = (fileBuffer, expectedHash) => {
    const actualHash = hashFile(fileBuffer);
    return actualHash === expectedHash;
};
