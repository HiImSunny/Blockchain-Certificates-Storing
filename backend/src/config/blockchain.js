import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI, RPC_URL } from './contract.js';

// Setup provider (read-only)
// Pass static network to avoid "failed to detect network" errors in Ethers v6
// Increase timeout to 60s to handle slow testnet nodes
// Setup provider (read-only)
// Pass static network to avoid "failed to detect network" errors in Ethers v6
// Increase timeout to 60s to handle slow testnet nodes
const fetchReq = new ethers.FetchRequest(RPC_URL);
fetchReq.timeout = 60000; // 60 seconds

const provider = new ethers.JsonRpcProvider(fetchReq, {
    chainId: 338,
    name: 'cronos-testnet',
}, {
    staticNetwork: true // Optimizes performance by disabling network checks
});

// Create contract instance (read-only, no signer)
const contract = new ethers.Contract(
    CONTRACT_ADDRESS,
    CONTRACT_ABI,
    provider
);

export { provider, contract };
