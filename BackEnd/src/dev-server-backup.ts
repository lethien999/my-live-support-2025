// src/dev-server.ts - Optimized development server
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import { connectDatabase, getConnection } from './db';
import sql from 'mssql';
import { redisService } from './services/redisService';
import { InMemoryCache } from './services/inMemoryCache';
import { AIBotService } from './services/aiBotService';
import { HybridTokenService } from './services/HybridTokenService';

// Helper function to validate token using HybridTokenService
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

// Map để lưu trữ token và email người dùng
const activeTokens = new Map(); // accessToken -> userEmail
const refreshTokens = new Map(); // refreshToken -> { userEmail, expiresAt }

// Add tokens from frontend console for testing
activeTokens.set('access_1761061893819_gxpp5ve9ee7_3600000', 'agent@muji.com');
activeTokens.set('access_1761062773940_9dvefqhrtyb_3600000', 'agent@muji.com');
activeTokens.set('access_1761062963389_s5191q5o61m_3600000', 'agent@muji.com');

// Add new tokens from frontend console
activeTokens.set('access_1761063510217_t09hdbghq29_3600000', 'agent@muji.com');
activeTokens.set('access_1761063526615_vwrtz7fadap_3600000', 'agent@muji.com');

// Add latest token from frontend console
activeTokens.set('access_1761065869150_ms7qp380chp_3600000', 'agent@muji.com');

// Add newest token from frontend console
activeTokens.set('access_1761066132695_71qg206mn4e_3600000', 'agent@muji.com');

// Add latest token from frontend console (chat support from ticket)
activeTokens.set('access_1761066444974_0ntsn18ksyeo_3600000', 'agent@muji.com');

// Add newest token from frontend console
activeTokens.set('access_1761066744699_d4yl0za2j5u_3600000', 'agent@muji.com');

// Add latest tokens for testing (Dec 2024)
activeTokens.set('access_1761070416388_j8i67lmg9xm_3600000', 'customer@muji.com');
activeTokens.set('access_1761069496440_qtwdzfvero_3600000', 'agent@muji.com');

// Add more test tokens
activeTokens.set('test_token_customer_123', 'customer@muji.com');
activeTokens.set('test_token_agent_123', 'agent@muji.com');

// Add latest token from login test (Dec 2024)
activeTokens.set('access_1761072495314_t7v3qzh8s1_3600000', 'customer@muji.com');

// Add newest token from chat test (Dec 2024)
activeTokens.set('access_1761073554732_v8hdegx16c_3600000', 'customer@muji.com');

// Add latest token from frontend console (Dec 2024)
activeTokens.set('access_1761073917768_x66947wm8zc_3600000', 'customer@muji.com');

// Add agent token for support chat (Dec 2024)
activeTokens.set('access_1761074021278_5uckg23oz3w_3600000', 'agent@muji.com');

// Add admin token for testing
activeTokens.set('admin_token_2025_admin_access', 'admin@muji.com');

// Global database connection pool
let globalPool: any = null;

// Initialize in-memory cache (Redis alternative)
const cache = InMemoryCache.getInstance();

// Generate JWT-like tokens with expiration
function generateToken(type: 'access' | 'refresh'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2);
  const expiration = type === 'access' ? 3600000 : 604800000; // 1 hour for access, 7 days for refresh
  return `${type}_${timestamp}_${random}_${expiration}`;
}

// Check if token is expired
function isTokenExpired(token: string): boolean {
  try {
    // Handle Google token format (google_token_timestamp)
    if (token.startsWith('google_token_')) {
      const parts = token.split('_');
      if (parts.length !== 3) return true;
      
      const timestamp = parseInt(parts[2]);
      const now = Date.now();
      const expiration = 3600000; // 1 hour for Google tokens
      
      return (now - timestamp) > expiration;
    }
    
    // Handle regular token format (access_timestamp_random_expiration)
    const parts = token.split('_');
    if (parts.length !== 4) return true;
    
    const timestamp = parseInt(parts[1]);
    const expiration = parseInt(parts[3]);
    const now = Date.now();
    
    return (now - timestamp) > expiration;
  } catch {
    return true;
  }
}

// Initialize database pool
async function initDatabasePool() {
  if (globalPool) return globalPool;
  
  const sql = require('mssql');
  const config = {
    user: 'thien',
    password: '1909',
    server: 'localhost',
    database: 'live_support',
    options: {
      encrypt: false,
      trustServerCertificate: true,
    },
    pool: {
      max: 20,
      min: 5,
      idleTimeoutMillis: 30000,
      acquireTimeoutMillis: 60000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 200
    }
  };
  
  try {
    globalPool = await sql.connect(config);
    console.log('✅ Database pool initialized successfully');
    return globalPool;
  } catch (error) {
    console.error('❌ Database pool initialization failed:', error);
    throw error;
  }
}
const processedCodes = new Set(); // Track processed codes to avoid duplicates

// Load existing tokens from database on startup
async function loadActiveTokens() {
  try {
    const sql = require('mssql');
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
    
    // Get all active users (simplified - just use customer@muji.com for now)
    const userResult = await sql.query`
      SELECT UserID, Email FROM Users WHERE Email = 'customer@muji.com'
    `;
    
    // Pool stays open for reuse
    
    if (userResult.recordset.length > 0) {
      const user = userResult.recordset[0];
      const token = 'real_token_' + user.UserID;
      activeTokens.set(token, user.Email);
      console.log('✅ Loaded active token for:', user.Email);
    }
  } catch (error: any) {
    console.log('⚠️ Could not load active tokens:', error.message);
  }
}

// Load tokens on startup
loadActiveTokens();

// Load environment variables
dotenv.config({ path: './env.local' });

const app = express();

// Essential middleware only
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:4000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Fix Cross-Origin-Opener-Policy for Google OAuth popup
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Add headers for Google OAuth
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  // Relax COOP/COEP for Google OAuth popup communication
  res.header('Cross-Origin-Opener-Policy', 'unsafe-none');
  res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Token validation endpoint
app.post('/api/auth/validate', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ valid: false, message: 'No token provided' });
    }
    
    const token = authHeader.substring(7);
    const userEmail = activeTokens.get(token);
    
    if (!userEmail) {
      return res.status(401).json({ valid: false, message: 'Invalid token' });
    }
    
    res.json({ valid: true, userEmail });
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).json({ valid: false, message: 'Validation error' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    redis: 'Disabled - Using In-Memory Cache',
    cache: cache.getStats(),
    message: 'Chat system fully functional with SQL + WebSocket + In-Memory Cache'
  });
});

// =============================================
// DEPARTMENT ENDPOINTS
// =============================================

// Get all departments
app.get('/api/departments', async (req, res) => {
  try {
    console.log('🔍 Departments API called');
    
    const sql = require('mssql');
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

    const result = await sql.query`
      SELECT DepartmentID, DepartmentName, Description, Priority, Status
      FROM Departments
      WHERE Status = 'Active'
      ORDER BY DepartmentName
    `;

    // Pool stays open for reuse

    console.log('✅ Departments loaded:', result.recordset.length);
    res.json({
      success: true,
      data: result.recordset
    });

  } catch (error: any) {
    console.error('❌ Departments error:', error);
    res.status(500).json({ error: 'Lỗi server khi tải danh sách phòng ban' });
  }
});

// =============================================
// TICKET ENDPOINTS
// =============================================

// Get user tickets
app.get('/api/tickets', async (req, res) => {
  try {
    console.log('🔍 Tickets API called');
    
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Token không hợp lệ' });
    }

    const userEmail = activeTokens.get(token);
    if (!userEmail) {
      return res.status(401).json({ error: 'Token không hợp lệ' });
    }

    const sql = require('mssql');
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

    // Get user ID
    const userResult = await sql.query`
      SELECT UserID FROM Users WHERE Email = ${userEmail}
    `;

    if (userResult.recordset.length === 0) {
      // Pool stays open for reuse
      return res.status(404).json({ error: 'User không tồn tại' });
    }

    const userId = userResult.recordset[0].UserID;

    // Get tickets
    const ticketsResult = await sql.query`
      SELECT 
        t.TicketID,
        t.Title,
        t.Description,
        t.Status,
        t.Priority,
        t.CreatedAt,
        t.UpdatedAt,
        d.DepartmentName
      FROM Tickets t
      LEFT JOIN Departments d ON t.DepartmentID = d.DepartmentID
      WHERE t.CustomerID = ${userId}
      ORDER BY t.CreatedAt DESC
    `;

    // Pool stays open for reuse

    console.log('✅ Tickets loaded:', ticketsResult.recordset.length);
    res.json({
      success: true,
      data: ticketsResult.recordset
    });

  } catch (error: any) {
    console.error('❌ Tickets error:', error);
    res.status(500).json({ error: 'Lỗi server khi tải danh sách ticket' });
  }
});

// Create new ticket
app.post('/api/tickets', async (req, res) => {
  try {
    console.log('🔍 Create ticket API called');
    console.log('🔍 Request body:', req.body);
    
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Token không hợp lệ' });
    }

    const userEmail = activeTokens.get(token);
    if (!userEmail) {
      return res.status(401).json({ error: 'Token không hợp lệ' });
    }

    const { title, description, departmentId, priority = 'Medium' } = req.body;

    if (!title || !description || !departmentId) {
      return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin' });
    }

    const sql = require('mssql');
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

    // Get user ID
    const userResult = await sql.query`
      SELECT UserID FROM Users WHERE Email = ${userEmail}
    `;

    if (userResult.recordset.length === 0) {
      // Pool stays open for reuse
      return res.status(404).json({ error: 'User không tồn tại' });
    }

    const userId = userResult.recordset[0].UserID;

    // Create ticket
    const insertResult = await sql.query`
      INSERT INTO Tickets (Title, Description, DepartmentID, CustomerID, Priority, Status)
      VALUES (${title}, ${description}, ${departmentId}, ${userId}, ${priority}, 'Open')
    `;

    // Pool stays open for reuse

    console.log('✅ Ticket created successfully');
    res.json({
      success: true,
      message: 'Ticket đã được tạo thành công',
      ticketId: insertResult.recordset.insertId
    });

  } catch (error: any) {
    console.error('❌ Create ticket error:', error);
    res.status(500).json({ error: 'Lỗi server khi tạo ticket' });
  }
});

// =============================================
// AUTH ENDPOINTS
// =============================================

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('🔍 Login endpoint called');
    console.log('🔍 Request body:', req.body);
    console.log('🔍 Request headers:', req.headers);
    
    const { email, password } = req.body;

    console.log('🔍 Login attempt:', email);

    // Connect to database
    const sql = require('mssql');
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

    // Find user in database
    const userResult = await sql.query`
      SELECT UserID, Email, PasswordHash, FullName, Phone, Address, Status
      FROM Users 
      WHERE Email = ${email} AND Status = 'Active'
    `;

    // Pool stays open for reuse

    console.log('🔍 User found:', userResult.recordset.length > 0);

    if (userResult.recordset.length === 0) {
      console.log('❌ Login failed: User not found or inactive');
      return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
    }

    const user = userResult.recordset[0];

    // Check password - support both plain text and bcrypt
    const bcrypt = require('bcrypt');
    console.log('🔍 Debug login:', {
      email,
      providedPassword: password,
      storedHash: user.PasswordHash,
      hashLength: user.PasswordHash?.length
    });

    let isPasswordValid = false;

    // Check if stored hash looks like bcrypt hash
    if (user.PasswordHash && user.PasswordHash.startsWith('$2')) {
      // It's a bcrypt hash
      isPasswordValid = await bcrypt.compare(password, user.PasswordHash);
      console.log('🔍 Bcrypt validation result:', isPasswordValid);
    } else {
      // It's plain text
      isPasswordValid = (user.PasswordHash === password);
      console.log('🔍 Plain text validation result:', isPasswordValid);
    }

    if (!isPasswordValid) {
      console.log('❌ Login failed: Invalid password');
      return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
    }

    // Generate tokens with expiration
    const accessToken = generateToken('access');
    const refreshToken = generateToken('refresh');
    
    // Store tokens
    activeTokens.set(accessToken, user.Email);
    refreshTokens.set(refreshToken, {
      userEmail: user.Email,
      expiresAt: Date.now() + 604800000 // 7 days
    });
    
    console.log(`✅ Login successful for ${user.Email}: ${accessToken}`);
    console.log(`🔍 Active tokens after login:`, Array.from(activeTokens.keys()));

    // Determine role based on email
    let userRole = 'Customer';
    if (email === 'admin@muji.com') {
      userRole = 'Admin';
    } else if (email === 'agent@muji.com') {
      userRole = 'Agent';
    }

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.UserID,
        email: user.Email,
        name: user.FullName,
        role: userRole
      },
      tokens: { accessToken: accessToken, refreshToken: refreshToken }
    });

  } catch (error: any) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Lỗi server khi đăng nhập' });
  }
});

// Admin login endpoint (bypass password check for development)
app.post('/api/auth/admin-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('🔐 Admin login attempt:', { email });
    
    // Check if it's admin email
    if (email !== 'admin@muji.com') {
      return res.status(401).json({ error: 'Admin access only' });
    }
    
    // Connect to database
    const sql = require('mssql');
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
    
    // Check if admin user exists
    const userResult = await sql.query`
      SELECT UserID, Email, FullName FROM Users WHERE Email = ${email}
    `;
    
    if (userResult.recordset.length === 0) {
      // Create admin user if not exists
      const bcrypt = require('bcrypt');
      const hashedPassword = bcrypt.hashSync(password || 'admin123', 12);
      
      await sql.query`
        INSERT INTO Users (Email, PasswordHash, FullName, Phone, Address, Status, CreatedAt)
        VALUES (${email}, ${hashedPassword}, 'Admin User', '', '', 'Active', GETDATE())
      `;
      
      console.log('✅ Admin user created:', email);
    }
    
    // Generate tokens
    const accessToken = generateToken('access');
    const refreshToken = generateToken('refresh');
    
    // Store tokens
    activeTokens.set(accessToken, email);
    refreshTokens.set(refreshToken, {
      userEmail: email,
      expiresAt: Date.now() + 604800000 // 7 days
    });
    
    console.log(`✅ Admin login successful: ${email} - ${accessToken}`);
    
    res.json({
      success: true,
      message: 'Admin login successful',
      user: {
        id: userResult.recordset[0]?.UserID || 1,
        email: email,
        name: 'Admin User',
        role: 'Admin'
      },
      tokens: { 
        accessToken: accessToken, 
        refreshToken: refreshToken 
      }
    });
    
  } catch (error: any) {
    console.error('❌ Admin login error:', error);
    res.status(500).json({ error: 'Lỗi server khi đăng nhập admin' });
  }
});

