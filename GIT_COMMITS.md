# Git Commit Guide - Blockchain Certificate System

Hướng dẫn chia code thành 6 commits để đẩy lên GitHub.

---

## Commit 1: Project Setup & Smart Contract Integration

**Message:** `feat: initial project setup with smart contract integration`

**Files to commit:**
```bash
git add .gitignore
git add README.md
git add SETUP.md
git add AUTHORIZATION.md
git add WORK_DISTRIBUTION.md
git add smart-contract/
git add shared/
git commit -m "feat: initial project setup with smart contract integration

- Add project documentation (README, SETUP, AUTHORIZATION)
- Add deployed smart contract (EduCertificate.sol)
- Add shared contract configuration (ABI, address, network)
- Setup project structure for full-stack application"
```

---

## Commit 2: Backend Core Services & Configuration

**Message:** `feat: implement backend core services and configuration`

**Files to commit:**
```bash
git add backend/package.json
git add backend/.env.example
git add backend/.gitignore
git add backend/src/config/
git add backend/src/models/
git add backend/src/middleware/
git commit -m "feat: implement backend core services and configuration

- Setup Express server with MongoDB and Cloudinary
- Add Certificate model with comprehensive schema
- Configure Gemini AI for OCR/extraction
- Add blockchain read service with ethers.js
- Setup file upload middleware with Multer"
```

---

## Commit 3: Backend Services - PDF Generation & AI Extraction

**Message:** `feat: add PDF generation and Gemini AI extraction services`

**Files to commit:**
```bash
git add backend/src/services/geminiService.js
git add backend/src/services/pdfService.js
git add backend/src/services/hashService.js
git add backend/src/services/blockchainService.js
git commit -m "feat: add PDF generation and Gemini AI extraction services

- Implement Gemini AI OCR for certificate data extraction
- Add PDF generation with Vietnamese certificate template
- Add keccak256 hashing service (Solidity-compatible)
- Implement blockchain verification service"
```

---

## Commit 4: Backend API Endpoints & Routes

**Message:** `feat: implement certificate and admin API endpoints`

**Files to commit:**
```bash
git add backend/src/controllers/
git add backend/src/routes/
git add backend/src/app.js
git add backend/src/server.js
git commit -m "feat: implement certificate and admin API endpoints

- Add certificate upload with AI extraction endpoint
- Add manual certificate creation with PDF generation
- Add certificate verification (by ID and file)
- Add revoke certificate endpoint
- Add admin endpoints (check admin/officer, statistics)
- Setup Express routes and error handling"
```

---

## Commit 5: Frontend UI Components & Pages

**Message:** `feat: build frontend UI with React, Vite, and TailwindCSS`

**Files to commit:**
```bash
git add frontend/package.json
git add frontend/.env
git add frontend/.gitignore
git add frontend/index.html
git add frontend/vite.config.js
git add frontend/tailwind.config.js
git add frontend/postcss.config.js
git add frontend/src/index.css
git add frontend/src/main.jsx
git add frontend/src/App.jsx
git add frontend/src/components/
git add frontend/src/pages/Home.jsx
git add frontend/src/pages/IssueCertificate.jsx
git add frontend/src/pages/VerifyCertificate.jsx
git commit -m "feat: build frontend UI with React, Vite, and TailwindCSS

- Setup React + Vite with TailwindCSS minimalist theme
- Create reusable UI components (Button, Input, Card, Modal)
- Add MetaMask connection component
- Build Home page with features and how-it-works
- Build Issue Certificate page (upload + manual modes)
- Build Verify Certificate page (by ID + file upload)
- Add file upload with drag-and-drop support"
```

---

## Commit 6: Admin Dashboard & MetaMask Integration

**Message:** `feat: add admin dashboard and complete MetaMask integration`

**Files to commit:**
```bash
git add frontend/src/pages/AdminDashboard.jsx
git add frontend/src/config/
git add frontend/src/utils/
git add backend/src/services/adminService.js
git commit -m "feat: add admin dashboard and complete MetaMask integration

- Add admin dashboard with officer management
- Implement certificate list with revoke functionality
- Add statistics display (total, issued, revoked, pending)
- Complete MetaMask utilities (connect, sign, add/remove officers)
- Add API client for all backend endpoints
- Implement admin-only access control"
```

---

## 🚀 Quick Commands (Copy & Paste)

### Commit 1:
```bash
git add .gitignore README.md SETUP.md AUTHORIZATION.md WORK_DISTRIBUTION.md smart-contract/ shared/
git commit -m "feat: initial project setup with smart contract integration"
```

### Commit 2:
```bash
git add backend/package.json backend/.env.example backend/.gitignore backend/src/config/ backend/src/models/ backend/src/middleware/
git commit -m "feat: implement backend core services and configuration"
```

### Commit 3:
```bash
git add backend/src/services/
git commit -m "feat: add PDF generation and Gemini AI extraction services"
```

### Commit 4:
```bash
git add backend/src/controllers/ backend/src/routes/ backend/src/app.js backend/src/server.js
git commit -m "feat: implement certificate and admin API endpoints"
```

### Commit 5:
```bash
git add frontend/package.json frontend/.env frontend/.gitignore frontend/index.html frontend/vite.config.js frontend/tailwind.config.js frontend/postcss.config.js frontend/src/index.css frontend/src/main.jsx frontend/src/App.jsx frontend/src/components/ frontend/src/pages/Home.jsx frontend/src/pages/IssueCertificate.jsx frontend/src/pages/VerifyCertificate.jsx
git commit -m "feat: build frontend UI with React, Vite, and TailwindCSS"
```

### Commit 6:
```bash
git add frontend/src/pages/AdminDashboard.jsx frontend/src/config/ frontend/src/utils/ backend/src/services/adminService.js
git commit -m "feat: add admin dashboard and complete MetaMask integration"
```

### Push to GitHub:
```bash
git push origin main
```

---

## 📝 Notes

- **Conventional Commits**: Sử dụng format `feat:` cho tất cả commits vì đây là features mới
- **Logical Grouping**: Mỗi commit là một phần logic hoàn chỉnh
- **Order**: Commits theo thứ tự từ setup → backend → frontend → admin
- **Testing**: Sau mỗi commit, code vẫn có thể build được (trừ commit 1-2)

---

## ⚠️ Before Committing

1. **Check git status:**
   ```bash
   git status
   ```

2. **Review changes:**
   ```bash
   git diff
   ```

3. **Make sure .env files are NOT committed:**
   ```bash
   # .env files should be in .gitignore
   backend/.env
   frontend/.env
   ```

4. **Verify .gitignore:**
   ```bash
   cat backend/.gitignore
   cat frontend/.gitignore
   ```
