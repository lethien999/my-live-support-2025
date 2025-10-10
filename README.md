# Live Support System - Fullstack Chat & Ticket Management

## Mô tả
Hệ thống hỗ trợ khách hàng trực tuyến với chat realtime, quản lý ticket, và đánh giá dịch vụ. Hỗ trợ cả chế độ mock và production với PostgreSQL.

## Kiến trúc
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + Redux Toolkit
- **Backend**: Node.js + Express + TypeScript + Prisma + PostgreSQL
- **Realtime**: Socket.IO với WebSocket
- **Database**: PostgreSQL với Docker
- **Monorepo**: Workspaces với shared packages
- **Authentication**: JWT với refresh token
- **File Upload**: Multer với validation
- **Documentation**: Swagger UI

## Hướng dẫn cài đặt và sử dụng

### Yêu cầu hệ thống
- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker và Docker Compose (khuyến nghị)
- Git

### Bước 1: Clone repository
```bash
git clone <repository-url>
cd my-live-support-2025
```

### Bước 2: Cài đặt Docker (nếu chưa có)
1. **Windows/Mac**: Tải Docker Desktop từ https://www.docker.com/products/docker-desktop/
2. **Linux**: Cài đặt Docker và Docker Compose
3. **Alternative**: Cài đặt PostgreSQL local và cập nhật DATABASE_URL trong `apps/api/.env`

### Bước 3: Cài đặt dependencies
```bash
# Cài đặt tất cả dependencies cho monorepo
npm install

# Hoặc cài đặt từng workspace riêng biệt
npm install --workspace apps/api
npm install --workspace apps/web
npm install --workspace packages/shared
```

### Bước 4: Cấu hình môi trường
```bash
# Copy file env mẫu cho API
cp apps/api/env.example apps/api/.env

# Copy file env mẫu cho Web
cp apps/web/env.example apps/web/.env
```

### Bước 5: Khởi động database
```bash
# Khởi động PostgreSQL với Docker
npm run db:up

# Kiểm tra database đã chạy
docker ps
```

### Bước 6: Chạy migration và seed data
```bash
# Tạo database schema
npm --workspace apps/api run prisma:migrate

# Seed dữ liệu mẫu (admin, agent, customer, tickets)
npm --workspace apps/api run prisma:seed
```

### Bước 7: Chạy ứng dụng
```bash
# Chạy tất cả services (API + Web + DB)
npm run dev

# Hoặc chạy riêng biệt:
# Terminal 1: API
npm --workspace apps/api run dev

# Terminal 2: Web
npm --workspace apps/web run dev
```

### Bước 8: Truy cập ứng dụng
Sau khi chạy thành công, truy cập:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:4000
- **API Documentation**: http://localhost:4000/api/docs
- **Prisma Studio**: http://localhost:5555 (chạy `npm run db:studio`)

## Hướng dẫn sử dụng chi tiết

### Đăng nhập và vai trò
1. **Admin** (admin@demo.io / admin123):
   - Quản lý toàn bộ hệ thống
   - Xem dashboard tổng quan
   - Quản lý agents và departments
   - Xem tất cả tickets và chat

2. **Agent** (agent1@demo.io / agent123):
   - Xử lý tickets được phân công
   - Chat với khách hàng
   - Cập nhật trạng thái ticket
   - Xem hàng đợi tickets

3. **Customer** (user@demo.io / user123):
   - Tạo ticket hỗ trợ
   - Chat với agent
   - Upload file
   - Đánh giá dịch vụ

### Quy trình sử dụng

#### Cho Customer:
1. **Tạo ticket**: Đăng nhập → Tickets → Tạo ticket mới
2. **Chat**: Vào ticket → Chat với agent
3. **Upload file**: Kéo thả file vào chat
4. **Đánh giá**: Sau khi ticket đóng → Đánh giá 1-5 sao

