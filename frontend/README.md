# Frontend - MetaMask Integration

Frontend application for the Blockchain Certificate System using MetaMask.

## 🎯 **NO Private Key Needed!**

With MetaMask integration, the frontend **DOES NOT need any private keys**. MetaMask manages the user's wallet and private key securely.

## 📋 **What You Need**

After the smart contract is deployed, you only need:

1. ✅ **Contract Address** (from deployment)
2. ✅ **Contract ABI** (from `smart-contract/artifacts/`)
3. ✅ **RPC URL**: `https://evm-t3.cronos.org`

## 🚀 **Setup**

### 1. Install dependencies

```bash
npm install ethers
```

### 2. Copy Contract ABI

```bash
# Copy ABI from smart-contract artifacts
mkdir -p src/abi
cp ../smart-contract/artifacts/contracts/EduCertificate.sol/EduCertificate.json ./src/abi/
```

### 3. Configure Contract Address

Edit `src/config/contract.js` and paste your deployed contract address:

```javascript
export const CONTRACT_CONFIG = {
  address: '0x...', // Paste your deployed contract address here
  // ... other config
};
```

## 📚 **Documentation**

See `METAMASK_INTEGRATION.md` for:
- Complete code examples
- MetaMask connection
- Issue certificates
- Verify certificates
- React component examples

## 🔐 **Security**

- ✅ NO private keys in code
- ✅ MetaMask manages user's wallet
- ✅ User signs every transaction
- ✅ Fully decentralized

## 👥 **User Requirements**

Users (Admin/Officers) need:
1. MetaMask browser extension installed
2. Cronos Testnet configured in MetaMask
3. CRO tokens for gas fees
4. Be added as officer (if not admin)

## 🎯 **Summary**

**Frontend developer (your friend) needs:**
- ✅ Contract Address
- ✅ Contract ABI
- ✅ RPC URL

**Frontend developer does NOT need:**
- ❌ Private keys
- ❌ Backend server
- ❌ `smart-contract/` folder
- ❌ `.env` files

**Everything is handled by MetaMask!** 🦊
