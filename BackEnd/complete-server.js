// complete-server.js
const express = require('express');
const cors = require('cors');
const app = express();

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
    database: 'Connected'
  });
});

// =============================================
// AUTH ENDPOINTS
// =============================================

// Login endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  console.log('Login attempt:', email);
  
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
  
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin' });
  }
  
  if (password.length < 6) {
    return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự' });
  }
  
  const existingEmails = ['admin@muji.com', 'agent@muji.com', 'customer@muji.com'];
  if (existingEmails.includes(email)) {
    return res.status(400).json({ error: 'Email đã được sử dụng' });
  }
  
  const newUser = {
    id: Date.now(),
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

// =============================================
// PRODUCTS & CATEGORIES ENDPOINTS
// =============================================

// Categories endpoint
app.get('/api/categories', (req, res) => {
  res.json({
    categories: [
      { id: 1, name: 'Home & Living', description: 'Furniture and home decoration' },
      { id: 2, name: 'Clothing', description: 'Fashion and apparel' },
      { id: 3, name: 'Stationery', description: 'Office supplies and stationery' },
      { id: 4, name: 'Food', description: 'Food and beverages' }
    ]
  });
});

// Products endpoint  
app.get('/api/products', (req, res) => {
  res.json({
    data: [
      { 
        id: 1, 
        ProductID: 1,
        ProductName: 'Wooden Chair', 
        Description: 'Comfortable wooden chair',
        Price: 299.99,
        CategoryID: 1,
        ImagePath: '/images/chair.jpg',
        StockQuantity: 50
      },
      { 
        id: 2, 
        ProductID: 2,
        ProductName: 'Cotton T-Shirt', 
        Description: 'Soft cotton t-shirt',
        Price: 29.99,
        CategoryID: 2,
        ImagePath: '/images/tshirt.jpg',
        StockQuantity: 100
      },
      { 
        id: 3, 
        ProductID: 3,
        ProductName: 'Notebook Set', 
        Description: 'Set of 3 notebooks',
        Price: 15.99,
        CategoryID: 3,
        ImagePath: '/images/notebook.jpg',
        StockQuantity: 200
      },
      { 
        id: 4, 
        ProductID: 4,
        ProductName: 'Green Tea', 
        Description: 'Premium green tea',
        Price: 12.99,
        CategoryID: 4,
        ImagePath: '/images/tea.jpg',
        StockQuantity: 150
      }
    ]
  });
});

// Product by ID endpoint
app.get('/api/products/:id', (req, res) => {
  const productId = parseInt(req.params.id);
  const products = [
    { 
      id: 1, 
      ProductID: 1,
      ProductName: 'Wooden Chair', 
      Description: 'Comfortable wooden chair for home',
      LongDescription: 'This beautiful wooden chair is made from solid oak wood and provides excellent comfort for your home.',
      Price: 299.99,
      CategoryID: 1,
      ImagePath: '/images/chair.jpg',
      StockQuantity: 50
    }
  ];
  
  const product = products.find(p => p.ProductID === productId);
  if (product) {
    res.json({ data: product });
  } else {
    res.status(404).json({ error: 'Product not found' });
  }
});

// =============================================
// TICKETS ENDPOINTS
// =============================================

// Get tickets
app.get('/api/tickets', (req, res) => {
  res.json({
    data: [
      {
        TicketID: 1,
        TicketNumber: 'TK000001',
        Subject: 'Product inquiry',
        Description: 'I want to know about the wooden chair',
        Status: 'Open',
        Priority: 'Medium',
        CustomerID: 3,
        AssignedTo: 2,
        DepartmentID: 2,
        CreatedAt: new Date().toISOString()
      },
      {
        TicketID: 2,
        TicketNumber: 'TK000002',
        Subject: 'Technical issue',
        Description: 'Website not loading properly',
        Status: 'In Progress',
        Priority: 'High',
        CustomerID: 3,
        AssignedTo: 2,
        DepartmentID: 1,
        CreatedAt: new Date().toISOString()
      }
    ]
  });
});

// Create ticket
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
// DEPARTMENTS ENDPOINTS
// =============================================

app.get('/api/departments', (req, res) => {
  res.json({
    data: [
      { DepartmentID: 1, DepartmentName: 'Technical Support', Description: 'Technical issues and troubleshooting' },
      { DepartmentID: 2, DepartmentName: 'Sales Support', Description: 'Sales inquiries and order support' },
      { DepartmentID: 3, DepartmentName: 'General Support', Description: 'General customer service' }
    ]
  });
});

// =============================================
// AGENTS ENDPOINTS
// =============================================

app.get('/api/agents', (req, res) => {
  res.json({
    data: [
      { UserID: 2, FullName: 'Agent User', Email: 'agent@muji.com', Role: 'Agent' }
    ]
  });
});

// =============================================
// CHAT ENDPOINTS
// =============================================

// Get conversations
app.get('/api/chat/conversations', (req, res) => {
  res.json({
    data: [
      {
        id: 1,
        roomId: 1,
        roomName: 'Ticket TK000001 - Product inquiry',
        lastMessage: 'Hello, I am interested in the wooden chair.',
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0,
        status: 'active'
      },
      {
        id: 2,
        roomId: 2,
        roomName: 'Ticket TK000002 - Technical issue',
        lastMessage: 'The website is not loading for me.',
        lastMessageTime: new Date().toISOString(),
        unreadCount: 1,
        status: 'active'
      }
    ]
  });
});

// Get messages for a room
app.get('/api/chat/messages', (req, res) => {
  const roomId = req.query.roomId;
  
  res.json({
    data: [
      {
        id: 1,
        roomId: parseInt(roomId),
        senderId: 3,
        senderName: 'Customer User',
        senderRole: 'Customer',
        content: 'Hello, I am interested in the wooden chair. Can you tell me more about it?',
        timestamp: new Date(Date.now() - 60000).toISOString(),
        type: 'text'
      },
      {
        id: 2,
        roomId: parseInt(roomId),
        senderId: 2,
        senderName: 'Agent User',
        senderRole: 'Agent',
        content: 'Hello! The wooden chair is made from solid oak wood and is very comfortable. Would you like to know more details?',
        timestamp: new Date().toISOString(),
        type: 'text'
      }
    ]
  });
});

// Send message
app.post('/api/chat/send', (req, res) => {
  const { chatId, content, type = 'text' } = req.body;
  
  console.log('Sending message:', { chatId, content, type });
  
  const newMessage = {
    id: Date.now(),
    roomId: parseInt(chatId),
    senderId: 3, // Mock customer
    senderName: 'Customer User',
    senderRole: 'Customer',
    content: content,
    timestamp: new Date().toISOString(),
    type: type
  };
  
  res.json({
    success: true,
    message: 'Message sent successfully',
    data: newMessage
  });
});

// =============================================
// ORDERS ENDPOINTS
// =============================================

app.get('/api/orders', (req, res) => {
  res.json({
    data: [
      {
        OrderID: 1,
        OrderNumber: 'ORD001',
        CustomerID: 3,
        Status: 'Pending',
        TotalAmount: 299.99,
        CreatedAt: new Date().toISOString(),
        Items: [
          { ProductID: 1, ProductName: 'Wooden Chair', Quantity: 1, Price: 299.99 }
        ]
      }
    ]
  });
});

app.post('/api/orders', (req, res) => {
  const { items, totalAmount } = req.body;
  
  console.log('Creating order:', { items, totalAmount });
  
  const newOrder = {
    OrderID: Date.now(),
    OrderNumber: 'ORD' + String(Date.now()).slice(-6),
    CustomerID: 3, // Mock customer
    Status: 'Pending',
    TotalAmount: totalAmount,
    CreatedAt: new Date().toISOString(),
    Items: items
  };
  
  res.status(201).json({
    message: 'Order created successfully',
    order: newOrder
  });
});

// =============================================
// CART ENDPOINTS
// =============================================

app.get('/api/cart', (req, res) => {
  // Mock cart data
  res.json({
    success: true,
    cartItems: [
      {
        CartID: 1,
        ProductID: 1,
        ProductName: 'Wooden Chair',
        Price: 299.99,
        Quantity: 2,
        Image: '/images/products/wooden-chair.jpg',
        ShopName: 'MUJI Store',
        SKU: 'WC001',
        Description: 'Comfortable wooden chair for home'
      },
      {
        CartID: 2,
        ProductID: 4,
        ProductName: 'Cotton T-Shirt',
        Price: 29.99,
        Quantity: 3,
        Image: '/images/products/cotton-tshirt.jpg',
        ShopName: 'MUJI Store',
        SKU: 'CTS001',
        Description: 'Soft cotton t-shirt'
      }
    ]
  });
});

app.post('/api/cart/add', (req, res) => {
  const { productId, quantity } = req.body;
  
  console.log('Adding to cart:', { productId, quantity });
  
  res.json({
    success: true,
    message: 'Product added to cart successfully'
  });
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

app.delete('/api/cart/:cartId', (req, res) => {
  const { cartId } = req.params;
  
  console.log('Removing cart item:', { cartId });
  
  res.json({
    success: true,
    message: 'Cart item removed successfully'
  });
});

// =============================================
// REVIEWS ENDPOINTS
// =============================================

app.get('/api/products/:productId/reviews', (req, res) => {
  const { productId } = req.params;
  
  console.log('Getting reviews for product:', productId);
  
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
      },
      {
        ReviewID: 2,
        ProductID: parseInt(productId),
        CustomerID: 4,
        Rating: 4,
        Title: 'Good product',
        Comment: 'Nice quality product. Fits well and comfortable to use.',
        IsVerified: true,
        CreatedAt: new Date().toISOString(),
        CustomerName: 'John Doe'
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

app.get('/api/wishlist', (req, res) => {
  console.log('Getting wishlist items');
  
  res.json({
    success: true,
    wishlistItems: [
      {
        WishlistID: 1,
        ProductID: 1,
        ProductName: 'Wooden Chair',
        Price: 299.99,
        Image: '/images/products/wooden-chair.jpg',
        AddedAt: new Date().toISOString()
      },
      {
        WishlistID: 2,
        ProductID: 13,
        ProductName: 'Wireless Headphones',
        Price: 199.99,
        Image: '/images/products/wireless-headphones.jpg',
        AddedAt: new Date().toISOString()
      }
    ]
  });
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

app.get('/api/notifications', (req, res) => {
  console.log('Getting notifications');
  
  res.json({
    success: true,
    notifications: [
      {
        NotificationID: 1,
        UserID: 3,
        Title: 'Order Delivered',
        Message: 'Your order ORD000001 has been delivered successfully!',
        Type: 'Success',
        IsRead: false,
        ActionUrl: '/orders/1',
        CreatedAt: new Date().toISOString()
      },
      {
        NotificationID: 2,
        UserID: 3,
        Title: 'New Product Available',
        Message: 'Check out our new wireless headphones!',
        Type: 'Info',
        IsRead: true,
        ActionUrl: '/products/13',
        CreatedAt: new Date().toISOString()
      }
    ]
  });
});

app.put('/api/notifications/:notificationId/read', (req, res) => {
  const { notificationId } = req.params;
  
  console.log('Marking notification as read:', { notificationId });
  
  res.json({
    success: true,
    message: 'Notification marked as read'
  });
});

// Start server
const port = 4000;
app.listen(port, () => {
  console.log(`🚀 Complete server running on port ${port}`);
  console.log(`📡 Health: http://localhost:${port}/health`);
  console.log(`🔐 Auth: http://localhost:${port}/api/auth/login`);
  console.log(`📦 Products: http://localhost:${port}/api/products`);
  console.log(`🎫 Tickets: http://localhost:${port}/api/tickets`);
  console.log(`💬 Chat: http://localhost:${port}/api/chat/conversations`);
  console.log(`🛒 Orders: http://localhost:${port}/api/orders`);
});
