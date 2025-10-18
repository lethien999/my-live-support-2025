-- =============================================
-- COMPLETE E-COMMERCE DATABASE SCHEMA
-- =============================================
-- Database: live_support
-- Includes: Users, Products, Orders, Cart, Reviews, Wishlist, Notifications

USE live_support;
GO

-- =============================================
-- DROP EXISTING TABLES (if any)
-- =============================================
IF OBJECT_ID('Notifications', 'U') IS NOT NULL DROP TABLE Notifications;
IF OBJECT_ID('Wishlist', 'U') IS NOT NULL DROP TABLE Wishlist;
IF OBJECT_ID('Reviews', 'U') IS NOT NULL DROP TABLE Reviews;
IF OBJECT_ID('OrderItems', 'U') IS NOT NULL DROP TABLE OrderItems;
IF OBJECT_ID('Orders', 'U') IS NOT NULL DROP TABLE Orders;
IF OBJECT_ID('Cart', 'U') IS NOT NULL DROP TABLE Cart;
IF OBJECT_ID('ProductImages', 'U') IS NOT NULL DROP TABLE ProductImages;
IF OBJECT_ID('Messages', 'U') IS NOT NULL DROP TABLE Messages;
IF OBJECT_ID('ChatRooms', 'U') IS NOT NULL DROP TABLE ChatRooms;
IF OBJECT_ID('Tickets', 'U') IS NOT NULL DROP TABLE Tickets;
IF OBJECT_ID('Departments', 'U') IS NOT NULL DROP TABLE Departments;
IF OBJECT_ID('Products', 'U') IS NOT NULL DROP TABLE Products;
IF OBJECT_ID('Categories', 'U') IS NOT NULL DROP TABLE Categories;
IF OBJECT_ID('UserRoles', 'U') IS NOT NULL DROP TABLE UserRoles;
IF OBJECT_ID('Roles', 'U') IS NOT NULL DROP TABLE Roles;
IF OBJECT_ID('Users', 'U') IS NOT NULL DROP TABLE Users;

-- =============================================
-- CREATE TABLES
-- =============================================

-- Users table
CREATE TABLE Users (
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    Email NVARCHAR(255) UNIQUE NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL,
    FullName NVARCHAR(255) NOT NULL,
    Phone NVARCHAR(20),
    Address NVARCHAR(500),
    City NVARCHAR(100),
    Province NVARCHAR(100),
    PostalCode NVARCHAR(20),
    DateOfBirth DATE,
    Gender NVARCHAR(10),
    Avatar NVARCHAR(500),
    Status NVARCHAR(20) DEFAULT 'Active',
    EmailVerified BIT DEFAULT 0,
    PhoneVerified BIT DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE()
);

-- Roles table
CREATE TABLE Roles (
    RoleID INT IDENTITY(1,1) PRIMARY KEY,
    RoleName NVARCHAR(50) UNIQUE NOT NULL,
    Description NVARCHAR(255),
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETDATE()
);

-- UserRoles table
CREATE TABLE UserRoles (
    UserRoleID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    RoleID INT NOT NULL,
    AssignedAt DATETIME2 DEFAULT GETDATE(),
    AssignedBy INT,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    FOREIGN KEY (RoleID) REFERENCES Roles(RoleID) ON DELETE CASCADE,
    FOREIGN KEY (AssignedBy) REFERENCES Users(UserID),
    UNIQUE(UserID, RoleID)
);

-- Categories table
CREATE TABLE Categories (
    CategoryID INT IDENTITY(1,1) PRIMARY KEY,
    CategoryName NVARCHAR(100) UNIQUE NOT NULL,
    ParentCategoryID INT,
    Description NVARCHAR(255),
    IconPath NVARCHAR(255),
    SortOrder INT DEFAULT 0,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (ParentCategoryID) REFERENCES Categories(CategoryID)
);

