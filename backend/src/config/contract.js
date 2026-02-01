import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read contract artifact
const artifactPath = join(__dirname, '../../../smart-contract/ignition/deployments/chain-338/artifacts/EduCertificateModule#EduCertificate.json');
const artifact = JSON.parse(readFileSync(artifactPath, 'utf8'));

export const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '0xE6571C574050e40A2D052674896F3aB3F3baeE06';
export const CONTRACT_ABI = artifact.abi;
export const RPC_URL = process.env.CRONOS_RPC_URL || 'https://evm-t3.cronos.org';
export const CHAIN_ID = parseInt(process.env.CHAIN_ID || '338');
