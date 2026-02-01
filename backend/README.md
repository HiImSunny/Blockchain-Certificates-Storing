# Backend - Blockchain Certificate System

Backend API for interacting with the EduCertificate smart contract on Cronos blockchain.

## Prerequisites

The smart contract must be deployed first. You need:
- ✅ Contract Address (from deployment)
- ✅ Contract ABI (from `smart-contract/artifacts/`)
- ✅ Admin/Officer private key (to sign transactions)

## Setup

1. **Install dependencies:**
   ```bash
   npm install ethers express dotenv
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   ```

3. **Edit `.env` file:**
   ```env
   CONTRACT_ADDRESS=0x...  # Your deployed contract address
   ADMIN_PRIVATE_KEY=0x... # Your admin/officer private key
   ```

4. **Copy Contract ABI:**
   ```bash
   # Copy ABI from smart-contract artifacts
   cp ../smart-contract/artifacts/contracts/EduCertificate.sol/EduCertificate.json ./abi/
   ```

## Important Notes

### 🔑 **Private Key Usage:**

The private key in `.env` is used to **sign transactions** when:
- Issuing new certificates
- Revoking certificates
- Updating certificates

The **public address** derived from this private key must be:
- The admin address (set during deployment), OR
- An officer address (added by admin)

### 📖 **Read vs Write Operations:**

**Read Operations (No private key needed):**
- Verify certificate
- Get certificate details
- Check officer status

**Write Operations (Requires private key):**
- Issue certificate
- Revoke certificate
- Update certificate
- Add/Remove officers (admin only)

### 🚫 **You DON'T need:**
- ❌ The entire `smart-contract/` folder
- ❌ Hardhat or Solidity compiler
- ❌ To redeploy the contract

### ✅ **You ONLY need:**
- ✅ Contract Address
- ✅ Contract ABI
- ✅ RPC URL
- ✅ Private key (for write operations)

## Example Usage

See `examples/` folder for code examples on how to:
- Connect to the contract
- Issue certificates
- Verify certificates
- Handle transactions