-- Products table
CREATE TABLE Products (
    ProductID INT IDENTITY(1,1) PRIMARY KEY,
    ProductName NVARCHAR(255) NOT NULL,
    Description NVARCHAR(MAX),
    LongDescription NVARCHAR(MAX),
    CategoryID INT NOT NULL,
    Price DECIMAL(10,2) NOT NULL,
    OriginalPrice DECIMAL(10,2),
    ImagePath NVARCHAR(500),
    StockQuantity INT DEFAULT 0,
    IsInStock BIT DEFAULT 1,
    AverageRating DECIMAL(3,2) DEFAULT 0,
    ReviewCount INT DEFAULT 0,
    SKU NVARCHAR(100),
    Weight DECIMAL(8,2),
    Dimensions NVARCHAR(100),
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (CategoryID) REFERENCES Categories(CategoryID)
);

-- ProductImages table
CREATE TABLE ProductImages (
    ImageID INT IDENTITY(1,1) PRIMARY KEY,
    ProductID INT NOT NULL,
    ImagePath NVARCHAR(500) NOT NULL,
    ImageOrder INT DEFAULT 1,
    IsPrimary BIT DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID) ON DELETE CASCADE
);

-- Cart table
CREATE TABLE Cart (
    CartID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    ProductID INT NOT NULL,
    Quantity INT NOT NULL DEFAULT 1,
    AddedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID) ON DELETE CASCADE,
    UNIQUE(UserID, ProductID)
);

-- Orders table
CREATE TABLE Orders (
    OrderID INT IDENTITY(1,1) PRIMARY KEY,
    OrderNumber NVARCHAR(20) UNIQUE NOT NULL,
    CustomerID INT NOT NULL,
    Status NVARCHAR(20) DEFAULT 'Pending',
    PaymentStatus NVARCHAR(20) DEFAULT 'Pending',
    PaymentMethod NVARCHAR(50),
    ShippingAddress NVARCHAR(500),
    BillingAddress NVARCHAR(500),
    SubTotal DECIMAL(10,2) NOT NULL,
    TaxAmount DECIMAL(10,2) DEFAULT 0,
    ShippingCost DECIMAL(10,2) DEFAULT 0,
    TotalAmount DECIMAL(10,2) NOT NULL,
    Notes NVARCHAR(MAX),
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    ShippedAt DATETIME2,
    DeliveredAt DATETIME2,
    FOREIGN KEY (CustomerID) REFERENCES Users(UserID)
);

-- OrderItems table
CREATE TABLE OrderItems (
    OrderItemID INT IDENTITY(1,1) PRIMARY KEY,
    OrderID INT NOT NULL,
    ProductID INT NOT NULL,
    ProductName NVARCHAR(255) NOT NULL,
    ProductPrice DECIMAL(10,2) NOT NULL,
    Quantity INT NOT NULL,
    SubTotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (OrderID) REFERENCES Orders(OrderID) ON DELETE CASCADE,
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID)
);

-- Reviews table
CREATE TABLE Reviews (
    ReviewID INT IDENTITY(1,1) PRIMARY KEY,
    ProductID INT NOT NULL,
    CustomerID INT NOT NULL,
    OrderID INT,
    Rating INT NOT NULL CHECK (Rating >= 1 AND Rating <= 5),
    Title NVARCHAR(255),
    Comment NVARCHAR(MAX),
    IsVerified BIT DEFAULT 0,
    IsApproved BIT DEFAULT 1,
    HelpfulCount INT DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID) ON DELETE CASCADE,
    FOREIGN KEY (CustomerID) REFERENCES Users(UserID),
    FOREIGN KEY (OrderID) REFERENCES Orders(OrderID),
    UNIQUE(ProductID, CustomerID, OrderID)
);

-- Wishlist table
CREATE TABLE Wishlist (
    WishlistID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    ProductID INT NOT NULL,
    AddedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID) ON DELETE CASCADE,
    UNIQUE(UserID, ProductID)
);

