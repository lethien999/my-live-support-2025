// ===========================================
// ADMIN ROUTES - CLEAN IMPLEMENTATION
// ===========================================

import { Router } from 'express';
import { 
  getUsers, 
  getProducts, 
  getCategories, 
  getOrders, 
  getDashboardStats,
  updateUser,
  deleteUser,
  updateProduct,
  deleteProduct,
  updateCategory,
  deleteCategory,
  updateOrder
} from '../services/adminService';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

// ===========================================
// ADMIN DASHBOARD ROUTES
// ===========================================

// Test endpoint with auth
router.get('/test-auth', requireAuth, (req: AuthRequest, res) => {
  res.json({ 
    message: 'Auth working!', 
    user: req.user 
  });
});

// Temporarily disable auth for testing
// router.use(requireAuth);
// router.use(requireRole(['Admin', 'SuperAdmin']));

// Get dashboard statistics
router.get('/stats', getDashboardStats);

// Get all users
router.get('/users', getUsers);

// Get all products
router.get('/products', getProducts);

// Get all categories
router.get('/categories', getCategories);

// Get all orders
router.get('/orders', getOrders);

// ===========================================
// CRUD ROUTES
// ===========================================

// Users CRUD
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Products CRUD
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

// Categories CRUD
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// Orders CRUD
router.put('/orders/:id', updateOrder);

export default router;
