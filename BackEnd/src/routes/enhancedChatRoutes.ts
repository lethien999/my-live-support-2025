import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sql from 'mssql';
import { HybridTokenService } from '../services/HybridTokenService';
import logger from '../config/logger';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|zip|rar/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('File type not allowed'));
    }
  }
});

// Helper function to get SQL Server connection
async function getSQLServerConnection() {
  const dbConfig = {
    user: 'thien',
    password: '1909',
    server: 'localhost',
    database: 'live_support',
    options: {
      encrypt: false,
      trustServerCertificate: true,
    },
  };

  try {
    const pool = await sql.connect(dbConfig);
    return pool;
  } catch (error) {
    logger.error('Database connection error:', error);
    throw error;
  }
}

// Helper function to validate token and get user info
async function validateTokenAndGetUser(req: express.Request): Promise<{ userId: number; userEmail: string; userRole: string }> {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;
  
  if (!token) {
    throw new Error('No token provided');
  }

  const validation = await HybridTokenService.validateToken(token);
  
  if (!validation.isValid || !validation.userEmail || !validation.userId) {
    throw new Error('Invalid token');
  }

  // Get user role from database
  const sql = await getSQLServerConnection();
  const userResult = await sql.query`
    SELECT Role FROM Users WHERE UserID = ${validation.userId}
  `;
  
  const userRole = userResult.recordset.length > 0 ? userResult.recordset[0].Role : 'Customer';

  return {
    userId: validation.userId,
    userEmail: validation.userEmail,
    userRole: userRole
  };
}

// ==================== FILE UPLOAD ENDPOINTS ====================

