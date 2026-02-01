/**
 * Script to add an officer to the EduCertificate contract
 * 
 * Usage:
 *   node scripts/add-officer.js <officer_address>
 * 
 * Example:
 *   node scripts/add-officer.js 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
 */

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

async function main() {
    // Get officer address from command line
    const officerAddress = process.argv[2];

    if (!officerAddress) {
        console.error('❌ Error: Please provide officer address');
        console.log('Usage: node scripts/add-officer.js <officer_address>');
        process.exit(1);
    }

    // Validate address
    if (!ethers.isAddress(officerAddress)) {
        console.error('❌ Error: Invalid Ethereum address');
        process.exit(1);
    }

    // Load environment variables
    require('dotenv').config();

    const {
        CRONOS_RPC,
        PRIVATE_KEY,
        CONTRACT_ADDRESS
    } = process.env;

    if (!CRONOS_RPC || !PRIVATE_KEY) {
        console.error('❌ Error: Missing environment variables');
        console.log('Please set CRONOS_RPC and PRIVATE_KEY in .env file');
        process.exit(1);
    }

    // Load contract ABI
    const artifactPath = path.join(__dirname, '../artifacts/contracts/EduCertificate.sol/EduCertificate.json');
    if (!fs.existsSync(artifactPath)) {
        console.error('❌ Error: Contract artifact not found');
        console.log('Please compile the contract first: npx hardhat compile');
        process.exit(1);
    }

    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    const abi = artifact.abi;

    // Get contract address
    let contractAddress = CONTRACT_ADDRESS;
    if (!contractAddress) {
        console.error('❌ Error: CONTRACT_ADDRESS not set in .env');
        console.log('Please deploy the contract first or set CONTRACT_ADDRESS in .env');
        process.exit(1);
    }

    console.log('🔗 Connecting to Cronos network...');
    const provider = new ethers.JsonRpcProvider(CRONOS_RPC);

    console.log('🔑 Loading admin wallet...');
    const adminWallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const adminAddress = await adminWallet.getAddress();
    console.log(`   Admin address: ${adminAddress}`);

    console.log('📄 Loading contract...');
    const contract = new ethers.Contract(contractAddress, abi, adminWallet);
    console.log(`   Contract address: ${contractAddress}`);

    // Check if caller is admin
    const contractAdmin = await contract.admin();
    if (contractAdmin.toLowerCase() !== adminAddress.toLowerCase()) {
        console.error('❌ Error: You are not the admin of this contract');
        console.log(`   Contract admin: ${contractAdmin}`);
        console.log(`   Your address: ${adminAddress}`);
        process.exit(1);
    }

    // Check if already an officer
    const isAlreadyOfficer = await contract.officers(officerAddress);
    if (isAlreadyOfficer) {
        console.log(`⚠️  ${officerAddress} is already an officer`);
        process.exit(0);
    }

    console.log(`\n➕ Adding officer: ${officerAddress}`);
    console.log('   Sending transaction...');

    try {
        const tx = await contract.addOfficer(officerAddress);
        console.log(`   Transaction hash: ${tx.hash}`);
        console.log('   Waiting for confirmation...');

        const receipt = await tx.wait();
        console.log(`   ✅ Transaction confirmed in block ${receipt.blockNumber}`);

        // Verify
        const isOfficer = await contract.officers(officerAddress);
        if (isOfficer) {
            console.log(`\n✅ Success! ${officerAddress} is now an officer`);
        } else {
            console.log(`\n⚠️  Warning: Transaction confirmed but officer status not updated`);
        }
    } catch (error) {
        console.error('\n❌ Error adding officer:', error.message);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
