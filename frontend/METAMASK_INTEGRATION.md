# 🦊 MetaMask Integration Guide

## 🎯 Kiến trúc

Với MetaMask, **KHÔNG CẦN private key trong code**!

```
User (Admin/Officer)
    ↓ Connect MetaMask
Frontend (Web App)
    ↓ Request signature from MetaMask
MetaMask (User's wallet - tự quản lý private key)
    ↓ Sign & Send Transaction
Smart Contract (Cronos)
```

---

## 📋 **Bạn bè chỉ cần:**

1. ✅ Contract Address (từ deployment)
2. ✅ Contract ABI (từ artifacts)
3. ✅ RPC URL: `https://evm-t3.cronos.org`

**KHÔNG CẦN:**
- ❌ Private key
- ❌ Backend
- ❌ Folder smart-contract

---

## 🚀 **Setup**

### 1. Install dependencies

```bash
npm install ethers
```

### 2. Create config file

```javascript
// frontend/src/config/contract.js
export const CONTRACT_CONFIG = {
  address: '0x...', // Paste deployed contract address here
  chainId: 338, // Cronos Testnet
  chainName: 'Cronos Testnet',
  rpcUrl: 'https://evm-t3.cronos.org',
  blockExplorer: 'https://explorer.cronos.org/testnet'
};
```

### 3. Copy Contract ABI

```bash
# Copy ABI from smart-contract artifacts
cp ../smart-contract/artifacts/contracts/EduCertificate.sol/EduCertificate.json ./src/abi/
```

---

## 💻 **Code Examples**

### Connect to MetaMask

```javascript
// frontend/src/utils/web3.js
import { ethers } from 'ethers';
import { CONTRACT_CONFIG } from '../config/contract';
import contractABI from '../abi/EduCertificate.json';

/**
 * Connect to MetaMask and get signer
 */
export async function connectWallet() {
  if (!window.ethereum) {
    throw new Error('MetaMask not installed!');
  }

  try {
    // Request account access
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    
    // Create provider
    const provider = new ethers.BrowserProvider(window.ethereum);
    
    // Get signer (user's wallet)
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    
    console.log('Connected wallet:', address);
    
    // Check if on correct network
    const network = await provider.getNetwork();
    if (Number(network.chainId) !== CONTRACT_CONFIG.chainId) {
      await switchNetwork();
    }
    
    return { provider, signer, address };
  } catch (error) {
    console.error('Error connecting wallet:', error);
    throw error;
  }
}

/**
 * Switch to Cronos Testnet
 */
export async function switchNetwork() {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${CONTRACT_CONFIG.chainId.toString(16)}` }],
    });
  } catch (switchError) {
    // Chain not added, add it
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: `0x${CONTRACT_CONFIG.chainId.toString(16)}`,
          chainName: CONTRACT_CONFIG.chainName,
          rpcUrls: [CONTRACT_CONFIG.rpcUrl],
          blockExplorerUrls: [CONTRACT_CONFIG.blockExplorer],
          nativeCurrency: {
            name: 'CRO',
            symbol: 'CRO',
            decimals: 18
          }
        }],
      });
    } else {
      throw switchError;
    }
  }
}

/**
 * Get contract instance with signer
 */
export function getContract(signer) {
  return new ethers.Contract(
    CONTRACT_CONFIG.address,
    contractABI.abi,
    signer
  );
}

/**
 * Get contract instance for read-only (no wallet needed)
 */
export function getContractReadOnly() {
  const provider = new ethers.JsonRpcProvider(CONTRACT_CONFIG.rpcUrl);
  return new ethers.Contract(
    CONTRACT_CONFIG.address,
    contractABI.abi,
    provider
  );
}
```

---

### Issue Certificate (Admin/Officer only)

```javascript
// frontend/src/services/certificateService.js
import { connectWallet, getContract } from '../utils/web3';
import { ethers } from 'ethers';

/**
 * Issue a new certificate
 * User must be admin or officer
 * MetaMask will prompt user to sign transaction
 */
export async function issueCertificate(certData) {
  try {
    // Connect wallet
    const { signer, address } = await connectWallet();
    console.log('Issuing certificate from:', address);
    
    // Get contract with signer
    const contract = getContract(signer);
    
    // Calculate certificate hash
    const certHash = ethers.keccak256(
      ethers.toUtf8Bytes(JSON.stringify(certData))
    );
    
    console.log('Certificate hash:', certHash);
    
    // Check if user is authorized
    const isAdmin = await contract.admin() === address;
    const isOfficer = await contract.officers(address);
    
    if (!isAdmin && !isOfficer) {
      throw new Error('You are not authorized to issue certificates');
    }
    
    // Issue certificate (MetaMask will prompt for signature)
    console.log('Requesting signature from MetaMask...');
    const tx = await contract.issueCertificate(certHash);
    
    console.log('Transaction sent:', tx.hash);
    console.log('Waiting for confirmation...');
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    console.log('Transaction confirmed:', receipt.hash);
    
    // Get certificate ID from event
    const event = receipt.logs.find(log => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed.name === 'CertificateIssued';
      } catch {
        return false;
      }
    });
    
    let certId = null;
    if (event) {
      const parsed = contract.interface.parseLog(event);
      certId = Number(parsed.args.certId);
      console.log('Certificate ID:', certId);
    }
    
    return {
      success: true,
      txHash: receipt.hash,
      certId: certId,
      certHash: certHash
    };
    
  } catch (error) {
    console.error('Error issuing certificate:', error);
    
    // Handle user rejection
    if (error.code === 'ACTION_REJECTED') {
      throw new Error('Transaction rejected by user');
    }
    
    throw error;
  }
}
```

---

### Verify Certificate (Public - no wallet needed)

```javascript
/**
 * Verify a certificate
 * No wallet needed - read-only operation
 */
