import contractAbi from './contract-abi.json' assert { type: 'json' };

export const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '0xE6571C574050e40A2D052674896F3aB3F3baeE06';
export const CONTRACT_ABI = contractAbi.abi;
export const RPC_URL = process.env.CRONOS_RPC_URL || 'https://evm-t3.cronos.org';
export const CHAIN_ID = parseInt(process.env.CHAIN_ID || '338');