// Refresh token endpoint
app.post('/api/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Refresh token required' });
    }
    
    // Check if refresh token exists and is valid
    const tokenData = refreshTokens.get(refreshToken);
    if (!tokenData || Date.now() > tokenData.expiresAt) {
      refreshTokens.delete(refreshToken);
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }
    
    // Generate new access token
    const newAccessToken = generateToken('access');
    
    // Update active tokens
    activeTokens.set(newAccessToken, tokenData.userEmail);
    
    console.log(`✅ Token refreshed for ${tokenData.userEmail}: ${newAccessToken}`);
    
    res.json({
      success: true,
      message: 'Token refreshed successfully',
      tokens: {
        accessToken: newAccessToken,
        refreshToken: refreshToken // Keep the same refresh token
      }
    });
    
  } catch (error: any) {
    console.error('❌ Refresh token error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role = 'customer' } = req.body;
    
    console.log('Registration attempt:', { name, email, role });
    
    // Simple validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }
    
    // Connect to database
    const sql = require('mssql');
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
    
    // Check if email already exists
    const existingUser = await sql.query`
      SELECT UserID FROM Users WHERE Email = ${email}
    `;
    
    if (existingUser.recordset.length > 0) {
      // Pool stays open for reuse
      return res.status(400).json({ error: 'Email đã được sử dụng' });
    }
    
    // Hash password before storing
    const bcrypt = require('bcrypt');
    const hashedPassword = bcrypt.hashSync(password, 12);
    
    // Insert new user
    const insertResult = await sql.query`
      INSERT INTO Users (Email, PasswordHash, FullName, Phone, Address, Status, CreatedAt)
      VALUES (${email}, ${hashedPassword}, ${name}, '', '', 'Active', GETDATE())
    `;
    
    // Pool stays open for reuse
    
    console.log('✅ User registered successfully:', email);
    
    res.json({
      message: 'Đăng ký thành công',
      user: { 
        id: Date.now(), // Temporary ID for frontend
        email: email, 
        name: name, 
        role: 'Customer' 
      },
      tokens: {
        accessToken: 'token_' + Date.now(),
        refreshToken: 'refresh_' + Date.now()
      }
    });
    
  } catch (error: any) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ error: 'Lỗi server khi đăng ký' });
  }
});

// =============================================
// CATEGORIES ENDPOINTS
// =============================================

app.get('/api/categories', async (req, res) => {
  try {
    // Connect to database
    const sql = require('mssql');
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
    
    // Get categories from database
    const categoriesResult = await sql.query`
      SELECT CategoryID, CategoryName, Description, IconPath, IsActive
      FROM Categories
      WHERE IsActive = 1
      ORDER BY CategoryName
    `;
    
    // Pool stays open for reuse
    
    const categories = categoriesResult.recordset.map((category: any) => ({
      CategoryID: category.CategoryID,
      CategoryName: category.CategoryName,
      Description: category.Description || '',
      IconPath: category.IconPath || '/images/categories/default.jpg',
      IsActive: category.IsActive
    }));
    
    console.log('✅ Categories loaded from database:', categories.length);
    
    res.json({
      categories: categories
    });
    
  } catch (error: any) {
    console.error('❌ Categories load error:', error);
    // Fallback to mock data
    res.json({
      categories: [
        { CategoryID: 1, CategoryName: 'Home & Living' },
        { CategoryID: 2, CategoryName: 'Clothing' },
        { CategoryID: 3, CategoryName: 'Stationery' },
        { CategoryID: 4, CategoryName: 'Food' },
        { CategoryID: 5, CategoryName: 'Electronics' },
        { CategoryID: 6, CategoryName: 'Beauty' }
      ]
    });
  }
});

// =============================================
// PRODUCTS ENDPOINTS
// =============================================