#### Cho Agent:
1. **Xem hàng đợi**: Dashboard → Tickets chưa phân công
2. **Nhận ticket**: Click "Nhận ticket" hoặc được phân công
3. **Chat**: Vào ticket → Trả lời khách hàng
4. **Cập nhật**: Thay đổi status (Open → Pending → Resolved → Closed)

#### Cho Admin:
1. **Dashboard**: Xem thống kê tổng quan
2. **Quản lý**: Agents, Departments, Settings
3. **Giám sát**: Tất cả tickets và chat rooms

### Tính năng Mock Mode
Khi `VITE_ENABLE_MOCK=true` trong file `.env`:
- Không cần database thật
- Dữ liệu lưu trong localStorage
- Socket.IO giả lập với EventEmitter
- Phù hợp cho demo và testing

## Troubleshooting

### Lỗi thường gặp

#### 1. Database connection error
```bash
# Kiểm tra Docker đang chạy
docker ps

# Restart database
npm run db:down
npm run db:up

# Kiểm tra logs
docker logs live-support-db
```

#### 2. Port đã được sử dụng
```bash
# Tìm process đang dùng port
netstat -ano | findstr :4000
netstat -ano | findstr :5173

# Kill process (Windows)
taskkill /PID <PID> /F

# Kill process (Mac/Linux)
kill -9 <PID>
```

#### 3. Prisma migration error
```bash
# Reset database
npm --workspace apps/api run prisma:migrate:reset

# Hoặc xóa và tạo lại
npm run db:down
npm run db:up
npm --workspace apps/api run prisma:migrate
npm --workspace apps/api run prisma:seed
```

#### 4. Node modules error
```bash
# Xóa và cài lại
rm -rf node_modules
rm -rf apps/*/node_modules
npm install
```

### Development Tips

#### Hot Reload
- Frontend: Tự động reload khi thay đổi file
- Backend: Tự động restart với ts-node-dev
- Database: Prisma Studio tự động sync

#### Debug Mode
```bash
# Chạy với debug logs
DEBUG=* npm run dev

# Chạy API với verbose logs
npm --workspace apps/api run dev -- --verbose
```

#### Testing
```bash
# Chạy tests
npm --workspace apps/api run test
npm --workspace apps/web run test

# Chạy tests với coverage
npm --workspace apps/api run test:coverage
```

## Cấu trúc thư mục chi tiết
```
my-live-support-2025/
├── apps/
│   ├── api/                    # Backend API
│   │   ├── src/
│   │   │   ├── controllers/    # API controllers
│   │   │   ├── services/       # Business logic
│   │   │   ├── routes/         # API routes
│   │   │   ├── middleware/     # Auth, validation
│   │   │   ├── sockets/        # Socket.IO handlers
│   │   │   └── validators/     # Zod schemas
│   │   ├── prisma/            # Database schema & migrations
│   │   └── package.json
│   └── web/                   # Frontend React
│       ├── src/
│       │   ├── components/     # React components
│       │   ├── pages/         # Page components
│       │   ├── store/         # Redux store
│       │   ├── services/      # API services
│       │   └── hooks/         # Custom hooks
│       └── package.json
├── packages/
│   └── shared/               # Shared types & constants
├── docs/                     # Documentation
├── docker-compose.yml        # Database setup
└── package.json             # Root package.json
```

## Scripts chi tiết

### Root Scripts
- `npm run dev`: Chạy tất cả services (API + Web + DB)
- `npm run build`: Build production cho tất cả apps
- `npm run lint`: Kiểm tra code style với ESLint
- `npm run format`: Format code với Prettier
- `npm run clean`: Xóa tất cả node_modules và dist

