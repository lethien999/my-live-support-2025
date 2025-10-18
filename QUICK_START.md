# 🚀 QUICK START GUIDE

## ⚡ Khởi động Nhanh (5 phút)

### 1. Backend
```bash
cd BackEnd
npm install
npm run dev
```

### 2. Frontend
```bash
cd FrontEnd
npm install
npm run dev
```

### 3. Kiểm tra
- Backend: http://localhost:4000/health
- Frontend: http://localhost:5173

## 🔧 Scripts Chính

### Backend
- `npm run dev` - Server tối ưu (nhanh)
- `npm run dev:full` - Server đầy đủ tính năng
- `npm run test:system` - Test toàn bộ hệ thống

### Frontend
- `npm run dev` - Development server
- `npm run build` - Build production

## ⚠️ Lưu Ý

1. **Database**: Cần SQL Server chạy trên localhost:1433
2. **Redis**: Không bắt buộc (fallback tự động)
3. **Port**: Backend 4000, Frontend 5173
4. **Config**: Tất cả trong `BackEnd/env.local`

## 🆘 Troubleshooting

```bash
# Test hệ thống
npm run test:system

# Test frontend
npm run test:frontend

# Check database
npm run test:database
```

---
**Xem README.md để biết chi tiết đầy đủ!**
