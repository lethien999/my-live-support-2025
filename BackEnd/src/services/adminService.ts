// ===========================================
// ADMIN PANEL APIs - CLEAN IMPLEMENTATION
// ===========================================

import { Request, Response } from 'express';
import sql from 'mssql';

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
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

// Helper function to get database connection
async function getDbConnection() {
  try {
    const pool = await sql.connect(dbConfig);
    return pool;
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}

// Helper function to check admin authentication
function checkAdminAuth(req: Request, res: Response): boolean {
  // Temporarily disable auth check for testing
  return true;
  
  // Commented out for testing - uncomment when auth is needed
  /*
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return false;
  }
  
  const token = authHeader.substring(7);
  // For now, we'll skip token validation for testing
  // In production, you should validate the token properly
  
  return true;
  */
}

// ===========================================
// USERS MANAGEMENT
// ===========================================

// Get all users
export async function getUsers(req: Request, res: Response) {
  try {
    if (!checkAdminAuth(req, res)) return;
    
    console.log('🔍 Admin: Getting users...');
    const pool = await getDbConnection();
    
    const result = await pool.request().query(`
      SELECT 
        UserID,
        Email,
        FullName,
        Phone,
        Address,
        Status,
        Role,
        CreatedAt,
        UpdatedAt,
        LastLoginAt,
        Avatar
      FROM Users 
      ORDER BY CreatedAt DESC
    `);
    
    const users = result.recordset.map((user: any) => ({
      id: user.UserID,
      email: user.Email,
      fullName: user.FullName,
      phone: user.Phone || '',
      address: user.Address || '',
      status: user.Status || 'Active',
      role: user.Role || 'Customer',
      createdAt: user.CreatedAt,
      updatedAt: user.UpdatedAt,
      lastLoginAt: user.LastLoginAt,
      avatar: user.Avatar || ''
    }));
    
    await pool.close();
    
    console.log(`✅ Admin: Loaded ${users.length} users`);
    res.json({
      success: true,
      data: users,
      total: users.length
    });
    
  } catch (error) {
    console.error('❌ Admin: Error getting users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// ===========================================
// PRODUCTS MANAGEMENT
// ===========================================

// Get all products
export async function getProducts(req: Request, res: Response) {
  try {
    if (!checkAdminAuth(req, res)) return;
    
    console.log('🔍 Admin: Getting products...');
    const pool = await getDbConnection();
    
    const result = await pool.request().query(`
      SELECT 
        p.ProductID,
        p.ProductName,
        p.Description,
        p.LongDescription,
        p.CategoryID,
        p.Price,
        p.OriginalPrice,
        p.ImagePath,
        p.StockQuantity,
        p.IsInStock,
        p.AverageRating,
        p.ReviewCount,
        p.CreatedAt,
        p.UpdatedAt,
        p.ShopID,
        p.IsActive,
        p.IsFeatured,
        c.CategoryName
      FROM Products p
      LEFT JOIN Categories c ON p.CategoryID = c.CategoryID
      ORDER BY p.CreatedAt DESC
    `);
    
    const products = result.recordset.map((product: any) => ({
      id: product.ProductID,
      name: product.ProductName,
      description: product.Description || '',
      longDescription: product.LongDescription || '',
      categoryId: product.CategoryID,
      categoryName: product.CategoryName || '',
      price: product.Price,
      originalPrice: product.OriginalPrice,
      imagePath: product.ImagePath || '',
      stockQuantity: product.StockQuantity || 0,
      isInStock: product.IsInStock || false,
      averageRating: product.AverageRating || 0,
      reviewCount: product.ReviewCount || 0,
      createdAt: product.CreatedAt,
      updatedAt: product.UpdatedAt,
      shopId: product.ShopID,
      isActive: product.IsActive || false,
      isFeatured: product.IsFeatured || false
    }));
    
    await pool.close();
    
    console.log(`✅ Admin: Loaded ${products.length} products`);
    res.json({
      success: true,
      data: products,
      total: products.length
    });
    
  } catch (error) {
    console.error('❌ Admin: Error getting products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// ===========================================
// CATEGORIES MANAGEMENT
// ===========================================

// Get all categories
export async function getCategories(req: Request, res: Response) {
  try {
    if (!checkAdminAuth(req, res)) return;
    
    console.log('🔍 Admin: Getting categories...');
    const pool = await getDbConnection();
    
    const result = await pool.request().query(`
      SELECT 
        CategoryID,
        CategoryName,
        ParentCategoryID,
        Description,
        IconPath,
        SortOrder,
        IsActive,
        CreatedAt
      FROM Categories 
      ORDER BY SortOrder, CategoryName
    `);
    
    const categories = result.recordset.map((category: any) => ({
      id: category.CategoryID,
      name: category.CategoryName,
      parentCategoryId: category.ParentCategoryID,
      description: category.Description || '',
      iconPath: category.IconPath || '',
      sortOrder: category.SortOrder || 0,
      isActive: category.IsActive || false,
      createdAt: category.CreatedAt
    }));
    
    await pool.close();
    
    console.log(`✅ Admin: Loaded ${categories.length} categories`);
    res.json({
      success: true,
      data: categories,
      total: categories.length
    });
    
  } catch (error) {
    console.error('❌ Admin: Error getting categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// ===========================================
// ORDERS MANAGEMENT
// ===========================================

// Get all orders
export async function getOrders(req: Request, res: Response) {
  try {
    if (!checkAdminAuth(req, res)) return;
    
    console.log('🔍 Admin: Getting orders...');
    const pool = await getDbConnection();
    
    const result = await pool.request().query(`
      SELECT 
        o.OrderID,
        o.OrderNumber,
        o.CustomerID,
        o.Status,
        o.PaymentStatus,
        o.PaymentMethod,
        o.ShippingAddress,
        o.BillingAddress,
        o.SubTotal,
        o.TaxAmount,
        o.ShippingCost,
        o.TotalAmount,
        o.Notes,
        o.CreatedAt,
        o.UpdatedAt,
        o.ShippedAt,
        o.DeliveredAt,
        u.FullName as CustomerName,
        u.Email as CustomerEmail,
        u.Phone as CustomerPhone
      FROM Orders o
      LEFT JOIN Users u ON o.CustomerID = u.UserID
      ORDER BY o.CreatedAt DESC
    `);
    
    const orders = result.recordset.map((order: any) => ({
      id: order.OrderID,
      orderNumber: order.OrderNumber,
      customerId: order.CustomerID,
      customerName: order.CustomerName || '',
      customerEmail: order.CustomerEmail || '',
      customerPhone: order.CustomerPhone || '',
      status: order.Status || 'Pending',
      paymentStatus: order.PaymentStatus || 'Pending',
      paymentMethod: order.PaymentMethod || '',
      shippingAddress: order.ShippingAddress || '',
      billingAddress: order.BillingAddress || '',
      subTotal: order.SubTotal,
      taxAmount: order.TaxAmount || 0,
      shippingCost: order.ShippingCost || 0,
      totalAmount: order.TotalAmount,
      notes: order.Notes || '',
      createdAt: order.CreatedAt,
      updatedAt: order.UpdatedAt,
      shippedAt: order.ShippedAt,
      deliveredAt: order.DeliveredAt
    }));
    
    await pool.close();
    
    console.log(`✅ Admin: Loaded ${orders.length} orders`);
    res.json({
      success: true,
      data: orders,
      total: orders.length
    });
    
  } catch (error) {
    console.error('❌ Admin: Error getting orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// ===========================================
// DASHBOARD STATISTICS
// ===========================================

// Get dashboard statistics
export async function getDashboardStats(req: Request, res: Response) {
  try {
    if (!checkAdminAuth(req, res)) return;
    
    console.log('🔍 Admin: Getting dashboard stats...');
    const pool = await getDbConnection();
    
    // Get user statistics
    const userStats = await pool.request().query(`
      SELECT 
        COUNT(*) as totalUsers,
        COUNT(CASE WHEN Status = 'Active' THEN 1 END) as activeUsers,
        COUNT(CASE WHEN Role = 'Customer' THEN 1 END) as customers,
        COUNT(CASE WHEN Role = 'Agent' THEN 1 END) as agents,
        COUNT(CASE WHEN Role = 'Admin' THEN 1 END) as admins
      FROM Users
    `);
    
    // Get product statistics
    const productStats = await pool.request().query(`
      SELECT 
        COUNT(*) as totalProducts,
        COUNT(CASE WHEN IsActive = 1 THEN 1 END) as activeProducts,
        COUNT(CASE WHEN IsInStock = 1 THEN 1 END) as inStockProducts,
        COUNT(CASE WHEN IsFeatured = 1 THEN 1 END) as featuredProducts
      FROM Products
    `);
    
    // Get order statistics
    const orderStats = await pool.request().query(`
      SELECT 
        COUNT(*) as totalOrders,
        COUNT(CASE WHEN Status = 'Pending' THEN 1 END) as pendingOrders,
        COUNT(CASE WHEN Status = 'Processing' THEN 1 END) as processingOrders,
        COUNT(CASE WHEN Status = 'Shipped' THEN 1 END) as shippedOrders,
        COUNT(CASE WHEN Status = 'Delivered' THEN 1 END) as deliveredOrders,
        COUNT(CASE WHEN Status = 'Cancelled' THEN 1 END) as cancelledOrders,
        ISNULL(SUM(CASE WHEN PaymentStatus IN ('Paid', 'Completed', 'Delivered') THEN TotalAmount END), 0) as totalRevenue,
        COUNT(CASE WHEN CreatedAt >= DATEADD(day, -7, GETDATE()) THEN 1 END) as ordersThisWeek,
        COUNT(CASE WHEN CreatedAt >= DATEADD(day, -30, GETDATE()) THEN 1 END) as ordersThisMonth
      FROM Orders
    `);
    
    // Get category statistics
    const categoryStats = await pool.request().query(`
      SELECT 
        COUNT(*) as totalCategories,
        COUNT(CASE WHEN IsActive = 1 THEN 1 END) as activeCategories
      FROM Categories
    `);
    
    await pool.close();
    
    const stats = {
      users: {
        total: userStats.recordset[0].totalUsers,
        active: userStats.recordset[0].activeUsers,
        customers: userStats.recordset[0].customers,
        agents: userStats.recordset[0].agents,
        admins: userStats.recordset[0].admins
      },
      products: {
        total: productStats.recordset[0].totalProducts,
        active: productStats.recordset[0].activeProducts,
        inStock: productStats.recordset[0].inStockProducts,
        featured: productStats.recordset[0].featuredProducts
      },
      orders: {
        total: orderStats.recordset[0].totalOrders,
        pending: orderStats.recordset[0].pendingOrders,
        processing: orderStats.recordset[0].processingOrders,
        shipped: orderStats.recordset[0].shippedOrders,
        delivered: orderStats.recordset[0].deliveredOrders,
        cancelled: orderStats.recordset[0].cancelledOrders,
        totalRevenue: orderStats.recordset[0].totalRevenue,
        thisWeek: orderStats.recordset[0].ordersThisWeek,
        thisMonth: orderStats.recordset[0].ordersThisMonth
      },
      categories: {
        total: categoryStats.recordset[0].totalCategories,
        active: categoryStats.recordset[0].activeCategories
      }
    };
    
    console.log('✅ Admin: Dashboard stats loaded');
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('❌ Admin: Error getting dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// ===========================================
// USERS CRUD OPERATIONS
// ===========================================

export const updateUser = async (req: Request, res: Response) => {
  if (!checkAdminAuth(req, res)) return;
  
  try {
    const { id } = req.params;
    const { fullName, phone, address, status, role } = req.body;
    
    const pool = await getDbConnection();
    
    await pool.request().query(`
      UPDATE Users 
      SET FullName = '${fullName}', 
          Phone = '${phone}', 
          Address = '${address}', 
          Status = '${status}', 
          Role = '${role}',
          UpdatedAt = GETDATE()
      WHERE UserID = ${id}
    `);
    
    await pool.close();
    
    res.json({ 
      success: true, 
      message: 'User updated successfully' 
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update user' 
    });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  if (!checkAdminAuth(req, res)) return;
  
  try {
    const { id } = req.params;
    
    const pool = await getDbConnection();
    
    await pool.request().query(`
      UPDATE Users 
      SET Status = 'Inactive', UpdatedAt = GETDATE()
      WHERE UserID = ${id}
    `);
    
    await pool.close();
    
    res.json({ 
      success: true, 
      message: 'User deactivated successfully' 
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete user' 
    });
  }
};

// ===========================================
// PRODUCTS CRUD OPERATIONS
// ===========================================

export const updateProduct = async (req: Request, res: Response) => {
  if (!checkAdminAuth(req, res)) return;
  
  try {
    const { id } = req.params;
    const { productName, description, longDescription, categoryId, price, originalPrice, stockQuantity, isInStock, isActive, isFeatured } = req.body;
    
    const pool = await getDbConnection();
    
    await pool.request()
      .input('productName', sql.NVarChar, productName)
      .input('description', sql.NVarChar, description)
      .input('longDescription', sql.NVarChar, longDescription)
      .input('categoryId', sql.Int, categoryId)
      .input('price', sql.Decimal(18,2), price)
      .input('originalPrice', sql.Decimal(18,2), originalPrice)
      .input('stockQuantity', sql.Int, stockQuantity)
      .input('isInStock', sql.Bit, isInStock)
      .input('isActive', sql.Bit, isActive)
      .input('isFeatured', sql.Bit, isFeatured)
      .input('id', sql.Int, id)
      .query(`
        UPDATE Products 
        SET ProductName = @productName, 
            Description = @description, 
            LongDescription = @longDescription, 
            CategoryID = @categoryId, 
            Price = @price, 
            OriginalPrice = @originalPrice, 
            StockQuantity = @stockQuantity, 
            IsInStock = @isInStock, 
            IsActive = @isActive, 
            IsFeatured = @isFeatured,
            UpdatedAt = GETDATE()
        WHERE ProductID = @id
      `);
    
    await pool.close();
    
    res.json({ 
      success: true, 
      message: 'Product updated successfully' 
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update product' 
    });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  if (!checkAdminAuth(req, res)) return;
  
  try {
    const { id } = req.params;
    
    const pool = await getDbConnection();
    
    await pool.request().query(`
      UPDATE Products 
      SET IsActive = 0, UpdatedAt = GETDATE()
      WHERE ProductID = ${id}
    `);
    
    await pool.close();
    
    res.json({ 
      success: true, 
      message: 'Product deactivated successfully' 
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete product' 
    });
  }
};

// ===========================================
// CATEGORIES CRUD OPERATIONS
// ===========================================

export const updateCategory = async (req: Request, res: Response) => {
  if (!checkAdminAuth(req, res)) return;
  
  try {
    const { id } = req.params;
    const { categoryName, description, sortOrder, isActive } = req.body;
    
    const pool = await getDbConnection();
    
    await pool.request().query(`
      UPDATE Categories 
      SET CategoryName = '${categoryName}', 
          Description = '${description}', 
          SortOrder = ${sortOrder}, 
          IsActive = ${isActive ? 1 : 0},
          UpdatedAt = GETDATE()
      WHERE CategoryID = ${id}
    `);
    
    await pool.close();
    
    res.json({ 
      success: true, 
      message: 'Category updated successfully' 
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update category' 
    });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  if (!checkAdminAuth(req, res)) return;
  
  try {
    const { id } = req.params;
    
    const pool = await getDbConnection();
    
    await pool.request().query(`
      UPDATE Categories 
      SET IsActive = 0, UpdatedAt = GETDATE()
      WHERE CategoryID = ${id}
    `);
    
    await pool.close();
    
    res.json({ 
      success: true, 
      message: 'Category deactivated successfully' 
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete category' 
    });
  }
};

// ===========================================
// ORDERS CRUD OPERATIONS
// ===========================================

export const updateOrder = async (req: Request, res: Response) => {
  if (!checkAdminAuth(req, res)) return;
  
  try {
    const { id } = req.params;
    const { status, paymentStatus, notes } = req.body;
    
    const pool = await getDbConnection();
    
    await pool.request()
      .input('status', sql.NVarChar, status)
      .input('paymentStatus', sql.NVarChar, paymentStatus)
      .input('notes', sql.NVarChar, notes)
      .input('id', sql.Int, id)
      .query(`
        UPDATE Orders 
        SET Status = @status, 
            PaymentStatus = @paymentStatus, 
            Notes = @notes,
            UpdatedAt = GETDATE()
        WHERE OrderID = @id
      `);
    
    await pool.close();
    
    res.json({ 
      success: true, 
      message: 'Order updated successfully' 
    });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update order' 
    });
  }
};
