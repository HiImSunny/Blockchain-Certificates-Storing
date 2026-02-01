import { ethers } from 'ethers';
import {
    CONTRACT_ADDRESS,
    CONTRACT_ABI,
    CHAIN_ID,
    NETWORK_CONFIG,
} from '../config/contract';

/**
 * Check if MetaMask is installed
 */
export const isMetaMaskInstalled = () => {
    return typeof window.ethereum !== 'undefined';
};

/**
 * Connect to MetaMask
 * @returns {Promise<{address: string, provider: ethers.BrowserProvider, signer: ethers.Signer}>}
 */
export const connectMetaMask = async () => {
    if (!isMetaMaskInstalled()) {
        throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
    }

    try {
        // Request account access
        const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts',
        });

        // Check network
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        const currentChainId = parseInt(chainId, 16);

        if (currentChainId !== CHAIN_ID) {
            // Try to switch network
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: NETWORK_CONFIG.chainId }],
                });
            } catch (switchError) {
                // Network not added, try to add it
                if (switchError.code === 4902) {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [NETWORK_CONFIG],
                    });
                } else {
                    throw switchError;
                }
            }
        }

        // Create provider and signer
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();

        return { address, provider, signer };
    } catch (error) {
        console.error('MetaMask connection error:', error);
        throw error;
    }
};

/**
 * Get contract instance with signer
 * @param {ethers.Signer} signer
 * @returns {ethers.Contract}
 */
export const getContract = (signer) => {
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
};

/**
 * Issue certificate on blockchain
 * @param {ethers.Signer} signer
 * @param {string} certHash
 * @returns {Promise<{txHash: string, certId: number}>}
 */
export const issueCertificate = async (signer, certHash) => {
    try {
        const contract = getContract(signer);
        const tx = await contract.issueCertificate(certHash);

        console.log('Transaction sent:', tx.hash);
        const receipt = await tx.wait();
        console.log('Transaction confirmed:', receipt.hash);

        // Extract certId from event
        const event = receipt.logs.find((log) => {
            try {
                const parsed = contract.interface.parseLog(log);
                return parsed.name === 'CertificateIssued';
            } catch {
                return false;
            }
        });

        let certId = null;
        if (event) {
            const parsed = contract.interface.parseLog(event);
            certId = Number(parsed.args.certId);
        }

        return {
            txHash: receipt.hash,
            certId,
        };
    } catch (error) {
        console.error('Issue certificate error:', error);
        throw error;
    }
};

/**
 * Revoke certificate on blockchain
 * @param {ethers.Signer} signer
 * @param {number} certId
 * @returns {Promise<string>} Transaction hash
 */
export const revokeCertificate = async (signer, certId) => {
    try {
        const contract = getContract(signer);
        const tx = await contract.revokeCertificate(certId);
        const receipt = await tx.wait();
        return receipt.hash;
    } catch (error) {
        console.error('Revoke certificate error:', error);
        throw error;
    }
};

/**
 * Add officer to smart contract (admin only)
 * @param {ethers.Signer} signer
 * @param {string} officerAddress
 * @returns {Promise<string>} Transaction hash
 */
export const addOfficer = async (signer, officerAddress) => {
    try {
        const contract = getContract(signer);
        const tx = await contract.addOfficer(officerAddress);
        const receipt = await tx.wait();
        return receipt.hash;
    } catch (error) {
        console.error('Add officer error:', error);
        throw error;
    }
};

/**
 * Remove officer from smart contract (admin only)
 * @param {ethers.Signer} signer
 * @param {string} officerAddress
 * @returns {Promise<string>} Transaction hash
 */
export const removeOfficer = async (signer, officerAddress) => {
    try {
        const contract = getContract(signer);
        const tx = await contract.removeOfficer(officerAddress);
        const receipt = await tx.wait();
        return receipt.hash;
    } catch (error) {
        console.error('Remove officer error:', error);
        throw error;
    }
};

/**
 * Listen for account changes
 * @param {Function} callback
 */
export const onAccountsChanged = (callback) => {
    if (isMetaMaskInstalled()) {
        window.ethereum.on('accountsChanged', callback);
    }
};

/**
 * Listen for chain changes
 * @param {Function} callback
 */
export const onChainChanged = (callback) => {
    if (isMetaMaskInstalled()) {
        window.ethereum.on('chainChanged', callback);
    }
};

/**
 * Get current connected account
 * @returns {Promise<string|null>}
 */
export const getCurrentAccount = async () => {
    if (!isMetaMaskInstalled()) {
        return null;
    }

    try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        return accounts[0] || null;
    } catch (error) {
        console.error('Get current account error:', error);
        return null;
    }
};