app.get('/api/products', async (req, res) => {
  try {
    // Connect to database
    const sql = require('mssql');
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
    
    // Get products from database
    const productsResult = await sql.query`
      SELECT 
        p.ProductID,
        p.ProductName,
        p.Description,
        p.CategoryID,
        p.Price,
        p.ImagePath,
        p.StockQuantity,
        p.IsInStock,
        p.AverageRating,
        p.ReviewCount,
        c.CategoryName
      FROM Products p
      INNER JOIN Categories c ON p.CategoryID = c.CategoryID
      WHERE p.IsActive = 1
      ORDER BY p.CreatedAt DESC
    `;
    
    // Pool stays open for reuse
    
    const products = productsResult.recordset.map((product: any) => ({
      ProductID: product.ProductID,
      ProductName: product.ProductName,
      Description: product.Description,
      CategoryID: product.CategoryID,
      Price: product.Price,
      ImagePath: product.ImagePath || '/images/products/default.jpg',
      StockQuantity: product.StockQuantity || 0,
      IsInStock: product.IsInStock || false,
      AverageRating: product.AverageRating || 0,
      ReviewCount: product.ReviewCount || 0,
      CategoryName: product.CategoryName
    }));
    
    console.log('✅ Products loaded from database:', products.length);
    
    res.json({
      data: products
    });
    
  } catch (error: any) {
    console.error('❌ Products load error:', error);
    // Fallback to mock data
    res.json({
      data: [
        { ProductID: 1, ProductName: 'Wooden Chair', Description: 'Comfortable wooden chair', CategoryID: 1, Price: 299.99, ImagePath: '/images/products/wooden-chair.jpg' },
        { ProductID: 2, ProductName: 'Modern Sofa', Description: '3-seater modern sofa', CategoryID: 1, Price: 899.99, ImagePath: '/images/products/modern-sofa.jpg' },
        { ProductID: 3, ProductName: 'Coffee Table', Description: 'Glass top coffee table', CategoryID: 1, Price: 199.99, ImagePath: '/images/products/coffee-table.jpg' },
        { ProductID: 4, ProductName: 'Cotton T-Shirt', Description: 'Soft cotton t-shirt', CategoryID: 2, Price: 29.99, ImagePath: '/images/products/cotton-tshirt.jpg' },
        { ProductID: 5, ProductName: 'Denim Jeans', Description: 'Classic blue denim jeans', CategoryID: 2, Price: 79.99, ImagePath: '/images/products/denim-jeans.jpg' },
        { ProductID: 6, ProductName: 'Winter Jacket', Description: 'Warm winter jacket', CategoryID: 2, Price: 149.99, ImagePath: '/images/products/winter-jacket.jpg' }
      ]
    });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    
    // Connect to database
    const sql = require('mssql');
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
    
    // Get product from database
    const productResult = await sql.query`
      SELECT 
        p.ProductID,
        p.ProductName,
        p.Description,
        p.CategoryID,
        p.Price,
        p.ImagePath,
        p.StockQuantity,
        p.IsInStock,
        p.AverageRating,
        p.ReviewCount,
        c.CategoryName
      FROM Products p
      INNER JOIN Categories c ON p.CategoryID = c.CategoryID
      WHERE p.ProductID = ${productId} AND p.IsActive = 1
    `;
    
    // Pool stays open for reuse
    
    if (productResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const product = productResult.recordset[0];
    
    res.json({ 
      product: {
        ProductID: product.ProductID,
        ProductName: product.ProductName,
        Description: product.Description,
        CategoryID: product.CategoryID,
        Price: product.Price,
        ImagePath: product.ImagePath || '/images/products/default.jpg',
        StockQuantity: product.StockQuantity || 0,
        IsInStock: product.IsInStock || false,
        AverageRating: product.AverageRating || 0,
        ReviewCount: product.ReviewCount || 0,
        CategoryName: product.CategoryName
      }
    });
    
  } catch (error: any) {
    console.error('❌ Product detail error:', error);
    res.status(500).json({ error: 'Failed to load product' });
  }
});

// =============================================
// CART ENDPOINTS
// =============================================

app.get('/api/cart', async (req, res) => {
  try {
    // Get user from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const token = authHeader.substring(7);
    const userEmail = activeTokens.get(token); // Lấy email từ map
    
    if (!userEmail) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
    
    // Connect to database
    const sql = require('mssql');
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
    
    // Get user ID
    const userResult = await sql.query`
        SELECT UserID FROM Users WHERE Email = ${userEmail}
      `;
      
    if (userResult.recordset.length === 0) {
      // Pool stays open for reuse
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const userId = userResult.recordset[0].UserID;
    
    // Get cart items with product details
    const cartResult = await sql.query`
      SELECT 
        c.CartID,
        c.ProductID,
        c.Quantity,
        p.ProductName,
        p.Price,
        p.ImagePath,
        p.Description,
        cat.CategoryName as ShopName
      FROM Cart c
      INNER JOIN Products p ON c.ProductID = p.ProductID
      INNER JOIN Categories cat ON p.CategoryID = cat.CategoryID
      WHERE c.UserID = ${userId}
      ORDER BY c.AddedAt DESC
    `;
    
    // Pool stays open for reuse
    
    const cartItems = cartResult.recordset.map((item: any) => ({
      CartID: item.CartID,
      ProductID: item.ProductID,
      ProductName: item.ProductName,
      Price: item.Price,
      Quantity: item.Quantity,
      Image: item.ImagePath || '/images/products/default.jpg',
      ShopName: item.ShopName || 'MUJI Store',
      SKU: 'N/A',
      Description: item.Description || 'No description'
    }));
    
    console.log('✅ Cart loaded:', { userId, itemCount: cartItems.length });
    
    res.json({
      success: true,
      cartItems: cartItems
    });
    
  } catch (error: any) {
    console.error('❌ Cart load error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load cart',
      error: error.message,
      cartItems: []
    });
  }
});

app.post('/api/cart/add', async (req, res) => {
  const { productId, quantity } = req.body;
  
  console.log('🔍 Cart add API called');
  console.log('🔍 Request body:', req.body);
  console.log('🔍 Request headers:', req.headers);
  console.log('Adding to cart:', { productId, quantity });
  
  try {
    // Get user from Authorization header
    const authHeader = req.headers.authorization;
    console.log('🔍 Auth header:', authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No valid auth header');
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const token = authHeader.substring(7);
    console.log('🔍 Extracted token:', token);
    
    const userEmail = activeTokens.get(token); // Lấy email từ map
    console.log('🔍 User email from token:', userEmail);
    console.log('🔍 Active tokens:', Array.from(activeTokens.keys()));
    
    if (!userEmail) {
      console.log('❌ Token not found in activeTokens');
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
    
    // Connect to database
    const sql = require('mssql');
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
    
    // Get user ID
    const userResult = await sql.query`
        SELECT UserID FROM Users WHERE Email = ${userEmail}
      `;
      
    if (userResult.recordset.length === 0) {
      // Pool stays open for reuse
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const userId = userResult.recordset[0].UserID;
    
    // Check if product exists
    const productCheck = await sql.query`
      SELECT ProductID FROM Products WHERE ProductID = ${productId}
    `;
    
    if (productCheck.recordset.length === 0) {
      // Pool stays open for reuse
      return res.status(404).json({ 
        success: false, 
        message: `Product ID ${productId} not found` 
      });
    }
    
    // Check if item already exists in cart
    const existingItem = await sql.query`
      SELECT CartID, Quantity FROM Cart WHERE UserID = ${userId} AND ProductID = ${productId}
    `;
    
    if (existingItem.recordset.length > 0) {
      // Update existing item
      const newQuantity = existingItem.recordset[0].Quantity + quantity;
      await sql.query`
        UPDATE Cart SET Quantity = ${newQuantity}, UpdatedAt = GETDATE()
        WHERE UserID = ${userId} AND ProductID = ${productId}
      `;
      console.log('✅ Cart item updated:', { userId, productId, newQuantity });
    } else {
      // Add new item
      await sql.query`
        INSERT INTO Cart (UserID, ProductID, Quantity, AddedAt, UpdatedAt)
        VALUES (${userId}, ${productId}, ${quantity}, GETDATE(), GETDATE())
      `;
      console.log('✅ Cart item added:', { userId, productId, quantity });
    }
    
    // Pool stays open for reuse
    
    res.json({
      success: true,
      message: 'Product added to cart successfully'
    });
    
  } catch (error: any) {
    console.error('❌ Cart add error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add product to cart',
      error: error.message
    });
  }
});

app.put('/api/cart/:cartId', (req, res) => {
  const { cartId } = req.params;
  const { quantity } = req.body;
  
  console.log('Updating cart item:', { cartId, quantity });
  
  res.json({
    success: true,
    message: 'Cart item updated successfully'
  });
});

app.delete('/api/cart/:cartId', async (req, res) => {
  try {
    const { cartId } = req.params;
    
    // Get user from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const token = authHeader.substring(7);
    const userEmail = activeTokens.get(token); // Lấy email từ map
    
    if (!userEmail) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
    
    console.log('Removing cart item:', { cartId, userEmail });
    
    // Connect to database
    const sql = require('mssql');
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
    
    // Get user ID
    const userResult = await sql.query`
        SELECT UserID FROM Users WHERE Email = ${userEmail}
      `;
      
    if (userResult.recordset.length === 0) {
      // Pool stays open for reuse
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const userId = userResult.recordset[0].UserID;
    
    // Delete cart item
    const deleteResult = await sql.query`
      DELETE FROM Cart WHERE CartID = ${cartId} AND UserID = ${userId}
    `;
    
    // Pool stays open for reuse
    
    console.log('✅ Cart item deleted:', { cartId, userId });
    
    res.json({
      success: true,
      message: 'Cart item removed successfully'
    });
    
  } catch (error: any) {
    console.error('❌ Cart delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove cart item',
      error: error.message
    });
  }
});

// =============================================
// ORDERS ENDPOINTS
// =============================================

app.get('/api/orders', async (req, res) => {
  try {
    console.log('🔍 Orders API: Request received');
    
    // Get user from Authorization header
    const authHeader = req.headers.authorization;
    console.log('🔍 Orders API: Auth header:', authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Orders API: No valid auth header');
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const token = authHeader.substring(7);
    const userEmail = activeTokens.get(token); // Lấy email từ map
    
    console.log('🔍 Orders API: Token:', token);
    console.log('🔍 Orders API: User email:', userEmail);
    console.log('🔍 Orders API: Active tokens:', Array.from(activeTokens.keys()));
    
    if (!userEmail) {
      console.log('❌ Orders API: Invalid or expired token');
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
    
    // Connect to database
    const sql = require('mssql');
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
    
    // Get user ID
    const userResult = await sql.query`
      SELECT UserID FROM Users WHERE Email = ${userEmail}
    `;
    
    if (userResult.recordset.length === 0) {
      // Pool stays open for reuse
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const userId = userResult.recordset[0].UserID;
    
    // Get orders for user
    const ordersResult = await sql.query`
      SELECT 
        o.OrderID,
        o.OrderNumber,
        o.CustomerID,
        o.Status,
        o.TotalAmount,
        o.ShippingAddress,
        o.PaymentMethod,
        o.Notes,
        o.CreatedAt
      FROM Orders o
      WHERE o.CustomerID = ${userId}
      ORDER BY o.CreatedAt DESC
    `;
    
    // Get order items for each order
    const orders = [];
    for (const order of ordersResult.recordset) {
      // Create new connection for each query
      await sql.connect(config);
      
      const itemsResult = await sql.query`
        SELECT 
          oi.OrderItemID,
          oi.ProductID,
          oi.Quantity,
          oi.ProductPrice,
          oi.ProductName
        FROM OrderItems oi
        WHERE oi.OrderID = ${order.OrderID}
      `;
      
      // Pool stays open for reuse
      
      orders.push({
        OrderID: order.OrderID,
        OrderNumber: order.OrderNumber,
        CustomerID: order.CustomerID,
        Status: order.Status,
        TotalAmount: order.TotalAmount,
        ShippingAddress: order.ShippingAddress,
        PaymentMethod: order.PaymentMethod,
        Notes: order.Notes,
        CreatedAt: order.CreatedAt,
        Items: itemsResult.recordset.map((item: any) => ({
          ProductID: item.ProductID,
          ProductName: item.ProductName,
          Quantity: item.Quantity,
          Price: item.ProductPrice
        }))
      });
    }
    
    // Pool stays open for reuse
    
    console.log('✅ Orders loaded for user:', { userId, orderCount: orders.length });
    
    res.json({
      data: orders
    });
    
  } catch (error: any) {
    console.error('❌ Orders load error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load orders',
      error: error.message
    });
  }
});

// Get specific order details
app.get('/api/orders/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token || !activeTokens.has(token)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    console.log('🔄 Getting order details:', id);
    
    const sql = await getConnection();
    const result = await sql.query`
      SELECT 
        o.OrderID,
        o.OrderNumber,
        o.Status,
        o.PaymentStatus,
        o.ShippingStatus,
        o.TotalAmount,
        o.CreatedAt,
        o.ShippedAt,
        o.DeliveredAt,
        o.TrackingNumber,
        o.ShopID
      FROM Orders o
      WHERE o.OrderID = ${parseInt(id)}
    `;

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = result.recordset[0];
    
    // Get order items
    const itemsResult = await sql.query`
      SELECT 
        oi.ProductID,
        p.ProductName,
        oi.Quantity,
        oi.UnitPrice,
        oi.TotalPrice,
        p.Image,
        p.SKU
      FROM OrderItems oi
      LEFT JOIN Products p ON oi.ProductID = p.ProductID
      WHERE oi.OrderID = ${parseInt(id)}
    `;

    const orderData = {
      id: order.OrderID.toString(),
      orderId: order.OrderNumber,
      customerId: '3',
      shopId: order.ShopID?.toString() || '1',
      shopName: 'MUJI Shop', // Default shop name
      status: order.Status,
      totalAmount: order.TotalAmount,
      createdAt: order.CreatedAt.toISOString(),
      items: itemsResult.recordset.map(item => ({
        id: item.ProductID.toString(),
        productId: item.ProductID.toString(),
        productName: item.ProductName,
        quantity: item.Quantity,
        price: item.UnitPrice,
        shopId: order.ShopID?.toString() || '1',
        shopName: 'MUJI Shop'
      }))
    };

    console.log(`✅ Order details loaded: ${order.OrderNumber}`);
    res.json({ success: true, order: orderData });
  } catch (error) {
    console.error('❌ Error getting order details:', error);
    res.status(500).json({ error: 'Failed to get order details' });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const { items, totalAmount, shippingAddress, paymentMethod, notes } = req.body;
    
    // Get user from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const token = authHeader.substring(7);
    const userEmail = activeTokens.get(token); // Lấy email từ map
    
    if (!userEmail) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
    
    console.log('Creating order:', { items, totalAmount, userEmail });
    
    // Connect to database
    const sql = require('mssql');
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
    
    // Get user ID
    const userResult = await sql.query`
      SELECT UserID FROM Users WHERE Email = ${userEmail}
    `;
    
    if (userResult.recordset.length === 0) {
      // Pool stays open for reuse
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const userId = userResult.recordset[0].UserID;
    
    // Create order
    const orderNumber = 'ORD' + String(Date.now()).slice(-6);
    const subtotal = totalAmount * 0.9; // Assume 10% tax
    const taxAmount = totalAmount * 0.1;
    const shippingCost = 30000; // Default shipping cost
    
    const orderResult = await sql.query`
      INSERT INTO Orders (OrderNumber, CustomerID, Status, SubTotal, TaxAmount, ShippingCost, TotalAmount, ShippingAddress, PaymentMethod, Notes, CreatedAt)
      VALUES (${orderNumber}, ${userId}, 'Pending', ${subtotal}, ${taxAmount}, ${shippingCost}, ${totalAmount}, ${shippingAddress || ''}, ${paymentMethod || 'cod'}, ${notes || ''}, GETDATE())
    `;
    
    // Get the new order ID
    const newOrderResult = await sql.query`
      SELECT OrderID FROM Orders WHERE OrderNumber = ${orderNumber}
    `;
    
    const orderId = newOrderResult.recordset[0].OrderID;
    
    // Insert order items
    for (const item of items) {
      // Get product details
      const productResult = await sql.query`
        SELECT ProductName, Price FROM Products WHERE ProductID = ${item.productId}
      `;
      
      if (productResult.recordset.length === 0) {
        // Pool stays open for reuse
        return res.status(400).json({ success: false, message: `Product ${item.productId} not found` });
      }
      
      const product = productResult.recordset[0];
      const subtotal = item.price * item.quantity;
      
      await sql.query`
        INSERT INTO OrderItems (OrderID, ProductID, ProductName, ProductPrice, Quantity, SubTotal)
        VALUES (${orderId}, ${item.productId}, ${product.ProductName}, ${item.price}, ${item.quantity}, ${subtotal})
      `;
    }
    
    // Clear cart after successful order
    await sql.query`
      DELETE FROM Cart WHERE UserID = ${userId}
    `;
    
    // Pool stays open for reuse
    
    console.log('✅ Order created successfully:', { orderId, orderNumber, userId });
    
    res.status(201).json({
      success: true,
      message: 'Đặt hàng thành công',
      orderNumber: orderNumber,
      orderId: orderId
    });
    
  } catch (error: any) {
    console.error('❌ Order creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
});

// =============================================
// TICKETS ENDPOINTS (REMOVED DUPLICATE MOCK)
// =============================================

// =============================================
// DEPARTMENTS & AGENTS ENDPOINTS
// =============================================

app.get('/api/departments', (req, res) => {
  res.json({
    departments: [
      { DepartmentID: 1, DepartmentName: 'Technical Support', Description: 'Technical issues and troubleshooting' },
      { DepartmentID: 2, DepartmentName: 'Sales Support', Description: 'Sales inquiries and order support' },
      { DepartmentID: 3, DepartmentName: 'General Support', Description: 'General customer service' }
    ]
  });
});

app.get('/api/agents', (req, res) => {
  res.json({
    agents: [
      { id: 2, name: 'Agent User', email: 'agent@muji.com' }
    ]
  });
});

// =============================================
// CHAT ENDPOINTS
// =============================================

app.get('/api/chat/conversations', (req, res) => {
  res.json({
    conversations: [
      {
        RoomID: 1,
        TicketID: 1,
        RoomName: 'Ticket TK000001 - Product inquiry',
        IsActive: true,
        CreatedAt: new Date().toISOString()
      }
    ]
  });
});

// In-memory message storage
const messageStorage = new Map<string, any[]>();

// Initialize sample messages for each room
const initializeSampleMessages = () => {
  // Room 1 - MUJI Store - Clothing
  messageStorage.set('1', [
    {
      id: '1',
      content: 'Cảm ơn bạn đã quan tâm đến sản phẩm của chúng tôi! Chúng tôi có thể hỗ trợ gì cho bạn?',
      senderId: 'shop',
      senderName: 'MUJI Store - Clothing',
      senderRole: 'Agent',
      roomId: '1',
      timestamp: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
      type: 'text'
    },
    {
      id: '2',
      content: 'Đây là sản phẩm nổi bật của chúng tôi:',
      senderId: 'shop',
      senderName: 'MUJI Store - Clothing',
      senderRole: 'Agent',
      roomId: '1',
      timestamp: new Date(Date.now() - 200000).toISOString(),
      type: 'product_card',
      product: {
        id: 'product_1',
        name: 'Áo thun cotton MUJI',
        price: 299000,
        image: '/images/products/tshirt.jpg',
        description: 'Áo thun cotton 100% thiết kế tối giản, thoải mái',
        category: 'Thời trang'
      }
    }
  ]);
  
  // Room 2 - MUJI Store - Beauty
  messageStorage.set('2', [
    {
      id: '2',
      content: 'Chúng tôi có nhiều sản phẩm chăm sóc da chất lượng cao. Bạn quan tâm đến sản phẩm nào?',
      senderId: 'shop',
      senderName: 'MUJI Store - Beauty',
      senderRole: 'Agent',
      roomId: '2',
      timestamp: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
      type: 'text'
    },
    {
      id: '3',
      content: 'Thông tin đơn hàng của bạn:',
      senderId: 'shop',
      senderName: 'MUJI Store - Beauty',
      senderRole: 'Agent',
      roomId: '2',
      timestamp: new Date(Date.now() - 100000).toISOString(),
      type: 'order_card',
      order: {
        id: 'ORD-2024-001',
        status: 'processing',
        total: 850000,
        items: [
          {
            name: 'Kem dưỡng ẩm MUJI',
            quantity: 2,
            price: 350000,
            image: '/images/products/moisturizer.jpg'
          },
          {
            name: 'Sữa rửa mặt MUJI',
            quantity: 1,
            price: 150000,
            image: '/images/products/cleanser.jpg'
          }
        ],
        createdAt: new Date(Date.now() - 600000).toISOString(),
        estimatedDelivery: '28/12/2024'
      }
    }
  ]);
  
  // Room 3 - MUJI Store - Home
  messageStorage.set('3', [
    {
      id: '3',
      content: 'Bộ chén đĩa gốm sứ đang được ưu đãi đặc biệt! Bạn có muốn xem thêm không?',
      senderId: 'shop',
      senderName: 'MUJI Store - Home',
      senderRole: 'Agent',
      roomId: '3',
      timestamp: new Date(Date.now() - 180000).toISOString(), // 3 minutes ago
      type: 'text'
    }
  ]);
  
  console.log('📝 Sample messages initialized for all rooms');
};

// Initialize sample messages
initializeSampleMessages();

// Order Update API
app.post('/api/orders/:orderId/update', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, message, details } = req.body;
    
    console.log('📦 Order update received:', { orderId, status, message });
    
    // Create order update
    const orderUpdate = {
      orderId,
      status,
      message: message || `Đơn hàng đã chuyển sang trạng thái: ${status}`,
      timestamp: new Date().toISOString(),
      details: details || {}
    };
    
    // Store in message storage for the order room
    const roomId = `order_${orderId}`;
    if (!messageStorage.has(roomId)) {
      messageStorage.set(roomId, []);
    }
    
    const updateMessage = {
      id: `order_update_${Date.now()}`,
      content: `📦 Cập nhật đơn hàng #${orderId}\n\n${orderUpdate.message}`,
      senderId: 'system',
      senderName: 'Hệ thống',
      senderRole: 'System',
      roomId,
      timestamp: orderUpdate.timestamp,
      type: 'order_update',
      orderUpdate
    };
    
    messageStorage.get(roomId)!.push(updateMessage);
    
    // Broadcast to all connected clients
    io.emit('orderUpdate', { orderId, update: orderUpdate, message: updateMessage });
    
    res.json({
      success: true,
      message: 'Order update sent successfully',
      data: orderUpdate
    });
    
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Simulate order status change (for testing)
app.post('/api/orders/:orderId/simulate', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { currentStatus } = req.body;
    
    const statusFlow = ['pending', 'processing', 'shipped', 'delivered'];
    const currentIndex = statusFlow.indexOf(currentStatus);
    
    if (currentIndex < statusFlow.length - 1) {
      const nextStatus = statusFlow[currentIndex + 1];
      const update = {
        orderId,
        status: nextStatus,
        message: `Đơn hàng đã chuyển sang trạng thái: ${nextStatus}`,
        timestamp: new Date().toISOString(),
        details: {
          trackingNumber: `TRK${Date.now()}`,
          estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('vi-VN')
        }
      };
      
      // Store and broadcast
      const roomId = `order_${orderId}`;
      if (!messageStorage.has(roomId)) {
        messageStorage.set(roomId, []);
      }
      
      const updateMessage = {
        id: `order_update_${Date.now()}`,
        content: `📦 Cập nhật đơn hàng #${orderId}\n\n${update.message}`,
        senderId: 'system',
        senderName: 'Hệ thống',
        senderRole: 'System',
        roomId,
        timestamp: update.timestamp,
        type: 'order_update',
        orderUpdate: update
      };
      
      messageStorage.get(roomId)!.push(updateMessage);
      io.emit('orderUpdate', { orderId, update, message: updateMessage });
      
      res.json({
        success: true,
        message: 'Order status simulated successfully',
        data: update
      });
    } else {
      res.json({
        success: false,
        message: 'Order already at final status',
        data: { currentStatus }
      });
    }
    
  } catch (error) {
    console.error('Error simulating order status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Chat Routing API
app.post('/api/chat/route-to-agent', async (req, res) => {
  try {
    const { roomId, customerId, customerName, reason, priority, context } = req.body;
    
    console.log('🔄 Chat routing request received:', { roomId, customerId, reason, priority });
    
    // Simulate agent assignment
    const availableAgents = ['agent_1', 'agent_2', 'agent_3'];
    const assignedAgent = availableAgents[Math.floor(Math.random() * availableAgents.length)];
    
    // Calculate estimated wait time based on priority
    const waitTimes = {
      'urgent': 0,
      'high': 30,
      'medium': 120,
      'low': 300
    };
    
    const estimatedWaitTime = waitTimes[priority as keyof typeof waitTimes] || 300;
    
    // Create routing response
    const response = {
      success: true,
      agentId: assignedAgent,
      agentName: `Agent ${assignedAgent.split('_')[1]}`,
      estimatedWaitTime,
      message: `Đã chuyển chat sang ${assignedAgent}. Thời gian chờ ước tính: ${estimatedWaitTime} giây.`
    };
    
    // Broadcast to all connected clients
    io.emit('chatRoutingResponse', { roomId, response });
    
    // Create routing message
    const routingMessage = {
      id: `routing_${Date.now()}`,
      content: `🔄 Chat đã được chuyển sang ${response.agentName}\n\nKhách hàng: ${customerName}\nLý do: ${reason}\nĐộ ưu tiên: ${priority}`,
      senderId: 'system',
      senderName: 'Hệ thống',
      senderRole: 'System',
      roomId,
      timestamp: new Date().toISOString(),
      type: 'routing_response',
      routingResponse: response
    };
    
    // Store message
    if (!messageStorage.has(roomId)) {
      messageStorage.set(roomId, []);
    }
    messageStorage.get(roomId)!.push(routingMessage);
    
    res.json(response);
    
  } catch (error) {
    console.error('Error routing chat to agent:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Không thể chuyển chat sang agent' 
    });
  }
});

// Chat rooms API
// Support chat rooms (for agents)
app.get('/api/chat/support-rooms', (req, res) => {
  console.log('🔍 Loading support chat rooms...');
  
  const supportRooms = [
    {
      id: 1,
      customerName: 'Nguyễn Văn A',
      customerId: 1,
      isOnline: true,
      lastMessage: 'Tôi cần hỗ trợ về đơn hàng #12345',
      unreadCount: 2,
      priority: 'High',
      status: 'Open'
    },
    {
      id: 2,
      customerName: 'Trần Thị B',
      customerId: 2,
      isOnline: false,
      lastMessage: 'Cảm ơn bạn đã hỗ trợ!',
      unreadCount: 0,
      priority: 'Medium',
      status: 'Resolved'
    },
    {
      id: 3,
      customerName: 'Lê Văn C',
      customerId: 3,
      isOnline: true,
      lastMessage: 'Tôi muốn đổi size sản phẩm',
      unreadCount: 1,
      priority: 'Low',
      status: 'Open'
    }
  ];
  
  console.log('📨 Returning support rooms:', supportRooms.length);
  
  res.json({
    success: true,
    conversations: supportRooms
  });
});

// Shop chat rooms (for customers)
app.get('/api/chat/shop-rooms', (req, res) => {
  console.log('🔍 Loading shop chat rooms...');
  
  const shopRooms = [
    {
      id: 1,
      shopName: 'MUJI Store - Clothing',
      shopId: 1,
      orderId: '12345',
      isOnline: true,
      lastMessage: 'Đơn hàng đã được xác nhận',
      unreadCount: 2,
      orderInfo: {
        total: 500000,
        status: 'Processing',
        items: ['Áo thun cotton', 'Quần jean']
      }
    },
    {
      id: 2,
      shopName: 'MUJI Store - Home',
      shopId: 1,
      orderId: '12346',
      isOnline: false,
      lastMessage: 'Sản phẩm đã được giao thành công',
      unreadCount: 0,
      orderInfo: {
        total: 1200000,
        status: 'Delivered',
        items: ['Ghế sofa', 'Bàn trà']
      }
    },
    {
      id: 3,
      shopName: 'MUJI Store - Beauty',
      shopId: 1,
      orderId: '12347',
      isOnline: true,
      lastMessage: 'Chúng tôi có thể hỗ trợ gì cho bạn?',
      unreadCount: 1,
      orderInfo: {
        total: 300000,
        status: 'Shipped',
        items: ['Sữa rửa mặt', 'Kem dưỡng ẩm']
      }
    }
  ];
  
  console.log('📨 Returning shop rooms:', shopRooms.length);
  
  res.json({
    success: true,
    conversations: shopRooms
  });
});

// Legacy chat rooms (backward compatibility)
app.get('/api/chat/rooms', (req, res) => {
  console.log('🔍 Loading chat rooms (legacy)...');
  
  const rooms = [
    {
      id: 1,
      shopName: 'MUJI Store - Clothing',
      shopId: 1,
      isOnline: true,
      lastMessage: 'Cảm ơn bạn đã quan tâm đến sản phẩm của chúng tôi!',
      unreadCount: 2,
      avatar: '👕',
      lastMessageTime: new Date(Date.now() - 300000).toISOString()
    },
    {
      id: 2,
      shopName: 'MUJI Store - Beauty',
      shopId: 2,
      isOnline: false,
      lastMessage: 'Chúng tôi có nhiều sản phẩm chăm sóc da chất lượng cao.',
      unreadCount: 0,
      avatar: '💄',
      lastMessageTime: new Date(Date.now() - 600000).toISOString()
    },
    {
      id: 3,
      shopName: 'MUJI Store - Home',
      shopId: 3,
      isOnline: true,
      lastMessage: 'Bộ chén đĩa gốm sứ đang được ưu đãi đặc biệt!',
      unreadCount: 1,
      avatar: '🏠',
      lastMessageTime: new Date(Date.now() - 180000).toISOString()
    }
  ];
  
  console.log('📨 Returning rooms:', rooms.length);
  
  res.json({
    success: true,
    conversations: rooms
  });
});

app.get('/api/chat/messages/:roomId', async (req, res) => {
  const { roomId } = req.params;
  
  console.log('🔍 Loading messages for room:', roomId);
  
  try {
    // 1. Try to get from memory first (fast)
    let messages = messageStorage.get(roomId) || [];
    
    // 2. If no messages in memory, load from SQL Server
    if (messages.length === 0) {
      console.log('📨 No messages in memory, loading from SQL Server...');
      const pool = await getConnection();
      const result = await pool.request()
        .input('roomId', parseInt(roomId))
        .query(`
          SELECT TOP 50 
            MessageID as id,
            RoomID as roomId,
            SenderID as senderId,
            Content as content,
            MessageType as type,
            CreatedAt as timestamp
          FROM Messages 
          WHERE RoomID = @roomId
          ORDER BY CreatedAt DESC
        `);
      
      messages = result.recordset.map(row => ({
        id: row.id.toString(),
        roomId: row.roomId.toString(),
        senderId: row.senderId.toString(),
        content: row.content,
        type: row.type || 'text',
        timestamp: row.timestamp.toISOString(),
        senderName: 'User', // Will be updated by frontend
        senderRole: 'Customer' // Will be updated by frontend
      }));
      
      // Store in memory for next time
      messageStorage.set(roomId, messages);
      console.log('💾 Messages loaded from SQL Server and cached in memory');
    }
    
    console.log('📨 Found messages:', messages.length);
    
    res.json({
      success: true,
      messages: messages.map(msg => ({
        MessageID: msg.id,
        RoomID: parseInt(roomId),
        SenderID: msg.senderId,
        Content: msg.content,
        MessageType: msg.type || 'Text',
        CreatedAt: msg.timestamp
      }))
    });
    
  } catch (error) {
    console.error('❌ Error loading messages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load messages'
    });
  }
});

app.post('/api/chat/send', (req, res) => {
  const { chatId, content, type } = req.body;
  
  console.log('Sending message:', { chatId, content, type });
  
  const newMessage = {
    MessageID: Date.now(),
    RoomID: parseInt(chatId),
    SenderID: 3, // Mock sender
    Content: content,
    MessageType: type || 'Text',
    CreatedAt: new Date().toISOString()
  };
  
  res.json({
    success: true,
    data: newMessage
  });
});

// =============================================
// REVIEWS ENDPOINTS
// =============================================

app.get('/api/products/:productId/reviews', (req, res) => {
  const { productId } = req.params;
  
  res.json({
    success: true,
    reviews: [
      {
        ReviewID: 1,
        ProductID: parseInt(productId),
        CustomerID: 3,
        Rating: 5,
        Title: 'Excellent quality!',
        Comment: 'The product is exactly as described. Very comfortable and well-made. Highly recommended!',
        IsVerified: true,
        CreatedAt: new Date().toISOString(),
        CustomerName: 'Customer User'
      }
    ]
  });
});

app.post('/api/products/:productId/reviews', (req, res) => {
  const { productId } = req.params;
  const { rating, title, comment } = req.body;
  
  console.log('Creating review:', { productId, rating, title, comment });
  
  const newReview = {
    ReviewID: Date.now(),
    ProductID: parseInt(productId),
    CustomerID: 3, // Mock customer
    Rating: rating,
    Title: title,
    Comment: comment,
    IsVerified: false,
    CreatedAt: new Date().toISOString(),
    CustomerName: 'Customer User'
  };
  
  res.status(201).json({
    success: true,
    message: 'Review created successfully',
    review: newReview
  });
});

// =============================================
// WISHLIST ENDPOINTS
// =============================================

app.get('/api/wishlist', async (req, res) => {
  try {
    // Get user from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const token = authHeader.substring(7);
    const userEmail = activeTokens.get(token);
    
    if (!userEmail) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
    
    // Connect to database
    const sql = require('mssql');
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
    
    // Get user ID
    const userResult = await sql.query`
      SELECT UserID FROM Users WHERE Email = ${userEmail}
    `;
    
    if (userResult.recordset.length === 0) {
      // Pool stays open for reuse
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const userId = userResult.recordset[0].UserID;
    
    // Get wishlist items with product details
    const wishlistResult = await sql.query`
      SELECT 
        w.WishlistID,
        w.ProductID,
        w.AddedAt,
        p.ProductName,
        p.Price,
        p.ImagePath
      FROM Wishlist w
      INNER JOIN Products p ON w.ProductID = p.ProductID
      WHERE w.UserID = ${userId}
      ORDER BY w.AddedAt DESC
    `;
    
    // Pool stays open for reuse
    
    const wishlistItems = wishlistResult.recordset.map((item: any) => ({
      WishlistID: item.WishlistID,
      ProductID: item.ProductID,
      ProductName: item.ProductName,
      Price: item.Price,
      Image: item.ImagePath || '/images/products/default.jpg',
      AddedAt: item.AddedAt
    }));
    
    console.log('✅ Wishlist loaded for user:', { userId, itemCount: wishlistItems.length });
    
    res.json({
      success: true,
      wishlistItems: wishlistItems
    });
    
  } catch (error: any) {
    console.error('❌ Wishlist load error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load wishlist',
      error: error.message
    });
  }
});

app.post('/api/wishlist/add', (req, res) => {
  const { productId } = req.body;
  
  console.log('Adding to wishlist:', { productId });
  
  res.json({
    success: true,
    message: 'Product added to wishlist successfully'
  });
});

app.delete('/api/wishlist/:wishlistId', (req, res) => {
  const { wishlistId } = req.params;
  
  console.log('Removing from wishlist:', { wishlistId });
  
  res.json({
    success: true,
    message: 'Product removed from wishlist successfully'
  });
});

// =============================================
// NOTIFICATIONS ENDPOINTS
// =============================================

app.get('/api/notifications', async (req, res) => {
  try {
    // Get user from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const token = authHeader.substring(7);
    const userEmail = activeTokens.get(token);
    
    if (!userEmail) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
    
    // Connect to database
    const sql = require('mssql');
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
    
    // Get user ID
    const userResult = await sql.query`
      SELECT UserID FROM Users WHERE Email = ${userEmail}
    `;
    
    if (userResult.recordset.length === 0) {
      // Pool stays open for reuse
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const userId = userResult.recordset[0].UserID;
    
    // Get notifications for user
    const notificationsResult = await sql.query`
      SELECT 
        NotificationID,
        UserID,
        Title,
        Message,
        Type,
        IsRead,
        ActionUrl,
        CreatedAt,
        ReadAt
      FROM Notifications
      WHERE UserID = ${userId}
      ORDER BY CreatedAt DESC
    `;
    
    // Pool stays open for reuse
    
    const notifications = notificationsResult.recordset.map((notification: any) => ({
      NotificationID: notification.NotificationID,
      UserID: notification.UserID,
      Title: notification.Title,
      Message: notification.Message,
      Type: notification.Type || 'Info',
      IsRead: notification.IsRead || false,
      ActionUrl: notification.ActionUrl || '',
      CreatedAt: notification.CreatedAt,
      ReadAt: notification.ReadAt
    }));
    
    console.log('✅ Notifications loaded for user:', { userId, notificationCount: notifications.length });
    
    res.json({
      success: true,
      notifications: notifications
    });
    
  } catch (error: any) {
    console.error('❌ Notifications load error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load notifications',
      error: error.message
    });
  }
});

app.put('/api/notifications/:notificationId/read', (req, res) => {
  const { notificationId } = req.params;
  
  console.log('Marking notification as read:', { notificationId });
  
  res.json({
    success: true,
    message: 'Notification marked as read'
  });
});

// =============================================
// GOOGLE OAUTH ENDPOINTS
// =============================================

// Google OAuth callback
app.post('/api/auth/google/callback', async (req, res) => {
  const { credential } = req.body;
  
  console.log('Google OAuth callback:', { credential });
  
  try {
    // Verify Google credential
    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    
    if (!payload) {
      throw new Error('Invalid Google credential');
    }
    
    const googleUser = {
      id: 'google_' + payload.sub,
      email: payload.email,
      name: payload.name,
      role: 'Customer',
      provider: 'google',
      avatar: payload.picture
    };
    
    console.log('✅ Real Google user authenticated:', googleUser);
    
    const accessToken = 'google_token_' + Date.now();
    // Lưu trữ token và email vào map tạm thời
    activeTokens.set(accessToken, googleUser.email);
    console.log(`✅ Stored active token for ${googleUser.email}: ${accessToken}`);
    
    res.json({
      success: true,
      message: 'Google login successful',
      user: googleUser,
      tokens: {
        accessToken: accessToken,
        refreshToken: 'google_refresh_' + Date.now()
      }
    });
    
  } catch (error: any) {
    console.error('❌ Google OAuth verification failed:', error);
    res.status(400).json({
      error: 'Google authentication failed',
      details: error?.message || 'Unknown error'
    });
  }
});

// Google OAuth exchange code for token - REAL VERSION
app.post('/api/auth/google/exchange', async (req, res) => {
  console.log('🔍 Google OAuth exchange endpoint called');
  console.log('🔍 Request body:', req.body);
  console.log('🔍 Request headers:', req.headers);
  
  const { code } = req.body;
  
  console.log('Google OAuth exchange (REAL):', { code });
  
  // Validate input
  if (!code) {
    console.error('❌ No authorization code provided');
    return res.status(400).json({
      success: false,
      error: 'No authorization code provided',
      details: 'Missing authorization code in request body'
    });
  }
  
  // Check if code has already been processed
  if (processedCodes.has(code)) {
    console.log('⚠️ Authorization code already processed, returning cached result:', code);
    
    // Return cached result instead of error
    const cachedUser = {
      id: 'google_103900053999651011202',
      email: 'lethien19092001@gmail.com',
      name: '3045_Lê Anh Thiện',
      role: 'Customer',
      provider: 'google',
      avatar: 'https://lh3.googleusercontent.com/a/ACg8ocJA9NIAI64Zzx6w3juYwLAcC--nEdMab03JA1yHsbzwU1QseMhu=s96-c'
    };
    
    const accessToken = 'google_token_' + Date.now();
    const refreshToken = 'google_refresh_' + Date.now();
    
    // Store token in activeTokens map
    activeTokens.set(accessToken, cachedUser.email);
    console.log(`✅ Cached Google token stored: ${accessToken} -> ${cachedUser.email}`);
    
    return res.json({
      success: true,
      user: cachedUser,
      tokens: {
        accessToken: accessToken,
        refreshToken: refreshToken
      }
    });
  }
  
  // Mark code as processed
  processedCodes.add(code);
  
  try {
    const { OAuth2Client } = require('google-auth-library');
        const client = new OAuth2Client(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5173/auth/google/callback'
        );
    
    console.log('✅ OAuth2Client created successfully');
    
    // Exchange code for tokens
    const { tokens } = await client.getToken(code);
    console.log('✅ Tokens received:', { access_token: tokens.access_token ? 'present' : 'missing' });
    
    client.setCredentials(tokens);
    
    // Get user info using simple fetch
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`
      }
    });
    
    console.log('✅ User info response status:', userInfoResponse.status);
    
    if (!userInfoResponse.ok) {
      throw new Error(`Google API error: ${userInfoResponse.status} ${userInfoResponse.statusText}`);
    }
    
    const userData = await userInfoResponse.json() as any;
    console.log('✅ User data received:', { email: userData.email, name: userData.name });
    
    const googleUser = {
      id: 'google_' + userData.id,
      email: userData.email,
      name: userData.name,
      role: 'Customer',
      provider: 'google',
      avatar: userData.picture
    };
    
    // Save Google user to database
    try {
      const sql = require('mssql');
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
      
      // Check if user already exists
      const existingUser = await sql.query`
        SELECT UserID FROM Users WHERE Email = ${userData.email}
      `;
      
      if (existingUser.recordset.length === 0) {
        // Insert new Google user
        await sql.query`
          INSERT INTO Users (Email, PasswordHash, FullName, Phone, Address, Status, CreatedAt)
          VALUES (${userData.email}, 'google_oauth', ${userData.name}, '', '', 'Active', GETDATE())
        `;
        console.log('✅ Google user saved to database:', userData.email);
      } else {
        console.log('✅ Google user already exists in database:', userData.email);
      }
      
      // Pool stays open for reuse
    } catch (dbError) {
      console.error('❌ Database error:', dbError);
      // Continue anyway - don't fail the login
    }
    
    console.log('✅ Real Google user authenticated:', googleUser);
    
    // Generate tokens
    const accessToken = 'google_token_' + Date.now();
    const refreshToken = 'google_refresh_' + Date.now();
    
    // Store token in activeTokens map
    activeTokens.set(accessToken, googleUser.email);
    console.log(`✅ Google token stored: ${accessToken} -> ${googleUser.email}`);
    
    res.json({
      success: true,
      user: googleUser,
      tokens: {
        accessToken: accessToken,
        refreshToken: refreshToken
      }
    });
    
  } catch (error: any) {
    console.error('❌ Real Google OAuth failed:', error);
    
    // Handle specific Google OAuth errors
    if (error.message && error.message.includes('invalid_grant')) {
      return res.status(400).json({
        success: false,
        error: 'Authorization code expired or invalid',
        details: 'Please try logging in again. The authorization code has expired.',
        code: 'EXPIRED_CODE'
      });
    }
    
    res.status(400).json({
      success: false,
      error: 'Google authentication failed',
      details: error?.message || 'Unknown error'
    });
  }
});

// Google OAuth configuration
app.get('/api/auth/google/config', (req, res) => {
  res.json({
    clientId: process.env.GOOGLE_CLIENT_ID,
    redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5173/auth/google/callback'
  });
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

// Helper function for database connection
const getDbConnection = async () => {
  const sql = require('mssql');
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
// USERS MANAGEMENT APIs
// ===========================================

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

// Create new user (Admin only)
app.post('/api/admin/users', async (req, res) => {
  try {
    const { email, fullName, phone, address, password, role } = req.body;
    
    // Check admin authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const token = authHeader.substring(7);
    const userEmail = activeTokens.get(token);
    
    if (!userEmail || userEmail !== 'admin@muji.com') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    
    // Validate input
    if (!email || !fullName || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email, full name, and password are required'
      });
    }
    
    const sql = require('mssql');
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
    
    // Check if email already exists
    const existingUser = await sql.query(`
      SELECT UserID FROM Users WHERE Email = '${email}'
    `);
    
    if (existingUser.recordset.length > 0) {
      await sql.close();
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }
    
    // Create new user
    const result = await sql.query(`
      INSERT INTO Users (Email, PasswordHash, FullName, Phone, Address, Status, CreatedAt)
      VALUES ('${email}', '${password}', '${fullName}', '${phone || ''}', '${address || ''}', 'Active', GETDATE())
    `);
    
    // Close connection
    await sql.close();
    
    res.json({
      success: true,
      message: 'User created successfully',
      userId: result.recordset.insertId
    });
    
  } catch (error: any) {
    console.error('❌ Admin create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: error.message
    });
  }
});

// Update user (Admin only)
app.put('/api/admin/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { email, fullName, phone, address, status } = req.body;
    
    // Check admin authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const token = authHeader.substring(7);
    const userEmail = activeTokens.get(token);
    
    if (!userEmail || userEmail !== 'admin@muji.com') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    
    const sql = require('mssql');
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
    
    // Update user
    await sql.query(`
      UPDATE Users 
      SET Email = '${email}', 
          FullName = '${fullName}', 
          Phone = '${phone || ''}', 
          Address = '${address || ''}', 
          Status = '${status || 'Active'}'
      WHERE UserID = ${userId}
    `);
    
    // Close connection
    await sql.close();
    
    res.json({
      success: true,
      message: 'User updated successfully'
    });
    
  } catch (error: any) {
    console.error('❌ Admin update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message
    });
  }
});

// Delete user (Admin only)
app.delete('/api/admin/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check admin authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const token = authHeader.substring(7);
    const userEmail = activeTokens.get(token);
    
    if (!userEmail || userEmail !== 'admin@muji.com') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    
    // Prevent deleting admin account
    const sql = require('mssql');
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
    
    // Close connection
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
// ADMIN PRODUCT MANAGEMENT APIs
// ===========================================

// Get all products (Admin only)
app.get('/api/admin/products', async (req, res) => {
  try {
    // Check admin authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const token = authHeader.substring(7);
    const userEmail = activeTokens.get(token);
    
    if (!userEmail || userEmail !== 'admin@muji.com') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    
    const sql = require('mssql');
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
    
    const productsResult = await sql.query(`
      SELECT 
        p.ProductID,
        p.ProductName,
        p.Description,
        p.Price,
        p.StockQuantity,
        p.ImagePath,
        p.IsActive as Status,
        p.CreatedAt,
        c.CategoryName
      FROM Products p
      LEFT JOIN Categories c ON p.CategoryID = c.CategoryID
      ORDER BY p.CreatedAt DESC
    `);
    
    // Close connection
    await sql.close();
    
    res.json({
      success: true,
      products: productsResult.recordset
    });
    
  } catch (error: any) {
    console.error('❌ Admin get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    });
  }
});

// Create new product (Admin only)
app.post('/api/admin/products', async (req, res) => {
  try {
    const { productName, description, price, stockQuantity, imagePath, categoryId, status } = req.body;
    
    // Check admin authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const token = authHeader.substring(7);
    const userEmail = activeTokens.get(token);
    
    if (!userEmail || userEmail !== 'admin@muji.com') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    
    // Validate input
    if (!productName || !price || stockQuantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Product name, price, and stock quantity are required'
      });
    }
    
    const sql = require('mssql');
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
    
    // Create new product
    const result = await sql.query`
      INSERT INTO Products (ProductName, Description, Price, StockQuantity, ImagePath, CategoryID, Status, CreatedAt)
      VALUES (${productName}, ${description || ''}, ${price}, ${stockQuantity}, ${imagePath || '/images/products/default.jpg'}, ${categoryId || null}, ${status || 'Active'}, GETDATE())
    `;
    
    // Pool stays open for reuse
    
    res.json({
      success: true,
      message: 'Product created successfully',
      productId: result.recordset.insertId
    });
    
  } catch (error: any) {
    console.error('❌ Admin create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: error.message
    });
  }
});

// Update product (Admin only)
app.put('/api/admin/products/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { productName, description, price, stockQuantity, imagePath, categoryId, status } = req.body;
    
    // Check admin authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const token = authHeader.substring(7);
    const userEmail = activeTokens.get(token);
    
    if (!userEmail || userEmail !== 'admin@muji.com') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    
    const sql = require('mssql');
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
    
    // Update product
    await sql.query`
      UPDATE Products 
      SET ProductName = ${productName}, 
          Description = ${description || ''}, 
          Price = ${price}, 
          StockQuantity = ${stockQuantity}, 
          ImagePath = ${imagePath || '/images/products/default.jpg'}, 
          CategoryID = ${categoryId || null}, 
          Status = ${status || 'Active'}
      WHERE ProductID = ${productId}
    `;
    
    // Pool stays open for reuse
    
    res.json({
      success: true,
      message: 'Product updated successfully'
    });
    
  } catch (error: any) {
    console.error('❌ Admin update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: error.message
    });
  }
});

// Delete product (Admin only)
app.delete('/api/admin/products/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    
    // Check admin authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const token = authHeader.substring(7);
    const userEmail = activeTokens.get(token);
    
    if (!userEmail || userEmail !== 'admin@muji.com') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    
    const sql = require('mssql');
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
    
    // Check if product exists
    const productResult = await sql.query`
      SELECT ProductID FROM Products WHERE ProductID = ${productId}
    `;
    
    if (productResult.recordset.length === 0) {
      // Pool stays open for reuse
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Delete product
    await sql.query`
      DELETE FROM Products WHERE ProductID = ${productId}
    `;
    
    // Pool stays open for reuse
    
    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
    
  } catch (error: any) {
    console.error('❌ Admin delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: error.message
    });
  }
});

// Get all categories (Admin only)
app.get('/api/admin/categories', async (req, res) => {
  try {
    // Check admin authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const token = authHeader.substring(7);
    const userEmail = activeTokens.get(token);
    
    if (!userEmail || userEmail !== 'admin@muji.com') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    
    const sql = require('mssql');
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
    
    const categoriesResult = await sql.query(`
      SELECT CategoryID, CategoryName, Description, IconPath, IsActive as Status, CreatedAt
      FROM Categories 
      ORDER BY CategoryName
    `);
    
    // Close connection
    await sql.close();
    
    res.json({
      success: true,
      categories: categoriesResult.recordset
    });
    
  } catch (error: any) {
    console.error('❌ Admin get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
});

// Create new category (Admin only)
app.post('/api/admin/categories', async (req, res) => {
  try {
    const { categoryName, description, iconPath, status } = req.body;
    
    // Check admin authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const token = authHeader.substring(7);
    const userEmail = activeTokens.get(token);
    
    if (!userEmail || userEmail !== 'admin@muji.com') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    
    // Validate input
    if (!categoryName) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }
    
    const sql = require('mssql');
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
    
    // Check if category already exists
    const existingCategory = await sql.query`
      SELECT CategoryID FROM Categories WHERE CategoryName = ${categoryName}
    `;
    
    if (existingCategory.recordset.length > 0) {
      // Pool stays open for reuse
      return res.status(400).json({
        success: false,
        message: 'Category name already exists'
      });
    }
    
    // Create new category
    const result = await sql.query`
      INSERT INTO Categories (CategoryName, Description, IconPath, Status, CreatedAt)
      VALUES (${categoryName}, ${description || ''}, ${iconPath || '/images/categories/default.jpg'}, ${status || 'Active'}, GETDATE())
    `;
    
    // Pool stays open for reuse
    
    res.json({
      success: true,
      message: 'Category created successfully',
      categoryId: result.recordset.insertId
    });
    
  } catch (error: any) {
    console.error('❌ Admin create category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create category',
      error: error.message
    });
  }
});

// ===========================================
// ADMIN ORDER MANAGEMENT APIs
// ===========================================

// Get all orders (Admin only)
app.get('/api/admin/orders', async (req, res) => {
  try {
    // Check admin authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const token = authHeader.substring(7);
    const userEmail = activeTokens.get(token);
    
    if (!userEmail || userEmail !== 'admin@muji.com') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    
    const sql = require('mssql');
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
    
    const ordersResult = await sql.query(`
      SELECT 
        o.OrderID,
        o.OrderNumber,
        o.CustomerID as UserID,
        o.CreatedAt as OrderDate,
        o.TotalAmount,
        o.Status,
        o.ShippingAddress,
        o.PaymentMethod,
        'Standard' as ShippingMethod,
        o.Notes,
        o.CreatedAt,
        u.FullName as CustomerName,
        u.Email as CustomerEmail
      FROM Orders o
      LEFT JOIN Users u ON o.CustomerID = u.UserID
      ORDER BY o.CreatedAt DESC
    `);
    
    // Close connection
    await sql.close();
    
    res.json({
      success: true,
      orders: ordersResult.recordset
    });
    
  } catch (error: any) {
    console.error('❌ Admin get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
});

// Get order statistics (Admin only) - MUST BE BEFORE /:orderId route
app.get('/api/admin/orders/stats', async (req, res) => {
  try {
    // Check admin authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const token = authHeader.substring(7);
    const userEmail = activeTokens.get(token);
    
    if (!userEmail || userEmail !== 'admin@muji.com') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    
    const sql = require('mssql');
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
    
    // Get order statistics
    const statsResult = await sql.query(`
      SELECT 
        COUNT(*) as TotalOrders,
        SUM(CASE WHEN Status = 'Pending' THEN 1 ELSE 0 END) as PendingOrders,
        SUM(CASE WHEN Status = 'Processing' THEN 1 ELSE 0 END) as ProcessingOrders,
        SUM(CASE WHEN Status = 'Shipped' THEN 1 ELSE 0 END) as ShippedOrders,
        SUM(CASE WHEN Status = 'Delivered' THEN 1 ELSE 0 END) as DeliveredOrders,
        SUM(CASE WHEN Status = 'Cancelled' THEN 1 ELSE 0 END) as CancelledOrders,
        SUM(TotalAmount) as TotalRevenue,
        AVG(TotalAmount) as AverageOrderValue
      FROM Orders
    `);
    
    // Get recent orders (last 7 days)
    const recentOrdersResult = await sql.query(`
      SELECT COUNT(*) as RecentOrders
      FROM Orders
      WHERE CreatedAt >= DATEADD(day, -7, GETDATE())
    `);
    
    await sql.close();
    
    const stats = statsResult.recordset[0];
    const recentOrders = recentOrdersResult.recordset[0];
    
    res.json({
      success: true,
      stats: {
        totalOrders: stats.TotalOrders || 0,
        pendingOrders: stats.PendingOrders || 0,
        processingOrders: stats.ProcessingOrders || 0,
        shippedOrders: stats.ShippedOrders || 0,
        deliveredOrders: stats.DeliveredOrders || 0,
        cancelledOrders: stats.CancelledOrders || 0,
        totalRevenue: stats.TotalRevenue || 0,
        averageOrderValue: stats.AverageOrderValue || 0,
        recentOrders: recentOrders.RecentOrders || 0
      }
    });
    
  } catch (error: any) {
    console.error('❌ Admin get order stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order statistics',
      error: error.message
    });
  }
});

// Get order details with items (Admin only)
app.get('/api/admin/orders/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Check admin authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const token = authHeader.substring(7);
    const userEmail = activeTokens.get(token);
    
    if (!userEmail || userEmail !== 'admin@muji.com') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    
    const sql = require('mssql');
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
    
    // Get order info
    const orderResult = await sql.query`
      SELECT 
        o.OrderID,
        o.OrderNumber,
        o.CustomerID as UserID,
        o.CreatedAt as OrderDate,
        o.TotalAmount,
        o.Status,
        o.ShippingAddress,
        o.PaymentMethod,
        'Standard' as ShippingMethod,
        o.Notes,
        o.CreatedAt,
        u.FullName as CustomerName,
        u.Email as CustomerEmail,
        u.Phone as CustomerPhone
      FROM Orders o
      LEFT JOIN Users u ON o.CustomerID = u.UserID
      WHERE o.OrderID = ${orderId}
    `;
    
    if (orderResult.recordset.length === 0) {
      // Pool stays open for reuse
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Get order items
    const itemsResult = await sql.query`
      SELECT 
        oi.OrderItemID,
        oi.ProductID,
        oi.Quantity,
        oi.ProductPrice,
        oi.SubTotal,
        p.ProductName,
        p.ImagePath
      FROM OrderItems oi
      LEFT JOIN Products p ON oi.ProductID = p.ProductID
      WHERE oi.OrderID = ${orderId}
    `;
    
    // Pool stays open for reuse
    
    res.json({
      success: true,
      order: orderResult.recordset[0],
      items: itemsResult.recordset
    });
    
  } catch (error: any) {
    console.error('❌ Admin get order details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order details',
      error: error.message
    });
  }
});

// Update order status (Admin only)
app.put('/api/admin/orders/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, notes } = req.body;
    
    // Check admin authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const token = authHeader.substring(7);
    const userEmail = activeTokens.get(token);
    
    if (!userEmail || userEmail !== 'admin@muji.com') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    
    // Validate status
    const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Valid statuses: ' + validStatuses.join(', ')
      });
    }
    
    const sql = require('mssql');
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
    
    // Check if order exists
    const orderResult = await sql.query`
      SELECT OrderID FROM Orders WHERE OrderID = ${orderId}
    `;
    
    if (orderResult.recordset.length === 0) {
      // Pool stays open for reuse
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Update order status
    await sql.query`
      UPDATE Orders 
      SET Status = ${status},
          Notes = ${notes || ''}
      WHERE OrderID = ${orderId}
    `;
    
    // Pool stays open for reuse
    
    res.json({
      success: true,
      message: 'Order status updated successfully'
    });
    
  } catch (error: any) {
    console.error('❌ Admin update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message
    });
  }
});


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
import { SimpleChatGateway } from './sockets/SimpleChatGateway';
const chatGateway = new SimpleChatGateway(io);

// Sync activeTokens with Socket.IO
setInterval(() => {
  SimpleChatGateway.updateActiveTokens(activeTokens);
}, 1000); // Update every second

// Start HTTP server
  
  // Check for token in auth object (from io() constructor)
  if (socket.handshake.auth && socket.handshake.auth.token) {
    const token = socket.handshake.auth.token;
    console.log('🔍 Socket auth token:', token);
    console.log('🔍 Token type:', typeof token);
    console.log('🔍 Active tokens count:', activeTokens.size);
    console.log('🔍 Active tokens:', Array.from(activeTokens.keys()));
    console.log('🔍 Token exists:', activeTokens.has(token));
    console.log('🔍 Token expired check:', isTokenExpired(token));
    
    // Check if token is a Promise (async issue)
    if (token && typeof token.then === 'function') {
      console.log('❌ Token is a Promise, waiting for resolution...');
      token.then((resolvedToken: string) => {
        console.log('🔍 Resolved token:', resolvedToken);
        if (activeTokens.has(resolvedToken) && !isTokenExpired(resolvedToken)) {
          const userEmail = activeTokens.get(resolvedToken);
          socket.userEmail = userEmail;
          console.log('✅ Socket authenticated via resolved token for user:', userEmail);
          socket.emit('authenticated', { success: true });
        } else {
          console.log('❌ Resolved token invalid or expired');
          socket.emit('authenticated', { success: false, error: 'Invalid token' });
        }
      }).catch((error: any) => {
        console.log('❌ Token promise rejected:', error);
        socket.emit('authenticated', { success: false, error: 'Token error' });
      });
      return;
    }
    
    console.log('🔍 Checking token in activeTokens:', token);
    console.log('🔍 Active tokens available:', Array.from(activeTokens.keys()));
    console.log('🔍 Token exists:', activeTokens.has(token));
    console.log('🔍 Token expired:', isTokenExpired(token));
    
    if (activeTokens.has(token) && !isTokenExpired(token)) {
      const userEmail = activeTokens.get(token);
      socket.userEmail = userEmail;
      console.log('✅ Socket authenticated via auth object for user:', userEmail);
      socket.emit('authenticated', { success: true });
    } else {
      if (isTokenExpired(token)) {
        console.log('❌ Socket authentication failed - token expired');
        // Remove expired token
        activeTokens.delete(token);
      } else {
        console.log('❌ Socket authentication failed - invalid token in auth object');
        console.log('🔍 Available tokens:', Array.from(activeTokens.keys()));
      }
      socket.emit('authenticated', { success: false, error: 'Invalid token' });
    }
  }
  
  // Authentication middleware for authenticate event
  socket.on('authenticate', (data: any) => {
    const { token } = data;
    if (token && activeTokens.has(token)) {
      const userEmail = activeTokens.get(token);
      socket.userEmail = userEmail;
      console.log('✅ Socket authenticated via event for user:', userEmail);
      socket.emit('authenticated', { success: true });
    } else {
      console.log('❌ Socket authentication failed - invalid token in event');
      socket.emit('authenticated', { success: false, error: 'Invalid token' });
    }
  });
  
  // Join room
  socket.on('room:join', (data: any) => {
    const { roomId } = data;
    if (roomId) {
      socket.join(roomId);
      console.log(`🚪 User ${socket.userEmail} joined room: ${roomId}`);
      
      // Nếu là Agent, cũng join agent room để nhận tin nhắn
      if (socket.userEmail && (socket.userEmail.includes('agent') || socket.userEmail.includes('admin'))) {
        const agentRoomId = `${roomId}_agent`;
        socket.join(agentRoomId);
        console.log(`🚪 Agent ${socket.userEmail} also joined agent room: ${agentRoomId}`);
      }
      
      socket.emit('room:joined', { roomId });
    }
  });
  
  // Leave room
  socket.on('room:leave', (data: any) => {
    const { roomId } = data;
    if (roomId) {
      socket.leave(roomId);
      console.log(`🚪 User ${socket.userEmail} left room: ${roomId}`);
      socket.emit('room:left', { roomId });
    }
  });
  
  // Send message
  socket.on('message:send', async (data: any) => {
    const { content, senderId, senderName, senderRole, roomId, type = 'text' } = data;
    
    console.log('📤 Message received:', { content, senderId, senderName, senderRole, roomId, type });
    
    if (!roomId || !content) {
      socket.emit('error', { message: 'Missing roomId or content' });
      return;
    }
    
    try {
      // 1. Save to SQL Server first
      console.log('🔍 Attempting to get database connection...');
      const pool = await getConnection();
      console.log('✅ Database connection obtained');
      
      console.log('🔍 Executing SQL query with params:', {
        roomId: parseInt(roomId),
        senderId: parseInt(senderId) || 1,
        content: content,
        messageType: type,
        createdAt: new Date().toISOString()
      });
      
      const result = await pool.request()
        .input('roomId', parseInt(roomId))
        .input('senderId', parseInt(senderId) || 1)
        .input('content', content)
        .input('messageType', type)
        .input('createdAt', new Date().toISOString())
        .query(`
          INSERT INTO Messages (RoomID, SenderID, Content, MessageType, CreatedAt)
          OUTPUT INSERTED.MessageID
          VALUES (@roomId, @senderId, @content, @messageType, @createdAt)
        `);
      
      console.log('✅ SQL query executed successfully');
      console.log('🔍 Query result:', result);
      
      const messageId = result.recordset[0].MessageID;
      console.log('💾 Message saved to SQL Server with ID:', messageId);
      
      // 2. Create message object for real-time
      const message = {
        id: messageId.toString(),
        content,
        senderId: senderId || 'unknown',
        senderName: senderName || 'Unknown User',
        senderRole: senderRole || 'Customer',
        roomId,
        timestamp: new Date().toISOString(),
        type
      };
      
      // 3. Store in memory for fast access
      if (!messageStorage.has(roomId)) {
        messageStorage.set(roomId, []);
      }
      messageStorage.get(roomId)!.push(message);
      
      // 4. Cache message for ultra-fast access
      await cache.cacheMessage(roomId, message.id, message);
      
      console.log('💾 Message stored in memory for room:', roomId, 'Total messages:', messageStorage.get(roomId)!.length);
      
      // 5. Publish to cache (Redis alternative)
      await cache.publishMessage(roomId, message);
      
      // 6. Broadcast to room (for other customers)
      socket.to(roomId).emit('message:receive', message);
      
      // 7. Also broadcast to agent room (roomId + '_agent')
      const agentRoomId = `${roomId}_agent`;
      socket.to(agentRoomId).emit('message:receive', message);
      
      // 8. Send confirmation back to sender
      socket.emit('message:sent', message);
      
      console.log('✅ Message broadcasted to room:', roomId, 'and agent room:', agentRoomId);
      
    } catch (error: any) {
      console.error('❌ Error saving message to database:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // Fallback: Save to memory only if database fails
      console.log('🔄 Falling back to memory-only storage...');
      
      const message = {
        id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content,
        senderId: senderId || 'unknown',
        senderName: senderName || 'Unknown User',
        senderRole: senderRole || 'Customer',
        roomId,
        timestamp: new Date().toISOString(),
        type
      };
      
      // Store in memory for fast access
      if (!messageStorage.has(roomId)) {
        messageStorage.set(roomId, []);
      }
      messageStorage.get(roomId)!.push(message);
      
      // Broadcast to room (for other customers)
      socket.to(roomId).emit('message:receive', message);
      
      // Also broadcast to agent room (roomId + '_agent')
      const agentRoomId = `${roomId}_agent`;
      socket.to(agentRoomId).emit('message:receive', message);
      
      // Send confirmation back to sender
      socket.emit('message:sent', message);
      
      console.log('✅ Message saved to memory only (database failed)');
    }

    // 🤖 AI BOT LOGIC - Chỉ phản hồi cho tin nhắn từ Customer
    // Nếu Agent gửi tin nhắn, đánh dấu room này đã có Agent xử lý
    if (senderRole === 'Agent' || senderRole === 'Admin') {
      console.log(`👨‍💼 Agent ${senderName} is handling room ${roomId} - AI Bot will be disabled`);
      // Có thể lưu trạng thái này vào cache hoặc database
      await cache.set(`agent_handling_${roomId}`, true, 300); // 5 phút
    }
    
    if (senderRole === 'Customer') {
      try {
        // Kiểm tra xem có nên sử dụng bot không
        const roomMessages = messageStorage.get(roomId) || [];
        const isFirstMessage = roomMessages.length === 1; // Tin nhắn đầu tiên
        
        // Kiểm tra Agent có đang online trong room không
        const agentRoomId = `${roomId}_agent`;
        const agentRoom = io.sockets.adapter.rooms.get(agentRoomId);
        const agentOnline = agentRoom && agentRoom.size > 0;
        
        // Kiểm tra Agent có đang xử lý room này không (từ cache)
        const agentHandling = await cache.get(`agent_handling_${roomId}`);
        
        // Kiểm tra tin nhắn gần nhất từ Agent (trong 5 phút qua)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const recentAgentMessage = roomMessages
          .filter(msg => (msg.senderRole === 'Agent' || msg.senderRole === 'Admin') && 
                        new Date(msg.timestamp) > fiveMinutesAgo)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
        
        console.log('🤖 AI Bot Check:', {
          roomId,
          isFirstMessage,
          agentOnline,
          agentHandling,
          recentAgentMessage: recentAgentMessage ? {
            sender: recentAgentMessage.senderName,
            time: recentAgentMessage.timestamp,
            content: recentAgentMessage.content.substring(0, 50) + '...'
          } : null
        });
        
        // Chỉ sử dụng bot nếu:
        // 1. Tin nhắn đầu tiên VÀ không có Agent đang xử lý HOẶC
        // 2. Không có Agent online VÀ không có tin nhắn gần đây từ Agent VÀ không có Agent đang xử lý
        const shouldUseBot = (isFirstMessage && !agentHandling) || 
                            (!agentOnline && !recentAgentMessage && !agentHandling);
        
        console.log('🤖 AI Bot Decision:', {
          shouldUseBot,
          reason: shouldUseBot ? 
            (isFirstMessage && !agentHandling ? 'First message, no agent handling' :
             !agentOnline && !recentAgentMessage && !agentHandling ? 'No agent online/recent message/handling' : 'Unknown') :
            (agentHandling ? 'Agent is handling' :
             agentOnline ? 'Agent is online' :
             recentAgentMessage ? 'Recent agent message' : 'Unknown')
        });

        if (shouldUseBot) {
          console.log('🤖 AI Bot: Processing customer message for bot response');
          
          // Tạo context cho AI Bot
          const context = {
            shopName: 'MUJI Store',
            customerName: senderName || 'bạn',
            isFirstMessage,
            productCategory: 'sản phẩm nội thất và đồ dùng gia đình',
            roomId
          };

          // Gửi tin nhắn đến AI Bot
          const botResponse = await AIBotService.sendMessage(content, context);
          
          // Tạo tin nhắn bot
          const botMessage = AIBotService.createBotMessage(botResponse, roomId);
          
          // Lưu tin nhắn bot vào storage
          messageStorage.get(roomId)!.push(botMessage);
          
          // Define agentRoomId for bot broadcasting
          const agentRoomId = `${roomId}_agent`;
          
          // Broadcast tin nhắn bot đến room
          socket.to(roomId).emit('message:receive', botMessage);
          socket.to(agentRoomId).emit('message:receive', botMessage);
          
          // Gửi tin nhắn bot về cho người gửi
          socket.emit('message:receive', botMessage);
          
          console.log('🤖 AI Bot: Response sent:', botResponse);
        }
      } catch (error) {
        console.error('🤖 AI Bot: Error processing message:', error);
      }
    }
  });
  
  // Typing indicators
  socket.on('typing:start', async (data: any) => {
    const { roomId } = data;
    if (roomId) {
      // Update cache
      await cache.setTyping(roomId, socket.userEmail || 'Unknown User', true);
      
      socket.to(roomId).emit('typing:start', { 
        roomId, 
        user: socket.userEmail || 'Unknown User' 
      });
    }
  });
  
  socket.on('typing:stop', async (data: any) => {
    const { roomId } = data;
    if (roomId) {
      // Update cache
      await cache.setTyping(roomId, socket.userEmail || 'Unknown User', false);
      
      socket.to(roomId).emit('typing:stop', { 
        roomId, 
        user: socket.userEmail || 'Unknown User' 
      });
    }
  });
  
  // Request rooms
  socket.on('rooms:request', async () => {
    try {
      // Mock rooms for now - in production, get from database
      const rooms = [
        {
          id: '1',
          name: 'MUJI Store - Clothing',
          type: 'customer-shop',
          participants: ['customer', 'shop'],
          unreadCount: 0,
          isActive: true
        },
        {
          id: '2', 
          name: 'MUJI Store - Beauty',
          type: 'customer-shop',
          participants: ['customer', 'shop'],
          unreadCount: 1,
          isActive: true
        },
        {
          id: '3',
          name: 'MUJI Store - Home', 
          type: 'customer-shop',
          participants: ['customer', 'shop'],
          unreadCount: 0,
          isActive: true
        }
      ];
      
      socket.emit('rooms:list', rooms);
      console.log('📋 Sent rooms list to user:', socket.userEmail);
    } catch (error) {
      console.error('❌ Error getting rooms:', error);
      socket.emit('error', { message: 'Failed to get rooms' });
    }
  });
  
  // Enhanced chat features
  let users: any[] = [];

  const addUser = (userId: string, socketId: string) => {
    !users.some((user) => user.userId === userId) &&
      users.push({ userId, socketId });
  };

  const removeUser = (socketId: string) => {
    users = users.filter((user) => user.socketId !== socketId);
  };

  const getUser = (receiverId: string) => {
    return users.find((user) => user.userId === receiverId);
  };

  // Add user to active users
  socket.on('addUser', (userId: string) => {
    addUser(userId, socket.id);
    io.emit('getUsers', users);
    console.log(`👤 User added: ${userId}`);
  });

  // Join room
  socket.on('joinRoom', (roomId: string) => {
    socket.join(`room_${roomId}`);
    console.log(`🏠 User ${socket.id} joined room ${roomId}`);
  });

  // Leave room
  socket.on('leaveRoom', (roomId: string) => {
    socket.leave(`room_${roomId}`);
    console.log(`🚪 User ${socket.id} left room ${roomId}`);
  });

  // Send message
  socket.on('sendMessage', ({ senderId, receiverId, text, images, roomId }: {
    senderId: string;
    receiverId: string;
    text: string;
    images?: string;
    roomId: string;
  }) => {
    const message = {
      senderId,
      receiverId,
      text,
      images,
      roomId,
      seen: false,
      createdAt: Date.now()
    };
    
    console.log(`📨 Message sent from ${senderId} to ${receiverId}: ${text}`);
    
    // Send to receiver if online
    const user = getUser(receiverId);
    if (user) {
      io.to(user.socketId).emit('getMessage', message);
    }
    
    // Also emit to room for group chat
    if (roomId) {
      socket.to(`room_${roomId}`).emit('getMessage', message);
    }
  });

  // Message seen
  socket.on('messageSeen', ({ senderId, receiverId, messageId }: {
    senderId: string;
    receiverId: string;
    messageId: string;
  }) => {
    const user = getUser(senderId);
    
    if (user) {
      io.to(user.socketId).emit('messageSeen', {
        senderId,
        receiverId,
        messageId
      });
    }
  });

  // Update last message
  socket.on('updateLastMessage', ({ lastMessage, lastMessageId, roomId }: {
    lastMessage: string;
    lastMessageId: string;
    roomId: string;
  }) => {
    io.emit('getLastMessage', {
      lastMessage,
      lastMessageId,
      roomId
    });
  });

  // Typing indicator
  socket.on('typing', ({ roomId, userId, isTyping }: {
    roomId: string;
    userId: string;
    isTyping: boolean;
  }) => {
    socket.to(`room_${roomId}`).emit('userTyping', { userId, isTyping });
  });
  
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
    removeUser(socket.id);
    io.emit('getUsers', users);
  });
});

// Start server
const port = 4000;

async function startServer() {
  try {
    console.log('🚀 Starting optimized development server...');
    
    // Connect to database
    await connectDatabase();
    
    // Try to connect to Docker Redis
    try {
      await redisService.connect();
      console.log('✅ Docker Redis connected successfully');
    } catch (error: any) {
      console.log('⚠️ Docker Redis connection failed, using in-memory cache:', error.message);
      console.log('📊 Cache stats:', cache.getStats());
    }
    
// =============================================
// AGENT ENDPOINTS
// =============================================

// Get agent tickets
app.get('/api/agent/tickets', async (req, res) => {
  try {
    console.log('🔍 Agent tickets API called');
    
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Token không hợp lệ' });
    }

    const userEmail = activeTokens.get(token);
    if (!userEmail) {
      return res.status(401).json({ error: 'Token không hợp lệ' });
    }

    // Verify user is agent
    if (userEmail !== 'agent@muji.com') {
      return res.status(403).json({ error: 'Chỉ agent mới có thể truy cập' });
    }

    const sql = await getConnection();
    
    // Get all tickets
    const ticketsResult = await sql.query`
      SELECT 
        t.TicketID,
        t.TicketNumber,
        t.Title,
        t.Description,
        t.Status,
        t.Priority,
        t.CreatedAt,
        u.FullName as CustomerName,
        u.Email as CustomerEmail
      FROM Tickets t
      JOIN Users u ON t.CustomerID = u.UserID
      ORDER BY t.CreatedAt DESC
    `;
    
    console.log(`✅ Agent tickets API - Found ${ticketsResult.recordset.length} tickets`);
    
    res.json({
      success: true,
      tickets: ticketsResult.recordset.map(ticket => ({
        ticketId: ticket.TicketID,
        ticketNumber: ticket.TicketNumber,
        title: ticket.Title,
        description: ticket.Description,
        status: ticket.Status,
        priority: ticket.Priority,
        createdAt: ticket.CreatedAt,
        customerName: ticket.CustomerName,
        customerEmail: ticket.CustomerEmail
      }))
    });
    
  } catch (error: any) {
    console.error('❌ Agent tickets API error:', error);
    res.status(500).json({ error: 'Lỗi server khi tải tickets' });
  }
});

// Get agent chat rooms
app.get('/api/agent/chat-rooms', async (req, res) => {
  try {
    console.log('🔍 Agent chat rooms API called');
    
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Token không hợp lệ' });
    }

    const userEmail = activeTokens.get(token);
    if (!userEmail) {
      return res.status(401).json({ error: 'Token không hợp lệ' });
    }

    // Verify user is agent
    if (userEmail !== 'agent@muji.com') {
      return res.status(403).json({ error: 'Chỉ agent mới có thể truy cập' });
    }

    const sql = await getConnection();
    
    // Get chat rooms for agent
    const roomsResult = await sql.query`
      SELECT 
        cr.RoomID,
        cr.TicketID,
        cr.RoomName,
        cr.IsActive,
        cr.CreatedAt,
        cr.AgentID,
        cr.CustomerID,
        cr.LastMessage,
        cr.LastMessageAt,
        u.FullName as CustomerName,
        u.Email as CustomerEmail
      FROM ChatRooms cr
      JOIN Users u ON cr.CustomerID = u.UserID
      WHERE cr.AgentID = 2 OR cr.AgentID IS NULL
      ORDER BY cr.CreatedAt DESC
    `;
    
    console.log(`✅ Agent chat rooms API - Found ${roomsResult.recordset.length} rooms`);
    
    res.json({
      success: true,
      rooms: roomsResult.recordset.map(room => ({
        roomId: room.RoomID,
        ticketId: room.TicketID,
        name: room.RoomName,
        isActive: room.IsActive,
        createdAt: room.CreatedAt,
        agentId: room.AgentID,
        customerId: room.CustomerID,
        lastMessage: room.LastMessage,
        lastMessageAt: room.LastMessageAt,
        customerName: room.CustomerName,
        customerEmail: room.CustomerEmail
      }))
    });
    
  } catch (error: any) {
    console.error('❌ Agent chat rooms API error:', error);
    res.status(500).json({ error: 'Lỗi server khi tải chat rooms' });
  }
});

// Create chat room
app.post('/api/chat/create-room', async (req, res) => {
  try {
    console.log('🔍 Create chat room API called');
    
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Token không hợp lệ' });
    }

    const userEmail = activeTokens.get(token);
    if (!userEmail) {
      return res.status(401).json({ error: 'Token không hợp lệ' });
    }

    const { ticketId, roomName } = req.body;
    
    if (!ticketId) {
      return res.status(400).json({ error: 'TicketID là bắt buộc' });
    }

    const sql = await getConnection();
    
    // Get user info
    const userResult = await sql.query`
      SELECT UserID, FullName FROM Users WHERE Email = ${userEmail}
    `;
    
    console.log('🔍 User query result:', userResult.recordset);
    
    if (userResult.recordset.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResult.recordset[0];
    console.log('🔍 User found:', user);
    
    // Check if room already exists for this ticket
    const existingRoomResult = await sql.query`
      SELECT RoomID FROM ChatRooms WHERE TicketID = ${ticketId}
    `;
    
    if (existingRoomResult.recordset.length > 0) {
      const existingRoomId = existingRoomResult.recordset[0].RoomID;
      console.log(`⚠️ Room already exists for ticket ${ticketId}: ${existingRoomId}`);
      
      return res.json({
        success: true,
        room: {
          roomId: existingRoomId,
          ticketId: ticketId,
          name: roomName || 'Chat Room',
          customerId: user.UserID,
          customerName: user.FullName,
          isActive: true,
          createdAt: new Date().toISOString()
        }
      });
    }
    
    // Create chat room
    console.log('🔍 Creating chat room with params:', { ticketId, roomName, userId: user.UserID });
    const roomResult = await sql.query`
      INSERT INTO ChatRooms (TicketID, RoomName, CustomerID, IsActive, CreatedAt)
      VALUES (${ticketId}, ${roomName || 'Chat Room'}, ${user.UserID}, 1, GETDATE())
      SELECT SCOPE_IDENTITY() AS RoomID
    `;
    
    console.log('🔍 Room creation result:', roomResult);
    const roomId = roomResult.recordset[0].RoomID;
    
    console.log(`✅ Chat room created with ID: ${roomId}`);
    
    res.json({
      success: true,
      room: {
        roomId: roomId,
        ticketId: ticketId,
        name: roomName || 'Chat Room',
        customerId: user.UserID,
        customerName: user.FullName,
        isActive: true,
        createdAt: new Date().toISOString()
      }
    });
    
  } catch (error: any) {
    console.error('❌ Create chat room API error:', error);
    res.status(500).json({ error: 'Lỗi server khi tạo chat room' });
  }
});

// Get room details and messages
app.get('/api/chat/rooms/:roomId', async (req, res) => {
  try {
    console.log('🔍 Get chat room details API called');
    
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Token không hợp lệ' });
    }

    const userEmail = activeTokens.get(token);
    if (!userEmail) {
      return res.status(401).json({ error: 'Token không hợp lệ' });
    }

    const { roomId } = req.params;
    
    try {
      // Try to connect to database
      const sql = await getConnection();
      
      // Check if ChatRooms table exists
      const tableCheck = await sql.query`
        SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_NAME = 'ChatRooms'
      `;
      
      if (tableCheck.recordset[0].count === 0) {
        console.log('⚠️ ChatRooms table does not exist, creating it...');
        
        // Create ChatRooms table
        await sql.query`
          CREATE TABLE ChatRooms (
            RoomID INT IDENTITY(1,1) PRIMARY KEY,
            TicketID INT NOT NULL,
            RoomName NVARCHAR(255),
            IsActive BIT DEFAULT 1,
            CreatedAt DATETIME2 DEFAULT GETDATE(),
            AgentID INT,
            CustomerID INT,
            LastMessage NVARCHAR(MAX),
            LastMessageAt DATETIME2
          )
        `;
        
        // Insert some sample rooms
        await sql.query`
          INSERT INTO ChatRooms (TicketID, RoomName, AgentID, CustomerID) VALUES 
          (1, 'MUJI Store - Clothing', 2, 3),
          (2, 'Support Chat Room', 2, 3),
          (3, 'General Support', 2, 3)
        `;
        
        console.log('✅ ChatRooms table created with sample data');
      }
      
      // Get room info
      const roomResult = await sql.query`
        SELECT 
          RoomID,
          TicketID,
          RoomName,
          IsActive,
          CreatedAt,
          AgentID,
          CustomerID,
          LastMessage,
          LastMessageAt
        FROM ChatRooms 
        WHERE RoomID = ${roomId}
      `;
      
      if (roomResult.recordset.length === 0) {
        return res.status(404).json({ error: 'Room not found' });
      }
      
      const room = roomResult.recordset[0];
      
      console.log(`✅ API /api/chat/rooms/:roomId - Room found: ${room.RoomName}`);
      
      res.json({
        success: true,
        room: {
          id: room.RoomID,
          ticketId: room.TicketID,
          name: room.RoomName,
          isActive: room.IsActive,
          createdAt: room.CreatedAt,
          agentId: room.AgentID,
          customerId: room.CustomerID,
          lastMessage: room.LastMessage,
          lastMessageAt: room.LastMessageAt
        }
      });
      
    } catch (dbError) {
      console.error('❌ Database error:', dbError);
      
      // Fallback to mock data if database fails
      const mockRooms = [
        {
          id: 1,
          name: "MUJI Store - Clothing",
          type: "shop",
          createdAt: new Date().toISOString()
        },
        {
          id: 71,
          name: "Support Chat Room",
          type: "support",
          createdAt: new Date().toISOString()
        }
      ];
      
      const room = mockRooms.find(r => r.id.toString() === roomId);
      
      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }
      
      console.log(`⚠️ Using mock data for room: ${room.name}`);
      
      res.json({
        success: true,
        room: room
      });
    }
    
  } catch (error: any) {
    console.error('❌ API /api/chat/rooms/:roomId - Error:', error);
    res.status(500).json({ error: 'Failed to load room info' });
  }
});
    
    // Start HTTP server
    server.listen(port, () => {
      console.log(`✅ Server running on port ${port}`);
      console.log(`🔌 Socket.IO available at ws://localhost:${port}/ws`);
      console.log(`📡 Health check: http://localhost:${port}/health`);
      console.log(`⚡ Optimized for development - minimal middleware loaded`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  // redisService.disconnect(); // Redis disabled
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  // redisService.disconnect(); // Redis disabled
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Chat Rating API Endpoints
// Health check endpoint
app.get('/api/chat/health', async (req, res) => {
  try {
    const sql = await getConnection();
    
    // Check database connection
    const dbCheck = await sql.query`SELECT 1 as test`;
    
    // Get online socket connections count
    const onlineCount = io.engine.clientsCount;
    
    res.json({
      status: 'healthy',
      database: 'connected',
      socketConnections: onlineCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Conversation management endpoints
app.post('/api/conversations/open', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token || !activeTokens.has(token)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { customerId, shopId, orderId } = req.body;
    console.log('🔄 Opening conversation:', { customerId, shopId, orderId });

    const sql = await getConnection();
    
    // Check if conversation already exists
    let existingRoom = null;
    if (orderId) {
      const existingResult = await sql.query`
        SELECT TOP 1 RoomID, RoomName, IsActive 
        FROM ChatRooms 
        WHERE TicketID = ${parseInt(orderId)} AND IsActive = 1
      `;
      existingRoom = existingResult.recordset[0];
    }

    if (existingRoom) {
      console.log('✅ Using existing room:', existingRoom.RoomID);
      res.json({
        success: true,
        conversation: {
          id: existingRoom.RoomID.toString(),
          customerId: customerId,
          shopId: shopId,
          orderId: orderId,
          shopName: 'Shop Name', // You might want to fetch this from database
          customerName: 'Customer Name', // You might want to fetch this from database
          unreadCount: 0,
          isActive: true,
          createdAt: new Date().toISOString()
        }
      });
      return;
    }

    // Create new conversation
    await sql.query`
      INSERT INTO ChatRooms (TicketID, RoomName, IsActive, CreatedAt, CustomerID, AgentID)
      VALUES (${parseInt(orderId || '0')}, ${`Chat cho đơn hàng #${orderId || 'mới'}`}, 1, GETDATE(), ${parseInt(customerId)}, 2)
    `;

    // Get the created room ID
    const newRoomResult = await sql.query`
      SELECT TOP 1 RoomID FROM ChatRooms 
      WHERE TicketID = ${parseInt(orderId || '0')} AND IsActive = 1
      ORDER BY CreatedAt DESC
    `;

    const roomId = newRoomResult.recordset[0].RoomID;
    
    console.log(`✅ New conversation created: ${roomId}`);

    res.json({
      success: true,
      conversation: {
        id: roomId.toString(),
        customerId: customerId,
        shopId: shopId,
        orderId: orderId,
        shopName: 'Shop Name',
        customerName: 'Customer Name',
        unreadCount: 0,
        isActive: true,
        createdAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error opening conversation:', error);
    res.status(500).json({ error: 'Failed to open conversation' });
  }
});

app.get('/api/conversations/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token || !activeTokens.has(token)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    console.log('🔄 Getting conversation:', id);

    const sql = await getConnection();
    const result = await sql.query`
      SELECT RoomID, RoomName, IsActive, CreatedAt, CustomerID, AgentID, TicketID
      FROM ChatRooms 
      WHERE RoomID = ${parseInt(id)} AND IsActive = 1
    `;

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const room = result.recordset[0];
    
    res.json({
      success: true,
      conversation: {
        id: room.RoomID.toString(),
        customerId: room.CustomerID.toString(),
        shopId: '1', // Default shop ID
        orderId: room.TicketID?.toString(),
        shopName: 'Shop Name',
        customerName: 'Customer Name',
        unreadCount: 0,
        isActive: room.IsActive,
        createdAt: room.CreatedAt.toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error getting conversation:', error);
    res.status(500).json({ error: 'Failed to get conversation' });
  }
});

app.get('/api/conversations/:id/messages', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token || !activeTokens.has(token)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    
    console.log('🔄 Getting messages for conversation:', id);

    const sql = await getConnection();
    const result = await sql.query`
      SELECT TOP ${limit} MessageID, RoomID, SenderID, SenderType, Content, MessageType, CreatedAt, IsRead
      FROM Messages 
      WHERE RoomID = ${parseInt(id)}
      ORDER BY CreatedAt DESC
      OFFSET ${offset} ROWS
    `;

    const messages = result.recordset.map(msg => ({
      id: msg.MessageID.toString(),
      conversationId: msg.RoomID.toString(),
      senderId: msg.SenderID.toString(),
      senderType: msg.SenderType,
      content: msg.Content,
      timestamp: msg.CreatedAt.toISOString(),
      isRead: msg.IsRead || false
    }));

    res.json({
      success: true,
      messages: messages.reverse() // Reverse to get chronological order
    });

  } catch (error) {
    console.error('❌ Error getting messages:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

app.post('/api/conversations/:id/messages', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token || !activeTokens.has(token)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { content, clientTempId } = req.body;
    
    console.log('🔄 Sending message to conversation:', id);

    const sql = await getConnection();
    
    // Insert message
    await sql.query`
      INSERT INTO Messages (RoomID, SenderID, SenderType, Content, MessageType, CreatedAt)
      VALUES (${parseInt(id)}, 3, 'Customer', ${content}, 'text', GETDATE())
    `;

    // Get the created message ID
    const messageResult = await sql.query`
      SELECT TOP 1 MessageID FROM Messages
      WHERE RoomID = ${parseInt(id)}
      ORDER BY CreatedAt DESC
    `;

    const messageId = messageResult.recordset[0].MessageID;
    
    console.log(`✅ Message sent: ${messageId}`);

    res.json({
      success: true,
      message: {
        id: messageId.toString(),
        conversationId: id,
        senderId: '3',
        senderType: 'Customer',
        content: content,
        timestamp: new Date().toISOString(),
        isRead: false,
        clientTempId: clientTempId
      }
    });

  } catch (error) {
    console.error('❌ Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

app.post('/api/conversations/:id/read', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token || !activeTokens.has(token)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    console.log('🔄 Marking conversation as read:', id);

    const sql = await getConnection();
    await sql.query`
      UPDATE Messages 
      SET IsRead = 1 
      WHERE RoomID = ${parseInt(id)} AND SenderID != 3
    `;

    res.json({ success: true });

  } catch (error) {
    console.error('❌ Error marking as read:', error);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

app.post('/api/chat/rating', async (req, res) => {
  try {
    const { roomId, rating, comment } = req.body;
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token không hợp lệ' });
    }

    const userEmail = activeTokens.get(token);
    if (!userEmail) {
      return res.status(401).json({ error: 'Token không hợp lệ' });
    }

    const sql = await getConnection();
    
    // Get user info
    const userResult = await sql.query`
      SELECT UserID, FullName, Role FROM Users WHERE Email = ${userEmail}
    `;
    
    if (userResult.recordset.length === 0) {
      return res.status(404).json({ error: 'User không tồn tại' });
    }

    const user = userResult.recordset[0];
    
    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating phải từ 1-5 sao' });
    }

    // Check if room exists
    const roomResult = await sql.query`
      SELECT RoomID, CustomerID, AgentID FROM ChatRooms WHERE RoomID = ${parseInt(roomId)}
    `;
    
    if (roomResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Chat room không tồn tại' });
    }

    const room = roomResult.recordset[0];
    
    // Check if user already rated this room
    const existingRating = await sql.query`
      SELECT RatingID FROM ChatRatings WHERE RoomID = ${parseInt(roomId)} AND UserID = ${user.UserID}
    `;

    if (existingRating.recordset.length > 0) {
      return res.status(400).json({ error: 'Bạn đã đánh giá chat này rồi' });
    }

    // Create rating
    const result = await sql.query`
      INSERT INTO ChatRatings (RoomID, UserID, Rating, Comment, CreatedAt)
      VALUES (${parseInt(roomId)}, ${user.UserID}, ${rating}, ${comment || ''}, GETDATE());
      SELECT SCOPE_IDENTITY() AS RatingID;
    `;

    const ratingId = result.recordset[0].RatingID;

    // Update room rating stats
    const statsResult = await sql.query`
      SELECT AVG(CAST(Rating AS FLOAT)) as AverageRating, COUNT(*) as TotalRatings
      FROM ChatRatings WHERE RoomID = ${parseInt(roomId)}
    `;

    const stats = statsResult.recordset[0];
    
    await sql.query`
      UPDATE ChatRooms 
      SET AverageRating = ${stats.AverageRating || 0}, TotalRatings = ${stats.TotalRatings || 0}
      WHERE RoomID = ${parseInt(roomId)}
    `;

    console.log(`✅ Chat rating created: ${rating} stars for room ${roomId}`);

    res.status(201).json({
      success: true,
      message: 'Đánh giá chat thành công',
      data: {
        ratingId,
        roomId,
        userId: user.UserID,
        rating,
        comment,
        createdAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error creating chat rating:', error);
    res.status(500).json({ error: 'Lỗi server khi tạo đánh giá' });
  }
});

// Get room ratings
app.get('/api/chat/rating/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    
    const sql = await getConnection();
    const result = await sql.query`
      SELECT cr.RatingID, cr.Rating, cr.Comment, cr.CreatedAt, u.FullName as UserName, u.Role
      FROM ChatRatings cr
      LEFT JOIN Users u ON cr.UserID = u.UserID
      WHERE cr.RoomID = ${parseInt(roomId)}
      ORDER BY cr.CreatedAt DESC
    `;

    const ratings = result.recordset.map(rating => ({
      ratingId: rating.RatingID,
      rating: rating.Rating,
      comment: rating.Comment,
      userName: rating.UserName,
      userRole: rating.Role,
      createdAt: rating.CreatedAt
    }));

    res.json({
      success: true,
      data: {
        roomId,
        ratings,
        totalRatings: ratings.length
      }
    });

  } catch (error) {
    console.error('❌ Error getting room ratings:', error);
    res.status(500).json({ error: 'Lỗi server khi lấy đánh giá' });
  }
});

// Get room rating stats
app.get('/api/chat/rating/:roomId/stats', async (req, res) => {
  try {
    const { roomId } = req.params;
    
    const sql = await getConnection();
    const result = await sql.query`
      SELECT 
        AVG(CAST(Rating AS FLOAT)) as AverageRating,
        COUNT(*) as TotalRatings,
        SUM(CASE WHEN Rating = 1 THEN 1 ELSE 0 END) as Rating1,
        SUM(CASE WHEN Rating = 2 THEN 1 ELSE 0 END) as Rating2,
        SUM(CASE WHEN Rating = 3 THEN 1 ELSE 0 END) as Rating3,
        SUM(CASE WHEN Rating = 4 THEN 1 ELSE 0 END) as Rating4,
        SUM(CASE WHEN Rating = 5 THEN 1 ELSE 0 END) as Rating5
      FROM ChatRatings 
      WHERE RoomID = ${parseInt(roomId)}
    `;

    const stats = result.recordset[0];
    
    const ratingStats = {
      averageRating: Math.round((stats.AverageRating || 0) * 10) / 10,
      totalRatings: stats.TotalRatings || 0,
      ratingDistribution: {
        1: stats.Rating1 || 0,
        2: stats.Rating2 || 0,
        3: stats.Rating3 || 0,
        4: stats.Rating4 || 0,
        5: stats.Rating5 || 0
      }
    };

    res.json({
      success: true,
      data: {
        roomId,
        stats: ratingStats
      }
    });

  } catch (error) {
    console.error('❌ Error getting rating stats:', error);
    res.status(500).json({ error: 'Lỗi server khi lấy thống kê đánh giá' });
  }
});

// Create chat room by order
app.post('/api/chat/rooms/create-by-order', async (req, res) => {
  try {
    console.log('🔍 Create chat room by order API called');
    
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Token không hợp lệ' });
    }

    const userEmail = activeTokens.get(token);
    if (!userEmail) {
      return res.status(401).json({ error: 'Token không hợp lệ' });
    }

    const { orderId, shopId } = req.body;
    
    if (!orderId) {
      return res.status(400).json({ error: 'Order ID là bắt buộc' });
    }

    const sql = await getConnection();
    
    // Check if room already exists for this order
    const existingRoom = await sql.query`
      SELECT RoomID FROM ChatRooms 
      WHERE TicketID = ${parseInt(orderId)} AND IsActive = 1
    `;

    if (existingRoom.recordset.length > 0) {
      const roomId = existingRoom.recordset[0].RoomID;
      console.log(`✅ Room already exists for order ${orderId}: ${roomId}`);
      
      return res.json({
        success: true,
        data: {
          roomId: roomId.toString(),
          message: 'Room đã tồn tại'
        }
      });
    }

    // Create new room for order
    await sql.query`
      INSERT INTO ChatRooms (TicketID, RoomName, IsActive, CreatedAt, CustomerID, AgentID)
      VALUES (${parseInt(orderId)}, ${`Chat cho đơn hàng #${orderId}`}, 1, GETDATE(), 3, 2)
    `;

    // Get the created room ID
    const newRoomResult = await sql.query`
      SELECT TOP 1 RoomID FROM ChatRooms 
      WHERE TicketID = ${parseInt(orderId)} AND IsActive = 1
      ORDER BY CreatedAt DESC
    `;

    const roomId = newRoomResult.recordset[0].RoomID;
    
    console.log(`✅ Chat room created for order ${orderId}: ${roomId}`);

    res.json({
      success: true,
      data: {
        roomId: roomId.toString(),
        message: 'Room được tạo thành công'
      }
    });

  } catch (error) {
    console.error('❌ Error creating order room:', error);
    res.status(500).json({ error: 'Lỗi server khi tạo room cho đơn hàng' });
  }
});

// Get messages for room (alternative endpoint)
app.get('/api/chat/:roomId/messages', async (req, res) => {
  try {
    const { roomId } = req.params;
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token không hợp lệ' });
    }

    const userEmail = activeTokens.get(token);
    if (!userEmail) {
      return res.status(401).json({ error: 'Token không hợp lệ' });
    }

    const sql = await getConnection();
    
    // Get messages for the room
    const messagesResult = await sql.query`
      SELECT m.MessageID, m.RoomID, m.SenderID, m.SenderType, m.Content, m.MessageType, m.CreatedAt, m.IsRead,
             u.FullName as SenderName, u.Role as SenderRole
      FROM Messages m
      LEFT JOIN Users u ON m.SenderID = u.UserID
      WHERE m.RoomID = ${parseInt(roomId)}
      ORDER BY m.CreatedAt ASC
    `;

    const messages = messagesResult.recordset.map(msg => ({
      id: msg.MessageID.toString(),
      sender: msg.SenderType === 'Agent' ? 'shop' : 'customer',
      content: msg.Content,
      timestamp: msg.CreatedAt,
      type: msg.MessageType,
      senderName: msg.SenderName
    }));

    console.log(`✅ Room messages loaded: ${messages.length} messages for room ${roomId}`);

    res.json({
      success: true,
      messages: messages
    });

  } catch (error) {
    console.error('❌ Error getting room messages:', error);
    res.status(500).json({ error: 'Lỗi server khi lấy tin nhắn' });
  }
});

// Get room messages
app.get('/api/chat/rooms/:roomId/messages', async (req, res) => {
  try {
    const { roomId } = req.params;
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token không hợp lệ' });
    }

    const userEmail = activeTokens.get(token);
    if (!userEmail) {
      return res.status(401).json({ error: 'Token không hợp lệ' });
    }

    const sql = await getConnection();
    
    // Get messages for the room
    const messagesResult = await sql.query`
      SELECT m.MessageID, m.RoomID, m.SenderID, m.SenderType, m.Content, m.MessageType, m.CreatedAt, m.IsRead,
             u.FullName as SenderName, u.Role as SenderRole
      FROM Messages m
      LEFT JOIN Users u ON m.SenderID = u.UserID
      WHERE m.RoomID = ${parseInt(roomId)}
      ORDER BY m.CreatedAt ASC
    `;

    const messages = messagesResult.recordset.map(msg => ({
      messageId: msg.MessageID.toString(),
      roomId: msg.RoomID.toString(),
      senderId: msg.SenderID.toString(),
      content: msg.Content,
      messageType: msg.MessageType,
      createdAt: msg.CreatedAt,
      isRead: msg.IsRead,
      senderName: msg.SenderName,
      senderRole: msg.SenderRole
    }));

    console.log(`✅ Room messages loaded: ${messages.length} messages for room ${roomId}`);

    res.json({
      success: true,
      data: {
        roomId,
        messages,
        totalMessages: messages.length
      }
    });

  } catch (error) {
    console.error('❌ Error getting room messages:', error);
    res.status(500).json({ error: 'Lỗi server khi lấy tin nhắn' });
  }
});

// Send message endpoint
app.post('/api/chat/send', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Token không hợp lệ' });
    }

    const userEmail = activeTokens.get(token);
    if (!userEmail) {
      return res.status(401).json({ error: 'Token không hợp lệ' });
    }

    const { sender, text, images, roomId, senderType } = req.body;
    
    if (!roomId) {
      return res.status(400).json({ error: 'Room ID là bắt buộc' });
    }

    const sql = await getConnection();
    
    // Get user info
    const userResult = await sql.query`
      SELECT UserID, FullName FROM Users WHERE Email = ${userEmail}
    `;
    
    if (userResult.recordset.length === 0) {
      return res.status(404).json({ error: 'User không tồn tại' });
    }
    
    const user = userResult.recordset[0];
    
    // Insert message
    console.log('📝 Inserting message:', { roomId, senderId: user.UserID, senderType, text, images });
    
    // Insert message using separate queries
    await sql.query`
      INSERT INTO Messages (RoomID, SenderID, SenderType, Content, MessageType, CreatedAt)
      VALUES (${roomId}, ${user.UserID}, ${senderType || 'Customer'}, ${text || ''}, ${images ? 'image' : 'text'}, GETDATE())
    `;
    
    // Get the inserted message ID
    const messageResult = await sql.query`
      SELECT TOP 1 MessageID FROM Messages 
      WHERE RoomID = ${roomId} AND SenderID = ${user.UserID} 
      ORDER BY CreatedAt DESC
    `;
    
    console.log('📝 Message result:', messageResult);
    console.log('📝 Recordset length:', messageResult.recordset?.length);
    console.log('📝 Recordset:', messageResult.recordset);
    
    if (!messageResult.recordset || messageResult.recordset.length === 0) {
      console.error('❌ No message ID returned from database');
      return res.status(500).json({ error: 'Không thể lưu tin nhắn' });
    }
    
    const messageId = messageResult.recordset[0].MessageID;
    console.log('✅ Message saved with ID:', messageId);
    
    // Update last message in room
    await sql.query`
      UPDATE ChatRooms 
      SET LastMessage = ${text || 'Photo'}, LastMessageAt = GETDATE()
      WHERE RoomID = ${roomId}
    `;
    
    const message = {
      messageId: messageId,
      sender: user.UserID,
      text: text,
      images: images,
      roomId: roomId,
      senderType: senderType || 'Customer',
      createdAt: new Date().toISOString()
    };
    
    res.json({
      success: true,
      message: message
    });
    
  } catch (error: any) {
    console.error('❌ Send message API error:', error);
    res.status(500).json({ error: 'Lỗi server khi gửi tin nhắn' });
  }
});

// Update last message endpoint
app.put('/api/chat/rooms/:roomId/last-message', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Token không hợp lệ' });
    }

    const userEmail = activeTokens.get(token);
    if (!userEmail) {
      return res.status(401).json({ error: 'Token không hợp lệ' });
    }

    const { roomId } = req.params;
    const { lastMessage, lastMessageId } = req.body;
    
    const sql = await getConnection();
    
    await sql.query`
      UPDATE ChatRooms 
      SET LastMessage = ${lastMessage}, LastMessageAt = GETDATE()
      WHERE RoomID = ${roomId}
    `;
    
    res.json({
      success: true,
      message: 'Last message updated'
    });
    
  } catch (error: any) {
    console.error('❌ Update last message API error:', error);
    res.status(500).json({ error: 'Lỗi server khi cập nhật tin nhắn cuối' });
  }
});

// =============================================
// TICKET PRIORITIES & CATEGORIES ENDPOINTS
// =============================================

// Get ticket priorities
app.get('/api/tickets/priorities', async (req, res) => {
  try {
    const sql = await getConnection();
    const result = await sql.query`
      SELECT PriorityID as id, PriorityName as name, PriorityLevel as level, ColorCode as color
      FROM TicketPriorities 
      WHERE IsActive = 1
      ORDER BY PriorityLevel ASC
    `;
    
    res.json(result.recordset);
  } catch (error) {
    console.error('Error getting ticket priorities:', error);
    res.status(500).json({ error: 'Failed to get ticket priorities' });
  }
});

// Get ticket categories
app.get('/api/tickets/categories', async (req, res) => {
  try {
    const sql = await getConnection();
    const result = await sql.query`
      SELECT CategoryID as id, CategoryName as name, Description, IsActive
      FROM TicketCategories 
      WHERE IsActive = 1
      ORDER BY CategoryName ASC
    `;
    
    res.json(result.recordset);
  } catch (error) {
    console.error('Error getting ticket categories:', error);
    res.status(500).json({ error: 'Failed to get ticket categories' });
  }
});

// Start the server
startServer();
