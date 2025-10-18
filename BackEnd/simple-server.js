// simple-server.js
const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    redis: 'Connected'
  });
});

// Simple login endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  console.log('Login attempt:', email);
  
  // Simple hardcoded check
  if (email === 'admin@muji.com' && password === 'admin123') {
    res.json({
      message: 'Login successful',
      user: {
        id: 1,
        email: 'admin@muji.com',
        name: 'Admin',
        role: 'Admin'
      },
      tokens: {
        accessToken: 'fake-token-' + Date.now(),
        refreshToken: 'fake-refresh-' + Date.now()
      }
    });
  } else if (email === 'agent@muji.com' && password === 'agent123') {
    res.json({
      message: 'Login successful',
      user: {
        id: 2,
        email: 'agent@muji.com',
        name: 'Agent',
        role: 'Agent'
      },
      tokens: {
        accessToken: 'fake-token-' + Date.now(),
        refreshToken: 'fake-refresh-' + Date.now()
      }
    });
  } else if (email === 'customer@muji.com' && password === 'customer123') {
    res.json({
      message: 'Login successful',
      user: {
        id: 3,
        email: 'customer@muji.com',
        name: 'Customer',
        role: 'Customer'
      },
      tokens: {
        accessToken: 'fake-token-' + Date.now(),
        refreshToken: 'fake-refresh-' + Date.now()
      }
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Simple categories endpoint
app.get('/api/categories', (req, res) => {
  res.json({
    categories: [
      { id: 1, name: 'Home & Living' },
      { id: 2, name: 'Clothing' },
      { id: 3, name: 'Stationery' },
      { id: 4, name: 'Food' }
    ]
  });
});

// Simple products endpoint
app.get('/api/products', (req, res) => {
  res.json({
    data: [
      { id: 1, name: 'Product 1', price: 100 },
      { id: 2, name: 'Product 2', price: 200 }
    ]
  });
});

// Start server
const port = 4000;
app.listen(port, () => {
  console.log(`🚀 Simple server running on port ${port}`);
  console.log(`📡 Health check: http://localhost:${port}/health`);
  console.log(`🔐 Login: http://localhost:${port}/api/auth/login`);
});