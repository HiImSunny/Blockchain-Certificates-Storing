# 🚀 Hướng dẫn Deploy Backend lên Render

## Bước 1: Chuẩn bị

### 1.1. Đảm bảo code đã được push lên GitHub
```powershell
# Kiểm tra status
git status

# Add tất cả thay đổi
git add .

# Commit
git commit -m "Prepare backend for Render deployment"

# Push lên GitHub
git push origin main
```

### 1.2. Chuẩn bị MongoDB (nếu chưa có)
Bạn cần MongoDB Atlas (miễn phí):
1. Truy cập: https://www.mongodb.com/cloud/atlas/register
2. Tạo tài khoản miễn phí
3. Tạo cluster mới (chọn FREE tier)
4. Tạo Database User (username + password)
5. Whitelist IP: Chọn "Allow Access from Anywhere" (0.0.0.0/0)
6. Lấy Connection String: 
   - Click "Connect" → "Connect your application"
   - Copy connection string: `mongodb+srv://username:password@cluster.mongodb.net/blockchain-certificates`

### 1.3. Chuẩn bị Cloudinary (nếu chưa có)
1. Truy cập: https://cloudinary.com/users/register_free
2. Tạo tài khoản miễn phí
3. Vào Dashboard, lấy:
   - Cloud Name
   - API Key
   - API Secret

---

## Bước 2: Deploy lên Render

### 2.1. Tạo tài khoản Render
1. Truy cập: https://render.com
2. Click **"Get Started"** hoặc **"Sign Up"**
3. Đăng ký bằng GitHub (khuyên dùng để dễ kết nối repo)

### 2.2. Tạo Web Service mới

1. **Vào Dashboard** → Click **"New +"** → Chọn **"Web Service"**

2. **Connect Repository:**
   - Nếu chưa connect GitHub: Click "Connect GitHub" và authorize
   - Tìm repository: `Blockchain-Certificates-Storing`
   - Click **"Connect"**

3. **Configure Service:**

   | Setting | Value |
   |---------|-------|
   | **Name** | `blockchain-certificate-backend` (hoặc tên bạn thích) |
   | **Region** | Singapore (gần Việt Nam nhất) |
   | **Branch** | `main` |
   | **Root Directory** | `backend` ⚠️ **QUAN TRỌNG** |
   | **Runtime** | `Node` |
   | **Build Command** | `npm install` |
   | **Start Command** | `npm start` |
   | **Instance Type** | `Free` |

4. **Click "Advanced"** để thêm Environment Variables

---

## Bước 3: Thêm Environment Variables

Click **"Add Environment Variable"** và thêm từng biến sau:

### Required Variables:

| Key | Value | Ghi chú |
|-----|-------|---------|
| `NODE_ENV` | `production` | |
| `PORT` | `5000` | Render sẽ tự động override |
| `MONGODB_URI` | `mongodb+srv://username:password@...` | Từ MongoDB Atlas |
| `CONTRACT_ADDRESS` | `0xE6571C574050e40A2D052674896F3aB3F3baeE06` | Địa chỉ contract của bạn |
| `CRONOS_RPC_URL` | `https://evm-t3.cronos.org` | |
| `CHAIN_ID` | `338` | |
| `CLOUDINARY_CLOUD_NAME` | `your_cloud_name` | Từ Cloudinary Dashboard |
| `CLOUDINARY_API_KEY` | `your_api_key` | Từ Cloudinary Dashboard |
| `CLOUDINARY_API_SECRET` | `your_api_secret` | Từ Cloudinary Dashboard |
| `GEMINI_API_KEY` | `your_gemini_api_key` | (Optional) Nếu dùng AI |
| `FRONTEND_URL` | `http://localhost:5173` | Tạm thời, sẽ update sau khi deploy frontend |

