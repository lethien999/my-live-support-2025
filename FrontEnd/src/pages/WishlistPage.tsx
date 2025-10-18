import React, { useState, useEffect } from 'react';
import AuthChatService from '../services/AuthChatService';
import { getApiUrl } from '../config/api';

interface WishlistItem {
  WishlistID: number;
  ProductID: number;
  ProductName: string;
  Price: number;
  Image: string;
  AddedAt: string;
}

const WishlistPage: React.FC = () => {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWishlistItems();
    
    // Listen for cart updates (when items are added to cart from wishlist)
    const handleCartUpdate = () => {
      console.log('WishlistPage: Cart updated, reloading wishlist...');
      loadWishlistItems();
    };
    
    window.addEventListener('cartUpdated', handleCartUpdate);
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  const loadWishlistItems = async () => {
    try {
      setLoading(true);
      const token = AuthChatService.getToken();
      
      if (!token) {
        throw new Error('Vui lòng đăng nhập để xem danh sách yêu thích');
      }

      const response = await fetch(getApiUrl('/api/wishlist'), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.wishlistItems) {
        setWishlistItems(data.wishlistItems);
      } else {
        setWishlistItems([]);
      }
    } catch (error) {
      console.error('Error loading wishlist items:', error);
      setError('Không thể tải danh sách yêu thích');
      // Fallback to mock data
      setWishlistItems([
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
      ]);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (wishlistId: number) => {
    try {
      const token = AuthChatService.getToken();
      if (!token) {
        throw new Error('Vui lòng đăng nhập');
      }

      const response = await fetch(getApiUrl(`/api/wishlist/${wishlistId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Reload wishlist items
      await loadWishlistItems();
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      setError('Không thể xóa sản phẩm khỏi danh sách yêu thích');
    }
  };

  const addToCart = async (productId: number) => {
    try {
      const token = AuthChatService.getToken();
      if (!token) {
        alert('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng');
        return;
      }

      const response = await fetch(getApiUrl('/api/cart/add'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: productId,
          quantity: 1
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        alert('Đã thêm sản phẩm vào giỏ hàng!');
      } else {
        throw new Error(result.message || 'Có lỗi xảy ra');
      }
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Không thể thêm sản phẩm vào giỏ hàng');
    }
  };

  const navigateToProduct = (productId: number) => {
    window.location.href = `/product-detail?id=${productId}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải danh sách yêu thích...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Danh sách yêu thích</h1>
          <p className="mt-2 text-gray-600">
            {wishlistItems.length} sản phẩm trong danh sách yêu thích
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

        {wishlistItems.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Danh sách yêu thích trống</h3>
            <p className="mt-1 text-sm text-gray-500">Hãy thêm một số sản phẩm vào danh sách yêu thích.</p>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlistItems.map((item) => (
              <div key={item.WishlistID} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {/* Product Image */}
                <div className="aspect-w-1 aspect-h-1 bg-gray-200">
                  <div className="h-48 bg-gray-200 flex items-center justify-center text-4xl cursor-pointer" onClick={() => navigateToProduct(item.ProductID)}>
                    {item.Image || '📦'}
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-2 cursor-pointer hover:text-gray-600" onClick={() => navigateToProduct(item.ProductID)}>
                    {item.ProductName}
                  </h3>
                  
                  <p className="text-xl font-bold text-gray-900 mb-4">
                    {item.Price.toLocaleString('vi-VN')} VND
                  </p>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => addToCart(item.ProductID)}
                      className="flex-1 bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-800 transition-colors text-sm font-medium"
                    >
                      Thêm vào giỏ
                    </button>
                    <button
                      onClick={() => removeFromWishlist(item.WishlistID)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                      title="Xóa khỏi danh sách yêu thích"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;
