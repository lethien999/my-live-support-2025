import React, { useState, useEffect } from 'react';
import { formatDate } from '../utils/dateUtils';
import AuthChatService from '../services/AuthChatService';
import { getApiUrl } from '../config/api';

interface User {
  UserID: number;
  Email: string;
  FullName: string;
  Phone: string;
  Address: string;
  Status: string;
  CreatedAt: string;
  Role: string;
}

interface Product {
  ProductID: number;
  ProductName: string;
  Description: string;
  Price: number;
  StockQuantity: number;
  ImagePath: string;
  Status: string;
  CreatedAt: string;
  CategoryName: string;
}

interface Category {
  CategoryID: number;
  CategoryName: string;
  Description: string;
  IconPath: string;
  Status: string;
  CreatedAt: string;
}

interface Order {
  OrderID: number;
  OrderNumber: string;
  UserID: number;
  OrderDate: string;
  TotalAmount: number;
  Status: string;
  ShippingAddress: string;
  PaymentMethod: string;
  ShippingMethod: string;
  Notes: string;
  CreatedAt: string;
  CustomerName: string;
  CustomerEmail: string;
}

interface OrderItem {
  OrderItemID: number;
  ProductID: number;
  Quantity: number;
  ProductPrice: number;
  SubTotal: number;
  ProductName: string;
  ImagePath: string;
}

interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  recentOrders: number;
}

