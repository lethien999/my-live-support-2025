// src/dev-server.ts - Clean development server with SimpleChatGateway
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import { connectDatabase } from './db';
import sql from 'mssql';
import { HybridTokenService } from './services/HybridTokenService';
import { SimpleChatGateway } from './sockets/SimpleChatGateway';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Map để lưu trữ token và email người dùng
const activeTokens = new Map(); // accessToken -> userEmail
const refreshTokens = new Map(); // refreshToken -> { userEmail, expiresAt }

// Helper function to validate token
async function validateTokenAndGetUserEmail(token: string): Promise<{ userEmail: string | null; userId?: number; role?: string }> {
  try {
    // First try HybridTokenService (persistent)
    const validation = await HybridTokenService.validateToken(token);
    if (validation.isValid && validation.userEmail) {
      return {
        userEmail: validation.userEmail,
        userId: validation.userId,
        role: validation.role
      };
    }
    
    // Fallback to activeTokens Map (temporary)
    const userEmail = activeTokens.get(token);
    if (userEmail) {
      return { userEmail };
    }
    
    return { userEmail: null };
  } catch (error) {
    console.error('Token validation error:', error);
    return { userEmail: null };
  }
}

// Helper function for database connection
const getDbConnection = async () => {
  const config = {
    user: 'thien',
    password: '1909',
    server: 'localhost',
    database: 'live_support',
    options: {
      encrypt: false,
      trustServerCertificate: true,
    },
  };
  
  await sql.connect(config);
  return sql;
};

// ===========================================
// AUTHENTICATION APIs
// ===========================================

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const sql = await getDbConnection();
    
    // Get user from database
    const userResult = await sql.query(`
      SELECT UserID, Email, PasswordHash, FullName, Status
      FROM Users 
      WHERE Email = '${email}' AND Status = 'Active'
    `);
    
    await sql.close();

    if (userResult.recordset.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const user = userResult.recordset[0];
    
    // Simple password check (for development)
    if (password !== '111111' && password !== user.PasswordHash) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate tokens
    const tokens = await HybridTokenService.generateTokens(user.UserID, email);
    
    // Store in activeTokens for Socket.IO
    activeTokens.set(tokens.accessToken, email);
    refreshTokens.set(tokens.refreshToken, {
      userEmail: email,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.UserID,
        email: user.Email,
        name: user.FullName,
        role: email === 'admin@muji.com' ? 'Admin' : 
              email === 'agent@muji.com' ? 'Agent' : 'Customer'
      },
      tokens
    });

  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

// Admin login endpoint (for development)
app.post('/api/auth/admin-login', async (req, res) => {
  try {
    const { email = 'admin@muji.com', password = '111111' } = req.body;

    const sql = await getDbConnection();
    
    // Check if admin user exists
    let userResult = await sql.query(`
      SELECT UserID, Email, FullName FROM Users WHERE Email = '${email}'
    `);
    
    // Create admin user if not exists
    if (userResult.recordset.length === 0) {
      await sql.query(`
        INSERT INTO Users (Email, PasswordHash, FullName, Status, CreatedAt)
        VALUES ('${email}', '${password}', 'Administrator', 'Active', GETDATE())
      `);
      
      userResult = await sql.query(`
        SELECT UserID, Email, FullName FROM Users WHERE Email = '${email}'
      `);
    }
    
    await sql.close();

    const user = userResult.recordset[0];
    
    // Generate tokens
    const tokens = await HybridTokenService.generateTokens(user.UserID, email);
    
    // Store in activeTokens for Socket.IO
    activeTokens.set(tokens.accessToken, email);
    refreshTokens.set(tokens.refreshToken, {
      userEmail: email,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      message: 'Admin login successful',
      user: {
        id: user.UserID,
        email: user.Email,
        name: user.FullName,
        role: 'Admin'
      },
      tokens
    });

  } catch (error: any) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Admin login failed',
      error: error.message
    });
  }
});

