# 🚀 Hướng dẫn Deploy Frontend lên Vercel

## 📋 Checklist trước khi deploy

- [ ] Backend đã deploy lên Render và có URL (ví dụ: `https://your-backend.onrender.com`)
- [ ] Code frontend đã push lên GitHub
- [ ] Đã test build local: `npm run build`

---

## 🎯 Các bước deploy (5 phút)

### 1️⃣ Push code lên GitHub

```powershell
cd d:\Blockchain-Certificates-Storing
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### 2️⃣ Deploy lên Vercel

1. **Vào Vercel**: https://vercel.com
2. **Sign up/Login** bằng GitHub
3. Click **"Add New..."** → **"Project"**
4. **Import repository**: Chọn `Blockchain-Certificates-Storing`
5. **Configure Project:**

   | Setting | Value |
   |---------|-------|
   | **Project Name** | `blockchain-certificate-frontend` (hoặc tên bạn thích) |
   | **Framework Preset** | `Vite` |
   | **Root Directory** | `frontend` ⚠️ **QUAN TRỌNG** |
   | **Build Command** | `npm run build` (auto-detect) |
   | **Output Directory** | `dist` (auto-detect) |
   | **Install Command** | `npm install` (auto-detect) |

6. **Add Environment Variables:**
   
   Click **"Environment Variables"** và thêm:
   
   | Key | Value | Ghi chú |
   |-----|-------|---------|
   | `VITE_API_URL` | `https://your-backend.onrender.com/api/cert` | ⚠️ Thay bằng URL backend của bạn |

   **Ví dụ:**
   ```
   VITE_API_URL=https://blockchain-certificate-backend.onrender.com/api/cert
   ```

7. Click **"Deploy"**

### 3️⃣ Đợi deploy hoàn thành

Vercel sẽ:
- Clone repo
- Install dependencies
- Build project
- Deploy lên CDN

Thời gian: ~2-3 phút

### 4️⃣ Lấy URL frontend

Sau khi deploy xong, bạn sẽ có URL dạng:
```
https://blockchain-certificate-frontend.vercel.app
```

hoặc

```
https://your-project-name-abc123.vercel.app
```

### 5️⃣ Update CORS trên Backend (Render)

**QUAN TRỌNG:** Backend cần biết frontend URL để cho phép CORS

1. Vào Render Dashboard: https://dashboard.render.com
2. Chọn service backend của bạn
3. Vào tab **"Environment"**
4. Sửa biến `FRONTEND_URL`:
   ```
   FRONTEND_URL=https://your-frontend.vercel.app
   ```
5. Click **"Save Changes"**
6. Service sẽ tự động redeploy (~1 phút)

### 6️⃣ Test ứng dụng

Mở frontend URL và test:
- ✅ Trang chủ load được
- ✅ Kết nối MetaMask
- ✅ Upload certificate
- ✅ Verify certificate

---

## 🔧 Cấu hình nâng cao (Optional)

### Custom Domain

1. Vào Vercel Dashboard → Project → Settings → Domains
2. Add domain của bạn
3. Configure DNS theo hướng dẫn

### Environment Variables cho nhiều môi trường

Vercel hỗ trợ 3 môi trường:
- **Production**: Dùng cho branch `main`
- **Preview**: Dùng cho pull requests
- **Development**: Dùng khi dev local

Bạn có thể set khác nhau cho từng môi trường.

---

## ⚠️ Lưu ý quan trọng

### 1. Root Directory phải là `frontend`
Nếu không set đúng, Vercel sẽ không tìm thấy `package.json`

### 2. Environment Variable phải có prefix `VITE_`
Vite chỉ expose biến có prefix `VITE_` ra client-side:
- ✅ `VITE_API_URL` - Được
- ❌ `API_URL` - Không được

### 3. Backend URL phải có `/api/cert`
Code frontend đang dùng:
```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/cert';
```

