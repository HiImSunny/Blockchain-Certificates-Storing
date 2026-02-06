# 🎓 EduCert - Hệ Thống Lưu Trữ & Xác Thực Chứng Chỉ Trên Blockchain

Dự án lưu trữ, cấp phát và xác minh chứng chỉ giáo dục sử dụng công nghệ Blockchain (Cronos Chain), đảm bảo tính toàn vẹn, minh bạch và không thể giả mạo.

![Status](https://img.shields.io/badge/Status-Development-green)
![Blockchain](https://img.shields.io/badge/Blockchain-Cronos_Testnet-blue)

## 🚀 Tính Năng Chính

- **🏛️ Cấp Chứng Chỉ (Issue):** Admin/Officer tải file (PDF/Image) lên, hệ thống tự động băm (hash) và lưu hash + metadata lên Blockchain. File gốc được lưu trên IPFS/Cloudinary.
- **🔍 Xác Thực (Verify):**
  - **Theo ID:** Nhập ID chứng chỉ để kiểm tra thông tin trên chuỗi.
  - **Theo File:** Tải file chứng chỉ lên để so khớp hash với Blockchain.
- **⚡ Performance:**
  - **Lazy Loading:** Tối ưu hóa việc tải danh sách chứng chỉ (< 5s).
  - **Caching:** Hệ thống cache thông minh cho Transaction Hash giúp truy xuất tức thì.
- **🛡️ Bảo Mật:**
  - Phân quyền Admin/Officer bằng Smart Contract.
  - Private Key chỉ được lưu ở Backend (Signed Transactions), Frontend an toàn tuyệt đối.

---

## 🏗️ Kiến Trúc Hệ Thống

Dự án gồm 3 module chính:

1.  **Smart Contract (`/smart-contract`)**:
    - Viết bằng **Solidity**, framework **Hardhat**.
    - Quản lý logic cấp phát, thu hồi và phân quyền.
    - Deploy trên **Cronos Testnet**.

2.  **Backend (`/backend`)**:
    - Node.js + Express.
    - Sử dụng **Ethers.js** để tương tác với Blockchain.
    - Tích hợp **Cloudinary** để lưu trữ file.
    - Tích hợp **Gemini AI** để trích xuất dữ liệu từ ảnh chứng chỉ (OCR).

3.  **Frontend (`/frontend`)**:
    - ReactJS + Vite + TailwindCSS.
    - Giao diện người dùng thân thiện, Responsive.
    - Kết nối với Backend API.

---

## 🛠️ Cài Đặt & Chạy Dự Án

### 1. Yêu cầu (Prerequisites)
- Node.js (v18+)
- Ví MetaMask (cấu hình mạng Cronos Testnet)

### 2. Cài đặt Dependencies
Chạy lệnh cài đặt cho cả 3 thư mục:

```bash
# Tại root folder
cd backend && npm install
cd ../frontend && npm install
cd ../smart-contract && npm install
```

### 3. Cấu hình Môi trường (.env)

Tạo file `.env` trong từng thư mục dựa trên file `.env.example`.

**Backend (`backend/.env`):**
```env
PORT=5000
MONGODB_URI=... (Optional)
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
GEMINI_API_KEY=...
# Blockchain Config
PRIVATE_KEY=... (Key của ví Admin dùng để ký transaction)
CONTRACT_ADDRESS=... (Địa chỉ Contract sau khi deploy)
RPC_URL=https://evm-t3.cronos.org
```

**Frontend (`frontend/.env`):**
```env
VITE_API_URL=http://localhost:5000/api
```

**Smart Contract (`smart-contract/.env`)** (Chỉ cần khi deploy):
```env
PRIVATE_KEY=... (Key ví deploy)
CRONOS_API_KEY=... (Optional)
```

### 4. Deploy Smart Contract (Nếu làm mới từ đầu)

```bash
cd smart-contract
npx hardhat ignition deploy ./ignition/modules/EduCertificate.ts --network cronos
# Copy Contract Address nhận được vào backend/.env
```

### 5. Chạy Ứng Dụng

Mở 2 terminal riêng biệt:

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

Truy cập: `http://localhost:5173`

---

## 📂 Cấu Trúc Thư Mục

```
Blockchain-Certificates-Storing/
├── backend/            # API Server & Blockchain Interaction
│   ├── src/controllers/ # Logic xử lý (Certificate, Auth)
│   ├── src/services/    # Blockchain, Cache, OCR Services
│   └── ...
├── frontend/           # React User Interface
│   ├── src/pages/       # Issue, Verify, Dashboard
│   ├── src/components/  # UI Components
│   └── ...
├── smart-contract/     # Solidity Contracts & Hardhat Config
│   ├── contracts/       # EduCertificate.sol
│   ├── ignition/        # Deployment Modules
│   └── ARCHITECTURE.md  # Tài liệu kiến trúc chi tiết
└── README.md           # Project Documentation
```

## 🔒 Security Notes
- **Không bao giờ commit file `.env`**.
- Private Key trong `backend/.env` phải được bảo vệ kỹ.
- Nếu lỡ lộ Private Key, hãy chuyển tài sản sang ví mới và update lại key trong `.env`.

---
*Developed by [Your Name/Team]*