const AdminDashboardPage: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null);
  const [_loading, _setLoading] = useState(false);
  const [_usersLoading, _setUsersLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [_categoriesLoading, _setCategoriesLoading] = useState(false);
  const [_ordersLoading, _setOrdersLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  // Form states
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    phone: '',
    address: '',
    password: '',
    status: 'Active'
  });

  const [productFormData, setProductFormData] = useState({
    productName: '',
    description: '',
    price: '',
    stockQuantity: '',
    imagePath: '',
    categoryId: '',
    status: 'Active'
  });

  const [categoryFormData, setCategoryFormData] = useState({
    categoryName: '',
    description: '',
    iconPath: '',
    status: 'Active'
  });

  useEffect(() => {
    initializeAdminDashboard();
  }, []); // Empty dependency array - only run once

  const initializeAdminDashboard = async () => {
    try {
      AuthChatService.init();
      let user = AuthChatService.getCurrentUser();
      
      // If no user or not admin, try to login as admin
      if (!user || user.email !== 'admin@muji.com') {
        console.log('🔍 AdminDashboard - No admin user found, attempting auto-login...');
        
        try {
          const loginResponse = await fetch(getApiUrl('/api/auth/login'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@muji.com', password: '111111' })
          });
          
          const loginData = await loginResponse.json();
          if (loginData.success) {
            console.log('✅ AdminDashboard - Auto-login successful');
            sessionStorage.setItem('accessToken', loginData.tokens.accessToken);
            sessionStorage.setItem('refreshToken', loginData.tokens.refreshToken);
            sessionStorage.setItem('currentUser', JSON.stringify(loginData.user));
            
            user = loginData.user;
            setCurrentUser(user);
          } else {
            console.error('❌ AdminDashboard - Auto-login failed:', loginData);
            window.location.href = '/dashboard';
            return;
          }
        } catch (loginError) {
          console.error('❌ AdminDashboard - Auto-login error:', loginError);
          window.location.href = '/dashboard';
          return;
        }
      }
      
      if (user && user.email === 'admin@muji.com') {
        setCurrentUser(user);
        // Load data only once
        loadUsers();
        loadProducts();
        loadCategories();
        loadOrders();
        loadOrderStats();
      } else {
        // Redirect non-admin users
        window.location.href = '/dashboard';
      }
    } catch (error) {
      console.error('❌ AdminDashboard - Initialization error:', error);
      window.location.href = '/dashboard';
    }
  };

  // Load data when activeTab changes
  useEffect(() => {
    if (currentUser && currentUser.email === 'admin@muji.com') {
      if (activeTab === 'users' && users.length === 0) {
        loadUsers();
      } else if (activeTab === 'products' && products.length === 0) {
        loadProducts();
      } else if (activeTab === 'categories' && categories.length === 0) {
        loadCategories();
      } else if (activeTab === 'orders' && orders.length === 0) {
        loadOrders();
      }
    }
  }, [activeTab, currentUser, users.length, products.length, categories.length, orders.length]);

  const loadUsers = async () => {
    try {
      const token = await AuthChatService.getToken();
      
      console.log('🔍 AdminDashboard - loadUsers - Token:', token);
      console.log('🔍 AdminDashboard - loadUsers - API URL:', getApiUrl('/api/admin/users'));
      
      if (!token) {
        console.log('❌ AdminDashboard - No token available for loadUsers');
        return;
      }

      const response = await fetch(getApiUrl('/api/admin/users'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('🔍 AdminDashboard - loadUsers - Response status:', response.status);
      console.log('🔍 AdminDashboard - loadUsers - Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('🔍 AdminDashboard - loadUsers - Error response:', errorText);
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      alert('Không thể tải danh sách người dùng');
    }
  };

  const loadProducts = async () => {
    if (productsLoading) {
      console.log('🔍 AdminDashboard - loadProducts already in progress, skipping');
      return;
    }
    
    try {
      setProductsLoading(true);
      const token = await AuthChatService.getToken();
      
      console.log('🔍 AdminDashboard - loadProducts - Token:', token);
      console.log('🔍 AdminDashboard - loadProducts - API URL:', getApiUrl('/api/admin/products'));
      
      if (!token) {
        console.log('❌ AdminDashboard - No token available for loadProducts');
        console.log('🔍 AdminDashboard - Attempting to login as admin...');
        
        // Try to login as admin automatically
        try {
          const loginResponse = await fetch(getApiUrl('/api/auth/login'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@muji.com', password: '111111' })
          });
          
          const loginData = await loginResponse.json();
          if (loginData.success) {
            console.log('✅ AdminDashboard - Auto-login successful for products');
            sessionStorage.setItem('accessToken', loginData.tokens.accessToken);
            sessionStorage.setItem('refreshToken', loginData.tokens.refreshToken);
            sessionStorage.setItem('user', JSON.stringify(loginData.user));
            
            // Retry with new token
            const newToken = loginData.tokens.accessToken;
            const response = await fetch(getApiUrl('/api/admin/products'), {
              headers: { 'Authorization': `Bearer ${newToken}` }
            });
            
            if (response.ok) {
              const data = await response.json();
              if (data.success) {
                setProducts(data.products);
                console.log('✅ AdminDashboard - Products loaded after auto-login');
                return;
              }
            }
          }
        } catch (loginError) {
          console.error('❌ AdminDashboard - Auto-login failed for products:', loginError);
        }
        
        return;
      }

      const response = await fetch(getApiUrl('/api/admin/products'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('🔍 AdminDashboard - loadProducts - Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('🔍 AdminDashboard - loadProducts - Error response:', errorText);
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      if (data.success) {
        setProducts(data.products);
        console.log('✅ AdminDashboard - Products loaded successfully:', data.products.length);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      alert('Không thể tải danh sách sản phẩm');
    } finally {
      setProductsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const token = await AuthChatService.getToken();
      
      if (!token) {
        console.log('❌ AdminDashboard - No token available for loadCategories');
        console.log('🔍 AdminDashboard - Attempting to login as admin...');
        
        // Try to login as admin automatically
        try {
          const loginResponse = await fetch(getApiUrl('/api/auth/login'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@muji.com', password: '111111' })
          });
          
          const loginData = await loginResponse.json();
          if (loginData.success) {
            console.log('✅ AdminDashboard - Auto-login successful for categories');
            sessionStorage.setItem('accessToken', loginData.tokens.accessToken);
            sessionStorage.setItem('refreshToken', loginData.tokens.refreshToken);
            sessionStorage.setItem('user', JSON.stringify(loginData.user));
            
            // Retry with new token
            const newToken = loginData.tokens.accessToken;
            const response = await fetch(getApiUrl('/api/admin/categories'), {
              headers: { 'Authorization': `Bearer ${newToken}` }
            });
            
            if (response.ok) {
              const data = await response.json();
              if (data.success) {
                setCategories(data.categories);
                console.log('✅ AdminDashboard - Categories loaded after auto-login');
                return;
              }
            }
          }
        } catch (loginError) {
          console.error('❌ AdminDashboard - Auto-login failed for categories:', loginError);
        }
        
        return;
      }

      const response = await fetch(getApiUrl('/api/admin/categories'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }

      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      alert('Không thể tải danh sách danh mục');
    }
  };

  const loadOrders = async () => {
    try {
      const token = await AuthChatService.getToken();
      
      if (!token) {
        console.log('❌ AdminDashboard - No token available for loadOrders');
        console.log('🔍 AdminDashboard - Attempting to login as admin...');
        
        // Try to login as admin automatically
        try {
          const loginResponse = await fetch(getApiUrl('/api/auth/login'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@muji.com', password: '111111' })
          });
          
          const loginData = await loginResponse.json();
          if (loginData.success) {
            console.log('✅ AdminDashboard - Auto-login successful for orders');
            sessionStorage.setItem('accessToken', loginData.tokens.accessToken);
            sessionStorage.setItem('refreshToken', loginData.tokens.refreshToken);
            sessionStorage.setItem('user', JSON.stringify(loginData.user));
            
            // Retry with new token
            const newToken = loginData.tokens.accessToken;
            const response = await fetch(getApiUrl('/api/admin/orders'), {
              headers: { 'Authorization': `Bearer ${newToken}` }
            });
            
            if (response.ok) {
              const data = await response.json();
              if (data.success) {
                setOrders(data.orders);
                console.log('✅ AdminDashboard - Orders loaded after auto-login');
                return;
              }
            }
          }
        } catch (loginError) {
          console.error('❌ AdminDashboard - Auto-login failed for orders:', loginError);
        }
        
        return;
      }

      const response = await fetch(getApiUrl('/api/admin/orders'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      alert('Không thể tải danh sách đơn hàng');
    }
  };

  const loadOrderStats = async () => {
    try {
      const token = await AuthChatService.getToken();
      
      if (!token) {
        console.log('❌ AdminDashboard - No token available for loadOrderStats');
        console.log('🔍 AdminDashboard - Attempting to login as admin...');
        
        // Try to login as admin automatically
        try {
          const loginResponse = await fetch(getApiUrl('/api/auth/login'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@muji.com', password: '111111' })
          });
          
          const loginData = await loginResponse.json();
          if (loginData.success) {
            console.log('✅ AdminDashboard - Auto-login successful for order stats');
            sessionStorage.setItem('accessToken', loginData.tokens.accessToken);
            sessionStorage.setItem('refreshToken', loginData.tokens.refreshToken);
            sessionStorage.setItem('user', JSON.stringify(loginData.user));
            
            // Retry with new token
            const newToken = loginData.tokens.accessToken;
            const response = await fetch(getApiUrl('/api/admin/orders/stats'), {
              headers: { 'Authorization': `Bearer ${newToken}` }
            });
            
            if (response.ok) {
              const data = await response.json();
              if (data.success) {
                setOrderStats(data.stats);
                console.log('✅ AdminDashboard - Order stats loaded after auto-login');
                return;
              }
            }
          }
        } catch (loginError) {
          console.error('❌ AdminDashboard - Auto-login failed for order stats:', loginError);
        }
        
        return;
      }

      const response = await fetch(getApiUrl('/api/admin/orders/stats'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch order stats');
      }

      const data = await response.json();
      if (data.success) {
        setOrderStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading order stats:', error);
    }
  };

  const loadOrderDetails = async (orderId: number) => {
    try {
      const token = AuthChatService.getToken();
      
      const response = await fetch(getApiUrl(`/api/admin/orders/${orderId}`), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch order details');
      }

      const data = await response.json();
      if (data.success) {
        setSelectedOrder(data.order);
        setOrderItems(data.items);
        setShowOrderDetails(true);
      }
    } catch (error) {
      console.error('Error loading order details:', error);
      alert('Không thể tải chi tiết đơn hàng');
    }
  };

  const updateOrderStatus = async (orderId: number, status: string, notes: string = '') => {
    try {
      const token = AuthChatService.getToken();
      
      const response = await fetch(getApiUrl(`/api/admin/orders/${orderId}/status`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status, notes })
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Cập nhật trạng thái đơn hàng thành công!');
        loadOrders();
        loadOrderStats();
      } else {
        alert('Lỗi: ' + data.message);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Không thể cập nhật trạng thái đơn hàng');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = AuthChatService.getToken();
      
      const response = await fetch(getApiUrl('/api/admin/users'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Tạo người dùng thành công!');
        setShowCreateUser(false);
        setFormData({ email: '', fullName: '', phone: '', address: '', password: '', status: 'Active' });
        loadUsers();
      } else {
        alert('Lỗi: ' + data.message);
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Không thể tạo người dùng');
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingUser) return;
    
    try {
      const token = AuthChatService.getToken();
      
      const response = await fetch(getApiUrl(`/api/admin/users/${editingUser.UserID}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Cập nhật người dùng thành công!');
        setEditingUser(null);
        setFormData({ email: '', fullName: '', phone: '', address: '', password: '', status: 'Active' });
        loadUsers();
      } else {
        alert('Lỗi: ' + data.message);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Không thể cập nhật người dùng');
    }
  };

  const handleDeleteUser = async (userId: number, email: string) => {
    if (email === 'admin@muji.com') {
      alert('Không thể xóa tài khoản admin!');
      return;
    }
    
    if (!confirm(`Bạn có chắc muốn xóa người dùng này?`)) {
      return;
    }
    
    try {
      const token = AuthChatService.getToken();
      
      const response = await fetch(getApiUrl(`/api/admin/users/${userId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Xóa người dùng thành công!');
        loadUsers();
      } else {
        alert('Lỗi: ' + data.message);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Không thể xóa người dùng');
    }
  };

  // Product Management Functions
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = AuthChatService.getToken();
      
      const response = await fetch(getApiUrl('/api/admin/products'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...productFormData,
          price: parseFloat(productFormData.price),
          stockQuantity: parseInt(productFormData.stockQuantity),
          categoryId: productFormData.categoryId ? parseInt(productFormData.categoryId) : null
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Tạo sản phẩm thành công!');
        setShowCreateProduct(false);
        setProductFormData({ productName: '', description: '', price: '', stockQuantity: '', imagePath: '', categoryId: '', status: 'Active' });
        loadProducts();
      } else {
        alert('Lỗi: ' + data.message);
      }
    } catch (error) {
      console.error('Error creating product:', error);
      alert('Không thể tạo sản phẩm');
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingProduct) return;
    
    try {
      const token = AuthChatService.getToken();
      
      const response = await fetch(getApiUrl(`/api/admin/products/${editingProduct.ProductID}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...productFormData,
          price: parseFloat(productFormData.price),
          stockQuantity: parseInt(productFormData.stockQuantity),
          categoryId: productFormData.categoryId ? parseInt(productFormData.categoryId) : null
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Cập nhật sản phẩm thành công!');
        setEditingProduct(null);
        setProductFormData({ productName: '', description: '', price: '', stockQuantity: '', imagePath: '', categoryId: '', status: 'Active' });
        loadProducts();
      } else {
        alert('Lỗi: ' + data.message);
      }
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Không thể cập nhật sản phẩm');
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!confirm(`Bạn có chắc muốn xóa sản phẩm này?`)) {
      return;
    }
    
    try {
      const token = AuthChatService.getToken();
      
      const response = await fetch(getApiUrl(`/api/admin/products/${productId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Xóa sản phẩm thành công!');
        loadProducts();
      } else {
        alert('Lỗi: ' + data.message);
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Không thể xóa sản phẩm');
    }
  };

  const openEditProductModal = (product: Product) => {
    setEditingProduct(product);
    setProductFormData({
      productName: product.ProductName,
      description: product.Description || '',
      price: product.Price.toString(),
      stockQuantity: product.StockQuantity.toString(),
      imagePath: product.ImagePath || '',
      categoryId: '', // Will be set based on category name
      status: product.Status
    });
  };

  // Category Management Functions
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = AuthChatService.getToken();
      
      const response = await fetch(getApiUrl('/api/admin/categories'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(categoryFormData)
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Tạo danh mục thành công!');
        setShowCreateCategory(false);
        setCategoryFormData({ categoryName: '', description: '', iconPath: '', status: 'Active' });
        loadCategories();
      } else {
        alert('Lỗi: ' + data.message);
      }
    } catch (error) {
      console.error('Error creating category:', error);
      alert('Không thể tạo danh mục');
    }
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.Email,
      fullName: user.FullName,
      phone: user.Phone || '',
      address: user.Address || '',
      password: '',
      status: user.Status
    });
  };

  const closeModals = () => {
    setShowCreateUser(false);
    setEditingUser(null);
    setFormData({ email: '', fullName: '', phone: '', address: '', password: '', status: 'Active' });
  };

  if (!currentUser || currentUser.email !== 'admin@muji.com') {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '50vh',
        fontSize: '18px',
        color: '#666',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div>🔐 Đang xác thực quyền admin...</div>
        <div style={{ fontSize: '14px', color: '#999' }}>
          Nếu bạn là admin, hãy đăng nhập với tài khoản admin@muji.com
        </div>
        <button 
          onClick={() => {
            // Clear current session and redirect to login
            sessionStorage.clear();
            localStorage.clear();
            window.location.href = '/login';
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Đăng nhập Admin
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#fff',
        padding: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ margin: 0, color: '#333' }}>Admin Dashboard</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span>Xin chào, {currentUser.name}</span>
            <button
              onClick={() => {
                AuthChatService.logout();
                window.location.href = '/';
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', maxWidth: '1200px', margin: '0 auto', gap: '20px' }}>
        {/* Sidebar */}
        <div style={{
          width: '250px',
          backgroundColor: '#fff',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          height: 'fit-content'
        }}>
          <nav>
            <div
              onClick={() => setActiveTab('dashboard')}
              style={{
                padding: '12px',
                cursor: 'pointer',
                borderRadius: '4px',
                backgroundColor: activeTab === 'dashboard' ? '#007bff' : 'transparent',
                color: activeTab === 'dashboard' ? 'white' : '#333',
                marginBottom: '8px'
              }}
            >
              📊 Dashboard
            </div>
            <div
              onClick={() => setActiveTab('users')}
              style={{
                padding: '12px',
                cursor: 'pointer',
                borderRadius: '4px',
                backgroundColor: activeTab === 'users' ? '#007bff' : 'transparent',
                color: activeTab === 'users' ? 'white' : '#333',
                marginBottom: '8px'
              }}
            >
              👥 Quản lý người dùng
            </div>
            <div
              onClick={() => setActiveTab('products')}
              style={{
                padding: '12px',
                cursor: 'pointer',
                borderRadius: '4px',
                backgroundColor: activeTab === 'products' ? '#007bff' : 'transparent',
                color: activeTab === 'products' ? 'white' : '#333',
                marginBottom: '8px'
              }}
            >
              🛒 Quản lý sản phẩm
            </div>
            <div
              onClick={() => setActiveTab('orders')}
              style={{
                padding: '12px',
                cursor: 'pointer',
                borderRadius: '4px',
                backgroundColor: activeTab === 'orders' ? '#007bff' : 'transparent',
                color: activeTab === 'orders' ? 'white' : '#333',
                marginBottom: '8px'
              }}
            >
              📦 Quản lý đơn hàng
            </div>
            <div
              onClick={() => setActiveTab('settings')}
              style={{
                padding: '12px',
                cursor: 'pointer',
                borderRadius: '4px',
                backgroundColor: activeTab === 'settings' ? '#007bff' : 'transparent',
                color: activeTab === 'settings' ? 'white' : '#333',
                marginBottom: '8px'
              }}
            >
              ⚙️ Cài đặt hệ thống
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1 }}>
          {activeTab === 'dashboard' && (
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              padding: '20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <h2>📊 Dashboard Tổng Quan</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '20px' }}>
                <div style={{ padding: '20px', backgroundColor: '#e3f2fd', borderRadius: '8px', textAlign: 'center' }}>
                  <h3 style={{ margin: 0, color: '#1976d2' }}>{users.length}</h3>
                  <p style={{ margin: '8px 0 0 0', color: '#666' }}>Tổng người dùng</p>
                </div>
                <div style={{ padding: '20px', backgroundColor: '#f3e5f5', borderRadius: '8px', textAlign: 'center' }}>
                  <h3 style={{ margin: 0, color: '#7b1fa2' }}>{users.filter(u => u.Role === 'Customer').length}</h3>
                  <p style={{ margin: '8px 0 0 0', color: '#666' }}>Khách hàng</p>
                </div>
                <div style={{ padding: '20px', backgroundColor: '#e8f5e8', borderRadius: '8px', textAlign: 'center' }}>
                  <h3 style={{ margin: 0, color: '#388e3c' }}>{users.filter(u => u.Role === 'Agent').length}</h3>
                  <p style={{ margin: '8px 0 0 0', color: '#666' }}>Nhân viên</p>
                </div>
                <div style={{ padding: '20px', backgroundColor: '#fff3e0', borderRadius: '8px', textAlign: 'center' }}>
                  <h3 style={{ margin: 0, color: '#f57c00' }}>{users.filter(u => u.Status === 'Active').length}</h3>
                  <p style={{ margin: '8px 0 0 0', color: '#666' }}>Tài khoản hoạt động</p>
                </div>
                <div style={{ padding: '20px', backgroundColor: '#e8f5e8', borderRadius: '8px', textAlign: 'center' }}>
                  <h3 style={{ margin: 0, color: '#28a745' }}>{products.length}</h3>
                  <p style={{ margin: '8px 0 0 0', color: '#666' }}>Sản phẩm</p>
                </div>
                <div style={{ padding: '20px', backgroundColor: '#f8d7da', borderRadius: '8px', textAlign: 'center' }}>
                  <h3 style={{ margin: 0, color: '#dc3545' }}>{orderStats?.totalOrders || 0}</h3>
                  <p style={{ margin: '8px 0 0 0', color: '#666' }}>Tổng đơn hàng</p>
                </div>
                <div style={{ padding: '20px', backgroundColor: '#d1ecf1', borderRadius: '8px', textAlign: 'center' }}>
                  <h3 style={{ margin: 0, color: '#0c5460' }}>
                    {orderStats?.totalRevenue ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(orderStats.totalRevenue) : '0₫'}
                  </h3>
                  <p style={{ margin: '8px 0 0 0', color: '#666' }}>Tổng doanh thu</p>
                </div>
                <div style={{ padding: '20px', backgroundColor: '#d4edda', borderRadius: '8px', textAlign: 'center' }}>
                  <h3 style={{ margin: 0, color: '#155724' }}>{orderStats?.recentOrders || 0}</h3>
                  <p style={{ margin: '8px 0 0 0', color: '#666' }}>Đơn hàng tuần này</p>
                </div>
              </div>
              
              {/* Order Status Overview */}
              {orderStats && (
                <div style={{ marginTop: '30px' }}>
                  <h3>📈 Tình trạng đơn hàng</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginTop: '15px' }}>
                    <div style={{ padding: '15px', backgroundColor: '#fff3cd', borderRadius: '8px', textAlign: 'center' }}>
                      <h4 style={{ margin: 0, color: '#856404' }}>{orderStats.pendingOrders}</h4>
                      <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>Chờ xử lý</p>
                    </div>
                    <div style={{ padding: '15px', backgroundColor: '#cce5ff', borderRadius: '8px', textAlign: 'center' }}>
                      <h4 style={{ margin: 0, color: '#004085' }}>{orderStats.processingOrders}</h4>
                      <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>Đang xử lý</p>
                    </div>
                    <div style={{ padding: '15px', backgroundColor: '#d1ecf1', borderRadius: '8px', textAlign: 'center' }}>
                      <h4 style={{ margin: 0, color: '#0c5460' }}>{orderStats.shippedOrders}</h4>
                      <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>Đã gửi</p>
                    </div>
                    <div style={{ padding: '15px', backgroundColor: '#d4edda', borderRadius: '8px', textAlign: 'center' }}>
                      <h4 style={{ margin: 0, color: '#155724' }}>{orderStats.deliveredOrders}</h4>
                      <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>Đã giao</p>
                    </div>
                    <div style={{ padding: '15px', backgroundColor: '#f8d7da', borderRadius: '8px', textAlign: 'center' }}>
                      <h4 style={{ margin: 0, color: '#721c24' }}>{orderStats.cancelledOrders}</h4>
                      <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>Đã hủy</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              padding: '20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>👥 Quản lý người dùng</h2>
                <button
                  onClick={() => setShowCreateUser(true)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  ➕ Thêm người dùng
                </button>
              </div>

              {_loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <p>Đang tải...</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8f9fa' }}>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>ID</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Email</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Tên</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Vai trò</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Trạng thái</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Ngày tạo</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.UserID}>
                          <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>{user.UserID}</td>
                          <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>{user.Email}</td>
                          <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>{user.FullName}</td>
                          <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              backgroundColor: user.Role === 'Admin' ? '#dc3545' : user.Role === 'Agent' ? '#28a745' : '#007bff',
                              color: 'white'
                            }}>
                              {user.Role}
                            </span>
                          </td>
                          <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              backgroundColor: user.Status === 'Active' ? '#28a745' : '#dc3545',
                              color: 'white'
                            }}>
                              {user.Status}
                            </span>
                          </td>
                          <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>
                            {formatDate(user.CreatedAt)}
                          </td>
                          <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>
                            <button
                              onClick={() => openEditModal(user)}
                              style={{
                                padding: '4px 8px',
                                backgroundColor: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                marginRight: '8px'
                              }}
                            >
                              ✏️ Sửa
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.UserID, user.Email)}
                              style={{
                                padding: '4px 8px',
                                backgroundColor: '#dc3545',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                            >
                              🗑️ Xóa
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'products' && (
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              padding: '20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>🛒 Quản lý sản phẩm {productsLoading && <span style={{ color: '#007bff' }}>(Đang tải...)</span>}</h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setShowCreateCategory(true)}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#17a2b8',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    📁 Thêm danh mục
                  </button>
                  <button
                    onClick={() => setShowCreateProduct(true)}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    ➕ Thêm sản phẩm
                  </button>
                </div>
              </div>

              {_loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <p>Đang tải...</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8f9fa' }}>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>ID</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Hình ảnh</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Tên sản phẩm</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Giá</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Tồn kho</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Danh mục</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Trạng thái</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Ngày tạo</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => (
                        <tr key={product.ProductID}>
                          <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>{product.ProductID}</td>
                          <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>
                            <img 
                              src={product.ImagePath || '/images/products/default.jpg'} 
                              alt={product.ProductName}
                              style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                              onError={(e) => {
                                e.currentTarget.src = '/images/products/default.jpg';
                              }}
                            />
                          </td>
                          <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>{product.ProductName}</td>
                          <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.Price)}
                          </td>
                          <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>{product.StockQuantity}</td>
                          <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>{product.CategoryName || 'Chưa phân loại'}</td>
                          <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              backgroundColor: product.Status === 'Active' ? '#28a745' : '#dc3545',
                              color: 'white'
                            }}>
                              {product.Status}
                            </span>
                          </td>
                          <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>
                            {formatDate(product.CreatedAt)}
                          </td>
                          <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>
                            <button
                              onClick={() => openEditProductModal(product)}
                              style={{
                                padding: '4px 8px',
                                backgroundColor: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                marginRight: '8px'
                              }}
                            >
                              ✏️ Sửa
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.ProductID)}
                              style={{
                                padding: '4px 8px',
                                backgroundColor: '#dc3545',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                            >
                              🗑️ Xóa
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              padding: '20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <h2>📦 Quản lý đơn hàng</h2>
              
              {_loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <p>Đang tải...</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8f9fa' }}>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Mã đơn</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Khách hàng</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Tổng tiền</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Trạng thái</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Phương thức</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Ngày đặt</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.OrderID}>
                          <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>{order.OrderNumber}</td>
                          <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>
                            <div>
                              <div style={{ fontWeight: '500' }}>{order.CustomerName}</div>
                              <div style={{ fontSize: '12px', color: '#666' }}>{order.CustomerEmail}</div>
                            </div>
                          </td>
                          <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.TotalAmount)}
                          </td>
                          <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              backgroundColor: 
                                order.Status === 'Pending' ? '#fff3cd' :
                                order.Status === 'Processing' ? '#cce5ff' :
                                order.Status === 'Shipped' ? '#d1ecf1' :
                                order.Status === 'Delivered' ? '#d4edda' :
                                order.Status === 'Cancelled' ? '#f8d7da' : '#e2e3e5',
                              color: 
                                order.Status === 'Pending' ? '#856404' :
                                order.Status === 'Processing' ? '#004085' :
                                order.Status === 'Shipped' ? '#0c5460' :
                                order.Status === 'Delivered' ? '#155724' :
                                order.Status === 'Cancelled' ? '#721c24' : '#383d41'
                            }}>
                              {order.Status}
                            </span>
                          </td>
                          <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>
                            <div>
                              <div style={{ fontSize: '12px' }}>💳 {order.PaymentMethod}</div>
                              <div style={{ fontSize: '12px', color: '#666' }}>🚚 {order.ShippingMethod}</div>
                            </div>
                          </td>
                          <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>
                            {formatDate(order.CreatedAt)}
                          </td>
                          <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>
                            <button
                              onClick={() => loadOrderDetails(order.OrderID)}
                              style={{
                                padding: '4px 8px',
                                backgroundColor: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                marginRight: '8px'
                              }}
                            >
                              👁️ Xem
                            </button>
                            <select
                              onChange={(e) => {
                                if (e.target.value && e.target.value !== order.Status) {
                                  updateOrderStatus(order.OrderID, e.target.value);
                                }
                              }}
                              value={order.Status}
                              style={{
                                padding: '4px 8px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '12px'
                              }}
                            >
                              <option value="Pending">Chờ xử lý</option>
                              <option value="Processing">Đang xử lý</option>
                              <option value="Shipped">Đã gửi</option>
                              <option value="Delivered">Đã giao</option>
                              <option value="Cancelled">Đã hủy</option>
                              <option value="Returned">Đã trả</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              padding: '20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <h2>⚙️ Cài đặt hệ thống</h2>
              <p style={{ color: '#666' }}>Chức năng đang được phát triển...</p>
            </div>
          )}
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            width: '500px',
            maxWidth: '90vw'
          }}>
            <h3>Tạo người dùng mới</h3>
            <form onSubmit={handleCreateUser}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Họ và tên *</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Số điện thoại</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Địa chỉ</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Mật khẩu *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Trạng thái</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="Active">Hoạt động</option>
                  <option value="Inactive">Không hoạt động</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={closeModals}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Tạo người dùng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            width: '500px',
            maxWidth: '90vw'
          }}>
            <h3>Cập nhật người dùng</h3>
            <form onSubmit={handleUpdateUser}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Họ và tên *</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Số điện thoại</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Địa chỉ</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Mật khẩu mới (để trống nếu không đổi)</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Trạng thái</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="Active">Hoạt động</option>
                  <option value="Inactive">Không hoạt động</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={closeModals}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Cập nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Product Modal */}
      {showCreateProduct && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            width: '600px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3>Tạo sản phẩm mới</h3>
            <form onSubmit={handleCreateProduct}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Tên sản phẩm *</label>
                <input
                  type="text"
                  value={productFormData.productName}
                  onChange={(e) => setProductFormData({ ...productFormData, productName: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Mô tả</label>
                <textarea
                  value={productFormData.description}
                  onChange={(e) => setProductFormData({ ...productFormData, description: e.target.value })}
                  rows={3}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Giá *</label>
                  <input
                    type="number"
                    value={productFormData.price}
                    onChange={(e) => setProductFormData({ ...productFormData, price: e.target.value })}
                    required
                    min="0"
                    step="0.01"
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Tồn kho *</label>
                  <input
                    type="number"
                    value={productFormData.stockQuantity}
                    onChange={(e) => setProductFormData({ ...productFormData, stockQuantity: e.target.value })}
                    required
                    min="0"
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Danh mục</label>
                <select
                  value={productFormData.categoryId}
                  onChange={(e) => setProductFormData({ ...productFormData, categoryId: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="">Chọn danh mục</option>
                  {categories.map((category) => (
                    <option key={category.CategoryID} value={category.CategoryID}>
                      {category.CategoryName}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Đường dẫn hình ảnh</label>
                <input
                  type="text"
                  value={productFormData.imagePath}
                  onChange={(e) => setProductFormData({ ...productFormData, imagePath: e.target.value })}
                  placeholder="/images/products/product-name.jpg"
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Trạng thái</label>
                <select
                  value={productFormData.status}
                  onChange={(e) => setProductFormData({ ...productFormData, status: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="Active">Hoạt động</option>
                  <option value="Inactive">Không hoạt động</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateProduct(false);
                    setProductFormData({ productName: '', description: '', price: '', stockQuantity: '', imagePath: '', categoryId: '', status: 'Active' });
                  }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Tạo sản phẩm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            width: '600px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3>Cập nhật sản phẩm</h3>
            <form onSubmit={handleUpdateProduct}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Tên sản phẩm *</label>
                <input
                  type="text"
                  value={productFormData.productName}
                  onChange={(e) => setProductFormData({ ...productFormData, productName: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Mô tả</label>
                <textarea
                  value={productFormData.description}
                  onChange={(e) => setProductFormData({ ...productFormData, description: e.target.value })}
                  rows={3}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Giá *</label>
                  <input
                    type="number"
                    value={productFormData.price}
                    onChange={(e) => setProductFormData({ ...productFormData, price: e.target.value })}
                    required
                    min="0"
                    step="0.01"
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Tồn kho *</label>
                  <input
                    type="number"
                    value={productFormData.stockQuantity}
                    onChange={(e) => setProductFormData({ ...productFormData, stockQuantity: e.target.value })}
                    required
                    min="0"
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Danh mục</label>
                <select
                  value={productFormData.categoryId}
                  onChange={(e) => setProductFormData({ ...productFormData, categoryId: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="">Chọn danh mục</option>
                  {categories.map((category) => (
                    <option key={category.CategoryID} value={category.CategoryID}>
                      {category.CategoryName}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Đường dẫn hình ảnh</label>
                <input
                  type="text"
                  value={productFormData.imagePath}
                  onChange={(e) => setProductFormData({ ...productFormData, imagePath: e.target.value })}
                  placeholder="/images/products/product-name.jpg"
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Trạng thái</label>
                <select
                  value={productFormData.status}
                  onChange={(e) => setProductFormData({ ...productFormData, status: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="Active">Hoạt động</option>
                  <option value="Inactive">Không hoạt động</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setEditingProduct(null);
                    setProductFormData({ productName: '', description: '', price: '', stockQuantity: '', imagePath: '', categoryId: '', status: 'Active' });
                  }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Cập nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Category Modal */}
      {showCreateCategory && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            width: '500px',
            maxWidth: '90vw'
          }}>
            <h3>Tạo danh mục mới</h3>
            <form onSubmit={handleCreateCategory}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Tên danh mục *</label>
                <input
                  type="text"
                  value={categoryFormData.categoryName}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, categoryName: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Mô tả</label>
                <textarea
                  value={categoryFormData.description}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                  rows={3}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Đường dẫn icon</label>
                <input
                  type="text"
                  value={categoryFormData.iconPath}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, iconPath: e.target.value })}
                  placeholder="/images/categories/category-name.jpg"
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Trạng thái</label>
                <select
                  value={categoryFormData.status}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, status: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="Active">Hoạt động</option>
                  <option value="Inactive">Không hoạt động</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateCategory(false);
                    setCategoryFormData({ categoryName: '', description: '', iconPath: '', status: 'Active' });
                  }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#17a2b8',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Tạo danh mục
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            width: '800px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3>Chi tiết đơn hàng #{selectedOrder.OrderNumber}</h3>
            
            {/* Order Info */}
            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <h4 style={{ margin: '0 0 10px 0' }}>Thông tin khách hàng</h4>
                  <p style={{ margin: '5px 0' }}><strong>Tên:</strong> {selectedOrder.CustomerName}</p>
                  <p style={{ margin: '5px 0' }}><strong>Email:</strong> {selectedOrder.CustomerEmail}</p>
                  <p style={{ margin: '5px 0' }}><strong>Địa chỉ:</strong> {selectedOrder.ShippingAddress}</p>
                </div>
                <div>
                  <h4 style={{ margin: '0 0 10px 0' }}>Thông tin đơn hàng</h4>
                  <p style={{ margin: '5px 0' }}><strong>Ngày đặt:</strong> {new Date(selectedOrder.CreatedAt).toLocaleString('vi-VN')}</p>
                  <p style={{ margin: '5px 0' }}><strong>Tổng tiền:</strong> {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedOrder.TotalAmount)}</p>
                  <p style={{ margin: '5px 0' }}><strong>Thanh toán:</strong> {selectedOrder.PaymentMethod}</p>
                  <p style={{ margin: '5px 0' }}><strong>Vận chuyển:</strong> {selectedOrder.ShippingMethod}</p>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div style={{ marginBottom: '20px' }}>
              <h4>Danh sách sản phẩm</h4>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Sản phẩm</th>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Giá</th>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Số lượng</th>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderItems.map((item) => (
                      <tr key={item.OrderItemID}>
                        <td style={{ padding: '10px', borderBottom: '1px solid #dee2e6' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img 
                              src={item.ImagePath || '/images/products/default.jpg'} 
                              alt={item.ProductName}
                              style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                              onError={(e) => {
                                e.currentTarget.src = '/images/products/default.jpg';
                              }}
                            />
                            <span>{item.ProductName}</span>
                          </div>
                        </td>
                        <td style={{ padding: '10px', borderBottom: '1px solid #dee2e6' }}>
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.ProductPrice)}
                        </td>
                        <td style={{ padding: '10px', borderBottom: '1px solid #dee2e6' }}>{item.Quantity}</td>
                        <td style={{ padding: '10px', borderBottom: '1px solid #dee2e6' }}>
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.SubTotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Notes */}
            {selectedOrder.Notes && (
              <div style={{ marginBottom: '20px' }}>
                <h4>Ghi chú</h4>
                <p style={{ padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px', margin: 0 }}>
                  {selectedOrder.Notes}
                </p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowOrderDetails(false);
                  setSelectedOrder(null);
                  setOrderItems([]);
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
