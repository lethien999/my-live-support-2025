import React, { useState, useEffect } from 'react';
import AuthChatService from '../services/AuthChatService';
import { getApiUrl } from '../config/api';

interface HeaderProps {
  onCartClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onCartClick }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);

  useEffect(() => {
    AuthChatService.init();
    const currentUser = AuthChatService.getCurrentUser();
    if (currentUser) {
      setIsAuthenticated(true);
      setUser(currentUser);
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }
    
    // Listen for authentication changes
    const handleAuthChange = () => {
      const user = AuthChatService.getCurrentUser();
      if (user) {
        setIsAuthenticated(true);
        setUser(user);
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    };
    
    // Add event listener for auth changes
    window.addEventListener('authChange', handleAuthChange);
    
    // Add event listener for cart updates
    const handleCartUpdate = () => {
      loadCartCount();
    };
    window.addEventListener('cartUpdated', handleCartUpdate);
    
    // Load initial cart count
    loadCartCount();
    
    return () => {
      window.removeEventListener('authChange', handleAuthChange);
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  const loadCartCount = async () => {
    try {
      const token = AuthChatService.getToken();
      if (!token) {
        setCartItemCount(0);
        return;
      }
      
      const response = await fetch(getApiUrl('/api/cart'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.cartItems)) {
          const totalItems = data.cartItems.length; // Đếm số items thay vì tổng quantity
          setCartItemCount(totalItems);
        } else {
          setCartItemCount(0);
        }
      }
    } catch (error) {
      console.error('Error loading cart count:', error);
    }
  };

  const handleLogout = () => {
    AuthChatService.logout();
    setIsAuthenticated(false);
    setUser(null);
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <header style={{ backgroundColor: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
      {/* Top Utility Bar */}
      <div style={{
        backgroundColor: '#f8f8f8',
        padding: '8px 0',
        fontSize: '12px',
        color: '#666',
        borderBottom: '1px solid #e0e0e0'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', display: 'flex', justifyContent: 'space-between' }}>
          <div>
            Miễn phí vận chuyển cho đơn hàng từ 499.000 VND
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <span>Hotline: 1900 255 579</span>
            <span>Tiếng Việt ▼</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 0'
        }}>
          {/* Logo */}
          <div
            onClick={() => navigateTo('/')}
            style={{
              cursor: 'pointer',
              fontSize: '2rem',
              fontWeight: '300',
              color: '#000',
              letterSpacing: '2px'
            }}
          >
            MUJI
          </div>

          {/* Navigation */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
            <button
              onClick={() => navigateTo('/products')}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '16px',
                fontWeight: '400',
                color: '#333',
                cursor: 'pointer',
                padding: '10px 0',
                borderBottom: '2px solid transparent',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderBottomColor = '#000';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderBottomColor = 'transparent';
              }}
            >
              Sản phẩm
            </button>

            <button
              onClick={() => navigateTo('/chat')}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '16px',
                fontWeight: '400',
                color: '#333',
                cursor: 'pointer',
                padding: '10px 0',
                borderBottom: '2px solid transparent',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderBottomColor = '#000';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderBottomColor = 'transparent';
              }}
            >
              Hỗ trợ
            </button>

            {/* Shopping Cart */}
            <button
              onClick={onCartClick}
              style={{
                padding: '10px',
                border: '2px solid #e0e0e0',
                backgroundColor: '#f8f8f8',
                borderRadius: '5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.3s ease',
                position: 'relative'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#000';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.borderColor = '#000';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#f8f8f8';
                e.currentTarget.style.color = '#333';
                e.currentTarget.style.borderColor = '#e0e0e0';
              }}
            >
              🛒 Giỏ hàng
              <span style={{
                backgroundColor: '#ff4444',
                color: 'white',
                borderRadius: '10px',
                padding: '2px 6px',
                fontSize: '11px',
                fontWeight: '500',
                minWidth: '16px',
                textAlign: 'center'
              }}>{
                cartItemCount > 0 ? cartItemCount : ''
              }</span>
            </button>

            {/* User Menu */}
            {isAuthenticated ? (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '16px',
                    fontWeight: '400',
                    color: '#333',
                    cursor: 'pointer',
                    padding: '10px 15px',
                    borderRadius: '5px',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#f0f0f0';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  👤 {user?.name || 'User'} ▼
                </button>

                {showUserMenu && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: '0',
                    backgroundColor: 'white',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    minWidth: '200px',
                    zIndex: 1000
                  }}>
                    <div style={{ padding: '10px 0' }}>
                      <button
                        onClick={() => {
                          navigateTo('/dashboard');
                          setShowUserMenu(false);
                        }}
                        style={{
                          width: '100%',
                          padding: '10px 20px',
                          background: 'none',
                          border: 'none',
                          textAlign: 'left',
                          cursor: 'pointer',
                          fontSize: '14px',
                          color: '#333',
                          transition: 'background-color 0.3s ease'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = '#f0f0f0';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        📊 Dashboard
                      </button>
                      
                      {user?.role === 'Agent' && (
                        <button
                          onClick={() => {
                            navigateTo('/shop-chat');
                            setShowUserMenu(false);
                          }}
                          style={{
                            width: '100%',
                            padding: '10px 20px',
                            background: 'none',
                            border: 'none',
                            textAlign: 'left',
                            cursor: 'pointer',
                            fontSize: '14px',
                            color: '#333',
                            transition: 'background-color 0.3s ease'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = '#f0f0f0';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          💬 Shop Chat
                        </button>
                      )}
                      
                      <button
                        onClick={() => {
                          navigateTo('/orders');
                          setShowUserMenu(false);
                        }}
                        style={{
                          width: '100%',
                          padding: '10px 20px',
                          background: 'none',
                          border: 'none',
                          textAlign: 'left',
                          cursor: 'pointer',
                          fontSize: '14px',
                          color: '#333',
                          transition: 'background-color 0.3s ease'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = '#f0f0f0';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        📦 Đơn hàng
                      </button>
                      
                      <button
                        onClick={() => {
                          navigateTo('/tickets');
                          setShowUserMenu(false);
                        }}
                        style={{
                          width: '100%',
                          padding: '10px 20px',
                          background: 'none',
                          border: 'none',
                          textAlign: 'left',
                          cursor: 'pointer',
                          fontSize: '14px',
                          color: '#333',
                          transition: 'background-color 0.3s ease'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = '#f0f0f0';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        🎫 Tickets
                      </button>
                      
                      <div style={{ borderTop: '1px solid #e0e0e0', margin: '5px 0' }}></div>
                      
                      <button
                        onClick={() => {
                          handleLogout();
                          setShowUserMenu(false);
                        }}
                        style={{
                          width: '100%',
                          padding: '10px 20px',
                          background: 'none',
                          border: 'none',
                          textAlign: 'left',
                          cursor: 'pointer',
                          fontSize: '14px',
                          color: '#e74c3c',
                          transition: 'background-color 0.3s ease'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = '#f0f0f0';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        🚪 Đăng xuất
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '15px' }}>
                <button
                  onClick={() => navigateTo('/login')}
                  style={{
                    background: 'none',
                    border: '1px solid #e0e0e0',
                    padding: '10px 20px',
                    borderRadius: '5px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = '#000';
                    e.currentTarget.style.backgroundColor = '#f0f0f0';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = '#e0e0e0';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  Đăng nhập
                </button>
                <button
                  onClick={() => navigateTo('/register')}
                  style={{
                    background: '#000',
                    border: 'none',
                    color: 'white',
                    padding: '10px 20px',
                    borderRadius: '5px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#333';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#000';
                  }}
                >
                  Đăng ký
                </button>
              </div>
            )}
          </nav>
        </div>
      </div>

      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </header>
  );
};

export default Header;