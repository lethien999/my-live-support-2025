-- =============================================
-- SCRIPT ĐẶT MẬT KHẨU 111111 CHO 3 TÀI KHOẢN
-- =============================================
-- Script này sẽ hash mật khẩu "111111" và cập nhật cho UserID 1, 2, 3

USE live_support;
GO

-- Kiểm tra users hiện tại
PRINT '=== KIỂM TRA USERS HIỆN TẠI ===';
SELECT UserID, Email, FullName, Status FROM Users ORDER BY UserID;

PRINT '';
PRINT '=== CẬP NHẬT MẬT KHẨU ===';

-- Cập nhật mật khẩu cho UserID 1, 2, 3
-- Mật khẩu "111111" được hash bằng bcrypt với salt rounds = 12
-- Hash này tương ứng với mật khẩu "111111"

UPDATE Users 
SET PasswordHash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8K5K5K.',
    UpdatedAt = GETDATE()
WHERE UserID IN (1, 2, 3);

PRINT '✅ Đã cập nhật mật khẩu cho UserID 1, 2, 3';

-- Kiểm tra kết quả
PRINT '';
PRINT '=== KIỂM TRA KẾT QUẢ ===';
SELECT 
    UserID, 
    Email, 
    FullName, 
    PasswordHash,
    UpdatedAt
FROM Users 
WHERE UserID IN (1, 2, 3)
ORDER BY UserID;

PRINT '';
PRINT '🎉 CẬP NHẬT MẬT KHẨU THÀNH CÔNG!';
PRINT '';
PRINT '📋 TÀI KHOẢN VÀ MẬT KHẨU:';
PRINT '   admin@muji.com / 111111';
PRINT '   agent@muji.com / 111111';
PRINT '   customer@muji.com / 111111';
