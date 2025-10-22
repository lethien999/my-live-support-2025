-- Enhanced Chat System Database Migrations
-- Based on Graduation-Thesis architecture

-- 1. Add new columns to Messages table for read receipts
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Messages') AND name = 'IsRead')
BEGIN
    ALTER TABLE Messages ADD IsRead BIT DEFAULT 0;
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Messages') AND name = 'ReadAt')
BEGIN
    ALTER TABLE Messages ADD ReadAt DATETIME2 NULL;
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Messages') AND name = 'FileID')
BEGIN
    ALTER TABLE Messages ADD FileID NVARCHAR(255) NULL;
END

-- 2. Create FileStorage table for file uploads
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='FileStorage' and xtype='U')
BEGIN
    CREATE TABLE FileStorage (
        FileID INT PRIMARY KEY IDENTITY(1,1),
        FileName NVARCHAR(255) NOT NULL,
        OriginalName NVARCHAR(255) NOT NULL,
        FilePath NVARCHAR(500) NOT NULL,
        FileSize BIGINT NOT NULL,
        MimeType NVARCHAR(100) NOT NULL,
        UploadedBy INT NOT NULL,
        RoomID INT NULL,
        MessageID INT NULL,
        CreatedAt DATETIME2 DEFAULT GETDATE(),
        IsActive BIT DEFAULT 1,
        FOREIGN KEY (UploadedBy) REFERENCES Users(UserID),
        FOREIGN KEY (RoomID) REFERENCES ChatRooms(RoomID),
        FOREIGN KEY (MessageID) REFERENCES Messages(MessageID)
    );
END

-- 3. Create ChatNotifications table for real-time notifications
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ChatNotifications' and xtype='U')
BEGIN
    CREATE TABLE ChatNotifications (
        NotificationID INT PRIMARY KEY IDENTITY(1,1),
        UserID INT NOT NULL,
        RoomID INT NULL,
        MessageID INT NULL,
        Type NVARCHAR(50) NOT NULL, -- 'message', 'typing', 'online', 'ticket_update'
        Title NVARCHAR(255) NOT NULL,
        Content NVARCHAR(MAX) NOT NULL,
        IsRead BIT DEFAULT 0,
        CreatedAt DATETIME2 DEFAULT GETDATE(),
        ReadAt DATETIME2 NULL,
        IsActive BIT DEFAULT 1,
        FOREIGN KEY (UserID) REFERENCES Users(UserID),
        FOREIGN KEY (RoomID) REFERENCES ChatRooms(RoomID),
        FOREIGN KEY (MessageID) REFERENCES Messages(MessageID)
    );
END

-- 4. Create UserSessions table for tracking online status
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='UserSessions' and xtype='U')
BEGIN
    CREATE TABLE UserSessions (
        SessionID INT PRIMARY KEY IDENTITY(1,1),
        UserID INT NOT NULL,
        SocketID NVARCHAR(255) NOT NULL,
        RoomID INT NULL,
        IsOnline BIT DEFAULT 1,
        LastActivity DATETIME2 DEFAULT GETDATE(),
        ConnectedAt DATETIME2 DEFAULT GETDATE(),
        DisconnectedAt DATETIME2 NULL,
        FOREIGN KEY (UserID) REFERENCES Users(UserID),
        FOREIGN KEY (RoomID) REFERENCES ChatRooms(RoomID)
    );
END

-- 5. Create TypingStatus table for typing indicators
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='TypingStatus' and xtype='U')
BEGIN
    CREATE TABLE TypingStatus (
        TypingID INT PRIMARY KEY IDENTITY(1,1),
        UserID INT NOT NULL,
        RoomID INT NOT NULL,
        IsTyping BIT DEFAULT 1,
        StartedAt DATETIME2 DEFAULT GETDATE(),
        LastActivity DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (UserID) REFERENCES Users(UserID),
        FOREIGN KEY (RoomID) REFERENCES ChatRooms(RoomID)
    );
END

-- 6. Add indexes for better performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Messages_RoomID_CreatedAt')
BEGIN
    CREATE INDEX IX_Messages_RoomID_CreatedAt ON Messages(RoomID, CreatedAt DESC);
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Messages_IsRead')
BEGIN
    CREATE INDEX IX_Messages_IsRead ON Messages(IsRead);
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_FileStorage_RoomID')
BEGIN
    CREATE INDEX IX_FileStorage_RoomID ON FileStorage(RoomID);
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ChatNotifications_UserID_IsRead')
BEGIN
    CREATE INDEX IX_ChatNotifications_UserID_IsRead ON ChatNotifications(UserID, IsRead);
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_UserSessions_UserID_IsOnline')
BEGIN
    CREATE INDEX IX_UserSessions_UserID_IsOnline ON UserSessions(UserID, IsOnline);
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TypingStatus_RoomID')
BEGIN
    CREATE INDEX IX_TypingStatus_RoomID ON TypingStatus(RoomID);
END

-- 7. Create stored procedures for common operations

