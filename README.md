# Blockchain Certificate System - Project Overview

## 🎯 Mục Tiêu Dự Án

Xây dựng hệ thống quản lý chứng chỉ giáo dục trên blockchain Cronos, cho phép:
- Phát hành chứng chỉ bất biến trên blockchain
- Xác minh tính hợp lệ của chứng chỉ
- Thu hồi chứng chỉ khi cần thiết

## 🏗️ Kiến Trúc Hệ Thống

```
┌─────────────────────────────────────┐
│ Admin/Officer (MetaMask)            │
│ - Quản lý private key               │
│ - Ký transactions                   │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Frontend (React + ethers.js)        │
│ - MetaMask integration              │
│ - Issue certificates                │
│ - Verify certificates               │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Smart Contract (Cronos Testnet)     │
│ - EduCertificate.sol                │
│ - Access control (Admin/Officers)   │
│ - Certificate storage               │
└─────────────────────────────────────┘
```

## 📁 Cấu Trúc Project

```
Blockchain-Certificates-Storing/
│
├── smart-contract/              # Smart contract & deployment
│   ├── contracts/               # Solidity contracts
│   ├── scripts/                 # Deployment & utility scripts
│   ├── test/                    # Contract tests
│   └── ignition/                # Hardhat Ignition deployment
│
├── frontend/                    # React frontend
│   ├── src/
│   │   ├── config/              # Contract configuration
│   │   ├── utils/               # Web3 utilities
│   │   └── services/            # Contract interaction services
│   └── METAMASK_INTEGRATION.md  # Integration guide
│
├── backend/                     # (Optional) Backend API
│   └── README.md                # Backend setup guide
│
├── WORK_DISTRIBUTION.md         # Phân công công việc
├── AUTHORIZATION.md             # Access control guide
└── .gitignore                   # Git ignore rules
```

## 🚀 Quick Start

### 1. Deploy Smart Contract (Người 1)
```bash
cd smart-contract
npm install
cp .env.example .env
# Edit .env with your private key
npx hardhat ignition deploy ./ignition/modules/EduCertificate.ts --network cronos
```

### 2. Build Frontend (Người 2)
```bash
cd frontend
npm install
# Copy contract address to src/config/contract.js
# Copy ABI from smart-contract/artifacts/
npm start
```

## 👥 Phân Công Công Việc

Xem chi tiết trong `WORK_DISTRIBUTION.md`:

- **Người 1:** Smart Contract & Deployment (Khó hơn)
- **Người 2:** Frontend Development (Dễ hơn)

## 📚 Documentation

- `smart-contract/README.md` - Smart contract setup
- `smart-contract/ARCHITECTURE.md` - Architecture overview
- `frontend/METAMASK_INTEGRATION.md` - MetaMask integration guide
- `AUTHORIZATION.md` - Access control & authorization
- `WORK_DISTRIBUTION.md` - Work distribution plan

## 🔐 Security

- ✅ Private keys NEVER in code
- ✅ MetaMask manages user wallets
- ✅ Access control via smart contract
- ✅ All sensitive files in .gitignore

## 🛠️ Tech Stack

- **Smart Contract:** Solidity, Hardhat
- **Frontend:** React, ethers.js, MetaMask
- **Blockchain:** Cronos Testnet
- **Deployment:** Hardhat Ignition

## 📞 Support

Đọc documentation trong các file README.md và .md tương ứng.