### Database Scripts
- `npm run db:up`: Khởi động PostgreSQL với Docker
- `npm run db:down`: Dừng PostgreSQL
- `npm run db:studio`: Mở Prisma Studio (http://localhost:5555)
- `npm run db:reset`: Reset database và chạy lại migrations

### API Scripts
- `npm --workspace apps/api run dev`: Chạy API development server
- `npm --workspace apps/api run build`: Build API production
- `npm --workspace apps/api run start`: Chạy API production
- `npm --workspace apps/api run prisma:migrate`: Chạy migrations
- `npm --workspace apps/api run prisma:seed`: Seed dữ liệu mẫu
- `npm --workspace apps/api run test`: Chạy API tests

### Web Scripts
- `npm --workspace apps/web run dev`: Chạy Web development server
- `npm --workspace apps/web run build`: Build Web production
- `npm --workspace apps/web run preview`: Preview production build
- `npm --workspace apps/web run test`: Chạy Web tests

## Tính năng chính

### ✅ Core Features
- **Chat Realtime**: WebSocket với Socket.IO, typing indicators, file sharing
- **Ticket Management**: CRUD operations, status tracking, assignment
- **Authentication**: JWT với refresh token, role-based access control
- **File Upload**: Multer với validation, secure file serving
- **Rating System**: 1-5 star rating cho closed tickets
- **Mock Mode**: Development mode không cần database

### ✅ Technical Features
- **TypeScript**: Full type safety cho frontend và backend
- **Prisma ORM**: Type-safe database operations
- **Redux Toolkit**: State management cho React
- **Tailwind CSS**: Utility-first CSS framework
- **Swagger UI**: Interactive API documentation
- **Docker**: Containerized PostgreSQL database
- **Monorepo**: Workspace-based project structure

### ✅ Security Features
- **JWT Authentication**: Secure token-based auth
- **Role-based Access**: Customer/Agent/Admin permissions
- **Rate Limiting**: API protection against abuse
- **CORS**: Cross-origin request security
- **Helmet**: Security headers
- **Input Validation**: Zod schema validation

## API Reference

### Authentication Endpoints
- `POST /api/auth/register` - Đăng ký tài khoản mới
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/forgot` - Quên mật khẩu (gửi OTP)
- `POST /api/auth/reset` - Đặt lại mật khẩu
- `GET /api/auth/me` - Lấy thông tin user hiện tại

### Ticket Endpoints
- `GET /api/tickets` - Lấy danh sách tickets (có filter, pagination)
- `POST /api/tickets` - Tạo ticket mới
- `GET /api/tickets/:id` - Lấy chi tiết ticket
- `PATCH /api/tickets/:id` - Cập nhật ticket (status, assignee, department)

### File Endpoints
- `POST /api/files` - Upload file (multipart/form-data)
- `GET /api/files/:id` - Download file

### Rating Endpoints
- `POST /api/ratings` - Tạo đánh giá cho ticket đã đóng

### Socket.IO Events
- `CHAT_JOIN` - Tham gia phòng chat
- `CHAT_LEAVE` - Rời phòng chat
- `MESSAGE_SEND` - Gửi tin nhắn
- `MESSAGE_RECEIVE` - Nhận tin nhắn
- `TYPING` - Typing indicator
- `TICKET_UPDATED` - Ticket được cập nhật
- `QUEUE_UPDATED` - Hàng đợi được cập nhật

Chi tiết API documentation: http://localhost:4000/api/docs

## Contributing

### Development Workflow
1. Fork repository
2. Tạo feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -m "Add new feature"`
4. Push branch: `git push origin feature/new-feature`
5. Tạo Pull Request

### Code Standards
- Sử dụng TypeScript cho type safety
- Follow ESLint và Prettier rules
- Viết tests cho new features
- Update documentation khi cần
- Commit messages theo convention: `type(scope): description`

### Testing
```bash
# Chạy tất cả tests
npm run test

# Chạy tests với watch mode
npm run test:watch

# Chạy tests với coverage
npm run test:coverage
```

## License
MIT License - xem file LICENSE để biết thêm chi tiết.

## Support
Nếu gặp vấn đề, vui lòng:
1. Kiểm tra phần Troubleshooting ở trên
2. Tạo issue trên GitHub
3. Liên hệ qua email: support@example.com
