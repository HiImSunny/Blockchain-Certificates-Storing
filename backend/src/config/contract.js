import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const contractAbi = JSON.parse(readFileSync(join(__dirname, 'contract-abi.json'), 'utf8'));

export const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '0x962a1aF4AF062ccfC808E4dB8EdFcdDb4a4641d2';
export const CONTRACT_ABI = contractAbi.abi;
export const RPC_URL = process.env.CRONOS_RPC_URL || 'https://evm-t3.cronos.org';
export const CHAIN_ID = parseInt(process.env.CHAIN_ID || '338');
