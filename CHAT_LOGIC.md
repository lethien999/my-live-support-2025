# 💬 LOGIC CHAT SYSTEM - MUJI LIVE SUPPORT

## 🎯 **TỔNG QUAN HỆ THỐNG**

### **2 Loại Chat:**

1. **Customer Chat** (`/chat`) - Khách hàng chat với hỗ trợ
2. **Agent Chat** (`/shop-chat`) - Nhân viên hỗ trợ trả lời khách hàng

---

## 🔄 **FLOW CHAT**

### **1. Customer gửi tin nhắn đầu tiên:**
```
Customer → /chat → Gửi tin nhắn → Tạo ChatRoom mới → Agent nhận được
```

### **2. Agent trả lời:**
```
Agent → /shop-chat → Chọn customer → Trả lời → Customer nhận được
```

### **3. Tiếp tục chat:**
```
Customer ↔ Agent (cùng ChatRoom)
```

---

## 🗄️ **DATABASE STRUCTURE**

### **ChatRooms Table:**
- `RoomID` (Primary Key)
- `CustomerID` (Foreign Key → Users.UserID)
- `ShopID` (Foreign Key → Shops.ShopID) - Default = 1 (MUJI Store)
- `CreatedAt`

### **Messages Table:**
- `MessageID` (Primary Key)
- `RoomID` (Foreign Key → ChatRooms.RoomID)
- `SenderID` (Foreign Key → Users.UserID)
- `Content` (Tin nhắn)
- `MessageType` (Customer/Agent)
- `CreatedAt`

---

## 🔌 **API ENDPOINTS**

### **Customer APIs:**
- `GET /api/chat/conversations` - Lấy danh sách shops đã chat
- `GET /api/chat/messages/:chatId` - Lấy tin nhắn trong room
- `POST /api/chat/send` - Gửi tin nhắn

### **Agent APIs:**
- `GET /api/chat/customers` - Lấy danh sách customers
- `GET /api/chat/messages/:chatId` - Lấy tin nhắn trong room
- `POST /api/chat/send` - Gửi tin nhắn

---

## 🎨 **FRONTEND PAGES**

### **Customer Chat (`/chat`):**
- Hiển thị danh sách shops (hiện tại chỉ có MUJI Store)
- Chat interface với shop
- Gửi tin nhắn đến shop

### **Agent Chat (`/shop-chat`):**
- Hiển thị danh sách customers đang chờ hỗ trợ
- Chat interface với customer
- Trả lời tin nhắn từ customer

---

## ⚡ **REAL-TIME FEATURES**

### **Socket.IO Events:**
- `join_room` - Tham gia room
- `leave_room` - Rời room
- `send_message` - Gửi tin nhắn
- `typing` - Đang gõ
- `stop_typing` - Dừng gõ

### **Room Management:**
- Customer và Agent cùng join một room
- Tin nhắn được broadcast đến tất cả thành viên trong room

---

## 🔐 **AUTHENTICATION**

### **Customer:**
- Role: `Customer`
- Có thể tạo chat room mới
- Có thể gửi tin nhắn

### **Agent:**
- Role: `Agent` hoặc `Admin`
- Có thể xem danh sách customers
- Có thể trả lời tin nhắn

---

## 🚀 **IMPLEMENTATION STATUS**

### ✅ **Đã hoàn thành:**
- Database schema (ChatRooms, Messages)
- API endpoints cơ bản
- Frontend pages (ChatPage, ShopChatPage)
- Socket.IO integration
- Authentication system

### 🔄 **Cần cải thiện:**
- Logic tạo room tự động khi customer gửi tin nhắn đầu tiên
- Real-time notification khi có tin nhắn mới
- Unread message count
- Chat history persistence

---

## 🎯 **KẾT LUẬN**

Hệ thống chat hiện tại đã có đầy đủ các thành phần cơ bản:
- ✅ Database structure
- ✅ API endpoints
- ✅ Frontend interfaces
- ✅ Real-time communication

**Vấn đề chính:** Cần đảm bảo Customer và Agent cùng sử dụng cùng một ChatRoom để tin nhắn được đồng bộ.
