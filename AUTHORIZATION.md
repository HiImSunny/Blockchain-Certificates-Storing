# 🔑 Authorization & Access Control Guide

## ⚠️ QUAN TRỌNG: Ai có thể issue certificates?

Smart contract có **access control** - chỉ những địa chỉ được ủy quyền mới có thể issue certificates.

### 🚫 **Vấn đề:**

```javascript
// Nếu bạn bè dùng private key của họ
const wallet = new ethers.Wallet("PRIVATE_KEY_CỦA_BẠN_BÈ", provider);
const contract = new ethers.Contract(contractAddress, ABI, wallet);

await contract.issueCertificate(certHash);
// ❌ REVERT: "Not authorized"
// Vì public address của bạn bè KHÔNG phải admin hoặc officer
```

### ✅ **Giải pháp:**

---

## **CÁCH 1: Backend API (RECOMMENDED cho production)**

### Kiến trúc:
```
Frontend (Bạn bè làm)
    ↓ HTTP Request
Backend API (BẠN host - có private key của BẠN)
    ↓ Sign Transaction với private key của BẠN
Smart Contract
    ↓ Check: msg.sender == admin? ✅
Certificate Issued!
```

### Setup:

**Backend `.env`:**
```env
CONTRACT_ADDRESS=0x123...
ADMIN_PRIVATE_KEY=0xABC...  # Private key của BẠN (admin)
CRONOS_RPC_URL=https://evm-t3.cronos.org
```

**Backend code:**
```javascript
// backend/controllers/certificateController.js
const { ethers } = require('ethers');
const contractABI = require('../abi/EduCertificate.json');

// Wallet của BẠN (admin)
const provider = new ethers.JsonRpcProvider(process.env.CRONOS_RPC_URL);
const adminWallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
const contract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  contractABI.abi,
  adminWallet  // ← Dùng wallet của BẠN
);

// API endpoint
exports.issueCertificate = async (req, res) => {
  try {
    // Validate request (authentication, authorization, etc.)
    if (!req.user || !req.user.canIssueCert) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    const { certHash } = req.body;
    
    // Issue certificate (ký bằng private key của BẠN)
    const tx = await contract.issueCertificate(certHash);
    console.log('Transaction sent:', tx.hash);
    
    const receipt = await tx.wait();
    console.log('Transaction confirmed:', receipt.hash);
    
    // Get cert ID from event
    const event = receipt.logs.find(log => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed.name === 'CertificateIssued';
      } catch { return false; }
    });
    
    const certId = event ? contract.interface.parseLog(event).args.certId : null;
    
    res.json({
      success: true,
      txHash: receipt.hash,
      certId: certId ? Number(certId) : null
    });
  } catch (error) {
    console.error('Error issuing certificate:', error);
    res.status(500).json({ error: error.message });
  }
};
```

**Frontend (bạn bè làm):**
```javascript
// Frontend chỉ gọi API, KHÔNG cần private key
async function issueCertificate(certData) {
  const response = await fetch('/api/certificates/issue', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    },
    body: JSON.stringify({
      certHash: calculateHash(certData)
    })
  });
  
  const result = await response.json();
  return result;
}
```

### ✅ Ưu điểm:
- Bảo mật (private key chỉ ở backend của BẠN)
- Kiểm soát hoàn toàn (có thể thêm authentication, logging, etc.)
- Bạn bè chỉ cần làm frontend
- Phù hợp cho production

### ⚠️ Nhược điểm:
- Bạn phải host backend
- Bạn phải trả gas fee
- Centralized (phụ thuộc vào backend của bạn)

---

## **CÁCH 2: Add Officer (Cho dự án học tập/testing)**

### Workflow:

**Bước 1: BẠN add bạn bè làm officer**
```javascript
// Bạn chạy script này (cần private key của BẠN)
const adminWallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
const contract = new ethers.Contract(contractAddress, ABI, adminWallet);

// Add địa chỉ của bạn bè
const friendAddress = "0x..."; // Public address của bạn bè
const tx = await contract.addOfficer(friendAddress);
await tx.wait();

console.log(`Added ${friendAddress} as officer`);
```

**Bước 2: Bạn bè dùng private key của họ**
```javascript
// Backend của bạn bè
const friendWallet = new ethers.Wallet(process.env.FRIEND_PRIVATE_KEY, provider);
const contract = new ethers.Contract(contractAddress, ABI, friendWallet);

// Bây giờ bạn bè có thể issue
const tx = await contract.issueCertificate(certHash);
await tx.wait();
```

### ✅ Ưu điểm:
- Decentralized (mỗi officer tự quản lý)
- Bạn bè tự trả gas fee
- Phù hợp cho testing/development

### ⚠️ Nhược điểm:
- Phải tin tưởng bạn bè (họ có quyền issue cert)
- Bạn bè cần có CRO token để trả gas
- Khó kiểm soát (mỗi officer có quyền như nhau)

---

## **CÁCH 3: MetaMask Integration (Decentralized)**

### Frontend:
```javascript
// User connect MetaMask
const provider = new ethers.BrowserProvider(window.ethereum);
await provider.send("eth_requestAccounts", []);
const signer = await provider.getSigner();

const contract = new ethers.Contract(contractAddress, ABI, signer);

// User tự ký transaction qua MetaMask
const tx = await contract.issueCertificate(certHash);
await tx.wait();
```

### ✅ Ưu điểm:
- Hoàn toàn decentralized
- User tự quản lý wallet
- Không cần backend

### ⚠️ Nhược điểm:
- User phải có MetaMask
- User phải là officer (bạn phải add trước)
- User tự trả gas fee
- UX phức tạp hơn

---

## 🎯 **Khuyến nghị:**

### Cho Production (Trường học, Tổ chức):
→ **CÁCH 1: Backend API**
- Bạn host backend với private key của BẠN
- Frontend chỉ gọi API
- Bạn kiểm soát hoàn toàn

### Cho Development/Testing:
→ **CÁCH 2: Add Officer**
- Bạn add bạn bè làm officer
- Họ tự test với private key của họ
- Nhanh chóng, đơn giản

### Cho Decentralized App:
→ **CÁCH 3: MetaMask**
- User tự quản lý wallet
- Hoàn toàn decentralized
- Phù hợp cho Web3 app

---

## 📋 **Tóm lại:**

**Vấn đề:** Bạn bè dùng private key của họ → Không có quyền issue cert

**Giải pháp:**
1. ✅ Backend dùng private key của BẠN (recommended)
2. ✅ Add bạn bè làm officer (cho testing)
3. ✅ MetaMask integration (cho Web3 app)

**KHÔNG BAO GIỜ:** Share private key của BẠN cho bạn bè!