### Cách thêm nhanh:
Render cho phép paste nhiều biến cùng lúc. Click **"Add from .env"** và paste:

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
GEMINI_API_KEY=your_gemini_api_key
FRONTEND_URL=http://localhost:5173
```

**⚠️ Nhớ thay thế các giá trị `your_*` bằng giá trị thật của bạn!**

---

## Bước 4: Deploy

1. Click **"Create Web Service"**
2. Render sẽ bắt đầu build và deploy
3. Theo dõi logs để xem quá trình deploy

### Logs bạn sẽ thấy:
```
==> Cloning from https://github.com/your-username/Blockchain-Certificates-Storing...
==> Checking out commit abc123...
==> Using Node version 20.x.x
==> Running 'npm install'
==> Running 'npm start'
==> Server listening on port 5000
==> Your service is live 🎉
```

---

## Bước 5: Kiểm tra Backend đã chạy

Sau khi deploy thành công, bạn sẽ có URL dạng:
```
https://blockchain-certificate-backend.onrender.com
```

### Test API:
Mở trình duyệt và truy cập:
```
https://blockchain-certificate-backend.onrender.com/api/health
```

Hoặc dùng PowerShell:
```powershell
Invoke-RestMethod -Uri "https://blockchain-certificate-backend.onrender.com/api/health"
```

**Kết quả mong đợi:**
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

---

## Bước 6: Update CORS cho Frontend

Sau khi deploy frontend lên Vercel, bạn cần update biến `FRONTEND_URL`:

1. Vào Render Dashboard
2. Chọn service `blockchain-certificate-backend`
3. Vào tab **"Environment"**
4. Sửa `FRONTEND_URL` thành URL của frontend trên Vercel:
   ```
   https://your-app.vercel.app
   ```
5. Click **"Save Changes"**
6. Service sẽ tự động redeploy

---

## 🎯 Troubleshooting

### ❌ Build failed: "Cannot find module"
**Nguyên nhân:** Thiếu dependencies
**Giải pháp:** 
- Kiểm tra `package.json` có đầy đủ dependencies
- Đảm bảo `Root Directory` = `backend`

### ❌ Application failed to respond
**Nguyên nhân:** Server không start được
**Giải pháp:**
- Kiểm tra logs trong Render Dashboard
- Đảm bảo `Start Command` = `npm start`
- Kiểm tra `MONGODB_URI` có đúng không

### ❌ MongooseServerSelectionError
**Nguyên nhân:** Không kết nối được MongoDB
**Giải pháp:**
- Kiểm tra MongoDB Atlas có whitelist IP `0.0.0.0/0`
- Kiểm tra `MONGODB_URI` có đúng username/password
- Đảm bảo cluster đang chạy

### ❌ CORS Error khi gọi từ frontend
**Nguyên nhân:** `FRONTEND_URL` chưa đúng
**Giải pháp:**
- Update `FRONTEND_URL` trong Environment Variables
- Hoặc sửa code CORS trong `backend/src/app.js` để cho phép tất cả origins (chỉ dùng khi test):
  ```javascript
  app.use(cors({ origin: '*' }));
  ```

---

## 📝 Lưu ý quan trọng

### 1. Free Tier Limitations
- ⚠️ **Service sẽ sleep sau 15 phút không hoạt động**
- ⚠️ **Request đầu tiên sau khi sleep sẽ mất ~30 giây để wake up**
- ✅ Giải pháp: Upgrade lên paid plan ($7/month) hoặc dùng cron job để ping server

### 2. Auto-Deploy
- ✅ Mỗi khi push code lên GitHub, Render sẽ tự động build và deploy lại
- ✅ Có thể tắt auto-deploy trong Settings nếu muốn deploy thủ công

### 3. Logs
- Xem logs realtime trong Dashboard → Logs tab
- Logs giúp debug khi có lỗi

### 4. Environment Variables
- Có thể update bất cứ lúc nào
- Sau khi update, service sẽ tự động redeploy

---

## ✅ Checklist

Trước khi deploy, đảm bảo:
- [ ] Code đã push lên GitHub
- [ ] Đã tạo MongoDB Atlas cluster
- [ ] Đã tạo Cloudinary account
- [ ] Đã có tất cả environment variables
- [ ] `Root Directory` = `backend`
- [ ] `Build Command` = `npm install`
- [ ] `Start Command` = `npm start`

Sau khi deploy:
- [ ] Service status = "Live" (màu xanh)
- [ ] Test API endpoint `/api/health` thành công
- [ ] Logs không có error
- [ ] Update `FRONTEND_URL` sau khi deploy frontend

---

## 🔗 Links hữu ích

- Render Dashboard: https://dashboard.render.com
- MongoDB Atlas: https://cloud.mongodb.com
- Cloudinary: https://cloudinary.com/console
- Render Docs: https://render.com/docs

---

## 📞 Cần giúp đỡ?

Nếu gặp vấn đề, hãy:
1. Kiểm tra Logs trong Render Dashboard
2. Kiểm tra lại Environment Variables
3. Đảm bảo MongoDB và Cloudinary đã setup đúng
4. Thử redeploy thủ công: Dashboard → Manual Deploy → "Clear build cache & deploy"
