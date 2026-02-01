# 🚀 Hướng Dẫn Setup & Chạy Project

## 📋 Yêu Cầu Trước Khi Bắt Đầu

- ✅ Node.js 18+ đã cài đặt
- ✅ MongoDB đã cài đặt (hoặc dùng MongoDB Atlas)
- ✅ MetaMask extension trên browser
- ✅ Tài khoản Cloudinary (free)
- ✅ Gemini API key (free)

---

## 🔧 BƯỚC 1: Cài Đặt Backend

### 1.1. Cài dependencies
```bash
cd backend
npm install
```

### 1.2. Tạo file .env
```bash
# Copy file mẫu
copy .env.example .env

# Hoặc trên Linux/Mac
cp .env.example .env
```

### 1.3. Điền thông tin vào .env

Mở file `backend/.env` và điền:

```env
# MongoDB (chọn 1 trong 2)
# Option 1: MongoDB local
MONGODB_URI=mongodb://localhost:27017/blockchain-certificates

# Option 2: MongoDB Atlas (khuyến nghị)
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/blockchain-certificates

# Cloudinary - Lấy từ https://cloudinary.com/console
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here

# Gemini AI - Lấy từ https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# Blockchain (ĐÃ CÓ SẴN - không cần sửa)
CONTRACT_ADDRESS=0xE6571C574050e40A2D052674896F3aB3F3baeE06
CRONOS_RPC_URL=https://evm-t3.cronos.org
CHAIN_ID=338

# Server
PORT=5000
FRONTEND_URL=http://localhost:5173
```

### 1.4. Chạy backend
```bash
npm run dev
```

✅ Backend chạy tại: **http://localhost:5000**

---

## 🎨 BƯỚC 2: Cài Đặt Frontend

Mở terminal mới (giữ backend chạy):

### 2.1. Cài dependencies
```bash
cd frontend
npm install
```

### 2.2. Kiểm tra file .env

File `frontend/.env` đã có sẵn:
```env
VITE_API_URL=http://localhost:5000/api/cert
```

### 2.3. Chạy frontend
```bash
npm run dev
```

✅ Frontend chạy tại: **http://localhost:5173**

---

## 🔑 BƯỚC 3: Lấy API Keys

### 3.1. Cloudinary (Bắt buộc)

1. Truy cập: https://cloudinary.com/users/register_free
2. Đăng ký tài khoản miễn phí
3. Vào Dashboard → Account Details
4. Copy 3 thông tin:
   - Cloud Name
   - API Key
   - API Secret
5. Dán vào `backend/.env`

### 3.2. Gemini API (Bắt buộc)

1. Truy cập: https://aistudio.google.com/app/apikey
2. Đăng nhập Google
3. Click "Create API Key"
4. Copy API key
5. Dán vào `backend/.env`

### 3.3. MongoDB Atlas (Tùy chọn - nếu không dùng local)

1. Truy cập: https://www.mongodb.com/cloud/atlas/register
2. Tạo cluster miễn phí
3. Tạo database user
4. Whitelist IP: `0.0.0.0/0` (cho phép tất cả - chỉ dùng test)
5. Lấy connection string
6. Dán vào `backend/.env`

---

## 🦊 BƯỚC 4: Setup MetaMask

### 4.1. Cài MetaMask
- Chrome: https://metamask.io/download/

### 4.2. Thêm Cronos Testnet

1. Mở MetaMask
2. Click Networks → Add Network
3. Điền thông tin:
   - **Network Name:** Cronos Testnet
   - **RPC URL:** https://evm-t3.cronos.org
   - **Chain ID:** 338
   - **Currency Symbol:** TCRO
   - **Block Explorer:** https://cronos.org/explorer/testnet3

### 4.3. Lấy Test TCRO

1. Copy địa chỉ ví của bạn
2. Truy cập: https://cronos.org/faucet
3. Paste địa chỉ và nhận TCRO miễn phí

---

## ✅ BƯỚC 5: Test Hệ Thống

### 5.1. Mở trình duyệt
```
http://localhost:5173
```