// Upload single file
router.post('/upload/single', upload.single('file'), async (req, res) => {
  try {
    const user = await validateTokenAndGetUser(req);
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const sql = await getSQLServerConnection();
    const result = await sql.query`
      INSERT INTO FileStorage (FileName, OriginalName, FilePath, FileSize, MimeType, UploadedBy, CreatedAt)
      VALUES (${req.file.filename}, ${req.file.originalname}, ${req.file.path}, ${req.file.size}, ${req.file.mimetype}, ${user.userId}, GETDATE());
      SELECT SCOPE_IDENTITY() AS FileID;
    `;

    const fileId = result.recordset[0].FileID;

    logger.info(`File uploaded by user ${user.userId}: ${req.file.originalname}`);

    res.json({
      success: true,
      fileId: fileId,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      fileUrl: `/api/files/${fileId}`
    });

  } catch (error) {
    logger.error('File upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
});

// Upload multiple files
router.post('/upload/multiple', upload.array('files', 5), async (req, res) => {
  try {
    const user = await validateTokenAndGetUser(req);
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const sql = await getSQLServerConnection();
    const uploadedFiles = [];

    for (const file of files) {
      const result = await sql.query`
        INSERT INTO FileStorage (FileName, OriginalName, FilePath, FileSize, MimeType, UploadedBy, CreatedAt)
        VALUES (${file.filename}, ${file.originalname}, ${file.path}, ${file.size}, ${file.mimetype}, ${user.userId}, GETDATE());
        SELECT SCOPE_IDENTITY() AS FileID;
      `;

      const fileId = result.recordset[0].FileID;
      uploadedFiles.push({
        fileId: fileId,
        fileName: file.filename,
        originalName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        fileUrl: `/api/files/${fileId}`
      });
    }

    logger.info(`Multiple files uploaded by user ${user.userId}: ${files.length} files`);

    res.json({
      success: true,
      files: uploadedFiles
    });

  } catch (error) {
    logger.error('Multiple file upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
});

// Get file by ID
router.get('/files/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const user = await validateTokenAndGetUser(req);

    const sql = await getSQLServerConnection();
    const result = await sql.query`
      SELECT FileName, OriginalName, FilePath, FileSize, MimeType, UploadedBy, RoomID
      FROM FileStorage 
      WHERE FileID = ${fileId} AND IsActive = 1
    `;

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    const file = result.recordset[0];

    // Check if user has access to this file
    if (file.UploadedBy !== user.userId && user.userRole !== 'Admin') {
      // Check if user is in the same room
      if (file.RoomID) {
        const roomResult = await sql.query`
          SELECT CustomerID, AgentID FROM ChatRooms WHERE RoomID = ${file.RoomID}
        `;
        
        if (roomResult.recordset.length === 0) {
          return res.status(403).json({ error: 'Access denied' });
        }

        const room = roomResult.recordset[0];
        if (room.CustomerID !== user.userId && room.AgentID !== user.userId) {
          return res.status(403).json({ error: 'Access denied' });
        }
      } else {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // Check if file exists on disk
    if (!fs.existsSync(file.FilePath)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }

    // Set appropriate headers
    res.setHeader('Content-Type', file.MimeType);
    res.setHeader('Content-Disposition', `inline; filename="${file.OriginalName}"`);
    res.setHeader('Content-Length', file.FileSize);

    // Stream the file
    const fileStream = fs.createReadStream(file.FilePath);
    fileStream.pipe(res);

  } catch (error) {
    logger.error('File download error:', error);
    res.status(500).json({ error: 'File download failed' });
  }
});

// Delete file
router.delete('/files/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const user = await validateTokenAndGetUser(req);

    const sql = await getSQLServerConnection();
    const result = await sql.query`
      SELECT FilePath, UploadedBy FROM FileStorage 
      WHERE FileID = ${fileId} AND IsActive = 1
    `;

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    const file = result.recordset[0];

    // Check if user can delete this file
    if (file.UploadedBy !== user.userId && user.userRole !== 'Admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Soft delete in database
    await sql.query`
      UPDATE FileStorage SET IsActive = 0 WHERE FileID = ${fileId}
    `;

    // Delete physical file
    if (fs.existsSync(file.FilePath)) {
      fs.unlinkSync(file.FilePath);
    }

    logger.info(`File deleted by user ${user.userId}: ${fileId}`);

    res.json({ success: true, message: 'File deleted successfully' });

  } catch (error) {
    logger.error('File deletion error:', error);
    res.status(500).json({ error: 'File deletion failed' });
  }
});

// ==================== NOTIFICATION ENDPOINTS ====================

// Get user notifications
router.get('/notifications', async (req, res) => {
  try {
    const user = await validateTokenAndGetUser(req);
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    const sql = await getSQLServerConnection();
    const offset = (Number(page) - 1) * Number(limit);

    let whereClause = `WHERE cn.UserID = ${user.userId} AND cn.IsActive = 1`;
    if (unreadOnly === 'true') {
      whereClause += ` AND cn.IsRead = 0`;
    }

    const result = await sql.query`
      SELECT cn.NotificationID, cn.Type, cn.Title, cn.Content, cn.IsRead, 
             cn.CreatedAt, cn.ReadAt, cr.RoomID, m.MessageID
      FROM ChatNotifications cn
      LEFT JOIN ChatRooms cr ON cn.RoomID = cr.RoomID
      LEFT JOIN Messages m ON cn.MessageID = m.MessageID
      ${whereClause}
      ORDER BY cn.CreatedAt DESC
      OFFSET ${offset} ROWS
      FETCH NEXT ${limit} ROWS ONLY
    `;

    // Get total count
    const countResult = await sql.query`
      SELECT COUNT(*) as TotalCount
      FROM ChatNotifications cn
      ${whereClause}
    `;

    const totalCount = countResult.recordset[0].TotalCount;

    res.json({
      success: true,
      notifications: result.recordset,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / Number(limit))
      }
    });

  } catch (error) {
    logger.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
});

// Mark notification as read
router.put('/notifications/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const user = await validateTokenAndGetUser(req);

    const sql = await getSQLServerConnection();
    const result = await sql.query`
      UPDATE ChatNotifications 
      SET IsRead = 1, ReadAt = GETDATE()
      WHERE NotificationID = ${notificationId} AND UserID = ${user.userId}
    `;

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ success: true, message: 'Notification marked as read' });

  } catch (error) {
    logger.error('Mark notification as read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.put('/notifications/read-all', async (req, res) => {
  try {
    const user = await validateTokenAndGetUser(req);

    const sql = await getSQLServerConnection();
    await sql.query`
      UPDATE ChatNotifications 
      SET IsRead = 1, ReadAt = GETDATE()
      WHERE UserID = ${user.userId} AND IsRead = 0
    `;

    res.json({ success: true, message: 'All notifications marked as read' });

  } catch (error) {
    logger.error('Mark all notifications as read error:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// Get unread notification count
router.get('/notifications/unread-count', async (req, res) => {
  try {
    const user = await validateTokenAndGetUser(req);

    const sql = await getSQLServerConnection();
    const result = await sql.query`
      SELECT COUNT(*) as UnreadCount
      FROM ChatNotifications 
      WHERE UserID = ${user.userId} AND IsRead = 0 AND IsActive = 1
    `;

    res.json({
      success: true,
      unreadCount: result.recordset[0].UnreadCount
    });

  } catch (error) {
    logger.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

// ==================== CHAT ENHANCEMENT ENDPOINTS ====================

// Get online users in a room
router.get('/chat/rooms/:roomId/online-users', async (req, res) => {
  try {
    const { roomId } = req.params;
    const user = await validateTokenAndGetUser(req);

    const sql = await getSQLServerConnection();
    const result = await sql.query`
      EXEC GetOnlineUsersInRoom @RoomID = ${roomId}
    `;

    res.json({
      success: true,
      onlineUsers: result.recordset
    });

  } catch (error) {
    logger.error('Get online users error:', error);
    res.status(500).json({ error: 'Failed to get online users' });
  }
});

// Get unread message count for user
router.get('/chat/unread-count', async (req, res) => {
  try {
    const user = await validateTokenAndGetUser(req);

    const sql = await getSQLServerConnection();
    const result = await sql.query`
      EXEC GetUnreadMessageCount @UserID = ${user.userId}
    `;

    res.json({
      success: true,
      unreadCount: result.recordset[0].UnreadCount
    });

  } catch (error) {
    logger.error('Get unread message count error:', error);
    res.status(500).json({ error: 'Failed to get unread message count' });
  }
});

// Mark messages as read
router.put('/chat/rooms/:roomId/mark-read', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { messageIds } = req.body;
    const user = await validateTokenAndGetUser(req);

    const sql = await getSQLServerConnection();
    await sql.query`
      EXEC MarkMessagesAsRead @UserID = ${user.userId}, @RoomID = ${roomId}, @MessageIDs = ${messageIds || null}
    `;

    res.json({ success: true, message: 'Messages marked as read' });

  } catch (error) {
    logger.error('Mark messages as read error:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

// Get typing users in a room
router.get('/chat/rooms/:roomId/typing-users', async (req, res) => {
  try {
    const { roomId } = req.params;
    const user = await validateTokenAndGetUser(req);

    const sql = await getSQLServerConnection();
    const result = await sql.query`
      SELECT ts.UserID, u.Email, u.FirstName, u.LastName, ts.StartedAt
      FROM TypingStatus ts
      INNER JOIN Users u ON ts.UserID = u.UserID
      WHERE ts.RoomID = ${roomId} 
      AND ts.IsTyping = 1 
      AND ts.UserID != ${user.userId}
      AND ts.LastActivity > DATEADD(minute, -1, GETDATE())
    `;

    res.json({
      success: true,
      typingUsers: result.recordset
    });

  } catch (error) {
    logger.error('Get typing users error:', error);
    res.status(500).json({ error: 'Failed to get typing users' });
  }
});

// Update typing status
router.post('/chat/rooms/:roomId/typing', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { isTyping } = req.body;
    const user = await validateTokenAndGetUser(req);

    const sql = await getSQLServerConnection();

    if (isTyping) {
      // Insert or update typing status
      await sql.query`
        MERGE TypingStatus AS target
        USING (SELECT ${user.userId} as UserID, ${roomId} as RoomID) AS source
        ON target.UserID = source.UserID AND target.RoomID = source.RoomID
        WHEN MATCHED THEN
          UPDATE SET IsTyping = 1, LastActivity = GETDATE()
        WHEN NOT MATCHED THEN
          INSERT (UserID, RoomID, IsTyping, StartedAt, LastActivity)
          VALUES (source.UserID, source.RoomID, 1, GETDATE(), GETDATE());
      `;
    } else {
      // Stop typing
      await sql.query`
        UPDATE TypingStatus 
        SET IsTyping = 0, LastActivity = GETDATE()
        WHERE UserID = ${user.userId} AND RoomID = ${roomId}
      `;
    }

    res.json({ success: true, message: 'Typing status updated' });

  } catch (error) {
    logger.error('Update typing status error:', error);
    res.status(500).json({ error: 'Failed to update typing status' });
  }
});

export default router;
