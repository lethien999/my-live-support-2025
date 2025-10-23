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
  VariantID?: number;
  VariantName?: string;
}

interface ShoppingCartProps {
  isOpen: boolean;
  onClose: () => void;
}

const ShoppingCart: React.FC<ShoppingCartProps> = ({ isOpen, onClose }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    AuthChatService.init();
    const currentUser = AuthChatService.getCurrentUser();
    
    if (currentUser) {
      loadCartItems();
    }
    
    // Listen for cart updates
    const handleCartUpdate = () => {
      console.log('ShoppingCart: Cart updated, reloading...');
      loadCartItems();
    };
    
    window.addEventListener('cartUpdated', handleCartUpdate);
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  // Reload cart when ShoppingCart opens
  useEffect(() => {
    if (isOpen) {
      console.log('ShoppingCart: Opened, reloading cart...');
      loadCartItems();
    }
  }, [isOpen]);

  const loadCartItems = async () => {
    try {
      setLoading(true);
      console.log('🛒 ShoppingCart: Loading cart items...');
      const token = await AuthChatService.getToken();
      
      console.log('🛒 ShoppingCart - loadCartItems - Token:', token);
      console.log('🛒 ShoppingCart - loadCartItems - Token type:', typeof token);
      console.log('🛒 ShoppingCart - loadCartItems - Token length:', token?.length);
      console.log('🛒 ShoppingCart - loadCartItems - API URL:', getApiUrl('/api/cart'));
      
      if (!token) {
        console.log('🛒 ShoppingCart: No token, clearing cart');
        setCartItems([]);
        return;
      }

      const response = await fetch(getApiUrl('/api/cart'), {
        method: 'GET', // Change back to GET
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('🛒 ShoppingCart - loadCartItems - Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('🛒 ShoppingCart - loadCartItems - Error response:', errorText);
        throw new Error('Failed to fetch cart');
      }
      
      const data = await response.json();
      console.log('🛒 ShoppingCart: API response:', data);
      
      if (data.success && Array.isArray(data.cartItems)) {
        setCartItems(data.cartItems);
        console.log('🛒 ShoppingCart: Loaded', data.cartItems.length, 'items');
      } else {
        setCartItems([]);
        console.log('🛒 ShoppingCart: No items or invalid response');
        console.log('🛒 ShoppingCart: Expected data.cartItems but got:', Object.keys(data));
      }
      
    } catch (error) {
      console.error('🛒 ShoppingCart: Error loading cart:', error);
      // Don't fallback to mock data - show empty cart
      setCartItems([]);
      console.log('🛒 ShoppingCart: Cart is empty due to error');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (cartId: number, newQuantity: number) => {
    if (newQuantity < 1) {
      await removeItem(cartId);
      return;
    }

    try {
      // Mock update for now
      setCartItems(prev => 
        prev.map(item => 
          item.CartID === cartId 
            ? { ...item, Quantity: newQuantity }
            : item
        )
      );
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const removeItem = async (cartId: number) => {
    try {
      const token = await AuthChatService.getToken();
      if (!token) {
        alert('Vui lòng đăng nhập để xóa sản phẩm');
        return;
      }

      // Get current user info for Google token authentication
      const currentUser = await AuthChatService.getCurrentUser();
      const userInfo = currentUser ? {
        email: currentUser.email,
        name: currentUser.name,
        role: currentUser.role
      } : null;

      const response = await fetch(getApiUrl(`/api/cart/${cartId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userInfo })
      });

      if (!response.ok) {
        throw new Error('Failed to remove item');
      }

      const result = await response.json();
      if (result.success) {
        console.log('🔄 ShoppingCart: Item removed, reloading cart...');
        // Reload cart items from server
        await loadCartItems();
        // Dispatch cart updated event
        console.log('📡 ShoppingCart: Dispatching cartUpdated event');
        window.dispatchEvent(new CustomEvent('cartUpdated'));
        console.log('✅ ShoppingCart: Item removed successfully');
      } else {
        throw new Error(result.message || 'Failed to remove item');
      }
    } catch (error) {
      console.error('Error removing item:', error);
      alert('Không thể xóa sản phẩm: ' + (error as Error).message);
    }
  };

  const clearCart = async () => {
    try {
      const token = await AuthChatService.getToken();
      if (!token) {
        alert('Vui lòng đăng nhập để xóa giỏ hàng');
        return;
      }

      // Clear all items by calling removeItem for each item
      for (const item of cartItems) {
        await removeItem(item.CartID);
      }
      
      // Dispatch cart updated event
      window.dispatchEvent(new CustomEvent('cartUpdated'));
      console.log('✅ Cart cleared successfully');
    } catch (error) {
      console.error('Error clearing cart:', error);
      alert('Không thể xóa giỏ hàng: ' + (error as Error).message);
    }
  };

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
    onClose();
  };

  const subtotal = (cartItems || []).reduce((sum, item) => sum + (item.Price * item.Quantity), 0);
  const shipping = subtotal > 500000 ? 0 : 30000; // Free shipping over 500k
  const tax = subtotal * 0.1; // 10% tax
  const total = subtotal + shipping + tax;

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: '400px',
      height: '100vh',
      backgroundColor: 'white',
      boxShadow: '-5px 0 15px rgba(0,0,0,0.1)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{
          fontSize: '1.2rem',
          fontWeight: '500',
          margin: 0,
          color: '#333'
        }}>
          Giỏ hàng ({cartItems.length})
        </h3>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            color: '#666',
            padding: '5px'
          }}
        >
          ×
        </button>
      </div>

      {/* Cart Items */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        minHeight: 0 // Đảm bảo flex item có thể shrink
      }}>
        {loading ? (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '200px',
            color: '#666'
          }}>
            Đang tải...
          </div>
        ) : cartItems.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#666'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🛒</div>
            <h4 style={{ fontSize: '1.1rem', marginBottom: '10px', color: '#333' }}>
              Giỏ hàng trống
            </h4>
            <p style={{ fontSize: '14px', marginBottom: '20px' }}>
              Hãy thêm sản phẩm vào giỏ hàng để tiếp tục mua sắm
            </p>
            <button
              onClick={() => navigateTo('/products')}
              style={{
                padding: '12px 24px',
                backgroundColor: '#000',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Mua sắm ngay
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {cartItems.map((item) => (
              <div
                key={item.CartID}
                style={{
                  display: 'flex',
                  gap: '12px',
                  padding: '15px',
                  backgroundColor: '#f8f8f8',
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0'
                }}
              >
                {/* Product Image */}
                <div style={{
                  width: '60px',
                  height: '60px',
                  backgroundColor: '#f0f0f0',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  flexShrink: 0,
                  overflow: 'hidden'
                }}>
                  {item.Image && item.Image.startsWith('http') ? (
                    <img 
                      src={item.Image} 
                      alt={item.ProductName}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '6px'
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div style={{
                    display: item.Image && item.Image.startsWith('http') ? 'none' : 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                    fontSize: '1.5rem'
                  }}>
                    📦
                  </div>
                </div>

                {/* Product Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    margin: '0 0 4px 0',
                    color: '#333',
                    lineHeight: '1.3',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {item.ProductName}
                  </h4>
                  
                  <p style={{
                    fontSize: '12px',
                    color: '#666',
                    margin: '0 0 4px 0',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {item.ShopName}
                  </p>
                  
                  <p style={{
                    fontSize: '12px',
                    color: '#666',
                    margin: '0 0 8px 0'
                  }}>
                    SKU: {item.SKU}
                  </p>

                  {/* Quantity Controls */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px'
                  }}>
                    <button
                      onClick={() => updateQuantity(item.CartID, item.Quantity - 1)}
                      style={{
                        width: '24px',
                        height: '24px',
                        border: '1px solid #e0e0e0',
                        backgroundColor: 'white',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        color: '#666'
                      }}
                    >
                      −
                    </button>
                    
                    <span style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      minWidth: '20px',
                      textAlign: 'center'
                    }}>
                      {item.Quantity}
                    </span>
                    
                    <button
                      onClick={() => updateQuantity(item.CartID, item.Quantity + 1)}
                      style={{
                        width: '24px',
                        height: '24px',
                        border: '1px solid #e0e0e0',
                        backgroundColor: 'white',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        color: '#666'
                      }}
                    >
                      +
                    </button>
                  </div>

                  {/* Price */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#000'
                    }}>
                      {(item.Price * item.Quantity).toLocaleString()} VND
                    </span>
                    
                    <button
                      onClick={() => removeItem(item.CartID)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#dc3545',
                        cursor: 'pointer',
                        fontSize: '12px',
                        padding: '4px'
                      }}
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {cartItems.length > 0 && (
        <div style={{
          padding: '20px',
          borderTop: '1px solid #e0e0e0',
          backgroundColor: '#f8f8f8'
        }}>
          {/* Price Summary */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px',
              fontSize: '14px',
              color: '#666'
            }}>
              <span>Tạm tính:</span>
              <span>{subtotal.toLocaleString()} VND</span>
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px',
              fontSize: '14px',
              color: '#666'
            }}>
              <span>Phí vận chuyển:</span>
              <span>{shipping === 0 ? 'Miễn phí' : `${shipping.toLocaleString()} VND`}</span>
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px',
              fontSize: '14px',
              color: '#666'
            }}>
              <span>Thuế (10%):</span>
              <span>{tax.toLocaleString()} VND</span>
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '16px',
              fontWeight: '600',
              color: '#000',
              paddingTop: '8px',
              borderTop: '1px solid #e0e0e0'
            }}>
              <span>Tổng cộng:</span>
              <span>{total.toLocaleString()} VND</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={() => navigateTo('/checkout')}
              style={{
                padding: '15px',
                backgroundColor: '#000',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500',
                transition: 'background-color 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#333';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#000';
              }}
            >
              Thanh toán ({total.toLocaleString()} VND)
            </button>
            
            <button
              onClick={clearCart}
              style={{
                padding: '10px',
                backgroundColor: 'transparent',
                color: '#dc3545',
                border: '1px solid #dc3545',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#dc3545';
                e.currentTarget.style.color = 'white';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#dc3545';
              }}
            >
              Xóa giỏ hàng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShoppingCart;
