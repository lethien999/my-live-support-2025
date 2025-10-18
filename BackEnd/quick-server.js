// quick-server.js
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running!' });
});

// Login endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (email === 'admin@muji.com' && password === '111111') {
    res.json({
      message: 'Login successful',
      user: { id: 1, email, name: 'Admin', role: 'Admin' },
      tokens: { accessToken: 'token123', refreshToken: 'refresh123' }
    });
  } else if (email === 'agent@muji.com' && password === '111111') {
    res.json({
      message: 'Login successful', 
      user: { id: 2, email, name: 'Agent', role: 'Agent' },
      tokens: { accessToken: 'token123', refreshToken: 'refresh123' }
    });
  } else if (email === 'customer@muji.com' && password === '111111') {
    res.json({
      message: 'Login successful',
      user: { id: 3, email, name: 'Customer', role: 'Customer' },
      tokens: { accessToken: 'token123', refreshToken: 'refresh123' }
    });
  } else {
    res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
  }
});

// Register endpoint
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, role = 'customer' } = req.body;
  
  console.log('Registration attempt:', { name, email, role });
  
  // Simple validation
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin' });
  }
  
  if (password.length < 6) {
    return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự' });
  }
  
  // Check if email already exists (mock check)
  const existingEmails = ['admin@muji.com', 'agent@muji.com', 'customer@muji.com'];
  if (existingEmails.includes(email)) {
    return res.status(400).json({ error: 'Email đã được sử dụng' });
  }
  
  // Mock successful registration
  const newUser = {
    id: Date.now(), // Mock ID
    email,
    name,
    role: role || 'customer'
  };
  
  console.log('Registration successful:', newUser);
  
  res.json({
    message: 'Đăng ký thành công',
    user: newUser,
    tokens: {
      accessToken: 'token_' + Date.now(),
      refreshToken: 'refresh_' + Date.now()
    }
  });
});

// Categories endpoint
app.get('/api/categories', (req, res) => {
  res.json({
    categories: [
      { id: 1, name: 'Home & Living' },
      { id: 2, name: 'Clothing' },
      { id: 3, name: 'Stationery' }
    ]
  });
});

// Products endpoint  
app.get('/api/products', (req, res) => {
  res.json({
    data: [
      { id: 1, name: 'Product 1', price: 100 },
      { id: 2, name: 'Product 2', price: 200 }
    ]
  });
});

const port = 4000;
app.listen(port, () => {
  console.log(`🚀 Quick server running on port ${port}`);
  console.log(`📡 Health: http://localhost:${port}/health`);
  console.log(`🔐 Login: POST http://localhost:${port}/api/auth/login`);
  console.log(`📦 Categories: http://localhost:${port}/api/categories`);
});