Nên `VITE_API_URL` phải là:
```
https://your-backend.onrender.com/api/cert
```

**KHÔNG PHẢI:**
```
https://your-backend.onrender.com  ❌
```

### 4. Auto-deploy
Mỗi khi push code lên GitHub:
- Branch `main` → Deploy lên Production
- Branch khác → Deploy lên Preview

### 5. Free Tier Limitations
- ✅ Unlimited bandwidth
- ✅ Automatic HTTPS
- ✅ Global CDN
- ⚠️ Build time: 6000 minutes/month (đủ dùng)

---

## 🐛 Troubleshooting

### ❌ Build failed: "Cannot find module"
**Nguyên nhân:** Root Directory sai
**Giải pháp:** 
- Settings → General → Root Directory → Set thành `frontend`
- Redeploy

### ❌ Blank page / 404 errors
**Nguyên nhân:** Output Directory sai
**Giải pháp:**
- Settings → General → Output Directory → Set thành `dist`
- Redeploy

### ❌ API calls fail / CORS error
**Nguyên nhân:** 
1. `VITE_API_URL` chưa set hoặc sai
2. Backend chưa update `FRONTEND_URL`

**Giải pháp:**
1. Kiểm tra Environment Variables trong Vercel
2. Update `FRONTEND_URL` trong Render
3. Redeploy cả 2

### ❌ Environment variable không hoạt động
**Nguyên nhân:** Quên prefix `VITE_`
**Giải pháp:**
- Đổi tên biến thành `VITE_API_URL`
- Redeploy

### ❌ MetaMask không kết nối được
**Nguyên nhân:** HTTPS required
**Giải pháp:**
- Vercel tự động dùng HTTPS → Không cần làm gì
- Nếu dùng custom domain, đảm bảo có SSL

---

## 📊 Kiểm tra logs

### Build Logs
1. Vào Vercel Dashboard
2. Chọn project
3. Tab **"Deployments"**
4. Click vào deployment → Xem logs

### Runtime Logs (Client-side)
1. Mở frontend URL
2. F12 → Console tab
3. Xem lỗi JavaScript (nếu có)

### API Logs (Backend)
- Xem trong Render Dashboard → Logs

---

## ✅ Checklist sau khi deploy

- [ ] Frontend URL hoạt động
- [ ] Trang chủ load được
- [ ] Không có lỗi trong Console (F12)
- [ ] API calls thành công (check Network tab)
- [ ] MetaMask kết nối được
- [ ] Upload certificate hoạt động
- [ ] Verify certificate hoạt động
- [ ] Backend `FRONTEND_URL` đã update

---

## 🔗 URLs cần nhớ

| Service | URL |
|---------|-----|
| Vercel Dashboard | https://vercel.com/dashboard |
| Render Dashboard | https://dashboard.render.com |
| Frontend (Production) | `https://your-app.vercel.app` |
| Backend API | `https://your-backend.onrender.com` |

---

## 📝 Workflow khi update code

```powershell
# 1. Sửa code
# 2. Test local
npm run dev

# 3. Build test
npm run build

# 4. Commit và push
git add .
git commit -m "Update feature X"
git push origin main

# 5. Vercel tự động deploy (1-2 phút)
# 6. Check production URL
```

---

## 🎉 Hoàn thành!

Sau khi làm xong các bước trên, bạn sẽ có:
- ✅ Frontend trên Vercel (CDN toàn cầu, tốc độ cao)
- ✅ Backend trên Render
- ✅ Auto-deploy khi push code
- ✅ HTTPS tự động
- ✅ Ứng dụng hoạt động hoàn chỉnh

---

## 🆘 Cần giúp đỡ?

Nếu gặp vấn đề:
1. Check Build Logs trong Vercel
2. Check Console trong browser (F12)
3. Check Network tab để xem API calls
4. Đảm bảo Environment Variables đúng
5. Đảm bảo Backend đang chạy (test `/health` endpoint)
