// real-server.js
const express = require('express');
const cors = require('cors');
const sql = require('mssql');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Database configuration
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

let pool = null;

// Connect to database
async function connectDB() {
  try {
    pool = await sql.connect(dbConfig);
    console.log('✅ Connected to live_support database');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: pool ? 'Connected' : 'Disconnected'
  });
});

// Login endpoint with real database
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Login attempt:', email);
    
    if (!pool) {
      return res.status(500).json({ error: 'Database not connected' });
    }
    
    // Find user by email
    const result = await pool.request()
      .input('email', sql.NVarChar, email)
      .query(`
        SELECT UserID, Email, FullName, PasswordHash, Status 
        FROM Users 
        WHERE Email = @email AND Status = 'Active'
      `);
    
    if (result.recordset.length === 0) {
      console.log('User not found:', email);
      return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
    }
    
    const user = result.recordset[0];
    console.log('User found:', user.FullName);
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.PasswordHash);
    if (!isValidPassword) {
      console.log('Invalid password for:', email);
      return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
    }
    
    // Get user role
    const roleResult = await pool.request()
      .input('userId', sql.Int, user.UserID)
      .query(`
        SELECT r.RoleName 
        FROM UserRoles ur 
        JOIN Roles r ON ur.RoleID = r.RoleID 
        WHERE ur.UserID = @userId
      `);
    
    const role = roleResult.recordset.length > 0 ? roleResult.recordset[0].RoleName : 'Customer';
    
    // Generate token
    const token = jwt.sign(
      { userId: user.UserID, email: user.Email, role: role },
      'devsecret',
      { expiresIn: '24h' }
    );
    
    console.log('Login successful:', email, 'Role:', role);
    
    res.json({
      message: 'Login successful',
      user: {
        id: user.UserID,
        email: user.Email,
        name: user.FullName,
        role: role
      },
      tokens: {
        accessToken: token,
        refreshToken: token + '_refresh'
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Categories endpoint with real database
app.get('/api/categories', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ error: 'Database not connected' });
    }
    
    const result = await pool.request().query(`
      SELECT CategoryID as id, CategoryName as name, Description 
      FROM Categories 
      WHERE IsActive = 1 
      ORDER BY SortOrder, CategoryName
    `);
    
    res.json({
      categories: result.recordset
    });
    
  } catch (error) {
    console.error('Categories error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Products endpoint with real database
app.get('/api/products', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ error: 'Database not connected' });
    }
    
    const result = await pool.request().query(`
      SELECT ProductID as id, ProductName as name, Description, Price, ImagePath 
      FROM Products 
      WHERE IsInStock = 1 
      ORDER BY ProductName
    `);
    
    res.json({
      data: result.recordset
    });
    
  } catch (error) {
    console.error('Products error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Start server
const port = 4000;
app.listen(port, async () => {
  console.log(`🚀 Real server running on port ${port}`);
  console.log(`📡 Health: http://localhost:${port}/health`);
  console.log(`🔐 Login: POST http://localhost:${port}/api/auth/login`);
  console.log(`📦 Categories: http://localhost:${port}/api/categories`);
  console.log(`🛍️ Products: http://localhost:${port}/api/products`);
  
  // Connect to database
  await connectDB();
});