-- Notifications table
CREATE TABLE Notifications (
    NotificationID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    Title NVARCHAR(255) NOT NULL,
    Message NVARCHAR(MAX) NOT NULL,
    Type NVARCHAR(50) DEFAULT 'Info',
    IsRead BIT DEFAULT 0,
    ActionUrl NVARCHAR(500),
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    ReadAt DATETIME2,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
);

-- Departments table
CREATE TABLE Departments (
    DepartmentID INT IDENTITY(1,1) PRIMARY KEY,
    DepartmentName NVARCHAR(100) UNIQUE NOT NULL,
    Description NVARCHAR(255),
    ManagerID INT,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (ManagerID) REFERENCES Users(UserID)
);

-- Tickets table
CREATE TABLE Tickets (
    TicketID INT IDENTITY(1,1) PRIMARY KEY,
    TicketNumber NVARCHAR(20) UNIQUE NOT NULL,
    Subject NVARCHAR(255) NOT NULL,
    Description NVARCHAR(MAX) NOT NULL,
    Status NVARCHAR(20) DEFAULT 'Open',
    Priority NVARCHAR(20) DEFAULT 'Medium',
    CustomerID INT NOT NULL,
    AssignedTo INT,
    DepartmentID INT,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    ClosedAt DATETIME2,
    FOREIGN KEY (CustomerID) REFERENCES Users(UserID),
    FOREIGN KEY (AssignedTo) REFERENCES Users(UserID),
    FOREIGN KEY (DepartmentID) REFERENCES Departments(DepartmentID)
);

-- ChatRooms table
CREATE TABLE ChatRooms (
    RoomID INT IDENTITY(1,1) PRIMARY KEY,
    TicketID INT UNIQUE NOT NULL,
    RoomName NVARCHAR(255),
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (TicketID) REFERENCES Tickets(TicketID) ON DELETE CASCADE
);

-- Messages table
CREATE TABLE Messages (
    MessageID INT IDENTITY(1,1) PRIMARY KEY,
    RoomID INT NOT NULL,
    SenderID INT NOT NULL,
    MessageType NVARCHAR(20) DEFAULT 'Text',
    Content NVARCHAR(MAX) NOT NULL,
    FilePath NVARCHAR(500),
    FileName NVARCHAR(255),
    FileSize INT,
    IsRead BIT DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (RoomID) REFERENCES ChatRooms(RoomID) ON DELETE CASCADE,
    FOREIGN KEY (SenderID) REFERENCES Users(UserID)
);

-- =============================================
-- CREATE INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IX_Users_Email ON Users(Email);
CREATE INDEX IX_Users_Status ON Users(Status);
CREATE INDEX IX_Products_CategoryID ON Products(CategoryID);
CREATE INDEX IX_Products_IsInStock ON Products(IsInStock);
CREATE INDEX IX_Cart_UserID ON Cart(UserID);
CREATE INDEX IX_Orders_CustomerID ON Orders(CustomerID);
CREATE INDEX IX_Orders_Status ON Orders(Status);
CREATE INDEX IX_OrderItems_OrderID ON OrderItems(OrderID);
CREATE INDEX IX_Reviews_ProductID ON Reviews(ProductID);
CREATE INDEX IX_Wishlist_UserID ON Wishlist(UserID);
CREATE INDEX IX_Notifications_UserID ON Notifications(UserID);
CREATE INDEX IX_Notifications_IsRead ON Notifications(IsRead);
CREATE INDEX IX_Tickets_CustomerID ON Tickets(CustomerID);
CREATE INDEX IX_Tickets_Status ON Tickets(Status);
CREATE INDEX IX_Messages_RoomID ON Messages(RoomID);
CREATE INDEX IX_Messages_CreatedAt ON Messages(CreatedAt);

PRINT '✅ Database schema created successfully!';
