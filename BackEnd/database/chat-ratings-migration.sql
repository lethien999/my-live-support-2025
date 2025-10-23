-- Chat Ratings System Migration
-- Add ChatRatings table for customer support rating system

USE live_support;
GO

-- Create ChatRatings table if not exists
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ChatRatings' and xtype='U')
BEGIN
    CREATE TABLE ChatRatings (
        RatingID INT IDENTITY(1,1) PRIMARY KEY,
        RoomID INT NOT NULL,
        UserID INT NOT NULL,
        Rating INT NOT NULL CHECK (Rating >= 1 AND Rating <= 5),
        Comment NVARCHAR(MAX) NULL,
        CreatedAt DATETIME2 DEFAULT GETDATE(),
        UpdatedAt DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (RoomID) REFERENCES ChatRooms(RoomID) ON DELETE CASCADE,
        FOREIGN KEY (UserID) REFERENCES Users(UserID),
        UNIQUE(RoomID, UserID) -- Prevent duplicate ratings from same user
    );
    
    PRINT '✅ ChatRatings table created successfully!';
END
ELSE
BEGIN
    PRINT '⚠️ ChatRatings table already exists';
END

-- Add rating columns to ChatRooms table if not exists
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ChatRooms') AND name = 'AverageRating')
BEGIN
    ALTER TABLE ChatRooms ADD AverageRating DECIMAL(3,2) DEFAULT 0;
    PRINT '✅ Added AverageRating column to ChatRooms';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ChatRooms') AND name = 'TotalRatings')
BEGIN
    ALTER TABLE ChatRooms ADD TotalRatings INT DEFAULT 0;
    PRINT '✅ Added TotalRatings column to ChatRooms';
END

-- Create indexes for performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ChatRatings_RoomID')
BEGIN
    CREATE INDEX IX_ChatRatings_RoomID ON ChatRatings(RoomID);
    PRINT '✅ Created index IX_ChatRatings_RoomID';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ChatRatings_UserID')
BEGIN
    CREATE INDEX IX_ChatRatings_UserID ON ChatRatings(UserID);
    PRINT '✅ Created index IX_ChatRatings_UserID';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ChatRatings_CreatedAt')
BEGIN
    CREATE INDEX IX_ChatRatings_CreatedAt ON ChatRatings(CreatedAt);
    PRINT '✅ Created index IX_ChatRatings_CreatedAt';
END

-- Insert sample data for testing
INSERT INTO ChatRatings (RoomID, UserID, Rating, Comment)
SELECT TOP 3
    cr.RoomID,
    cr.CustomerID,
    CASE 
        WHEN ROW_NUMBER() OVER (ORDER BY cr.RoomID) = 1 THEN 5
        WHEN ROW_NUMBER() OVER (ORDER BY cr.RoomID) = 2 THEN 4
        ELSE 3
    END,
    CASE 
        WHEN ROW_NUMBER() OVER (ORDER BY cr.RoomID) = 1 THEN 'Dịch vụ hỗ trợ rất tốt, nhân viên nhiệt tình!'
        WHEN ROW_NUMBER() OVER (ORDER BY cr.RoomID) = 2 THEN 'Giải quyết vấn đề nhanh chóng'
        ELSE 'Hỗ trợ ổn'
    END
FROM ChatRooms cr
WHERE cr.RoomID IN (SELECT TOP 3 RoomID FROM ChatRooms ORDER BY RoomID);

-- Update ChatRooms with rating statistics
UPDATE cr 
SET 
    AverageRating = ISNULL(r.AvgRating, 0),
    TotalRatings = ISNULL(r.TotalCount, 0)
FROM ChatRooms cr
LEFT JOIN (
    SELECT 
        RoomID,
        AVG(CAST(Rating AS DECIMAL(3,2))) as AvgRating,
        COUNT(*) as TotalCount
    FROM ChatRatings 
    GROUP BY RoomID
) r ON cr.RoomID = r.RoomID;

PRINT '✅ Chat ratings system setup completed!';
PRINT '📊 Sample ratings inserted and statistics updated';
