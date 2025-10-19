-- PostgreSQL Database Schema for MUJI Live Support
-- This script will run automatically when PostgreSQL container starts

-- Create database if not exists (handled by POSTGRES_DB env var)
-- CREATE DATABASE live_support;

-- Connect to the database
\c live_support;

-- Create Users table
CREATE TABLE IF NOT EXISTS Users (
    UserID SERIAL PRIMARY KEY,
    Email VARCHAR(255) UNIQUE NOT NULL,
    Password VARCHAR(255) NOT NULL,
    Name VARCHAR(255) NOT NULL,
    Role VARCHAR(50) NOT NULL DEFAULT 'Customer',
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Categories table
CREATE TABLE IF NOT EXISTS Categories (
    CategoryID SERIAL PRIMARY KEY,
    Name VARCHAR(255) NOT NULL,
    Description TEXT,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Products table
CREATE TABLE IF NOT EXISTS Products (
    ProductID SERIAL PRIMARY KEY,
    Name VARCHAR(255) NOT NULL,
    Description TEXT,
    Price DECIMAL(10,2) NOT NULL,
    ImageURL VARCHAR(500),
    CategoryID INTEGER REFERENCES Categories(CategoryID),
    Stock INTEGER DEFAULT 0,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Orders table
CREATE TABLE IF NOT EXISTS Orders (
    OrderID SERIAL PRIMARY KEY,
    UserID INTEGER REFERENCES Users(UserID),
    TotalAmount DECIMAL(10,2) NOT NULL,
    Status VARCHAR(50) DEFAULT 'Pending',
    ShippingAddress TEXT,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create OrderItems table
CREATE TABLE IF NOT EXISTS OrderItems (
    OrderItemID SERIAL PRIMARY KEY,
    OrderID INTEGER REFERENCES Orders(OrderID),
    ProductID INTEGER REFERENCES Products(ProductID),
    Quantity INTEGER NOT NULL,
    Price DECIMAL(10,2) NOT NULL
);

-- Create ChatRooms table
CREATE TABLE IF NOT EXISTS ChatRooms (
    RoomID SERIAL PRIMARY KEY,
    CustomerID INTEGER REFERENCES Users(UserID),
    ShopID INTEGER DEFAULT 1,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Messages table
CREATE TABLE IF NOT EXISTS Messages (
    MessageID SERIAL PRIMARY KEY,
    RoomID INTEGER REFERENCES ChatRooms(RoomID),
    SenderID INTEGER REFERENCES Users(UserID),
    Content TEXT NOT NULL,
    MessageType VARCHAR(50) DEFAULT 'Text',
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO Users (Email, Password, Name, Role) VALUES
('admin@muji.com', '111111', 'Admin MUJI', 'Admin'),
('agent@muji.com', '111111', 'Agent MUJI', 'Agent'),
('customer@muji.com', '111111', 'Khách hàng mẫu', 'Customer')
ON CONFLICT (Email) DO NOTHING;

INSERT INTO Categories (Name, Description) VALUES
('Thời trang', 'Quần áo, giày dép, phụ kiện'),
('Nội thất', 'Bàn ghế, tủ, kệ'),
('Đồ gia dụng', 'Bát đĩa, ly cốc, đồ dùng nhà bếp'),
('Văn phòng', 'Đồ dùng văn phòng, sổ sách'),
('Trang trí', 'Đồ trang trí, cây cảnh'),
('Thể thao', 'Đồ thể thao, dụng cụ tập luyện'),
('Sách', 'Sách vở, tài liệu'),
('Điện tử', 'Đồ điện tử, phụ kiện')
ON CONFLICT DO NOTHING;

INSERT INTO Products (Name, Description, Price, ImageURL, CategoryID, Stock) VALUES
('Áo thun cotton MUJI', 'Áo thun cotton 100% thiết kế tối giản', 299000, '/images/products/tshirt.jpg', 1, 50),
('Quần jeans MUJI', 'Quần jeans slim fit chất liệu cao cấp', 599000, '/images/products/jeans.jpg', 1, 30),
('Ghế gỗ MUJI', 'Ghế gỗ tự nhiên thiết kế tối giản', 1299000, '/images/products/chair.jpg', 2, 20),
('Bàn làm việc MUJI', 'Bàn làm việc gỗ veneer kích thước 120x60cm', 2499000, '/images/products/desk.jpg', 2, 15),
('Bát sứ MUJI', 'Bộ bát sứ trắng 6 chiếc', 199000, '/images/products/bowls.jpg', 3, 100),
('Ly cốc MUJI', 'Ly cốc thủy tinh trong suốt', 99000, '/images/products/glass.jpg', 3, 80),
('Sổ tay MUJI', 'Sổ tay giấy trắng A5 100 trang', 79000, '/images/products/notebook.jpg', 4, 200),
('Bút chì MUJI', 'Bút chì gỗ 2B hộp 12 chiếc', 59000, '/images/products/pencil.jpg', 4, 150),
('Cây cảnh mini', 'Cây cảnh mini để bàn', 199000, '/images/products/plant.jpg', 5, 25),
('Đèn bàn MUJI', 'Đèn bàn LED thiết kế tối giản', 399000, '/images/products/lamp.jpg', 5, 40),
('Bóng đá MUJI', 'Bóng đá da PU size 5', 299000, '/images/products/soccer.jpg', 6, 20),
('Dây nhảy MUJI', 'Dây nhảy thể thao có đếm', 99000, '/images/products/jumprope.jpg', 6, 30)
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON Users(Email);
CREATE INDEX IF NOT EXISTS idx_orders_userid ON Orders(UserID);
CREATE INDEX IF NOT EXISTS idx_messages_roomid ON Messages(RoomID);
CREATE INDEX IF NOT EXISTS idx_messages_createdat ON Messages(CreatedAt);

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO muji_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO muji_user;
