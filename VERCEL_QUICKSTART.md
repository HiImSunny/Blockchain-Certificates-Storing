# ⚡ Quick Start: Deploy Frontend lên Vercel

## 🎯 Các bước chính (3 phút)

### 1️⃣ Push code lên GitHub
```powershell
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### 2️⃣ Deploy lên Vercel
1. Vào: https://vercel.com → Login bằng GitHub
2. **Add New...** → **Project**
3. Import repo: `Blockchain-Certificates-Storing`
4. **Configure:**
   - Framework: **Vite**
   - Root Directory: **`frontend`** ⚠️
   - Build Command: `npm run build`
   - Output Directory: `dist`

5. **Add Environment Variable:**
   ```
   VITE_API_URL=https://your-backend.onrender.com/api/cert
   ```
   
   **⚠️ Thay `your-backend` bằng URL backend thật của bạn!**

6. Click **"Deploy"**

### 3️⃣ Update Backend CORS
Sau khi deploy xong, lấy URL frontend (ví dụ: `https://your-app.vercel.app`)

1. Vào Render Dashboard
2. Chọn backend service
3. Environment → Sửa `FRONTEND_URL`:
   ```
   FRONTEND_URL=https://your-app.vercel.app
   ```
4. Save Changes

### 4️⃣ Test
Mở frontend URL và test:
- ✅ Trang load được
- ✅ Kết nối MetaMask
- ✅ Upload/Verify certificate

---

## 📋 Checklist nhanh

- [ ] Backend đã deploy lên Render
- [ ] Code đã push lên GitHub
- [ ] Root Directory = **`frontend`**
- [ ] Environment Variable: `VITE_API_URL` đã set
- [ ] Backend `FRONTEND_URL` đã update
- [ ] Test ứng dụng thành công

---

## ⚠️ Lưu ý

### Environment Variable phải đúng format:
```
VITE_API_URL=https://your-backend.onrender.com/api/cert
```

**Phải có `/api/cert` ở cuối!**

### Root Directory phải là `frontend`
Nếu không, build sẽ fail.

### Auto-deploy
Mỗi lần push code → Vercel tự động deploy lại

---

## 🆘 Gặp lỗi?

- **Build failed**: Check Root Directory = `frontend`
- **API không hoạt động**: Check `VITE_API_URL` và `FRONTEND_URL`
- **CORS error**: Đảm bảo backend đã update `FRONTEND_URL`

Xem hướng dẫn chi tiết: [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)
