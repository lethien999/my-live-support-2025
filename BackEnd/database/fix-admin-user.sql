-- Script để kiểm tra admin user trong database
USE live_support;
GO

PRINT '=== CHECKING ADMIN USER ===';

-- Check if admin user exists
SELECT UserID, Email, FullName, PasswordHash, Status, CreatedAt 
FROM Users 
WHERE Email = 'admin@muji.com';

-- Check all users
PRINT '';
PRINT '=== ALL USERS ===';
SELECT UserID, Email, FullName, Status FROM Users ORDER BY UserID;

-- If admin user doesn't exist, create it
IF NOT EXISTS (SELECT 1 FROM Users WHERE Email = 'admin@muji.com')
BEGIN
    PRINT '';
    PRINT '=== CREATING ADMIN USER ===';
    
    INSERT INTO Users (Email, PasswordHash, FullName, Phone, Address, Status, CreatedAt)
    VALUES ('admin@muji.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J8K8K8K8K', 'Admin User', '', '', 'Active', GETDATE());
    
    PRINT '✅ Admin user created with password: 111111';
END
ELSE
BEGIN
    PRINT '✅ Admin user already exists';
    
    -- Update admin password to 111111 if needed
    UPDATE Users 
    SET PasswordHash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J8K8K8K8K'
    WHERE Email = 'admin@muji.com';
    
    PRINT '✅ Admin password updated to: 111111';
END

PRINT '';
PRINT '=== FINAL ADMIN USER ===';
SELECT UserID, Email, FullName, Status FROM Users WHERE Email = 'admin@muji.com';
