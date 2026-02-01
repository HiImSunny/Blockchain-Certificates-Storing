# Blockchain Certificate System - Full Stack Application

## 🎯 Project Overview

A complete blockchain-powered certificate management system for educational institutions, featuring:
- **AI-powered certificate issuance** with automatic data extraction
- **Blockchain verification** on Cronos Testnet for tamper-proof authenticity
- **Beautiful PDF generation** with Vietnamese template
- **Modern web interface** with MetaMask integration

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────┐
│ FRONTEND (React + Vite + TailwindCSS)          │
│ - MetaMask Integration                          │
│ - Issue/Verify Certificate UI                   │
│ - Minimalist Bordered Design                    │
└─────────────────────────────────────────────────┘
         ↓ (REST API)
┌─────────────────────────────────────────────────┐
│ BACKEND (Express + Node.js)                     │
│ - File Upload & Processing                      │
│ - Gemini AI (OCR/Extraction)                    │
│ - PDF Generation                                │
│ - Blockchain Read Service                       │
└─────────────────────────────────────────────────┘
         ↓                           ↓
┌──────────────────┐      ┌─────────────────────┐
│ MongoDB          │      │ Cronos Testnet      │
│ - Metadata       │      │ - Certificate Hash  │
│ - File URLs      │      │ - Issuer Address    │
│ - Status         │      │ - Timestamp         │
└──────────────────┘      └─────────────────────┘
         ↑
┌──────────────────┐
│ Cloudinary       │
│ - PDF Storage    │
│ - Image Storage  │
└──────────────────┘
```

---

## 📁 Project Structure

```
Blockchain-Certificates-Storing/
│
├── backend/                    # Express API Server
│   ├── src/
│   │   ├── config/            # Database, Cloudinary, Blockchain
│   │   ├── models/            # MongoDB schemas
│   │   ├── services/          # Gemini AI, PDF, Hashing, Blockchain
│   │   ├── controllers/       # API endpoints
│   │   ├── routes/            # Express routes
│   │   └── middleware/        # File upload
│   └── package.json
│
├── frontend/                   # React Web App
│   ├── src/
│   │   ├── components/        # UI components (Button, Input, Card, etc.)
│   │   ├── pages/             # Home, Issue, Verify
│   │   ├── config/            # Contract configuration
│   │   └── utils/             # MetaMask, API client
│   └── package.json
│
├── shared/                     # Shared configuration
│   ├── contract-abi.json      # Smart contract ABI
│   └── contract-config.json   # Contract address & network
│
├── smart-contract/             # Solidity contract (deployed)
│   ├── contracts/
│   │   └── EduCertificate.sol
│   └── ignition/deployments/
│
├── SETUP.md                    # Setup instructions
├── AUTHORIZATION.md            # Access control guide
└── README.md                   # This file
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- MetaMask browser extension
- Cloudinary account (free tier)
- Gemini API key

### Installation

**1. Backend Setup:**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev
```

**2. Frontend Setup:**
```bash
cd frontend
npm install
npm run dev
```

**3. Open Browser:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

📖 **Full setup guide:** See [SETUP.md](file:///d:/Blockchain-Certificates-Storing/SETUP.md)

---

## ✨ Features

### Certificate Issuance
- **Upload Mode**: Upload existing PDF/image → AI extracts data → Issue to blockchain
- **Manual Mode**: Fill form → Generate PDF → Issue to blockchain
- **AI Extraction**: Gemini AI automatically extracts student name, course, dates, etc.
- **PDF Template**: Beautiful Vietnamese certificate with "Digital Certificate Storing by DNC" branding

### Certificate Verification
- **By ID**: Enter certificate ID to verify
- **By File**: Upload certificate file to verify hash
- **Blockchain Proof**: Immutable verification on Cronos blockchain
- **Download**: Anyone can download verified certificates

### Security
- ✅ No private keys in backend (MetaMask signs all transactions)
- ✅ Blockchain immutability (tamper-proof)
- ✅ File hash verification
- ✅ Access control (Admin/Officer roles)

---

## 🛠️ Tech Stack

### Frontend
- **React** + **Vite** - Fast, modern web framework
- **TailwindCSS** - Minimalist bordered design
- **ethers.js** - Blockchain interaction
- **axios** - API client
- **lucide-react** - Icons

### Backend
- **Express.js** - REST API server
- **MongoDB** + **Mongoose** - Database
- **Cloudinary** - File storage
- **Gemini AI** - OCR/text extraction
- **pdf-lib** - PDF generation
- **ethers.js** - Blockchain read service

### Blockchain
- **Solidity** ^0.8.20 - Smart contract
- **Hardhat** - Development framework
- **Cronos Testnet** - Deployment network

---

## 📚 Documentation

- **[SETUP.md](file:///d:/Blockchain-Certificates-Storing/SETUP.md)** - Complete setup guide
- **[AUTHORIZATION.md](file:///d:/Blockchain-Certificates-Storing/AUTHORIZATION.md)** - Access control & authorization
- **[WORK_DISTRIBUTION.md](file:///d:/Blockchain-Certificates-Storing/WORK_DISTRIBUTION.md)** - Work distribution plan
- **[smart-contract/ARCHITECTURE.md](file:///d:/Blockchain-Certificates-Storing/smart-contract/ARCHITECTURE.md)** - Smart contract architecture

---

## 🔐 Smart Contract

**Deployed on Cronos Testnet:**
- **Address**: `0xE6571C574050e40A2D052674896F3aB3F3baeE06`
- **Network**: Cronos Testnet (Chain ID: 338)
- **Explorer**: https://cronos.org/explorer/testnet3

**Contract Features:**
- Issue certificates (Admin/Officers only)
- Verify certificates (Public)
- Revoke certificates (Issuer only)
- Update certificates (Issuer only)

---

## 🎨 UI Design

**Minimalist Bordered Style:**
- Cream/beige background (#F5F5DC)
- Dark borders (#333333)
- Orange accent (#D97706)
- Inter font family
- Clean, professional aesthetic

**Responsive Design:**
- Mobile-friendly
- Tablet-optimized
- Desktop-enhanced

---

## 🧪 Testing

1. **Start servers** (backend + frontend)
2. **Connect MetaMask** to Cronos Testnet
3. **Get test TCRO** from faucet
4. **Issue a certificate** (upload or manual)
5. **Verify certificate** (by ID or file)
6. **Download certificate**

---

## 🌐 Deployment

### Backend → Railway
```bash
# Deploy to Railway
railway login
railway init
railway up
```

### Frontend → Vercel
```bash
# Deploy to Vercel
vercel login
vercel deploy
```

---

## 📞 Support

For issues or questions, check the documentation files or review the smart contract architecture guide.

---

## 🎉 Credits

**Digital Certificate Storing by DNC**
- Powered by Cronos Blockchain
- Built with React, Express, and Solidity

---

## 📄 License

MIT License - See LICENSE file for details

