-- =============================================
-- SCRIPT XÓA USERS CÓ FOREIGN KEY CONSTRAINTS
-- =============================================
-- Script này sẽ xóa UserID 4 và 5 một cách an toàn

USE live_support;
GO

-- Kiểm tra dữ liệu trước khi xóa
PRINT '=== KIỂM TRA DỮ LIỆU TRƯỚC KHI XÓA ===';
SELECT 'AuditLogs' as TableName, COUNT(*) as RecordCount FROM AuditLogs WHERE UserID IN (4, 5)
UNION ALL
SELECT 'Messages', COUNT(*) FROM Messages WHERE SenderID IN (4, 5)
UNION ALL
SELECT 'Tickets (Customer)', COUNT(*) FROM Tickets WHERE CustomerID IN (4, 5)
UNION ALL
SELECT 'Tickets (Assigned)', COUNT(*) FROM Tickets WHERE AssignedTo IN (4, 5)
UNION ALL
SELECT 'UserRoles', COUNT(*) FROM UserRoles WHERE UserID IN (4, 5)
UNION ALL
SELECT 'Departments', COUNT(*) FROM Departments WHERE ManagerID IN (4, 5);

PRINT '';
PRINT '=== BẮT ĐẦU XÓA DỮ LIỆU ===';

-- 1. Xóa AuditLogs
PRINT '1. Xóa AuditLogs...';
DELETE FROM AuditLogs WHERE UserID IN (4, 5);
PRINT '   ✅ AuditLogs đã xóa';

-- 2. Xóa Messages
PRINT '2. Xóa Messages...';
DELETE FROM Messages WHERE SenderID IN (4, 5);
PRINT '   ✅ Messages đã xóa';

-- 3. Xóa Tickets (Customer)
PRINT '3. Xóa Tickets (Customer)...';
DELETE FROM Tickets WHERE CustomerID IN (4, 5);
PRINT '   ✅ Tickets (Customer) đã xóa';

-- 4. Xóa Tickets (Assigned)
PRINT '4. Xóa Tickets (Assigned)...';
DELETE FROM Tickets WHERE AssignedTo IN (4, 5);
PRINT '   ✅ Tickets (Assigned) đã xóa';

-- 5. Xóa ChatRooms (nếu có ticket liên quan)
PRINT '5. Xóa ChatRooms...';
DELETE FROM ChatRooms WHERE TicketID IN (
    SELECT TicketID FROM Tickets WHERE CustomerID IN (4, 5)
);
PRINT '   ✅ ChatRooms đã xóa';

-- 6. Xóa UserRoles
PRINT '6. Xóa UserRoles...';
DELETE FROM UserRoles WHERE UserID IN (4, 5);
PRINT '   ✅ UserRoles đã xóa';

-- 7. Xóa Departments (nếu có manager)
PRINT '7. Xóa Departments...';
DELETE FROM Departments WHERE ManagerID IN (4, 5);
PRINT '   ✅ Departments đã xóa';

-- 8. Cuối cùng xóa Users
PRINT '8. Xóa Users...';
DELETE FROM Users WHERE UserID IN (4, 5);
PRINT '   ✅ Users đã xóa';

PRINT '';
PRINT '=== KIỂM TRA SAU KHI XÓA ===';
SELECT COUNT(*) as TotalUsers FROM Users;
SELECT UserID, Email, FullName FROM Users ORDER BY UserID;

PRINT '';
PRINT '🎉 XÓA THÀNH CÔNG!';
