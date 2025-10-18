-- =============================================
-- SMART SETUP SCRIPT - Run this in SSMS
-- =============================================

USE live_support;
GO

-- Check existing data first
PRINT '=== CHECKING EXISTING DATA ===';
SELECT 'Users' as TableName, COUNT(*) as RecordCount FROM Users
UNION ALL
SELECT 'Products', COUNT(*) FROM Products
UNION ALL
SELECT 'Categories', COUNT(*) FROM Categories;

-- Show actual UserIDs and ProductIDs
PRINT '';
PRINT '=== ACTUAL USER IDs ===';
SELECT UserID, Email, FullName FROM Users ORDER BY UserID;

PRINT '';
PRINT '=== ACTUAL PRODUCT IDs ===';
SELECT ProductID, ProductName FROM Products ORDER BY ProductID;

-- Clear existing data first
PRINT '';
PRINT '=== CLEARING EXISTING DATA ===';
DELETE FROM Notifications;
DELETE FROM Wishlist;
DELETE FROM Reviews;
DELETE FROM OrderItems;
DELETE FROM Orders;
DELETE FROM Cart;
PRINT '✅ Existing data cleared';

-- Get actual IDs dynamically
DECLARE @FirstUserID INT, @SecondUserID INT;
DECLARE @FirstProductID INT, @SecondProductID INT, @ThirdProductID INT;

-- Get User IDs
SELECT @FirstUserID = MIN(UserID) FROM Users WHERE Email = 'customer@muji.com';
SELECT @SecondUserID = MIN(UserID) FROM Users WHERE Email = 'john.doe@email.com';

-- Get Product IDs
SELECT @FirstProductID = MIN(ProductID) FROM Products;
SELECT @SecondProductID = MIN(ProductID) FROM Products WHERE ProductID > @FirstProductID;
SELECT @ThirdProductID = MIN(ProductID) FROM Products WHERE ProductID > @SecondProductID;

PRINT '';
PRINT '=== USING ACTUAL IDs ===';
PRINT 'First User ID: ' + ISNULL(CAST(@FirstUserID AS NVARCHAR(10)), 'NULL');
PRINT 'Second User ID: ' + ISNULL(CAST(@SecondUserID AS NVARCHAR(10)), 'NULL');
PRINT 'First Product ID: ' + ISNULL(CAST(@FirstProductID AS NVARCHAR(10)), 'NULL');
PRINT 'Second Product ID: ' + ISNULL(CAST(@SecondProductID AS NVARCHAR(10)), 'NULL');
PRINT 'Third Product ID: ' + ISNULL(CAST(@ThirdProductID AS NVARCHAR(10)), 'NULL');

-- Insert sample data using actual IDs
PRINT '';
PRINT '=== INSERTING SAMPLE DATA ===';

-- Insert cart data (only if we have valid IDs)
IF @FirstUserID IS NOT NULL AND @FirstProductID IS NOT NULL
BEGIN
    INSERT INTO Cart (UserID, ProductID, Quantity) VALUES
    (@FirstUserID, @FirstProductID, 2);
    PRINT '✅ Cart item 1 inserted';
    
    IF @SecondProductID IS NOT NULL
    BEGIN
        INSERT INTO Cart (UserID, ProductID, Quantity) VALUES
        (@FirstUserID, @SecondProductID, 3);
        PRINT '✅ Cart item 2 inserted';
    END
    
    IF @SecondUserID IS NOT NULL AND @ThirdProductID IS NOT NULL
    BEGIN
        INSERT INTO Cart (UserID, ProductID, Quantity) VALUES
        (@SecondUserID, @ThirdProductID, 1);
        PRINT '✅ Cart item 3 inserted';
    END
END
ELSE
BEGIN
    PRINT '⚠️ No valid User/Product IDs found for cart';
END

-- Insert orders (only if we have valid User IDs)
IF @FirstUserID IS NOT NULL
BEGIN
    INSERT INTO Orders (OrderNumber, CustomerID, Status, PaymentStatus, PaymentMethod, ShippingAddress, SubTotal, TaxAmount, ShippingCost, TotalAmount) VALUES
    ('ORD000001', @FirstUserID, 'Delivered', 'Paid', 'Credit Card', '789 Customer Road, Ho Chi Minh', 359.98, 35.99, 20.00, 415.97);
    PRINT '✅ Order 1 inserted';
END

IF @SecondUserID IS NOT NULL
BEGIN
    INSERT INTO Orders (OrderNumber, CustomerID, Status, PaymentStatus, PaymentMethod, ShippingAddress, SubTotal, TaxAmount, ShippingCost, TotalAmount) VALUES
    ('ORD000002', @SecondUserID, 'Shipped', 'Paid', 'PayPal', '321 John Street, Ha Noi', 199.99, 20.00, 15.00, 234.99);
    PRINT '✅ Order 2 inserted';
END

-- Insert order items (only if we have valid Order IDs)
DECLARE @FirstOrderID INT, @SecondOrderID INT;
SELECT @FirstOrderID = OrderID FROM Orders WHERE OrderNumber = 'ORD000001';
SELECT @SecondOrderID = OrderID FROM Orders WHERE OrderNumber = 'ORD000002';

