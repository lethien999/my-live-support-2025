# 🔍 HƯỚNG DẪN TÌM ĐÚNG GOOGLE API

## ❌ KHÔNG TÌM THẤY "Google OAuth2 API"?

**Lý do:** API này không tồn tại! Google không có API tên "Google OAuth2 API".

## ✅ CÁCH TÌM ĐÚNG:

### 1. Truy cập Google Cloud Console
- Vào: https://console.cloud.google.com/apis/library
- Đăng nhập bằng tài khoản Google

### 2. Tìm kiếm đúng tên API:

**🔍 Tìm kiếm:**
- `Google+ API` ✅
- `People API` ✅  
- `Google Identity` ✅

**❌ KHÔNG tìm:**
- ~~Google OAuth2 API~~ (không tồn tại)
- ~~OAuth2 API~~ (không tồn tại)

### 3. Enable các API sau:

#### **Google+ API**
- Tìm kiếm: "Google+ API"
- Click vào kết quả đầu tiên
- Click "Enable"

#### **People API**  
- Tìm kiếm: "People API"
- Click vào "People API (Google)"
- Click "Enable"

#### **Google Identity**
- Tìm kiếm: "Google Identity"
- Click vào "Google Identity"
- Click "Enable"

## 🔧 TẠO OAUTH CREDENTIALS:

### 1. Vào Credentials
- Vào: https://console.cloud.google.com/apis/credentials
- Click "Create Credentials" → "OAuth client ID"

### 2. Cấu hình OAuth Client
- **Application type:** Web application
- **Name:** `MUJI Live Support Web`

### 3. Authorized JavaScript origins:
```
http://localhost:5173
http://localhost:3000
```

### 4. Authorized redirect URIs:
```
http://localhost:5173/auth/google/callback
http://localhost:3000/auth/google/callback
```

### 5. Click "Create"
- Copy **Client ID** và **Client Secret**
- Lưu lại để sử dụng

## 🎯 LƯU Ý QUAN TRỌNG:

1. **Google+ API** đã deprecated nhưng vẫn hoạt động
2. **People API** là API mới thay thế Google+ API
3. **Google Identity** cung cấp OAuth services
4. **Không cần** "Google OAuth2 API" - nó không tồn tại!

## 🔍 NẾU VẪN KHÔNG TÌM THẤY:

### Kiểm tra:
1. **Project đã được chọn** chưa?
2. **APIs & Services** đã được enable chưa?
3. **Tên tìm kiếm** có chính xác không?

### Thử tìm kiếm khác:
- `Google+`
- `People`  
- `Identity`
- `OAuth`

## 📞 HỖ TRỢ:

Nếu vẫn không tìm thấy, hãy:
1. Screenshot trang API Library
2. Gửi cho tôi để hỗ trợ
3. Hoặc thử tạo project mới
