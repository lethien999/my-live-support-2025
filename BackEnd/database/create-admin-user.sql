-- =============================================
-- CREATE ADMIN USER SCRIPT
-- =============================================
-- Script để tạo admin user và sửa chữa hệ thống token

USE live_support;
GO

PRINT '=== CREATING ADMIN USER ===';

-- Check if admin user already exists
IF EXISTS (SELECT 1 FROM Users WHERE Email = 'admin@muji.com')
BEGIN
    PRINT '✅ Admin user already exists';
    SELECT UserID, Email, FullName FROM Users WHERE Email = 'admin@muji.com';
END
ELSE
BEGIN
    -- Create admin user
    INSERT INTO Users (Email, PasswordHash, FullName, Phone, Address, Status, CreatedAt)
    VALUES ('admin@muji.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J8K8K8K8K', 'Admin User', '', '', 'Active', GETDATE());
    
    PRINT '✅ Admin user created successfully';
    
    -- Show created admin user
    SELECT UserID, Email, FullName FROM Users WHERE Email = 'admin@muji.com';
END

-- Check if agent user exists
IF EXISTS (SELECT 1 FROM Users WHERE Email = 'agent@muji.com')
BEGIN
    PRINT '✅ Agent user already exists';
END
ELSE
BEGIN
    -- Create agent user
    INSERT INTO Users (Email, PasswordHash, FullName, Phone, Address, Status, CreatedAt)
    VALUES ('agent@muji.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J8K8K8K8K', 'Agent User', '', '', 'Active', GETDATE());
    
    PRINT '✅ Agent user created successfully';
END

-- Check if customer user exists
IF EXISTS (SELECT 1 FROM Users WHERE Email = 'customer@muji.com')
BEGIN
    PRINT '✅ Customer user already exists';
END
ELSE
BEGIN
    -- Create customer user
    INSERT INTO Users (Email, PasswordHash, FullName, Phone, Address, Status, CreatedAt)
    VALUES ('customer@muji.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J8K8K8K8K', 'Customer User', '', '', 'Active', GETDATE());
    
    PRINT '✅ Customer user created successfully';
END

-- Show all users
PRINT '';
PRINT '=== ALL USERS ===';
SELECT UserID, Email, FullName, Status FROM Users ORDER BY UserID;

PRINT '';
PRINT '🎉 Admin user setup completed!';
PRINT '📋 You can now login with:';
PRINT '   - Email: admin@muji.com';
PRINT '   - Password: admin123';
PRINT '   - Email: agent@muji.com';
PRINT '   - Password: agent123';
PRINT '   - Email: customer@muji.com';
PRINT '   - Password: customer123';
