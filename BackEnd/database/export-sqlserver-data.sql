-- Export script để chuyển data từ SQL Server sang PostgreSQL
-- Chạy script này để export data từ SQL Server

-- 1. Export Users
SELECT 
    'INSERT INTO Users (Email, Password, Name, Role, CreatedAt) VALUES (''' + 
    Email + ''', ''' + Password + ''', ''' + Name + ''', ''' + Role + ''', ''' + 
    CONVERT(VARCHAR, CreatedAt, 120) + ''');' as sql_statement
FROM Users;

-- 2. Export Categories  
SELECT 
    'INSERT INTO Categories (Name, Description, CreatedAt) VALUES (''' + 
    Name + ''', ''' + ISNULL(Description, '') + ''', ''' + 
    CONVERT(VARCHAR, CreatedAt, 120) + ''');' as sql_statement
FROM Categories;

-- 3. Export Products
SELECT 
    'INSERT INTO Products (Name, Description, Price, ImageURL, CategoryID, Stock, CreatedAt) VALUES (''' + 
    Name + ''', ''' + ISNULL(Description, '') + ''', ' + 
    CAST(Price AS VARCHAR) + ', ''' + ISNULL(ImageURL, '') + ''', ' + 
    CAST(CategoryID AS VARCHAR) + ', ' + CAST(Stock AS VARCHAR) + ', ''' + 
    CONVERT(VARCHAR, CreatedAt, 120) + ''');' as sql_statement
FROM Products;

-- 4. Export Orders
SELECT 
    'INSERT INTO Orders (UserID, TotalAmount, Status, ShippingAddress, CreatedAt) VALUES (' + 
    CAST(UserID AS VARCHAR) + ', ' + CAST(TotalAmount AS VARCHAR) + ', ''' + 
    Status + ''', ''' + ISNULL(ShippingAddress, '') + ''', ''' + 
    CONVERT(VARCHAR, CreatedAt, 120) + ''');' as sql_statement
FROM Orders;

-- 5. Export ChatRooms
SELECT 
    'INSERT INTO ChatRooms (CustomerID, ShopID, CreatedAt) VALUES (' + 
    CAST(CustomerID AS VARCHAR) + ', ' + CAST(ShopID AS VARCHAR) + ', ''' + 
    CONVERT(VARCHAR, CreatedAt, 120) + ''');' as sql_statement
FROM ChatRooms;

-- 6. Export Messages
SELECT 
    'INSERT INTO Messages (RoomID, SenderID, Content, MessageType, CreatedAt) VALUES (' + 
    CAST(RoomID AS VARCHAR) + ', ' + CAST(SenderID AS VARCHAR) + ', ''' + 
    Content + ''', ''' + MessageType + ''', ''' + 
    CONVERT(VARCHAR, CreatedAt, 120) + ''');' as sql_statement
FROM Messages;
