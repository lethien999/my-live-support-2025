# 🚀 Live Support System

A comprehensive live support system with real-time chat, ticket management, and rating functionality.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### 🎯 Core Features
- **Real-time Chat System** - WebSocket-based instant messaging
- **Multi-role Support** - Customer, Agent, Admin interfaces
- **Ticket Management** - Create, assign, and track support tickets
- **Chat Rating System** - Rate chat sessions with 5-star system
- **File Sharing** - Upload and share files in chat
- **Order Management** - E-commerce integration
- **Admin Dashboard** - Comprehensive analytics and management

### 🔧 Technical Features
- **Responsive Design** - Mobile-first approach
- **Real-time Notifications** - Instant updates across all clients
- **Performance Monitoring** - Built-in performance dashboard
- **Error Handling** - Comprehensive error boundaries
- **Security** - JWT authentication, CORS protection
- **Scalability** - Modular architecture for easy scaling

## 🛠 Tech Stack

### Frontend
- **React 18** - Modern UI framework
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool
- **Socket.IO Client** - Real-time communication
- **CSS-in-JS** - Styled components

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **TypeScript** - Type-safe development
- **Socket.IO** - Real-time communication
- **SQL Server** - Database
- **JWT** - Authentication

### Database
- **Microsoft SQL Server** - Primary database
- **39 Tables** - Comprehensive schema
- **Real-time Updates** - Live data synchronization

## 🏗 Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (React)       │◄──►│   (Express)     │◄──►│   (SQL Server)  │
│                 │    │                 │    │                 │
│ • Customer UI   │    │ • REST API      │    │ • Users         │
│ • Agent UI      │    │ • WebSocket     │    │ • ChatRooms     │
│ • Admin UI      │    │ • Auth Service  │    │ • Messages      │
│ • Real-time     │    │ • File Upload   │    │ • Tickets       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Installation

### Prerequisites
- Node.js 18+ 
- SQL Server 2019+
- Git

### Quick Start

1. **Clone the repository**
```bash
git clone <repository-url>
cd my-live-support-2025
```

2. **Install dependencies**
```bash
# Backend
cd BackEnd
npm install

# Frontend
cd ../FrontEnd
npm install
```

3. **Database Setup**
```bash
# Run database migrations
sqlcmd -S localhost -U your_username -P your_password -d live_support -i database/complete-schema.sql
```

4. **Start the application**
```bash
# Terminal 1 - Backend
cd BackEnd
npm run dev

# Terminal 2 - Frontend
cd FrontEnd
npm run dev
```

5. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:4000
- Health Check: http://localhost:4000/health

## ⚙️ Configuration

### Environment Variables

**Backend (.env)**
```env
DB_SERVER=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=live_support
JWT_SECRET=your_jwt_secret
PORT=4000
```

**Frontend (.env)**
```env
VITE_API_URL=http://localhost:4000
VITE_APP_NAME=Live Support System
```

### Database Configuration

The system uses 39 tables including:
- **Users** - User management
- **ChatRooms** - Chat sessions
- **Messages** - Chat messages
- **ChatRatings** - Rating system
- **Tickets** - Support tickets
- **Orders** - E-commerce orders
- **Products** - Product catalog

## 📖 Usage

### For Customers
1. Navigate to http://localhost:5173
2. Create account or login
3. Start chat with support
4. Rate chat sessions

### For Agents
1. Login to agent dashboard
2. Accept incoming chats
3. Manage tickets
4. View performance metrics

### For Admins
1. Access admin panel at `/admin`
2. Manage users and agents
3. View analytics and reports
4. Configure system settings

## 📚 API Documentation

### Authentication
```http
POST /api/auth/login
POST /api/auth/register
POST /api/auth/refresh
```

### Chat System
```http
GET /api/chat/rooms
POST /api/chat/send
GET /api/chat/messages/:roomId
POST /api/chat/rating
```

### Rating Management
```http
GET /api/chat/ratings
GET /api/chat/rating-stats
POST /api/chat/rating
```

### Ticket System
```http
GET /api/tickets
POST /api/tickets
PUT /api/tickets/:id
```

## 🗄️ Database Schema

### Key Tables

**Users**
- UserID, Email, FullName, Role, Status

**ChatRooms**
- RoomID, RoomName, CustomerID, AgentID, IsActive

**Messages**
- MessageID, RoomID, SenderID, Content, MessageType

**ChatRatings**
- RatingID, RoomID, UserID, Rating, Comment

**Tickets**
- TicketID, CustomerID, Title, Description, Status

## 🚀 Deployment

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d
```

### Manual Deployment
```bash
# Production build
cd FrontEnd && npm run build
cd ../BackEnd && npm run build

# Start production server
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support, email support@example.com or create an issue in the repository.

---

**Built with ❤️ by the Live Support Team**