# Deployment Guide

## Overview
This project has been restructured to support independent deployment of frontend (Vercel) and backend (Render) without requiring access to the `shared/` or `smart-contract/` folders.

## Changes Made

### 1. Frontend (Vercel Deployment)
**Files copied:**
- `shared/contract-abi.json` → `frontend/src/config/contract-abi.json`
- `shared/contract-config.json` → `frontend/src/config/contract-config.json`

**Import updated in:**
- `frontend/src/config/contract.js` - Now imports from local `./contract-abi.json` and `./contract-config.json`

### 2. Backend (Render Deployment)
**Files copied:**
- `shared/contract-abi.json` → `backend/src/config/contract-abi.json`

**Import updated in:**
- `backend/src/config/contract.js` - Now imports from local `./contract-abi.json` instead of reading from `smart-contract/ignition/deployments/`

## Deployment Instructions

### Frontend (Vercel)
1. Push your code to GitHub
2. In Vercel dashboard:
   - Select repository: `Blockchain-Certificates-Storing`
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add environment variables from `frontend/.env`:
   ```
   VITE_API_URL=<your-backend-url>
   ```
4. Deploy

### Backend (Render)
1. Push your code to GitHub
2. In Render dashboard:
   - Select repository: `Blockchain-Certificates-Storing`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
3. Add environment variables from `backend/.env`:
   ```
   PORT=3000
   NODE_ENV=production
   MONGODB_URI=<your-mongodb-uri>
   JWT_SECRET=<your-jwt-secret>
   CONTRACT_ADDRESS=<your-contract-address>
   CRONOS_RPC_URL=https://evm-t3.cronos.org
   CHAIN_ID=338
   CLOUDINARY_CLOUD_NAME=<your-cloudinary-name>
   CLOUDINARY_API_KEY=<your-cloudinary-key>
   CLOUDINARY_API_SECRET=<your-cloudinary-secret>
   ```
4. Deploy

## Important Notes

### Updating Contract Configuration
If you redeploy the smart contract or change configuration:

1. **Update the source files in `shared/` folder:**
   - Update `shared/contract-abi.json` with new ABI
   - Update `shared/contract-config.json` with new contract address

2. **Run the sync script:**
   ```powershell
   .\sync-contract-config.ps1
   ```
   
   Or manually copy:
   ```powershell
   Copy-Item "shared/contract-abi.json" "frontend/src/config/contract-abi.json"
   Copy-Item "shared/contract-config.json" "frontend/src/config/contract-config.json"
   Copy-Item "shared/contract-abi.json" "backend/src/config/contract-abi.json"
   ```

3. **Commit and push changes**

4. **Redeploy** - Vercel and Render will auto-deploy on push

### Alternative: Using Environment Variables
For `CONTRACT_ADDRESS`, you can also update it via environment variables without redeploying:
- **Frontend**: Set `VITE_CONTRACT_ADDRESS` in Vercel
- **Backend**: Set `CONTRACT_ADDRESS` in Render

## Folder Structure
```
Blockchain-Certificates-Storing/
├── frontend/
│   ├── src/
│   │   └── config/
│   │       ├── contract.js
│   │       ├── contract-abi.json      ← Copied from shared/
│   │       └── contract-config.json   ← Copied from shared/
│   └── ...
├── backend/
│   ├── src/
│   │   └── config/
│   │       ├── contract.js
│   │       └── contract-abi.json      ← Copied from shared/
│   └── ...
├── shared/                             ← Original source (can be removed after deployment)
│   ├── contract-abi.json
│   └── contract-config.json
└── smart-contract/                     ← Not needed for frontend/backend deployment
    └── ...
```

## Should I Keep the `shared/` Folder?

**Recommended: Keep it** as the "source of truth" for contract configuration.

### Why keep it?
- ✅ Single source of truth for contract config
- ✅ Easy to sync between frontend and backend using `sync-contract-config.ps1`
- ✅ Clear workflow when updating contract configuration
- ✅ Prevents inconsistencies between frontend and backend

### Workflow with `shared/` folder:
1. Update contract → Update files in `shared/`
2. Run `.\sync-contract-config.ps1`
3. Commit and push
4. Auto-deploy

### Can I delete it?
**Yes**, you can delete it if you prefer. The frontend and backend will work fine without it. However, you'll need to manually update contract config in both places when needed.