### 5.2. Kết nối MetaMask
- Click "Connect MetaMask"
- Chấp nhận kết nối
- Chấp nhận chuyển network sang Cronos Testnet

### 5.3. Test Issue Certificate

**Cách 1: Upload File**
1. Click "Issue Certificate"
2. Chọn "Upload File"
3. Upload file PDF hoặc ảnh certificate
4. AI sẽ tự động trích xuất thông tin
5. Review và edit nếu cần
6. Click "Preview & Issue"
7. Ký transaction với MetaMask
8. Đợi confirmation

**Cách 2: Manual Input**
1. Click "Issue Certificate"
2. Chọn "Manual Input"
3. Điền thông tin certificate
4. Click "Generate PDF Preview"
5. Review PDF
6. Click "Issue to Blockchain"
7. Ký transaction với MetaMask

### 5.4. Test Verify Certificate

**Cách 1: By ID**
1. Click "Verify Certificate"
2. Chọn "By Certificate ID"
3. Nhập ID (ví dụ: CERT-1738393200000-A1B2C3D4)
4. Click "Verify"

**Cách 2: By File**
1. Click "Verify Certificate"
2. Chọn "By File Upload"
3. Upload file certificate
4. Hệ thống sẽ hash và verify

### 5.5. Test Admin Dashboard (Nếu bạn là admin)

1. Kết nối ví admin (ví deploy contract)
2. Click "Admin Dashboard" ở góc phải
3. Test:
   - Add/Remove Officer
   - Xem danh sách certificates
   - Revoke certificate

---

## 🐛 Xử Lý Lỗi Thường Gặp

### Lỗi: Backend không start

**Nguyên nhân:** MongoDB chưa chạy hoặc connection string sai

**Giải pháp:**
```bash
# Kiểm tra MongoDB local
mongod --version

# Hoặc dùng MongoDB Atlas
# Kiểm tra connection string trong .env
```

### Lỗi: "Cannot connect to MongoDB"

**Giải pháp:**
- Nếu dùng local: Start MongoDB service
- Nếu dùng Atlas: Kiểm tra IP whitelist và connection string

### Lỗi: "Cloudinary upload failed"

**Giải pháp:**
- Kiểm tra CLOUDINARY_CLOUD_NAME, API_KEY, API_SECRET trong .env
- Đảm bảo không có khoảng trắng thừa

### Lỗi: "Gemini API error"

**Giải pháp:**
- Kiểm tra GEMINI_API_KEY
- Kiểm tra quota API (free tier có giới hạn)
- Hệ thống vẫn hoạt động nếu Gemini fail, chỉ không auto-fill

### Lỗi: MetaMask "Wrong network"

**Giải pháp:**
- Thêm Cronos Testnet vào MetaMask (xem BƯỚC 4.2)
- Hệ thống sẽ tự động đề xuất chuyển network

### Lỗi: "Transaction failed"

**Nguyên nhân:** Ví không phải admin/officer

**Giải pháp:**
- Đảm bảo ví đã được thêm làm officer
- Hoặc dùng ví admin (ví deploy contract)

---

## 📝 Checklist Trước Khi Chạy

- [ ] Node.js đã cài
- [ ] MongoDB đang chạy (hoặc có Atlas connection string)
- [ ] File `backend/.env` đã điền đầy đủ
- [ ] Cloudinary API keys hợp lệ
- [ ] Gemini API key hợp lệ
- [ ] Backend chạy thành công (port 5000)
- [ ] Frontend chạy thành công (port 5173)
- [ ] MetaMask đã cài và có TCRO

---

## 🎉 Hoàn Thành!

Nếu tất cả các bước trên OK, bạn đã có:
- ✅ Backend API chạy tại http://localhost:5000
- ✅ Frontend UI chạy tại http://localhost:5173
- ✅ MetaMask kết nối Cronos Testnet
- ✅ Có thể issue và verify certificates

**Chúc bạn thành công!** 🚀

---

## 📞 Cần Trợ Giúp?

- Kiểm tra file `SETUP.md` để biết thêm chi tiết
- Xem `walkthrough.md` để hiểu luồng hoạt động
- Đọc `GIT_COMMITS.md` để hiểu cấu trúc code
