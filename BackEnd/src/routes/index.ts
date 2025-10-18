import { Router } from 'express';
import { AuthController } from '@/controllers/auth.controller';
import { TicketController } from '@/controllers/tickets.controller';
import { ProductController } from '@/controllers/products.controller';
import { ChatController } from '@/controllers/chat.controller';
import { requireAuth, requireRole } from '@/middleware/auth';
import { authLimiter } from '@/middleware/rateLimit';
import googleAuthRoutes from './googleAuth';
import sql from 'mssql';

// Database configuration
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

const router = Router();

// Auth routes
router.post('/auth/register', authLimiter, AuthController.register);
router.post('/auth/login', authLimiter, AuthController.login);
router.post('/auth/refresh', AuthController.refreshToken);
router.post('/auth/forgot', authLimiter, AuthController.forgotPassword);
router.post('/auth/reset', authLimiter, AuthController.resetPassword);
router.post('/auth/logout', AuthController.logout);
router.get('/auth/me', requireAuth, AuthController.me);

// Google OAuth routes
router.use('/', googleAuthRoutes);

// Ticket routes
router.post('/tickets', requireAuth, TicketController.createTicket);
router.get('/tickets', requireAuth, TicketController.getTickets);
router.get('/tickets/:id', requireAuth, TicketController.getTicketById);
router.patch('/tickets/:id', requireAuth, TicketController.updateTicket);

router.get('/departments', TicketController.getDepartments);
router.get('/agents', requireAuth, requireRole(['Agent', 'Admin']), TicketController.getAgents);

// Product routes
router.get('/products', ProductController.getProducts);
router.get('/products/:id', ProductController.getProductById);
router.post('/products', requireAuth, requireRole(['Admin']), ProductController.createProduct);
router.patch('/products/:id', requireAuth, requireRole(['Admin']), ProductController.updateProduct);
router.delete('/products/:id', requireAuth, requireRole(['Admin']), ProductController.deleteProduct);

// Category routes
router.get('/categories', ProductController.getCategories);
// router.post('/categories', requireAuth, requireRole(['Admin']), CategoryController.createCategory);
// router.patch('/categories/:id', requireAuth, requireRole(['Admin']), CategoryController.updateCategory);
// router.delete('/categories/:id', requireAuth, requireRole(['Admin']), CategoryController.deleteCategory);

// Review routes
router.post('/reviews', requireAuth, ProductController.createReview);
router.get('/products/:productId/reviews', ProductController.getReviews);

// File routes - disabled
// router.post('/files', requireAuth, FileController.getUploadMiddleware(), FileController.uploadFile);
// router.get('/files/:id', requireAuth, FileController.getFile);
// router.delete('/files/:id', requireAuth, FileController.deleteFile);

// Rating routes - disabled
// router.post('/ratings', requireAuth, RatingController.createRating);
// router.get('/ratings', requireAuth, requireRole(['Agent', 'Admin']), RatingController.getRatings);
// router.get('/ratings/stats', requireAuth, requireRole(['Agent', 'Admin']), RatingController.getRatingStats);

// Chat routes
router.get('/chat/conversations', requireAuth, ChatController.getConversations);
router.get('/chat/customers', requireAuth, requireRole(['Agent', 'Admin']), ChatController.getCustomers);
router.get('/chat/messages/:chatId', requireAuth, ChatController.getMessages);
router.post('/chat/send', ChatController.sendMessage);
router.post('/chat/mark-read/:chatId', requireAuth, ChatController.markAsRead);
router.post('/chat/create-room', requireAuth, ChatController.createRoom);

// Department routes
router.get('/departments', async (req, res) => {
  try {
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
      SELECT DepartmentID as id, DepartmentName as name, Priority, Description
      FROM Departments 
      WHERE IsActive = 1
      ORDER BY DepartmentName
    `;
    
    res.json({
      success: true,
      departments: result.recordset
    });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching departments'
    });
  }
});

// Products API
router.get('/products', async (req, res) => {
  try {
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
      SELECT 
        p.ProductID as id,
        p.ProductName as name,
        p.Description,
        p.Price,
        p.CategoryID,
        c.CategoryName as categoryName,
        p.ShopID,
        s.ShopName as shopName,
        p.IsActive,
        p.CreatedAt
      FROM Products p
      LEFT JOIN Categories c ON p.CategoryID = c.CategoryID
      LEFT JOIN Shops s ON p.ShopID = s.ShopID
      WHERE p.IsActive = 1
      ORDER BY p.CreatedAt DESC
    `;
    
    res.json({
      success: true,
      products: result.recordset
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products'
    });
  }
});

// Categories API
router.get('/categories', async (req, res) => {
  try {
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
      SELECT CategoryID as id, CategoryName as name, Description, IsActive
      FROM Categories 
      WHERE IsActive = 1
      ORDER BY CategoryName
    `;
    
    res.json({
      success: true,
      categories: result.recordset
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories'
    });
  }
});

// Shops API
router.get('/shops', async (req, res) => {
  try {
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
      SELECT ShopID as id, ShopName as name, Description, Email, Phone, IsActive
      FROM Shops 
      WHERE IsActive = 1
      ORDER BY ShopName
    `;
    
    res.json({
      success: true,
      shops: result.recordset
    });
  } catch (error) {
    console.error('Error fetching shops:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching shops'
    });
  }
});

