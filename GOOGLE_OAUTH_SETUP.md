# 🔐 HƯỚNG DẪN TÍCH HỢP GOOGLE OAUTH

## 📋 BƯỚC 1: TẠO GOOGLE CLOUD PROJECT

### 1. Truy cập Google Cloud Console
- Vào: https://console.cloud.google.com/
- Đăng nhập bằng tài khoản Google

### 2. Tạo Project mới
- Click "Select a project" → "New Project"
- Tên project: `MUJI Live Support`
- Click "Create"

### 3. Enable APIs
- Vào "APIs & Services" → "Library"
- Tìm kiếm và Enable các API sau:
  - **People API** (tìm kiếm: "People API") ✅
  - **Identity Toolkit API** (tìm kiếm: "Google Identity") ✅

**Lưu ý:** 
- Không tìm "Google OAuth2 API" - API này không tồn tại!
- Chọn "Identity Toolkit API" từ kết quả "Google Identity"

### 4. Tạo OAuth 2.0 Credentials
- Vào "APIs & Services" → "Credentials"
- Click "Create Credentials" → "OAuth client ID"
- Application type: **Web application**
- Name: `MUJI Live Support Web`

### 5. Cấu hình Authorized redirect URIs
```
http://localhost:5173/auth/google/callback
http://localhost:3000/auth/google/callback
```

### 6. Lấy Credentials
- Copy **Client ID** và **Client Secret**
- Lưu lại để sử dụng

## 📋 BƯỚC 2: CẤU HÌNH ENVIRONMENT

### Frontend (.env)
```env
REACT_APP_GOOGLE_CLIENT_ID=your_client_id_here
REACT_APP_GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback
REACT_APP_API_URL=http://localhost:3000/api
```

### Backend (.env)
```env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback
```

## 📋 BƯỚC 3: CÀI ĐẶT DEPENDENCIES

### Frontend
```bash
npm install googleapis
```

### Backend
```bash
npm install googleapis
```

## 📋 BƯỚC 4: TEST GOOGLE OAUTH

### 1. Khởi động ứng dụng
```bash
# Frontend
npm run dev

# Backend
npm run dev
```

### 2. Test đăng nhập Google
- Truy cập `/login` hoặc `/register`
- Click "Đăng nhập với Google"
- Chọn tài khoản Google
- Xác nhận quyền truy cập

### 3. Kiểm tra kết quả
- User sẽ được redirect về dashboard
- Thông tin user được lưu trong localStorage
- Console sẽ hiển thị thông tin user từ Google

## 🔧 TROUBLESHOOTING

### Lỗi "Google API chưa được tải"
- Kiểm tra internet connection
- Kiểm tra Client ID trong .env
- Mở Developer Console để xem lỗi chi tiết

### Lỗi "Invalid redirect URI"
- Kiểm tra redirect URI trong Google Cloud Console
- Đảm bảo URI match với .env file
- Kiểm tra protocol (http/https)

### Lỗi "Client ID not found"
- Kiểm tra REACT_APP_GOOGLE_CLIENT_ID trong .env
- Restart development server sau khi thay đổi .env
- Kiểm tra file .env có ở đúng thư mục

## 📚 TÀI LIỆU THAM KHẢO

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Google Identity Services](https://developers.google.com/identity/gsi/web)

## 🎯 LƯU Ý QUAN TRỌNG

1. **Client Secret**: Chỉ sử dụng ở backend, không expose ra frontend
2. **Redirect URI**: Phải match chính xác với Google Cloud Console
3. **HTTPS**: Production phải sử dụng HTTPS
4. **Scopes**: Chỉ request những quyền cần thiết
5. **Error Handling**: Luôn có fallback khi Google API fail