-- Procedure to get unread message count for a user
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'GetUnreadMessageCount')
    DROP PROCEDURE GetUnreadMessageCount;
GO

CREATE PROCEDURE GetUnreadMessageCount
    @UserID INT
AS
BEGIN
    SELECT COUNT(*) as UnreadCount
    FROM Messages m
    INNER JOIN ChatRooms cr ON m.RoomID = cr.RoomID
    WHERE m.IsRead = 0 
    AND m.SenderID != @UserID
    AND (cr.CustomerID = @UserID OR cr.AgentID = @UserID)
    AND m.CreatedAt > DATEADD(day, -30, GETDATE());
END
GO

-- Procedure to mark messages as read
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'MarkMessagesAsRead')
    DROP PROCEDURE MarkMessagesAsRead;
GO

CREATE PROCEDURE MarkMessagesAsRead
    @UserID INT,
    @RoomID INT,
    @MessageIDs NVARCHAR(MAX) = NULL
AS
BEGIN
    IF @MessageIDs IS NULL
    BEGIN
        -- Mark all unread messages in room as read
        UPDATE Messages 
        SET IsRead = 1, ReadAt = GETDATE()
        WHERE RoomID = @RoomID 
        AND SenderID != @UserID
        AND IsRead = 0;
    END
    ELSE
    BEGIN
        -- Mark specific messages as read
        UPDATE Messages 
        SET IsRead = 1, ReadAt = GETDATE()
        WHERE RoomID = @RoomID 
        AND SenderID != @UserID
        AND MessageID IN (SELECT value FROM STRING_SPLIT(@MessageIDs, ','));
    END
END
GO

-- Procedure to get online users in a room
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'GetOnlineUsersInRoom')
    DROP PROCEDURE GetOnlineUsersInRoom;
GO

CREATE PROCEDURE GetOnlineUsersInRoom
    @RoomID INT
AS
BEGIN
    SELECT DISTINCT 
        u.UserID,
        u.Email,
        u.FirstName,
        u.LastName,
        u.Role,
        us.LastActivity,
        us.ConnectedAt
    FROM UserSessions us
    INNER JOIN Users u ON us.UserID = u.UserID
    WHERE us.RoomID = @RoomID 
    AND us.IsOnline = 1
    AND us.LastActivity > DATEADD(minute, -5, GETDATE());
END
GO

-- Procedure to cleanup old data
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'CleanupOldChatData')
    DROP PROCEDURE CleanupOldChatData;
GO

CREATE PROCEDURE CleanupOldChatData
AS
BEGIN
    -- Cleanup old typing status (older than 1 minute)
    DELETE FROM TypingStatus 
    WHERE LastActivity < DATEADD(minute, -1, GETDATE());
    
    -- Cleanup old user sessions (older than 1 hour)
    UPDATE UserSessions 
    SET IsOnline = 0, DisconnectedAt = GETDATE()
    WHERE IsOnline = 1 
    AND LastActivity < DATEADD(hour, -1, GETDATE());
    
    -- Cleanup old notifications (older than 30 days)
    DELETE FROM ChatNotifications 
    WHERE CreatedAt < DATEADD(day, -30, GETDATE());
    
    -- Cleanup old file storage (older than 90 days)
    UPDATE FileStorage 
    SET IsActive = 0
    WHERE CreatedAt < DATEADD(day, -90, GETDATE())
    AND IsActive = 1;
END
GO

-- 8. Create triggers for automatic operations

-- Trigger to update room last message when new message is inserted
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_Messages_UpdateRoomLastMessage')
    DROP TRIGGER TR_Messages_UpdateRoomLastMessage;
GO

CREATE TRIGGER TR_Messages_UpdateRoomLastMessage
ON Messages
AFTER INSERT
AS
BEGIN
    UPDATE cr
    SET LastMessage = i.Content,
        LastMessageAt = i.CreatedAt
    FROM ChatRooms cr
    INNER JOIN inserted i ON cr.RoomID = i.RoomID;
END
GO

-- Trigger to create notification when new message is inserted
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_Messages_CreateNotification')
    DROP TRIGGER TR_Messages_CreateNotification;
GO

CREATE TRIGGER TR_Messages_CreateNotification
ON Messages
AFTER INSERT
AS
BEGIN
    INSERT INTO ChatNotifications (UserID, RoomID, MessageID, Type, Title, Content)
    SELECT DISTINCT
        CASE 
            WHEN cr.CustomerID = i.SenderID THEN cr.AgentID
            ELSE cr.CustomerID
        END as UserID,
        i.RoomID,
        i.MessageID,
        'message' as Type,
        'New Message' as Title,
        LEFT(i.Content, 100) as Content
    FROM inserted i
    INNER JOIN ChatRooms cr ON i.RoomID = cr.RoomID
    WHERE i.SenderID != CASE 
        WHEN cr.CustomerID = i.SenderID THEN cr.AgentID
        ELSE cr.CustomerID
    END;
END
GO

PRINT 'Enhanced Chat System Database Migrations Completed Successfully!';
