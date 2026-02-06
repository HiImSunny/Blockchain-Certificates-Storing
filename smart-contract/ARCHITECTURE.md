# 🎓 EduCertificate Contract - Architecture Guide

## 🚨 **QUAN TRỌNG: Private Key vs Public Address**

### **Private Key (Chỉ dùng để ký transaction):**
- ✍️ Deploy contract
- ✍️ Ký transaction khi gửi lệnh lên blockchain
- 🔒 **KHÔNG BAO GIỜ share với ai!**
- 🔒 **Chỉ lưu trong .env của backend**

### **Public Address (Dùng để xác định quyền):**
- 👤 Contract kiểm tra `msg.sender` (public address)
- 👤 Admin = public address (được set khi deploy)
- 👤 Officer = public address (được admin thêm vào)
- ✅ **Có thể share công khai**

**Ví dụ:**
```
Private Key: 0xYOUR_PRIVATE_KEY_KEEP_SECRET
    ↓ (derive)
Public Address: 0xYourCronosAddress...
    ↓ (used in contract)
contract.admin == 0xYourCronosAddress  ✅
```

---

## � **Vai trò trong hệ thống:**

### 1️⃣ **Admin (BẠN - Người deploy contract)**
- **Public Address**: Được set làm admin khi deploy
- **Private Key**: Dùng để ký transaction (lưu trong backend/.env)
- **Quyền hạn**:
  - ✅ Deploy contract (1 lần duy nhất)
  - ✅ Add/Remove officers
  - ✅ Issue certificates
  - ✅ Revoke certificates

### 2️⃣ **Officers (Giáo viên/Nhân viên cấp chứng chỉ)**
- **Public Address**: Được admin add vào mapping `officers`
- **Private Key**: Của từng officer (để ký transaction của họ)
- **Quyền hạn**:
  - ✅ Issue certificates
  - ✅ Update certificates (của họ)
  - ✅ Revoke certificates (của họ)

### 3️⃣ **Web Frontend (Bạn bè làm web)**
- **KHÔNG CẦN Private Key**
- **Chỉ cần**:
  - ✅ Contract Address (sau khi deploy)
  - ✅ Contract ABI (từ artifacts)
  - ✅ RPC URL
- **Có thể làm**:
  - ✅ Xem danh sách certificates
  - ✅ Verify certificates
  - ✅ Hiển thị thông tin certificates

---

## 🏗️ **Kiến trúc đề xuất:**

### **Cách 1: Backend API (Recommended)**
```
Frontend (Public)
    ↓ (HTTP Request)
Backend API (Có private key của Admin/Officer)
    ↓ (Web3 Transaction)
Smart Contract (Cronos Chain)
```

**Ưu điểm:**
- ✅ Bảo mật private key
- ✅ Kiểm soát quyền truy cập
- ✅ Có thể thêm business logic

### **Cách 2: MetaMask Integration**
```
Frontend (Public)
    ↓ (MetaMask)
User's Wallet (User tự ký transaction)
    ↓
Smart Contract (Cronos Chain)
```

**Ưu điểm:**
- ✅ Không cần backend
- ✅ User tự quản lý wallet
- ✅ Decentralized

---

## 📝 **Workflow thực tế:**

### **Bước 1: BẠN deploy contract (1 lần)**
```bash
cd smart-contract
npm install
cp .env.example .env
# Sửa .env với private key của BẠN
npx hardhat ignition deploy ./ignition/modules/EduCertificate.ts --network cronos
```

**Kết quả:**
- Contract Address: `0x123...` (Lưu lại địa chỉ này!)

### **Bước 2: Share thông tin với team**
Tạo file `contract-config.json`:
```json
{
  "contractAddress": "0x123...",
  "network": "cronos-testnet",
  "rpcUrl": "https://evm-t3.cronos.org",
  "chainId": 338
}
```

### **Bước 3: Bạn bè làm web**

**Frontend chỉ cần:**
```javascript
// Đọc dữ liệu (KHÔNG cần private key)
const provider = new ethers.JsonRpcProvider("https://evm-t3.cronos.org");
const contract = new ethers.Contract(contractAddress, ABI, provider);

// Verify certificate
const [valid, revoked] = await contract.verifyCertificate(certId, certHash);

// Get certificate info
const cert = await contract.getCertificate(certId);
```

**Backend (nếu cần issue certificate):**
```javascript
// Cần private key của Admin/Officer
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const contract = new ethers.Contract(contractAddress, ABI, wallet);

// Issue certificate (cần ký transaction)
const tx = await contract.issueCertificate(certHash);
await tx.wait();
```

---

## 🔐 **Bảo mật:**

### ✅ **ĐÚNG:**
1. Admin/Officer giữ private key riêng
2. Frontend chỉ đọc dữ liệu (read-only)
3. Backend API xử lý transactions (nếu cần)
4. Mỗi người dùng private key của mình

### ❌ **SAI:**
1. Share private key của admin cho mọi người
2. Hardcode private key trong frontend
3. Commit private key lên Git

---

## 💡 **Kết luận:**

**Câu trả lời cho câu hỏi của bạn:**

> "Làm web vô cái project này thì backend lấy cái address cronos để đẩy các lệnh lên smartcontract trên chain thôi chứ đâu có động tới folder smartcontract nữa đúng không?"

**Trả lời:**
- ✅ **ĐÚNG 100%!** Sau khi deploy xong, làm web **KHÔNG CẦN** folder `smart-contract/` nữa!
- ✅ Backend chỉ cần:
  1. **Contract Address** (0x123...)
  2. **Contract ABI** (copy từ artifacts)
  3. **Private Key** (để ký transaction)
  4. **RPC URL** (https://evm-t3.cronos.org)

> "Các .env hay contract-config có cần thiết nữa không?"

**Trả lời:**
- ❌ `smart-contract/.env` - **KHÔNG cần** cho web (chỉ dùng khi deploy)
- ✅ `backend/.env` - **CẦN** (chứa Contract Address + Private Key để backend gọi contract)
- ✅ `contract-config.json` - **NÊN CÓ** (để share Contract Address với team, nhưng không bắt buộc)

**Workflow thực tế:**
```
┌─────────────────────────────────────┐
│ PHASE 1: Deploy (1 lần duy nhất)   │
└─────────────────────────────────────┘
smart-contract/
  ├── .env (private key để deploy)
  └── contracts/EduCertificate.sol
      ↓
  npx hardhat deploy
      ↓
  Contract Address: 0x123...
  
┌─────────────────────────────────────┐
│ PHASE 2: Web Development           │
│ (KHÔNG cần folder smart-contract)  │
└─────────────────────────────────────┘
backend/
  ├── .env
  │   ├── CONTRACT_ADDRESS=0x123...
  │   ├── ADMIN_PRIVATE_KEY=0xABC...
  │   └── CRONOS_RPC_URL=https://...
  ├── abi/
  │   └── EduCertificate.json (copy từ artifacts)
  └── controllers/
      └── certificateController.js
          # Dùng ethers.js gọi contract
          # KHÔNG cần Hardhat, KHÔNG cần Solidity
```

**Tóm lại:**
- 🎯 **Private key chỉ để KÝ TRANSACTION**, không phải để xác định quyền
- 🎯 **Public address mới là thứ contract check** (admin, officer)
- 🎯 **Folder smart-contract chỉ cần khi DEPLOY**, làm web KHÔNG cần!
- 🎯 **Backend chỉ cần**: Contract Address + ABI + Private Key + RPC URL
