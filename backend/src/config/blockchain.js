import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI, RPC_URL } from './contract.js';

// Setup provider (read-only)
const provider = new ethers.JsonRpcProvider(RPC_URL);

// Create contract instance (read-only, no signer)
const contract = new ethers.Contract(
    CONTRACT_ADDRESS,
    CONTRACT_ABI,
    provider
);

export { provider, contract };
