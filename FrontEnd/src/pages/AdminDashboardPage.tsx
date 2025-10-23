import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../config/api';
import RatingManagementPage from './RatingManagementPage';

// ===========================================
// TYPES
// ===========================================

interface User {
  id: number;
  email: string;
  fullName: string;
  phone: string;
  address: string;
  status: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
  avatar: string;
}

interface Product {
  id: number;
  name: string;
  description: string;
  longDescription: string;
  categoryId: number;
  categoryName: string;
  price: number;
  originalPrice: number;
  imagePath: string;
  stockQuantity: number;
  isInStock: boolean;
  averageRating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
  shopId: number;
  isActive: boolean;
  isFeatured: boolean;
}

interface Category {
  id: number;
  name: string;
  parentCategoryId: number;
  description: string;
  iconPath: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

interface Order {
  id: number;
  orderNumber: string;
  customerId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  shippingAddress: string;
  billingAddress: string;
  subTotal: number;
  taxAmount: number;
  shippingCost: number;
  totalAmount: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
  shippedAt: string;
  deliveredAt: string;
}

interface DashboardStats {
  users: {
    total: number;
    active: number;
    customers: number;
    agents: number;
    admins: number;
  };
  products: {
    total: number;
    active: number;
    inStock: number;
    featured: number;
  };
  orders: {
    total: number;
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  totalRevenue: number;
    thisWeek: number;
    thisMonth: number;
  };
  categories: {
    total: number;
    active: number;
  };
}

// ===========================================
// ADMIN DASHBOARD COMPONENT
// ===========================================

const AdminDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Data states
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  
  // Edit states
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  
  // Debug: Log when editingOrder changes
  useEffect(() => {
    console.log('🔧 Admin: editingOrder state changed:', editingOrder);
  }, [editingOrder]);

