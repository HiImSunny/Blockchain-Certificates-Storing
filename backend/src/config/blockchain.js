import { ethers } from 'ethers';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load contract ABI
const contractAbiPath = join(__dirname, '../../../shared/contract-abi.json');
const contractData = JSON.parse(readFileSync(contractAbiPath, 'utf-8'));

// Setup provider (read-only)
const provider = new ethers.JsonRpcProvider(process.env.CRONOS_RPC_URL);

// Create contract instance (read-only, no signer)
const contract = new ethers.Contract(
    process.env.CONTRACT_ADDRESS,
    contractData.abi,
    provider
);

export { provider, contract };
