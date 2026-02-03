# ⚡ Quick Start: Deploy Backend lên Render

## 🎯 Các bước chính (5 phút)

### 1️⃣ Push code lên GitHub
```powershell
git add .
git commit -m "Ready for Render deployment"
git push origin main
```

### 2️⃣ Tạo MongoDB Atlas (miễn phí)
1. Vào: https://www.mongodb.com/cloud/atlas/register
2. Tạo FREE cluster
3. Tạo Database User (nhớ username + password)
4. Network Access → Add IP → **0.0.0.0/0** (Allow from anywhere)
5. Lấy Connection String:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/blockchain-certificates
   ```

### 3️⃣ Tạo Cloudinary (miễn phí)
1. Vào: https://cloudinary.com/users/register_free
2. Dashboard → Copy:
   - Cloud Name
   - API Key
   - API Secret

### 4️⃣ Deploy lên Render
1. Vào: https://render.com → Sign up bằng GitHub
2. Dashboard → **New +** → **Web Service**
3. Connect repo: `Blockchain-Certificates-Storing`
4. **Configure:**
   - Name: `blockchain-certificate-backend`
   - Region: **Singapore**
   - Root Directory: **`backend`** ⚠️
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Instance Type: **Free**

5. **Add Environment Variables** (Click "Advanced"):
   ```env
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/blockchain-certificates
   CONTRACT_ADDRESS=0xE6571C574050e40A2D052674896F3aB3F3baeE06
   CRONOS_RPC_URL=https://evm-t3.cronos.org
   CHAIN_ID=338
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   FRONTEND_URL=http://localhost:5173
   ```
   
   **⚠️ Thay thế các giá trị `your_*` và `username:password`!**

6. Click **"Create Web Service"**

### 5️⃣ Kiểm tra
Sau khi deploy xong (3-5 phút), test API:
```
https://your-service-name.onrender.com/health
```

Kết quả:
```json
{
  "status": "OK",
  "message": "Backend server is running"
}
```

---

## 📋 Checklist nhanh

- [ ] Code đã push lên GitHub
- [ ] Đã có MongoDB URI
- [ ] Đã có Cloudinary credentials
- [ ] Root Directory = **`backend`**
- [ ] Đã thêm đủ Environment Variables
- [ ] Service status = **Live** (màu xanh)
- [ ] Test `/health` endpoint thành công

---

## ⚠️ Lưu ý

- **Free tier sẽ sleep sau 15 phút** → Request đầu tiên sẽ chậm ~30s
- Sau khi deploy frontend, nhớ update `FRONTEND_URL` trong Environment Variables
- Mỗi lần push code, Render sẽ tự động redeploy

---

## 🆘 Gặp lỗi?

Xem hướng dẫn chi tiết: [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md)
