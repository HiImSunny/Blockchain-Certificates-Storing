# Blockchain Certificate System - Setup Guide

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **MongoDB** (local or MongoDB Atlas)
- **MetaMask** browser extension
- **Cloudinary** account (free tier)
- **Gemini API** key (Google AI Studio)

---

## 🚀 Quick Start

### 1. Clone and Setup

```bash
cd d:\Blockchain-Certificates-Storing
```

### 2. Backend Setup

```bash
cd backend
npm install
```

**Configure Environment Variables:**

Copy `.env.example` to `.env` and fill in your credentials:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/blockchain-certificates
# Or MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/blockchain-certificates

# Cloudinary (Get from https://cloudinary.com/console)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Gemini AI (Get from https://aistudio.google.com/app/apikey)
GEMINI_API_KEY=your_gemini_api_key

# Blockchain (Already configured)
CONTRACT_ADDRESS=0xE6571C574050e40A2D052674896F3aB3F3baeE06
CRONOS_RPC_URL=https://evm-t3.cronos.org
CHAIN_ID=338

# Server
PORT=5000
FRONTEND_URL=http://localhost:5173
```

**Start Backend:**

```bash
npm run dev
```

Backend should be running on `http://localhost:5000`

---

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

**Start Frontend:**

```bash
npm run dev
```

Frontend should be running on `http://localhost:5173`

---

## 🔑 Getting API Keys

### Cloudinary

1. Go to https://cloudinary.com/users/register_free
2. Sign up for free account
3. Go to Dashboard → Account Details
4. Copy: Cloud Name, API Key, API Secret

### Gemini API

1. Go to https://aistudio.google.com/app/apikey
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the API key

### MongoDB Atlas (Optional - if not using local MongoDB)

1. Go to https://www.mongodb.com/cloud/atlas/register
2. Create free cluster
3. Create database user
4. Whitelist your IP (or use 0.0.0.0/0 for testing)
5. Get connection string

---

## 🧪 Testing the Application

### 1. Start Both Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 2. Connect MetaMask

1. Open http://localhost:5173
2. Click "Connect MetaMask"
3. Approve network switch to Cronos Testnet
4. Get test TCRO from faucet: https://cronos.org/faucet

### 3. Issue a Certificate

**Option A: Upload Existing Certificate**
1. Go to "Issue Certificate"
2. Choose "Upload File"
3. Upload a PDF or image certificate
4. AI will extract data automatically
5. Review and edit extracted data
6. Click "Preview & Issue"
7. Sign transaction with MetaMask
8. Wait for confirmation

**Option B: Manual Input**
1. Go to "Issue Certificate"
2. Choose "Manual Input"
3. Fill in certificate details
4. Click "Generate PDF Preview"
5. Review generated PDF
6. Click "Issue to Blockchain"
7. Sign transaction with MetaMask

### 4. Verify a Certificate

**Option A: By Certificate ID**
1. Go to "Verify Certificate"
2. Choose "By Certificate ID"
3. Enter the certificate ID (e.g., CERT-1738393200000-A1B2C3D4)
4. Click "Verify"
5. View certificate details and blockchain verification

**Option B: By File Upload**
1. Go to "Verify Certificate"
2. Choose "By File Upload"
3. Upload the certificate file
4. System will hash the file and verify against blockchain
5. View verification results

---

## 📁 Project Structure

```
Blockchain-Certificates-Storing/
├── backend/
│   ├── src/
│   │   ├── config/          # Database, Cloudinary, Blockchain config
│   │   ├── models/          # MongoDB schemas
│   │   ├── services/        # Gemini AI, PDF generation, Hashing, Blockchain
│   │   ├── controllers/     # API endpoints logic
│   │   ├── routes/          # Express routes
│   │   ├── middleware/      # File upload middleware
│   │   ├── app.js           # Express app setup
│   │   └── server.js        # Server entry point
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # UI components (Button, Input, Card, etc.)
│   │   ├── pages/           # Pages (Home, Issue, Verify)
│   │   ├── config/          # Contract configuration
│   │   ├── utils/           # MetaMask, API client
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env
│   ├── tailwind.config.js
│   └── package.json
│
├── shared/
│   ├── contract-abi.json    # Smart contract ABI
│   └── contract-config.json # Contract address and network config
│
└── smart-contract/          # Already deployed contract
```

---

## 🔧 Troubleshooting

### Backend won't start

- **MongoDB connection error**: Make sure MongoDB is running or check Atlas connection string
- **Port already in use**: Change PORT in `.env` to another port (e.g., 5001)

### Frontend won't connect to backend

- Check that backend is running on http://localhost:5000
- Check CORS settings in `backend/src/app.js`
- Verify `VITE_API_URL` in `frontend/.env`

### MetaMask issues

- **Wrong network**: Make sure you're on Cronos Testnet (Chain ID: 338)
- **No TCRO**: Get test tokens from https://cronos.org/faucet
- **Transaction fails**: Check if your wallet is an admin or officer in the contract

### Gemini AI not extracting data

- Verify `GEMINI_API_KEY` is correct
- Check API quota limits
- System will work without Gemini, just no auto-fill

### File upload fails

- Check file size (max 10MB)
- Verify Cloudinary credentials
- Check file format (PDF, JPG, PNG only)

---

## 🌐 Deployment (Railway)

### Backend Deployment

1. Create account on https://railway.app
2. Click "New Project" → "Deploy from GitHub"
3. Select your repository
4. Set root directory to `/backend`
5. Add environment variables (same as `.env`)
6. Deploy!

### Frontend Deployment (Vercel)

1. Create account on https://vercel.com
2. Import your repository
3. Set root directory to `/frontend`
4. Add environment variable: `VITE_API_URL=https://your-backend-url.railway.app/api/cert`
5. Deploy!

---

## 📞 Support

For issues or questions:
- Check the documentation in `/AUTHORIZATION.md` and `/WORK_DISTRIBUTION.md`
- Review smart contract details in `/smart-contract/ARCHITECTURE.md`

---

## 🎉 You're All Set!

Your blockchain certificate system is now running locally. You can:
- ✅ Issue certificates with AI-powered data extraction
- ✅ Generate beautiful PDF certificates with Vietnamese template
- ✅ Verify certificates on the blockchain
- ✅ Download and share certificates

Happy certifying! 🚀