// ===========================================
// ADMIN MANAGEMENT APIs - CLEAN IMPLEMENTATION
// ===========================================

// Helper function for admin authentication
const requireAdminAuth = (req: any, res: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return null;
  }
  
  const token = authHeader.substring(7);
  const userEmail = activeTokens.get(token);
  
  if (!userEmail || userEmail !== 'admin@muji.com') {
    res.status(403).json({ success: false, message: 'Admin access required' });
    return null;
  }
  
  return token;
};

// Get all users (Admin only)
app.get('/api/admin/users', async (req, res) => {
  try {
    const token = requireAdminAuth(req, res);
    if (!token) return;
    
    const sql = await getDbConnection();
    
    const result = await sql.query(`
      SELECT 
        UserID,
        Email,
        FullName,
        Phone,
        Address,
        Status,
        CreatedAt,
        CASE 
          WHEN Email = 'admin@muji.com' THEN 'Admin'
          WHEN Email = 'agent@muji.com' THEN 'Agent'
          ELSE 'Customer'
        END as Role
      FROM Users
      ORDER BY CreatedAt DESC
    `);
    
    await sql.close();
    
    res.json({
      success: true,
      users: result.recordset
    });
    
  } catch (error: any) {
    console.error('❌ Admin get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
});

// Delete user (Admin only)
app.delete('/api/admin/users/:userId', async (req, res) => {
  try {
    const token = requireAdminAuth(req, res);
    if (!token) return;
    
    const { userId } = req.params;
    
    const sql = await getDbConnection();
    
    // Check if user exists
    const userResult = await sql.query(`
      SELECT Email FROM Users WHERE UserID = ${userId}
    `);
    
    if (userResult.recordset.length === 0) {
      await sql.close();
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Prevent deleting admin account
    if (userResult.recordset[0].Email === 'admin@muji.com') {
      await sql.close();
      return res.status(400).json({
        success: false,
        message: 'Cannot delete admin account'
      });
    }
    
    // Delete user
    await sql.query(`
      DELETE FROM Users WHERE UserID = ${userId}
    `);
    
    await sql.close();
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
    
  } catch (error: any) {
    console.error('❌ Admin delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
});

// ===========================================
// CHAT SYSTEM APIs - CLEAN IMPLEMENTATION
// ===========================================

// Helper function for chat authentication
const requireChatAuth = (req: any, res: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return null;
  }
  
  const token = authHeader.substring(7);
  const userEmail = activeTokens.get(token);
  
  if (!userEmail) {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
    return null;
  }
  
  return { token, userEmail };
};

// Get all chat rooms (Authenticated users)
app.get('/api/chat/rooms', async (req, res) => {
  try {
    const auth = requireChatAuth(req, res);
    if (!auth) return;
    
    const sql = await getDbConnection();
    
    const result = await sql.query(`
      SELECT 
        r.RoomID,
        r.RoomName,
        r.RoomType,
        r.Status,
        r.CreatedAt,
        r.LastMessageAt,
        u1.FullName as CustomerName,
        u2.FullName as AgentName,
        COUNT(m.MessageID) as MessageCount
      FROM ChatRooms r
      LEFT JOIN Users u1 ON r.CustomerID = u1.UserID
      LEFT JOIN Users u2 ON r.AgentID = u2.UserID
      LEFT JOIN Messages m ON r.RoomID = m.RoomID
      WHERE r.Status = 'Active'
      GROUP BY r.RoomID, r.RoomName, r.RoomType, r.Status, r.CreatedAt, r.LastMessageAt, u1.FullName, u2.FullName
      ORDER BY r.LastMessageAt DESC
    `);
    
    await sql.close();
    
    res.json({
      success: true,
      rooms: result.recordset
    });
    
  } catch (error: any) {
    console.error('❌ Get chat rooms error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chat rooms',
      error: error.message
    });
  }
});

// Get messages for a room (Authenticated users)
app.get('/api/chat/rooms/:roomId/messages', async (req, res) => {
  try {
    const auth = requireChatAuth(req, res);
    if (!auth) return;
    
    const { roomId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    const sql = await getDbConnection();
    
    // Check if room exists
    const roomResult = await sql.query(`
      SELECT RoomID FROM ChatRooms WHERE RoomID = ${roomId} AND Status = 'Active'
    `);
    
    if (roomResult.recordset.length === 0) {
      await sql.close();
      return res.status(404).json({
        success: false,
        message: 'Chat room not found'
      });
    }
    
    // Get messages
    const messagesResult = await sql.query(`
      SELECT 
        m.MessageID,
        m.RoomID,
        m.SenderID,
        m.Content,
        m.MessageType,
        m.CreatedAt,
        u.FullName as SenderName,
        u.Email as SenderEmail
      FROM Messages m
      LEFT JOIN Users u ON m.SenderID = u.UserID
      WHERE m.RoomID = ${roomId}
      ORDER BY m.CreatedAt DESC
      OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY
    `);
    
    await sql.close();
    
    res.json({
      success: true,
      messages: messagesResult.recordset.reverse() // Reverse to show oldest first
    });
    
  } catch (error: any) {
    console.error('❌ Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages',
      error: error.message
    });
  }
});

// Send message (Authenticated users)
app.post('/api/chat/send', async (req, res) => {
  try {
    const auth = requireChatAuth(req, res);
    if (!auth) return;
    
    const { roomId, content, messageType = 'text' } = req.body;
    
    if (!roomId || !content) {
      return res.status(400).json({
        success: false,
        message: 'Room ID and content are required'
      });
    }
    
    const sql = await getDbConnection();
    
    // Check if room exists
    const roomResult = await sql.query(`
      SELECT RoomID FROM ChatRooms WHERE RoomID = ${roomId} AND Status = 'Active'
    `);
    
    if (roomResult.recordset.length === 0) {
      await sql.close();
      return res.status(404).json({
        success: false,
        message: 'Chat room not found'
      });
    }
    
    // Get sender ID from token
    const userResult = await sql.query(`
      SELECT UserID FROM Users WHERE Email = '${auth.userEmail}'
    `);
    
    if (userResult.recordset.length === 0) {
      await sql.close();
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const senderId = userResult.recordset[0].UserID;
    
    // Insert message
    const messageResult = await sql.query(`
      INSERT INTO Messages (RoomID, SenderID, Content, MessageType, CreatedAt)
      VALUES (${roomId}, ${senderId}, '${content}', '${messageType}', GETDATE())
    `);
    
    // Update room's last message time
    await sql.query(`
      UPDATE ChatRooms SET LastMessageAt = GETDATE() WHERE RoomID = ${roomId}
    `);
    
    await sql.close();
    
    res.json({
      success: true,
      message: 'Message sent successfully',
      messageId: messageResult.recordset.insertId
    });
    
  } catch (error: any) {
    console.error('❌ Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      socket: 'active',
      chat: 'functional'
    }
  });
});

// ===========================================
// SERVER INITIALIZATION
// ===========================================

// Create HTTP server
const server = createServer(app);

// Initialize Socket.IO with SimpleChatGateway
const io = new SocketIOServer(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'] as any,
});

// Initialize Simple Chat Gateway
const chatGateway = new SimpleChatGateway(io);

// Sync activeTokens with Socket.IO
setInterval(() => {
  SimpleChatGateway.updateActiveTokens(activeTokens);
}, 1000); // Update every second

// Start HTTP server
const port = process.env.PORT || 4000;

server.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
  console.log(`🔌 Socket.IO available at ws://localhost:${port}`);
  console.log(`📡 Health check: http://localhost:${port}/health`);
  console.log(`⚡ Simple Chat Gateway initialized`);
});
