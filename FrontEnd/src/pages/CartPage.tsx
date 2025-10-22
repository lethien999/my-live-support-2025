import React, { useState, useEffect } from 'react';
import AuthChatService from '../services/AuthChatService';
import { getApiUrl } from '../config/api';

interface CartItem {
  CartID: number;
  ProductID: number;
  ProductName: string;
  Price: number;
  Quantity: number;
  Image: string;
  ShopName: string;
  SKU: string;
  Description?: string;
}

const CartPage: React.FC = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCartItems();
    
    // Listen for cart updates
    const handleCartUpdate = () => {
      console.log('CartPage: Cart updated, reloading...');
      loadCartItems();
    };
    
    window.addEventListener('cartUpdated', handleCartUpdate);
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  const loadCartItems = async () => {
    try {
      setLoading(true);
      const token = await AuthChatService.getToken();
      
      if (!token) {
        throw new Error('Vui lòng đăng nhập để xem giỏ hàng');
      }

      // Get current user info for Google token authentication
      const currentUser = await AuthChatService.getCurrentUser();
      const userInfo = currentUser ? {
        email: currentUser.email,
        name: currentUser.name,
        role: currentUser.role
      } : null;

      const response = await fetch(getApiUrl('/api/cart'), {
        method: 'POST', // Use POST to send user info
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userInfo })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.items) {
        setCartItems(data.items);
      } else {
        setCartItems([]);
      }
    } catch (error) {
      console.error('Error loading cart items:', error);
      setError('Không thể tải giỏ hàng');
      // Fallback to mock data
      const { mockCartItems } = await import('../data/mockData');
      setCartItems(mockCartItems);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (cartId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      await removeItem(cartId);
      return;
    }

    try {
      const token = await AuthChatService.getToken();
      if (!token) {
        throw new Error('Vui lòng đăng nhập');
      }

      const response = await fetch(getApiUrl(`/api/cart/${cartId}`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity: newQuantity }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Reload cart items
      await loadCartItems();
    } catch (error) {
      console.error('Error updating quantity:', error);
      setError('Không thể cập nhật số lượng');
    }
  };

  const removeItem = async (cartId: number) => {
    try {
      const token = await AuthChatService.getToken();
      if (!token) {
        throw new Error('Vui lòng đăng nhập');
      }

      const response = await fetch(getApiUrl(`/api/cart/${cartId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Reload cart items
      await loadCartItems();
    } catch (error) {
      console.error('Error removing item:', error);
      setError('Không thể xóa sản phẩm');
    }
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.Price * item.Quantity), 0);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.Quantity, 0);
  };

  const proceedToCheckout = () => {
    if (cartItems.length === 0) {
      setError('Giỏ hàng trống');
      return;
    }
    window.location.href = '/checkout';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải giỏ hàng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Giỏ hàng</h1>
          <p className="mt-2 text-gray-600">
            {getTotalItems()} sản phẩm trong giỏ hàng
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {cartItems.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Giỏ hàng trống</h3>
            <p className="mt-1 text-sm text-gray-500">Hãy thêm một số sản phẩm vào giỏ hàng.</p>
            <div className="mt-6">
              <a
                href="/products"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800"
              >
                Tiếp tục mua sắm
              </a>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Sản phẩm</h2>
                </div>
                <div className="divide-y divide-gray-200">
                  {cartItems.map((item) => (
                    <div key={item.CartID} className="px-6 py-4">
                      <div className="flex items-center space-x-4">
                        {/* Product Image */}
                        <div className="flex-shrink-0">
                          <div className="h-20 w-20 bg-gray-200 rounded-lg flex items-center justify-center text-2xl">
                            {item.Image || '📦'}
                          </div>
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {item.ProductName}
                          </h3>
                          <p className="text-sm text-gray-500 truncate">
                            {item.ShopName}
                          </p>
                          <p className="text-sm text-gray-500">
                            SKU: {item.SKU}
                          </p>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(item.CartID, item.Quantity - 1)}
                            className="p-1 rounded-full hover:bg-gray-100"
                          >
                            <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                          </button>
                          <span className="text-sm font-medium text-gray-900 w-8 text-center">
                            {item.Quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.CartID, item.Quantity + 1)}
                            className="p-1 rounded-full hover:bg-gray-100"
                          >
                            <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          </button>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {(item.Price * item.Quantity).toLocaleString('vi-VN')} VND
                          </p>
                          <p className="text-sm text-gray-500">
                            {item.Price.toLocaleString('vi-VN')} VND/SP
                          </p>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => removeItem(item.CartID)}
                          className="p-1 rounded-full hover:bg-red-100 text-red-500"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white shadow rounded-lg sticky top-8">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Tóm tắt đơn hàng</h2>
                </div>
                <div className="px-6 py-4 space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tạm tính:</span>
                    <span className="text-gray-900">{getTotalPrice().toLocaleString('vi-VN')} VND</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Phí vận chuyển:</span>
                    <span className="text-gray-900">Miễn phí</span>
                  </div>
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between text-lg font-medium">
                      <span className="text-gray-900">Tổng cộng:</span>
                      <span className="text-gray-900">{getTotalPrice().toLocaleString('vi-VN')} VND</span>
                    </div>
                  </div>
                  <button
                    onClick={proceedToCheckout}
                    className="w-full bg-gray-900 text-white py-3 px-4 rounded-md hover:bg-gray-800 transition-colors font-medium"
                  >
                    Thanh toán
                  </button>
                  <a
                    href="/products"
                    className="w-full bg-white text-gray-900 py-3 px-4 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors font-medium text-center block"
                  >
                    Tiếp tục mua sắm
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;