  // ===========================================
  // HELPER FUNCTIONS
  // ===========================================

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  };

  // DATA LOADING FUNCTIONS
  // ===========================================

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(getApiUrl('/api/admin/stats'), {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }
      
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
        console.log('✅ Dashboard stats loaded:', data.data);
      }
    } catch (error) {
      console.error('❌ Error loading dashboard stats:', error);
      setError('Không thể tải thống kê dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(getApiUrl('/api/admin/users'), {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
        console.log('✅ Users loaded:', data.data.length);
      }
    } catch (error) {
      console.error('❌ Error loading users:', error);
      setError('Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
            const response = await fetch(getApiUrl('/api/admin/products'), {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      if (data.success) {
        setProducts(data.data);
        console.log('✅ Products loaded:', data.data.length);
      }
    } catch (error) {
      console.error('❌ Error loading products:', error);
      setError('Không thể tải danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      setLoading(true);
            const response = await fetch(getApiUrl('/api/admin/categories'), {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }

      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
        console.log('✅ Categories loaded:', data.data.length);
      }
    } catch (error) {
      console.error('❌ Error loading categories:', error);
      setError('Không thể tải danh sách danh mục');
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
            const response = await fetch(getApiUrl('/api/admin/orders'), {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      if (data.success) {
        setOrders(data.data);
        console.log('✅ Orders loaded:', data.data.length);
      }
    } catch (error) {
      console.error('❌ Error loading orders:', error);
      setError('Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  // ===========================================
  // EFFECTS
  // ===========================================

  useEffect(() => {
    // Load dashboard stats on component mount
    loadDashboardStats();
  }, []);

  useEffect(() => {
    // Load data based on active tab
    switch (activeTab) {
      case 'users':
        if (users.length === 0) loadUsers();
        break;
      case 'products':
        if (products.length === 0) loadProducts();
        break;
      case 'categories':
        if (categories.length === 0) loadCategories();
        break;
      case 'orders':
        if (orders.length === 0) loadOrders();
        break;
    }
  }, [activeTab]);

  // ===========================================
  // UTILITY FUNCTIONS
  // ===========================================

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('vi-VN');
    } catch {
      return 'N/A';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return '#28a745';
      case 'pending': return '#ffc107';
      case 'processing': return '#17a2b8';
      case 'shipped': return '#6f42c1';
      case 'delivered': return '#28a745';
      case 'cancelled': return '#dc3545';
      default: return '#6c757d';
    }
  };

  // ===========================================
  // CRUD OPERATIONS
  // ===========================================

  const updateUser = async (id: number, userData: Partial<User>) => {
    try {
      const response = await fetch(getApiUrl(`/api/admin/users/${id}`), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        throw new Error('Failed to update user');
      }
      
      const result = await response.json();
      if (result.success) {
        // Reload users data
        await loadUsers();
        setError('');
        console.log('✅ User updated successfully');
      }
    } catch (error) {
      console.error('❌ Error updating user:', error);
      setError('Không thể cập nhật người dùng');
    }
  };

  const deleteUser = async (id: number) => {
    try {
      const response = await fetch(getApiUrl(`/api/admin/users/${id}`), {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }
      
      const result = await response.json();
      if (result.success) {
        // Reload users data
        await loadUsers();
        setError('');
        console.log('✅ User deleted successfully');
      }
    } catch (error) {
      console.error('❌ Error deleting user:', error);
      setError('Không thể xóa người dùng');
    }
  };

  const updateProduct = async (id: number, productData: Partial<Product>) => {
    try {
      const response = await fetch(getApiUrl(`/api/admin/products/${id}`), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(productData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update product');
      }
      
      const result = await response.json();
      if (result.success) {
        // Reload products data
        await loadProducts();
        setError('');
        console.log('✅ Product updated successfully');
      }
    } catch (error) {
      console.error('❌ Error updating product:', error);
      setError('Không thể cập nhật sản phẩm');
    }
  };

  const deleteProduct = async (id: number) => {
    try {
      const response = await fetch(getApiUrl(`/api/admin/products/${id}`), {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete product');
      }
      
      const result = await response.json();
      if (result.success) {
        // Reload products data
        await loadProducts();
        setError('');
        console.log('✅ Product deleted successfully');
      }
    } catch (error) {
      console.error('❌ Error deleting product:', error);
      setError('Không thể xóa sản phẩm');
    }
  };

  const updateCategory = async (id: number, categoryData: Partial<Category>) => {
    try {
      const response = await fetch(getApiUrl(`/api/admin/categories/${id}`), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(categoryData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update category');
      }
      
      const result = await response.json();
      if (result.success) {
        // Reload categories data
        await loadCategories();
        setError('');
        console.log('✅ Category updated successfully');
      }
    } catch (error) {
      console.error('❌ Error updating category:', error);
      setError('Không thể cập nhật danh mục');
    }
  };

  const deleteCategory = async (id: number) => {
    try {
      const response = await fetch(getApiUrl(`/api/admin/categories/${id}`), {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete category');
      }
      
      const result = await response.json();
      if (result.success) {
        // Reload categories data
        await loadCategories();
        setError('');
        console.log('✅ Category deleted successfully');
      }
    } catch (error) {
      console.error('❌ Error deleting category:', error);
      setError('Không thể xóa danh mục');
    }
  };

  const updateOrder = async (id: number, orderData: Partial<Order>) => {
    try {
      const response = await fetch(getApiUrl(`/api/admin/orders/${id}`), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(orderData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update order');
      }
      
      const result = await response.json();
      if (result.success) {
        // Reload orders data
        await loadOrders();
        setError('');
        console.log('✅ Order updated successfully');
      }
    } catch (error) {
      console.error('❌ Error updating order:', error);
      setError('Không thể cập nhật đơn hàng');
    }
  };

  // ===========================================
  // EDIT COMPONENTS
  // ===========================================

  const UserEditModal = ({ user, onClose, onSave }: { user: User; onClose: () => void; onSave: (data: Partial<User>) => void }) => {
    const [formData, setFormData] = useState({
      fullName: user.fullName,
      phone: user.phone,
      address: user.address,
      status: user.status,
      role: user.role
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave(formData);
      onClose();
    };

    return (
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
          borderRadius: '10px',
            width: '500px',
          maxHeight: '80vh',
          overflow: 'auto'
          }}>
          <h3 style={{ marginBottom: '20px', color: '#333' }}>Chỉnh sửa người dùng</h3>
          
          <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Họ tên:</label>
                <input
                  type="text"
                  value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                required
                />
              </div>
            
              <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Số điện thoại:</label>
                <input
                  type="text"
                  value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
            
              <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Địa chỉ:</label>
              <textarea
                  value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', height: '80px' }}
                />
              </div>
            
              <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Trạng thái:</label>
                <select
                  value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="Active">Hoạt động</option>
                  <option value="Inactive">Không hoạt động</option>
                <option value="Suspended">Tạm khóa</option>
                </select>
              </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Vai trò:</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                <option value="Customer">Khách hàng</option>
                <option value="Agent">Nhân viên</option>
                <option value="Admin">Quản trị viên</option>
                <option value="SuperAdmin">Siêu quản trị viên</option>
              </select>
            </div>
            
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                onClick={onClose}
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
                Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
    );
  };

  const ProductEditModal = ({ product, onClose, onSave }: { product: Product; onClose: () => void; onSave: (data: Partial<Product>) => void }) => {
    const [formData, setFormData] = useState({
      productName: product.name,
      description: product.description,
      longDescription: product.longDescription,
      categoryId: product.categoryId,
      price: product.price,
      originalPrice: product.originalPrice,
      stockQuantity: product.stockQuantity,
      isInStock: product.isInStock,
      isActive: product.isActive,
      isFeatured: product.isFeatured
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave(formData);
      onClose();
    };

    return (
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
          borderRadius: '10px',
          width: '600px',
          maxHeight: '80vh',
          overflow: 'auto'
        }}>
          <h3 style={{ marginBottom: '20px', color: '#333' }}>Chỉnh sửa sản phẩm</h3>
          
          <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Tên sản phẩm:</label>
                <input
                type="text"
                value={formData.productName}
                onChange={(e) => setFormData({...formData, productName: e.target.value})}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                required
                />
              </div>
            
              <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Mô tả ngắn:</label>
                <input
                  type="text"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
            
              <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Mô tả dài:</label>
              <textarea
                value={formData.longDescription}
                onChange={(e) => setFormData({...formData, longDescription: e.target.value})}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', height: '80px' }}
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Danh mục:</label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({...formData, categoryId: parseInt(e.target.value)})}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            
            <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Giá:</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  required
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Giá gốc:</label>
                <input
                  type="number"
                  value={formData.originalPrice}
                  onChange={(e) => setFormData({...formData, originalPrice: parseFloat(e.target.value)})}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
            </div>
            
              <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Số lượng tồn kho:</label>
                <input
                type="number"
                value={formData.stockQuantity}
                onChange={(e) => setFormData({...formData, stockQuantity: parseInt(e.target.value)})}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                required
                />
              </div>
            
            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input
                  type="checkbox"
                  checked={formData.isInStock}
                  onChange={(e) => setFormData({...formData, isInStock: e.target.checked})}
                />
                Còn hàng
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                />
                Hoạt động
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input
                  type="checkbox"
                  checked={formData.isFeatured}
                  onChange={(e) => setFormData({...formData, isFeatured: e.target.checked})}
                />
                Nổi bật
              </label>
              </div>
            
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                onClick={onClose}
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
                Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
    );
  };

  const CategoryEditModal = ({ category, onClose, onSave }: { category: Category; onClose: () => void; onSave: (data: Partial<Category>) => void }) => {
    const [formData, setFormData] = useState({
      name: category.name,
      description: category.description || ''
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave(formData);
      onClose();
    };

    return (
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
        zIndex: 10000
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '10px',
          width: '500px',
          maxHeight: '80vh',
          overflow: 'auto'
        }}>
          <h3 style={{ marginBottom: '20px', color: '#333' }}>Chỉnh sửa danh mục</h3>
          
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Tên danh mục:</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                required
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Mô tả:</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', height: '100px' }}
                placeholder="Nhập mô tả danh mục..."
              />
            </div>
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={onClose}
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
                Lưu
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const OrderEditModal = ({ order, onClose, onSave }: { order: Order; onClose: () => void; onSave: (data: Partial<Order>) => void }) => {
    console.log('🔧 Admin: OrderEditModal rendered with order:', order);
    const [formData, setFormData] = useState({
      status: order.status,
      paymentStatus: order.paymentStatus,
      notes: order.notes || ''
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave(formData);
      onClose();
    };

    return (
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
          zIndex: 10000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
          borderRadius: '10px',
          width: '500px',
          maxHeight: '80vh',
          overflow: 'auto'
        }}>
          <h3 style={{ marginBottom: '20px', color: '#333' }}>Chỉnh sửa đơn hàng</h3>
          
          <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Trạng thái đơn hàng:</label>
                <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                <option value="Pending">Chờ xử lý</option>
                <option value="Processing">Đang xử lý</option>
                <option value="Shipped">Đã gửi hàng</option>
                <option value="Delivered">Đã giao hàng</option>
                <option value="Cancelled">Đã hủy</option>
                <option value="Returned">Đã trả hàng</option>
                </select>
              </div>
            
              <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Trạng thái thanh toán:</label>
                <select
                value={formData.paymentStatus}
                onChange={(e) => setFormData({...formData, paymentStatus: e.target.value})}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                <option value="Pending">Chờ thanh toán</option>
                <option value="Paid">Đã thanh toán</option>
                <option value="Failed">Thanh toán thất bại</option>
                <option value="Refunded">Đã hoàn tiền</option>
                <option value="Partial">Thanh toán một phần</option>
                </select>
              </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Ghi chú:</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', height: '100px' }}
                placeholder="Nhập ghi chú về đơn hàng..."
              />
            </div>
            
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                onClick={onClose}
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
                Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
    );
  };

  // ===========================================
  // RENDER FUNCTIONS
  // ===========================================

  const renderDashboard = () => {
    if (!stats) {
    return (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '18px', color: '#666' }}>Đang tải thống kê...</div>
      </div>
    );
  }

  return (
      <div>
        <h2 style={{ marginBottom: '20px', color: '#333' }}>Dashboard Tổng Quan</h2>
        
        {/* Statistics Cards */}
        <div style={{
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '20px', 
          marginBottom: '30px' 
        }}>
          {/* Users Stats */}
          <div style={{
          padding: '20px',
            backgroundColor: '#e3f2fd', 
            borderRadius: '8px',
            textAlign: 'center' 
          }}>
            <h3 style={{ margin: 0, color: '#1976d2', fontSize: '24px' }}>{stats.users.total}</h3>
            <p style={{ margin: '8px 0 0 0', color: '#666' }}>Tổng người dùng</p>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
              Khách hàng: {stats.users.customers} | Nhân viên: {stats.users.agents} | Admin: {stats.users.admins}
              </div>
              </div>

          {/* Products Stats */}
            <div style={{
              padding: '20px',
            backgroundColor: '#e8f5e8', 
            borderRadius: '8px', 
            textAlign: 'center' 
          }}>
            <h3 style={{ margin: 0, color: '#28a745', fontSize: '24px' }}>{stats.products.total}</h3>
            <p style={{ margin: '8px 0 0 0', color: '#666' }}>Tổng sản phẩm</p>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
              Hoạt động: {stats.products.active} | Còn hàng: {stats.products.inStock}
                </div>
                </div>

          {/* Orders Stats */}
            <div style={{
              padding: '20px',
            backgroundColor: '#fff3e0', 
            borderRadius: '8px', 
            textAlign: 'center' 
          }}>
            <h3 style={{ margin: 0, color: '#f57c00', fontSize: '24px' }}>{stats.orders.total}</h3>
                  <p style={{ margin: '8px 0 0 0', color: '#666' }}>Tổng đơn hàng</p>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
              Tuần này: {stats.orders.thisWeek} | Tháng này: {stats.orders.thisMonth}
              </div>
              </div>

          {/* Revenue Stats */}
          <div style={{ 
            padding: '20px', 
            backgroundColor: '#f3e5f5', 
            borderRadius: '8px', 
            textAlign: 'center' 
          }}>
            <h3 style={{ margin: 0, color: '#7b1fa2', fontSize: '24px' }}>
              {formatCurrency(stats.orders.totalRevenue)}
                  </h3>
                  <p style={{ margin: '8px 0 0 0', color: '#666' }}>Tổng doanh thu</p>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
              Đã thanh toán: {stats.orders.delivered}
              </div>
              </div>
              </div>
              
              {/* Order Status Overview */}
                <div style={{ marginTop: '30px' }}>
          <h3 style={{ marginBottom: '15px', color: '#333' }}>Trạng thái đơn hàng</h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
            gap: '15px' 
          }}>
            <div style={{ 
              padding: '15px', 
              backgroundColor: '#fff3cd', 
              borderRadius: '6px', 
              textAlign: 'center' 
            }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#856404' }}>
                {stats.orders.pending}
                    </div>
              <div style={{ fontSize: '12px', color: '#856404' }}>Chờ xử lý</div>
                    </div>
            <div style={{ 
              padding: '15px', 
              backgroundColor: '#d1ecf1', 
              borderRadius: '6px', 
              textAlign: 'center' 
            }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#0c5460' }}>
                {stats.orders.processing}
                    </div>
              <div style={{ fontSize: '12px', color: '#0c5460' }}>Đang xử lý</div>
                    </div>
            <div style={{ 
              padding: '15px', 
              backgroundColor: '#e2e3e5', 
              borderRadius: '6px', 
              textAlign: 'center' 
            }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#383d41' }}>
                {stats.orders.shipped}
                    </div>
              <div style={{ fontSize: '12px', color: '#383d41' }}>Đã giao</div>
                  </div>
            <div style={{ 
              padding: '15px', 
              backgroundColor: '#d4edda', 
              borderRadius: '6px', 
              textAlign: 'center' 
            }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#155724' }}>
                {stats.orders.delivered}
                </div>
              <div style={{ fontSize: '12px', color: '#155724' }}>Hoàn thành</div>
            </div>
        </div>
      </div>
      
    </div>
  );
};

  const renderUsers = () => (
    <div>
      <h2 style={{ marginBottom: '20px', color: '#333' }}>Quản lý người dùng</h2>
            <div style={{
        backgroundColor: 'white', 
              borderRadius: '8px',
        overflow: 'hidden',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
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
              <tr key={user.id}>
                <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>{user.id}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>{user.email}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>{user.fullName}</td>
                          <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                    backgroundColor: user.role === 'Admin' ? '#dc3545' : user.role === 'Agent' ? '#007bff' : '#28a745',
                              color: 'white'
                            }}>
                    {user.role}
                            </span>
                          </td>
                          <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                    backgroundColor: user.status === 'Active' ? '#d4edda' : '#f8d7da',
                    color: user.status === 'Active' ? '#155724' : '#721c24'
                            }}>
                    {user.status}
                            </span>
                          </td>
                <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>{formatDate(user.createdAt)}</td>
                          <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>
                  <div style={{ display: 'flex', gap: '5px' }}>
                <button
                      onClick={() => setEditingUser(user)}
                  style={{
                                padding: '4px 8px',
                                backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                                cursor: 'pointer',
                        fontSize: '12px'
                  }}
                >
                      Sửa
                </button>
                <button
                      onClick={() => {
                        if (window.confirm('Bạn có chắc muốn vô hiệu hóa người dùng này?')) {
                          deleteUser(user.id);
                        }
                      }}
                  style={{
                                padding: '4px 8px',
                                backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                  }}
                >
                      Xóa
                </button>
              </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
          </div>
        </div>
  );

  const renderProducts = () => (
    <div>
      <h2 style={{ marginBottom: '20px', color: '#333' }}>Quản lý sản phẩm</h2>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
        overflow: 'hidden',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8f9fa' }}>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>ID</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Hình ảnh</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Tên sản phẩm</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Danh mục</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Giá</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Tồn kho</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Trạng thái</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => (
              <tr key={product.id}>
                <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>{product.id}</td>
                          <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>
                            <img 
                    src={product.imagePath || '/images/products/default.jpg'} 
                    alt={product.name}
                              style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                              onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/products/default.jpg';
                              }}
                            />
                          </td>
                          <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>
                  <div style={{ fontWeight: '500' }}>{product.name}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>{product.description}</div>
                          </td>
                <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>{product.categoryName}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>{formatCurrency(product.price)}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>{product.stockQuantity}</td>
                          <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                    backgroundColor: product.isActive ? '#d4edda' : '#f8d7da',
                    color: product.isActive ? '#155724' : '#721c24'
                            }}>
                    {product.isActive ? 'Hoạt động' : 'Không hoạt động'}
                            </span>
                          </td>
                <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>
                  <div style={{ display: 'flex', gap: '5px' }}>
                <button
                      onClick={() => setEditingProduct(product)}
                  style={{
                        padding: '4px 8px',
                        backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                  }}
                >
                      Sửa
                </button>
                <button
                      onClick={() => {
                        if (window.confirm('Bạn có chắc muốn vô hiệu hóa sản phẩm này?')) {
                          deleteProduct(product.id);
                        }
                      }}
                  style={{
                        padding: '4px 8px',
                        backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                  }}
                >
                      Xóa
                </button>
              </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
          </div>
        </div>
  );

  const renderCategories = () => (
    <div>
      <h2 style={{ marginBottom: '20px', color: '#333' }}>Quản lý danh mục</h2>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa' }}>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>ID</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Tên danh mục</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Mô tả</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Thứ tự</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Trạng thái</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Ngày tạo</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id}>
                <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>{category.id}</td>
                          <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>
                  <div style={{ fontWeight: '500' }}>{category.name}</div>
                          </td>
                <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>{category.description}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>{category.sortOrder}</td>
                          <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>
                  <span style={{ 
                                padding: '4px 8px',
                                borderRadius: '4px',
                    fontSize: '12px',
                    backgroundColor: category.isActive ? '#d4edda' : '#f8d7da',
                    color: category.isActive ? '#155724' : '#721c24'
                  }}>
                    {category.isActive ? 'Hoạt động' : 'Không hoạt động'}
                  </span>
                          </td>
                <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>{formatDate(category.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                </div>
  );

  const renderOrders = () => (
    <div>
      <h2 style={{ marginBottom: '20px', color: '#333' }}>Quản lý đơn hàng</h2>
            <div style={{
        backgroundColor: 'white', 
              borderRadius: '8px',
        overflow: 'hidden',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Mã đơn</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Khách hàng</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Trạng thái</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Thanh toán</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Tổng tiền</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Ngày đặt</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                      {orders.map((order) => (
              <tr key={order.id}>
                <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>{order.orderNumber}</td>
                          <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>
                  <div style={{ fontWeight: '500' }}>{order.customerName}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>{order.customerEmail}</div>
                        </td>
                          <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                    backgroundColor: getStatusColor(order.status) + '20',
                    color: getStatusColor(order.status)
                  }}>
                    {order.status}
                            </span>
                        </td>
                          <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>
                  <span style={{ 
                                padding: '4px 8px',
                                borderRadius: '4px',
                    fontSize: '12px',
                    backgroundColor: order.paymentStatus === 'Paid' ? '#d4edda' : '#fff3cd',
                    color: order.paymentStatus === 'Paid' ? '#155724' : '#856404'
                  }}>
                    {order.paymentStatus}
                  </span>
                          </td>
                <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>{formatCurrency(order.totalAmount)}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>{formatDate(order.createdAt)}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <button
                      onClick={() => {
                        console.log('🔧 Admin: Edit order clicked for order:', order);
                        setEditingOrder(order);
                      }}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Sửa
                    </button>
                  </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
  );

  // ===========================================
  // MAIN RENDER
  // ===========================================

  return (
        <div style={{
      minHeight: '100vh', 
      backgroundColor: '#f8f9fa',
      padding: '20px'
    }}>
      {/* Header */}
          <div style={{
            backgroundColor: 'white',
        padding: '20px', 
            borderRadius: '8px',
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ margin: 0, color: '#333' }}>MUJI Admin Dashboard</h1>
        <p style={{ margin: '8px 0 0 0', color: '#666' }}>Quản lý hệ thống</p>
              </div>

      {/* Navigation */}
          <div style={{
            backgroundColor: 'white',
        padding: '20px', 
            borderRadius: '8px',
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          {[
            { key: 'dashboard', label: '📊 Dashboard' },
            { key: 'users', label: '👥 Người dùng' },
            { key: 'products', label: '🛒 Sản phẩm' },
            { key: 'categories', label: '📁 Danh mục' },
            { key: 'orders', label: '📦 Đơn hàng' },
            { key: 'ratings', label: '⭐ Đánh giá chat' }
          ].map((tab) => (
              <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                borderRadius: '6px',
                backgroundColor: activeTab === tab.key ? '#007bff' : '#f8f9fa',
                color: activeTab === tab.key ? 'white' : '#333',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              {tab.label}
              </button>
          ))}
            </div>
          </div>

      {/* Content */}
          <div style={{
            backgroundColor: 'white',
        padding: '20px', 
            borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        {error && (
        <div style={{
            backgroundColor: '#f8d7da', 
            color: '#721c24', 
            padding: '12px', 
            borderRadius: '4px', 
            marginBottom: '20px' 
          }}>
            {error}
        </div>
      )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '18px', color: '#666' }}>Đang tải...</div>
              </div>
            )}

        {!loading && (
          <>
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'users' && renderUsers()}
            {activeTab === 'products' && renderProducts()}
            {activeTab === 'categories' && renderCategories()}
            {activeTab === 'orders' && renderOrders()}
            {activeTab === 'ratings' && <RatingManagementPage />}
          </>
        )}
      </div>

      {/* Edit Modals - Moved outside main content */}
      {editingUser && (
        <UserEditModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={(data) => updateUser(editingUser.id, data)}
        />
      )}
      {editingProduct && (
        <ProductEditModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSave={(data) => updateProduct(editingProduct.id, data)}
        />
      )}
      {editingCategory && (
        <CategoryEditModal
          category={editingCategory}
          onClose={() => setEditingCategory(null)}
          onSave={(data) => updateCategory(editingCategory.id, data)}
        />
      )}
      {editingOrder && (
        <OrderEditModal
          order={editingOrder}
          onClose={() => {
            console.log('🔧 Admin: Closing order edit modal');
            setEditingOrder(null);
          }}
          onSave={(data) => {
            console.log('🔧 Admin: Saving order data:', data);
            updateOrder(editingOrder.id, data);
          }}
        />
      )}
    </div>
  );
};

export default AdminDashboardPage;