export async function verifyCertificate(certId, certData) {
  try {
    // Get read-only contract (no wallet needed)
    const contract = getContractReadOnly();
    
    // Calculate hash
    const certHash = ethers.keccak256(
      ethers.toUtf8Bytes(JSON.stringify(certData))
    );
    
    // Verify
    const [valid, revoked] = await contract.verifyCertificate(certId, certHash);
    
    return {
      valid,
      revoked,
      status: revoked ? 'revoked' : (valid ? 'valid' : 'invalid')
    };
    
  } catch (error) {
    console.error('Error verifying certificate:', error);
    throw error;
  }
}

/**
 * Get certificate details
 * No wallet needed - read-only operation
 */
export async function getCertificate(certId) {
  try {
    const contract = getContractReadOnly();
    
    const [issuer, certHash, issuedAt, revoked] = await contract.getCertificate(certId);
    
    return {
      id: certId,
      issuer,
      hash: certHash,
      issuedAt: new Date(Number(issuedAt) * 1000),
      revoked
    };
    
  } catch (error) {
    console.error('Error getting certificate:', error);
    throw error;
  }
}
```

---

### React Component Example

```jsx
// frontend/src/components/IssueCertificate.jsx
import React, { useState } from 'react';
import { issueCertificate } from '../services/certificateService';

export default function IssueCertificate() {
  const [certData, setCertData] = useState({
    studentName: '',
    courseName: '',
    issueDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      // This will prompt MetaMask for signature
      const result = await issueCertificate(certData);
      
      setResult({
        success: true,
        message: `Certificate issued successfully! ID: ${result.certId}`,
        txHash: result.txHash
      });
      
      // Reset form
      setCertData({ studentName: '', courseName: '', issueDate: '' });
      
    } catch (error) {
      setResult({
        success: false,
        message: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="issue-certificate">
      <h2>Issue Certificate</h2>
      
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Student Name"
          value={certData.studentName}
          onChange={(e) => setCertData({...certData, studentName: e.target.value})}
          required
        />
        
        <input
          type="text"
          placeholder="Course Name"
          value={certData.courseName}
          onChange={(e) => setCertData({...certData, courseName: e.target.value})}
          required
        />
        
        <input
          type="date"
          value={certData.issueDate}
          onChange={(e) => setCertData({...certData, issueDate: e.target.value})}
          required
        />
        
        <button type="submit" disabled={loading}>
          {loading ? 'Processing...' : 'Issue Certificate'}
        </button>
      </form>
      
      {result && (
        <div className={result.success ? 'success' : 'error'}>
          <p>{result.message}</p>
          {result.txHash && (
            <a 
              href={`https://explorer.cronos.org/testnet/tx/${result.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View on Explorer
            </a>
          )}
        </div>
      )}
    </div>
  );
}
```

---

## 🔐 **Security Notes**

### ✅ **Advantages:**

1. **No private key in code** - MetaMask manages it
2. **User controls wallet** - Decentralized
3. **No backend needed** - Direct blockchain interaction
4. **Transparent** - User sees every transaction

### ⚠️ **Requirements:**

1. User must have MetaMask installed
2. User must be added as officer (if not admin)
3. User needs CRO tokens for gas fees
4. User must be on Cronos network

---

## 📋 **Workflow**

### For Admin (You):

1. Deploy contract → Get contract address
2. Share contract address + ABI with frontend team
3. (Optional) Add officers using `add-officer.js` script

### For Frontend Developer (Your friend):

1. Get contract address + ABI
2. Create config file with contract address
3. Implement MetaMask integration
4. Build UI for issue/verify certificates
5. **NO private key needed!**

### For End Users (Admin/Officers):

1. Install MetaMask
2. Connect wallet to web app
3. Switch to Cronos Testnet
4. Issue certificates (MetaMask prompts for signature)
5. Pay gas fees with CRO tokens

---

## 🎯 **Summary**

**With MetaMask:**
- ✅ NO private key in code
- ✅ NO backend needed
- ✅ Fully decentralized
- ✅ User controls everything

**Frontend developer needs:**
- ✅ Contract Address
- ✅ Contract ABI
- ✅ RPC URL

**That's it!** 🎉
