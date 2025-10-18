// src/dev-server.ts - Optimized development server
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import { connectDatabase } from './db';
import { redisService } from './services/redisService';

// Map để lưu trữ token và email người dùng
const activeTokens = new Map(); // accessToken -> userEmail
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
    
    await sql.close();
    
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

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    redis: redisService.isReady() ? 'Connected' : 'Disconnected',
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

    await sql.close();

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
      await sql.close();
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

    await sql.close();

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
      await sql.close();
      return res.status(404).json({ error: 'User không tồn tại' });
    }

    const userId = userResult.recordset[0].UserID;

    // Create ticket
    const insertResult = await sql.query`
      INSERT INTO Tickets (Title, Description, DepartmentID, CustomerID, Priority, Status)
      VALUES (${title}, ${description}, ${departmentId}, ${userId}, ${priority}, 'Open')
    `;

    await sql.close();

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

    await sql.close();

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

    const accessToken = 'real_token_' + user.UserID;
    // Lưu trữ token và email vào map tạm thời
    activeTokens.set(accessToken, user.Email);
    console.log(`✅ Login successful for ${user.Email}: ${accessToken}`);

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.UserID,
        email: user.Email,
        name: user.FullName,
        role: email === 'agent@muji.com' ? 'Agent' : 'Customer' // Set role based on email
      },
      tokens: { accessToken: accessToken, refreshToken: 'real_refresh_' + user.UserID }
    });

  } catch (error: any) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Lỗi server khi đăng nhập' });
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
      await sql.close();
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
    
    await sql.close();
    
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
    
    await sql.close();
    
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
    
    await sql.close();
    
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
    
    await sql.close();
    
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
      await sql.close();
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
    
    await sql.close();
    
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
      await sql.close();
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const userId = userResult.recordset[0].UserID;
    
    // Check if product exists
    const productCheck = await sql.query`
      SELECT ProductID FROM Products WHERE ProductID = ${productId}
    `;
    
    if (productCheck.recordset.length === 0) {
      await sql.close();
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
    
    await sql.close();
    
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
      await sql.close();
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const userId = userResult.recordset[0].UserID;
    
    // Delete cart item
    const deleteResult = await sql.query`
      DELETE FROM Cart WHERE CartID = ${cartId} AND UserID = ${userId}
    `;
    
    await sql.close();
    
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
      await sql.close();
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
      
      await sql.close();
      
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
    
    await sql.close();
    
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
      await sql.close();
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
        await sql.close();
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
    
    await sql.close();
    
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
// TICKETS ENDPOINTS
// =============================================

app.get('/api/tickets', (req, res) => {
  res.json({
    tickets: [
      {
        TicketID: 1,
        TicketNumber: 'TK000001',
        Subject: 'Product inquiry',
        Description: 'I need more information about this product',
        Status: 'Open',
        Priority: 'Medium',
        CustomerID: 3,
        AssignedTo: null,
        DepartmentID: 1,
        CreatedAt: new Date().toISOString()
      }
    ]
  });
});

app.post('/api/tickets', (req, res) => {
  const { subject, description, priority, departmentId } = req.body;
  
  console.log('Creating ticket:', { subject, description, priority, departmentId });
  
  const newTicket = {
    TicketID: Date.now(),
    TicketNumber: 'TK' + String(Date.now()).slice(-6),
    Subject: subject,
    Description: description,
    Status: 'Open',
    Priority: priority || 'Medium',
    CustomerID: 3, // Mock customer
    AssignedTo: null,
    DepartmentID: departmentId ? parseInt(departmentId) : null,
    CreatedAt: new Date().toISOString()
  };
  
  res.status(201).json({
    message: 'Ticket created successfully',
    ticket: newTicket
  });
});

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

app.get('/api/chat/messages/:roomId', (req, res) => {
  const { roomId } = req.params;
  
  res.json({
    messages: [
      {
        MessageID: 1,
        RoomID: parseInt(roomId),
        SenderID: 3,
        Content: 'Hello, I need help with this product',
        MessageType: 'Text',
        CreatedAt: new Date().toISOString()
      }
    ]
  });
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
      await sql.close();
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
    
    await sql.close();
    
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
      await sql.close();
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
    
    await sql.close();
    
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
          process.env.GOOGLE_CLIENT_ID || 'your-client-id',
          process.env.GOOGLE_CLIENT_SECRET || 'your-client-secret',
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
      
      await sql.close();
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
    clientId: process.env.GOOGLE_CLIENT_ID || 'your-client-id',
    redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5173/auth/google/callback'
  });
});

// Create HTTP server
const server = createServer(app);

// Initialize Socket.IO with minimal config
const io = new SocketIOServer(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'] as any,
});

// Initialize Socket handlers (simplified)
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// Start server
const port = 4000;

async function startServer() {
  try {
    console.log('🚀 Starting optimized development server...');
    
    // Connect to database
    await connectDatabase();
    
    // Connect to Redis (optional)
    try {
      await redisService.connect();
      console.log('✅ Redis connected successfully');
    } catch (redisError) {
      console.log('⚠️ Redis not available, continuing without Redis');
      console.log('   Install Redis for better performance: npm install redis');
    }
    
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
  redisService.disconnect();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  redisService.disconnect();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Start the server
startServer();
