import contractAbi from '../../../shared/contract-abi.json';
import contractConfig from '../../../shared/contract-config.json';

export const CONTRACT_ADDRESS = contractConfig.contractAddress;
export const CONTRACT_ABI = contractAbi.abi;
export const CHAIN_ID = contractConfig.chainId;
export const RPC_URL = contractConfig.rpcUrl;
export const NETWORK_NAME = 'Cronos Testnet';

export const NETWORK_CONFIG = {
    chainId: `0x${CHAIN_ID.toString(16)}`,
    chainName: NETWORK_NAME,
    nativeCurrency: {
        name: 'TCRO',
        symbol: 'TCRO',
        decimals: 18,
    },
    rpcUrls: [RPC_URL],
    blockExplorerUrls: [contractConfig.blockExplorer],
};
