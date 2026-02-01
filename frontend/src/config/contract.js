// Contract configuration
// Fill this after deploying the smart contract

export const CONTRACT_CONFIG = {
    // Deployed contract address (get this after running: npx hardhat ignition deploy)
    address: 'PASTE_YOUR_DEPLOYED_CONTRACT_ADDRESS_HERE',

    // Cronos Testnet configuration
    chainId: 338,
    chainName: 'Cronos Testnet',
    rpcUrl: 'https://evm-t3.cronos.org',
    blockExplorer: 'https://explorer.cronos.org/testnet',

    // Native currency
    nativeCurrency: {
        name: 'CRO',
        symbol: 'CRO',
        decimals: 18
    }
};

// Note: You can get the contract address from the deployment output
// or from the smart-contract/ignition/deployments folder
