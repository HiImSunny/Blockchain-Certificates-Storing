# 🔧 Fix: Trang Admin không hiện trên Vercel

## Vấn đề
Trang Admin Dashboard không hiện gì khi deploy lên Vercel, nhưng chạy local thì bình thường.

## Nguyên nhân
Khi MetaMask chưa kết nối, trang chỉ hiển thị error message "Truy cập bị từ chối" mà không có nút để kết nối MetaMask.

## Giải pháp

Đã sửa file `frontend/src/pages/AdminDashboard.jsx`:

### Thay đổi 1: Không set error khi chưa kết nối MetaMask (Dòng 54-59)

**Đã sửa:**
```javascript
const currentAccount = await getCurrentAccount();
if (!currentAccount) {
    // Don't set error - let the UI show MetaMask connect button
    setLoading(false);
    return;
}
```

### Thay đổi 2: Hiển thị nút kết nối MetaMask (Dòng 167-206)

Cần thay thế phần UI `if (!isAdmin)` để hiển thị nút kết nối MetaMask:

**Thay thế từ dòng 167-188:**

```javascript
if (!isAdmin) {
    return (
        <div className="min-h-screen bg-neutral-cream">
            <header className="border-b-2 border-neutral-dark bg-white">
                <div className="container mx-auto px-4 py-6">
                    <Link to="/" className="inline-flex items-center gap-2 text-neutral-dark hover:text-primary">
                        <ArrowLeft size={20} />
                        <span>Về Trang Chủ</span>
                    </Link>
                </div>
            </header>
            <main className="container mx-auto px-4 py-8 max-w-2xl">
                <Card>
                    <div className="text-center py-8">
                        {error ? (
                            <>
                                <h2 className="text-2xl font-bold text-red-600 mb-4">Truy Cập Bị Từ Chối</h2>
                                <p className="text-neutral-gray mb-6">{error}</p>
                            </>
                        ) : (
                            <>
                                <h2 className="text-2xl font-bold text-neutral-dark mb-4">Trang Quản Trị</h2>
                                <p className="text-neutral-gray mb-6">
                                    Vui lòng kết nối ví MetaMask để truy cập trang quản trị
                                </p>
                                <div className="flex justify-center">
                                    <MetaMaskConnect />
                                </div>
                                <p className="text-sm text-neutral-gray mt-4">
                                    Sau khi kết nối, trang sẽ tự động kiểm tra quyền admin của bạn
                                </p>
                            </>
                        )}
                    </div>
                </Card>
            </main>
        </div>
    );
}
```

## Cách áp dụng

1. Mở file `frontend/src/pages/AdminDashboard.jsx`
2. Tìm dòng 167 (phần `if (!isAdmin)`)
3. Thay thế toàn bộ block từ dòng 167-188 bằng code ở trên
4. Save file
5. Push lên GitHub:
   ```powershell
   git add .
   git commit -m "Fix admin page MetaMask connection UI"
   git push origin main
   ```
6. Vercel sẽ tự động redeploy

## Kết quả

Sau khi fix:
- ✅ Trang admin sẽ hiển thị nút "Kết Nối MetaMask"
- ✅ Sau khi kết nối, tự động check quyền admin
- ✅ Nếu không phải admin, hiển thị error message rõ ràng
- ✅ Hoạt động tốt trên cả local và production (Vercel)

## Lưu ý

Sau khi kết nối MetaMask, nếu bạn không phải admin, sẽ thấy message:
> "Truy cập bị từ chối: Bạn không phải admin"

Để kiểm tra địa chỉ admin, xem trong file `backend/.env`:
```
CONTRACT_ADDRESS=0x...
```

Địa chỉ ví deploy contract chính là admin address.