// Orders API
router.get('/orders', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await sql.connect(config);
    
    const result = await sql.query`
      SELECT 
        o.OrderID as id,
        o.OrderNumber,
        o.Status,
        o.TotalAmount,
        o.CreatedAt,
        s.ShopName,
        s.ShopID,
        o.ShippingAddress,
        o.PaymentMethod,
        o.Notes
      FROM Orders o
      LEFT JOIN Shops s ON o.ShopID = s.ShopID
      WHERE o.CustomerID = ${userId}
      ORDER BY o.CreatedAt DESC
    `;

    // Get order items for each order
    const orders = result.recordset;
    for (const order of orders) {
      const itemsResult = await sql.query`
        SELECT 
          oi.OrderItemID as id,
          oi.Quantity,
          oi.Price,
          oi.TotalPrice,
          p.ProductName,
          p.ProductID
        FROM OrderItems oi
        LEFT JOIN Products p ON oi.ProductID = p.ProductID
        WHERE oi.OrderID = ${order.id}
      `;
      order.items = itemsResult.recordset;
    }

    res.json({
      success: true,
      orders: orders
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders'
    });
  }
});

// Shopping Cart API
router.get('/cart', async (req, res) => {
  try {
    const userId = 3; // TEMPORARY: Use hardcoded user for testing
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await sql.connect(config);
    
    const result = await sql.query`
      SELECT 
        sc.CartID as CartID,
        sc.Quantity,
        sc.CreatedAt,
        p.ProductID,
        p.ProductName,
        p.Price,
        p.Description,
        s.ShopName,
        s.ShopID,
        '👕' as Image,
        'MUJI-' + CAST(p.ProductID as NVARCHAR(10)) as SKU
      FROM ShoppingCart sc
      LEFT JOIN Products p ON sc.ProductID = p.ProductID
      LEFT JOIN Shops s ON p.ShopID = s.ShopID
      WHERE sc.CustomerID = ${userId}
      ORDER BY sc.CreatedAt DESC
    `;

    res.json({
      success: true,
      cartItems: result.recordset
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching cart'
    });
  }
});

router.post('/cart/add', async (req, res) => {
  try {
    const userId = 3; // TEMPORARY: Use hardcoded user for testing
    const { productId, quantity } = req.body;
    
    if (!productId || !quantity) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await sql.connect(config);
    
    // Check if item already exists in cart
    const existingItem = await sql.query`
      SELECT CartID, Quantity FROM ShoppingCart 
      WHERE CustomerID = ${userId} AND ProductID = ${productId}
    `;

    if (existingItem.recordset.length > 0) {
      // Update quantity
      await sql.query`
        UPDATE ShoppingCart 
        SET Quantity = Quantity + ${quantity}, UpdatedAt = GETDATE()
        WHERE CustomerID = ${userId} AND ProductID = ${productId}
      `;
    } else {
      // Add new item
      await sql.query`
        INSERT INTO ShoppingCart (CustomerID, ProductID, Quantity, CreatedAt)
        VALUES (${userId}, ${productId}, ${quantity}, GETDATE())
      `;
    }

    res.json({
      success: true,
      message: 'Item added to cart'
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding to cart'
    });
  }
});

router.delete('/cart/:itemId', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user?.userId;
    const { itemId } = req.params;
    
    if (!userId || !itemId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await sql.connect(config);
    
    await sql.query`
      DELETE FROM ShoppingCart 
      WHERE CartItemID = ${itemId} AND CustomerID = ${userId}
    `;

    res.json({
      success: true,
      message: 'Item removed from cart'
    });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing from cart'
    });
  }
});

// Create Order API
router.post('/orders/create', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user?.userId;
    const { items, shippingAddress, paymentMethod, notes } = req.body;
    
    if (!userId || !items || !shippingAddress) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await sql.connect(config);
    
    // Generate order number
    const orderNumber = `ORD${Date.now().toString().slice(-8)}`;
    
    // Calculate total amount
    let totalAmount = 0;
    for (const item of items) {
      totalAmount += item.price * item.quantity;
    }

    // Create order
    const orderResult = await sql.query`
      INSERT INTO Orders (OrderNumber, CustomerID, ShopID, Status, TotalAmount, ShippingAddress, PaymentMethod, Notes, CreatedAt)
      VALUES (${orderNumber}, ${userId}, ${items[0].shopId}, 'Pending', ${totalAmount}, ${shippingAddress}, ${paymentMethod || 'COD'}, ${notes || ''}, GETDATE())
      SELECT SCOPE_IDENTITY() as OrderID
    `;

    const orderId = orderResult.recordset[0].OrderID;

    // Create order items
    for (const item of items) {
      await sql.query`
        INSERT INTO OrderItems (OrderID, ProductID, Quantity, Price, TotalPrice, CreatedAt)
        VALUES (${orderId}, ${item.productId}, ${item.quantity}, ${item.price}, ${item.price * item.quantity}, GETDATE())
      `;
    }

    // Clear cart
    await sql.query`
      DELETE FROM ShoppingCart WHERE CustomerID = ${userId}
    `;

    res.json({
      success: true,
      orderId: orderId,
      orderNumber: orderNumber,
      message: 'Order created successfully'
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
    });
  }
});

export default router;