IF @FirstOrderID IS NOT NULL AND @FirstProductID IS NOT NULL
BEGIN
    INSERT INTO OrderItems (OrderID, ProductID, ProductName, ProductPrice, Quantity, SubTotal) VALUES
    (@FirstOrderID, @FirstProductID, 'Product 1', 299.99, 1, 299.99);
    PRINT '✅ Order item 1 inserted';
    
    IF @SecondProductID IS NOT NULL
    BEGIN
        INSERT INTO OrderItems (OrderID, ProductID, ProductName, ProductPrice, Quantity, SubTotal) VALUES
        (@FirstOrderID, @SecondProductID, 'Product 2', 29.99, 2, 59.98);
        PRINT '✅ Order item 2 inserted';
    END
END

IF @SecondOrderID IS NOT NULL AND @ThirdProductID IS NOT NULL
BEGIN
    INSERT INTO OrderItems (OrderID, ProductID, ProductName, ProductPrice, Quantity, SubTotal) VALUES
    (@SecondOrderID, @ThirdProductID, 'Product 3', 199.99, 1, 199.99);
    PRINT '✅ Order item 3 inserted';
END

-- Insert reviews (only if we have valid IDs)
IF @FirstUserID IS NOT NULL AND @FirstProductID IS NOT NULL AND @FirstOrderID IS NOT NULL
BEGIN
    INSERT INTO Reviews (ProductID, CustomerID, OrderID, Rating, Title, Comment, IsVerified) VALUES
    (@FirstProductID, @FirstUserID, @FirstOrderID, 5, 'Excellent quality!', 'The product is exactly as described. Very comfortable and well-made. Highly recommended!', 1);
    PRINT '✅ Review 1 inserted';
    
    IF @SecondProductID IS NOT NULL
    BEGIN
        INSERT INTO Reviews (ProductID, CustomerID, OrderID, Rating, Title, Comment, IsVerified) VALUES
        (@SecondProductID, @FirstUserID, @FirstOrderID, 4, 'Good product', 'Nice quality product. Fits well and comfortable to use.', 1);
        PRINT '✅ Review 2 inserted';
    END
END

-- Insert wishlist (only if we have valid IDs)
IF @FirstUserID IS NOT NULL AND @SecondProductID IS NOT NULL
BEGIN
    INSERT INTO Wishlist (UserID, ProductID) VALUES
    (@FirstUserID, @SecondProductID);
    PRINT '✅ Wishlist item 1 inserted';
    
    IF @ThirdProductID IS NOT NULL
    BEGIN
        INSERT INTO Wishlist (UserID, ProductID) VALUES
        (@FirstUserID, @ThirdProductID);
        PRINT '✅ Wishlist item 2 inserted';
    END
END

IF @SecondUserID IS NOT NULL AND @FirstProductID IS NOT NULL
BEGIN
    INSERT INTO Wishlist (UserID, ProductID) VALUES
    (@SecondUserID, @FirstProductID);
    PRINT '✅ Wishlist item 3 inserted';
END

-- Insert notifications (only if we have valid User IDs)
IF @FirstUserID IS NOT NULL
BEGIN
    INSERT INTO Notifications (UserID, Title, Message, Type, ActionUrl) VALUES
    (@FirstUserID, 'Order Delivered', 'Your order ORD000001 has been delivered successfully!', 'Success', '/orders/1'),
    (@FirstUserID, 'New Product Available', 'Check out our new products!', 'Info', '/products');
    PRINT '✅ Notifications for user 1 inserted';
END

IF @SecondUserID IS NOT NULL
BEGIN
    INSERT INTO Notifications (UserID, Title, Message, Type, ActionUrl) VALUES
    (@SecondUserID, 'Order Shipped', 'Your order ORD000002 has been shipped and is on its way!', 'Info', '/orders/2');
    PRINT '✅ Notifications for user 2 inserted';
END

-- Verify final data
PRINT '';
PRINT '=== FINAL DATA VERIFICATION ===';
SELECT 'Users' as TableName, COUNT(*) as RecordCount FROM Users
UNION ALL
SELECT 'Products', COUNT(*) FROM Products
UNION ALL
SELECT 'Cart', COUNT(*) FROM Cart
UNION ALL
SELECT 'Orders', COUNT(*) FROM Orders
UNION ALL
SELECT 'OrderItems', COUNT(*) FROM OrderItems
UNION ALL
SELECT 'Reviews', COUNT(*) FROM Reviews
UNION ALL
SELECT 'Wishlist', COUNT(*) FROM Wishlist
UNION ALL
SELECT 'Notifications', COUNT(*) FROM Notifications;

-- Show sample data
PRINT '';
PRINT '=== SAMPLE DATA PREVIEW ===';
PRINT 'Cart Items:';
SELECT c.CartID, u.Email, p.ProductName, c.Quantity FROM Cart c
JOIN Users u ON c.UserID = u.UserID
JOIN Products p ON c.ProductID = p.ProductID;

PRINT '';
PRINT 'Orders:';
SELECT o.OrderNumber, u.Email, o.Status, o.TotalAmount FROM Orders o
JOIN Users u ON o.CustomerID = u.UserID;

PRINT '';
PRINT 'Reviews:';
SELECT r.Rating, r.Title, u.Email, p.ProductName FROM Reviews r
JOIN Users u ON r.CustomerID = u.UserID
JOIN Products p ON r.ProductID = p.ProductID;

PRINT '';
PRINT '🎉 Database setup completed successfully!';
PRINT '📋 All e-commerce features are now available!';
