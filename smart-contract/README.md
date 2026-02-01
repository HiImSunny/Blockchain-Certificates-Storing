# Smart Contract - EduCertificate

Smart contract for blockchain-based certificate management on Cronos network.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   # Copy the example file
   cp .env.example .env
   
   # Edit .env and add your private key
   # NEVER commit the .env file!
   ```

3. **Deploy to Cronos Testnet:**
   ```bash
   npx hardhat ignition deploy ./ignition/modules/EduCertificate.ts --network cronos
   ```

## Important Security Notes

⚠️ **NEVER commit your `.env` file!** It contains your private key.

✅ Only share `.env.example` with your team.

✅ Each developer should create their own `.env` file locally.

## For Frontend Developers

After deploying the contract, export the ABI for frontend integration:

```bash
node scripts/export-abi.js
```

This will create `exports/EduCertificate.abi.json` that frontend can use to interact with the contract.

**Frontend developers only need:**
- Contract Address (from deployment)
- ABI file (from exports/)
- RPC URL: `https://evm-t3.cronos.org`

**NO private key needed for read-only operations!**