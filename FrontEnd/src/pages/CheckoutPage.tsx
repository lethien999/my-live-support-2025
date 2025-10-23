import React, { useState, useEffect } from 'react';
import AuthChatService from '../services/AuthChatService';
import { getApiUrl } from '../config/api';

interface OrderItem {
  ProductID: number;
  ProductName: string;
  Price: number;
  Quantity: number;
  Image: string;
  ShopName: string;
  SKU: string;
}

interface CheckoutForm {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  paymentMethod: string;
  shippingMethod: string;
  notes: string;
}

const CheckoutPage: React.FC = () => {
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<CheckoutForm>({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    paymentMethod: 'cod',
    shippingMethod: 'standard',
    notes: ''
  });
  
  useEffect(() => {
    AuthChatService.init();
    const user = AuthChatService.getCurrentUser();
    setCurrentUser(user);
    
    if (user) {
      setForm(prev => ({
        ...prev,
        fullName: user.name || '',
        email: user.email || ''
      }));
    }
  }, []); // Chỉ chạy 1 lần khi component mount

  useEffect(() => {
    if (currentUser) {
      loadOrderItems();
    }
    
    // Listen for cart updates
    const handleCartUpdate = () => {
      console.log('🔄 CheckoutPage: Cart updated event received, reloading...');
      loadOrderItems();
    };
    
    console.log('👂 CheckoutPage: Setting up cartUpdated listener');
    window.addEventListener('cartUpdated', handleCartUpdate);
    
    return () => {
      console.log('🧹 CheckoutPage: Removing cartUpdated listener');
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, [currentUser]); // Chỉ chạy khi currentUser thay đổi

  const loadOrderItems = async () => {
    try {
      console.log('🛒 CheckoutPage: Loading order items...');
      setLoading(true);
      
      const token = await AuthChatService.getToken();
      if (!token) {
        console.error('❌ CheckoutPage: No token available for checkout');
        setOrderItems([]);
        return;
      }

      console.log('🔑 CheckoutPage: Token available, fetching cart...');

      // Get current user info for Google token authentication
      const currentUser = await AuthChatService.getCurrentUser();
      const userInfo = currentUser ? {
        email: currentUser.email,
        name: currentUser.name,
        role: currentUser.role
      } : null;

      // Load cart items from backend
      const response = await fetch(getApiUrl('/api/cart'), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📦 CheckoutPage: Cart data received:', data);
      
      if (data.success && data.cartItems) {
        // Convert cart items to order items format
        const orderItems: OrderItem[] = data.cartItems.map((item: any) => ({
          ProductID: item.ProductID,
          ProductName: item.ProductName,
          Price: item.Price,
          Quantity: item.Quantity,
          Image: item.Image || '📦',
          ShopName: item.ShopName || 'MUJI Store',
          SKU: item.SKU || 'N/A'
        }));
        
        setOrderItems(orderItems);
        console.log('✅ CheckoutPage: Order items updated:', orderItems.length, 'items');
      } else {
        console.log('⚠️ CheckoutPage: No cart items found');
        setOrderItems([]);
      }
    } catch (error) {
      console.error('Error loading order items:', error);
      setOrderItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      alert('Vui lòng đăng nhập để thanh toán');
      return;
    }

    setSubmitting(true);
    
    try {
      const token = await AuthChatService.getToken();
      if (!token) {
        throw new Error('Vui lòng đăng nhập');
      }

      // Prepare order data
      const orderData = {
        items: orderItems.map(item => ({
          productId: item.ProductID,
          quantity: item.Quantity,
          price: item.Price
        })),
        shippingAddress: `${form.address}, ${form.city}, ${form.province} ${form.postalCode}`,
        paymentMethod: form.paymentMethod,
        notes: form.notes,
        totalAmount: total
      };

      console.log('Creating order:', orderData);

      const response = await fetch(getApiUrl('/api/orders'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        alert(`Đặt hàng thành công! Mã đơn hàng: ${result.orderNumber}`);
        // Redirect to order management page first
        window.location.href = '/orders';
        // Dispatch order updated event after redirect
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('orderUpdated'));
        }, 100);
      } else {
        throw new Error(result.message || 'Có lỗi xảy ra khi tạo đơn hàng');
      }
      
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const subtotal = orderItems.reduce((sum, item) => sum + (item.Price * item.Quantity), 0);
  const shipping = form.shippingMethod === 'express' ? 50000 : 30000;
  const tax = subtotal * 0.1; // 10% tax
  const total = subtotal + shipping + tax;

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '50vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Đang tải...
      </div>
    );
  }

  if (orderItems.length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '50vh',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🛒</div>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '10px', color: '#333' }}>
          Giỏ hàng trống
        </h3>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          Hãy thêm sản phẩm vào giỏ hàng để tiếp tục thanh toán
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
    );
  }

  return (
    <div style={{ backgroundColor: '#fafafa', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px 0',
        borderBottom: '1px solid #e0e0e0',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: '300',
            marginBottom: '10px',
            color: '#333'
          }}>
            Thanh toán
          </h1>
          <p style={{ color: '#666', fontSize: '14px' }}>
            Hoàn tất đơn hàng của bạn
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
        <div style={{ display: 'flex', gap: '40px' }}>
          {/* Checkout Form */}
          <div style={{ flex: 1 }}>
            <form onSubmit={handleSubmit}>
              {/* Shipping Information */}
              <div style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '30px',
                marginBottom: '30px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{
                  fontSize: '1.3rem',
                  fontWeight: '500',
                  marginBottom: '20px',
                  color: '#333'
                }}>
                  Thông tin giao hàng
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      marginBottom: '8px',
                      color: '#333'
                    }}>
                      Họ và tên *
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={form.fullName}
                      onChange={handleInputChange}
                      required
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '5px',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'border-color 0.3s ease'
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#000';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#e0e0e0';
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      marginBottom: '8px',
                      color: '#333'
                    }}>
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleInputChange}
                      required
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '5px',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'border-color 0.3s ease'
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#000';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#e0e0e0';
                      }}
                    />
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      marginBottom: '8px',
                      color: '#333'
                    }}>
                      Số điện thoại *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleInputChange}
                      required
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '5px',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'border-color 0.3s ease'
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#000';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#e0e0e0';
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      marginBottom: '8px',
                      color: '#333'
                    }}>
                      Mã bưu điện
                    </label>
                    <input
                      type="text"
                      name="postalCode"
                      value={form.postalCode}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '5px',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'border-color 0.3s ease'
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#000';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#e0e0e0';
                      }}
                    />
                  </div>
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    marginBottom: '8px',
                    color: '#333'
                  }}>
                    Địa chỉ *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={form.address}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #e0e0e0',
                      borderRadius: '5px',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.3s ease'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#000';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#e0e0e0';
                    }}
                  />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      marginBottom: '8px',
                      color: '#333'
                    }}>
                      Thành phố *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={form.city}
                      onChange={handleInputChange}
                      required
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '5px',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'border-color 0.3s ease'
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#000';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#e0e0e0';
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      marginBottom: '8px',
                      color: '#333'
                    }}>
                      Tỉnh/Thành phố *
                    </label>
                    <select
                      name="province"
                      value={form.province}
                      onChange={handleInputChange}
                      required
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '5px',
                        fontSize: '14px',
                        outline: 'none',
                        backgroundColor: 'white',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="">Chọn tỉnh/thành phố</option>
                      <option value="Hồ Chí Minh">Hồ Chí Minh</option>
                      <option value="Hà Nội">Hà Nội</option>
                      <option value="Đà Nẵng">Đà Nẵng</option>
                      <option value="Cần Thơ">Cần Thơ</option>
                      <option value="An Giang">An Giang</option>
                      <option value="Bà Rịa - Vũng Tàu">Bà Rịa - Vũng Tàu</option>
                      <option value="Bắc Giang">Bắc Giang</option>
                      <option value="Bắc Kạn">Bắc Kạn</option>
                      <option value="Bạc Liêu">Bạc Liêu</option>
                      <option value="Bắc Ninh">Bắc Ninh</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Payment & Shipping */}
              <div style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '30px',
                marginBottom: '30px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{
                  fontSize: '1.3rem',
                  fontWeight: '500',
                  marginBottom: '20px',
                  color: '#333'
                }}>
                  Phương thức thanh toán & giao hàng
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      marginBottom: '8px',
                      color: '#333'
                    }}>
                      Phương thức thanh toán *
                    </label>
                    <select
                      name="paymentMethod"
                      value={form.paymentMethod}
                      onChange={handleInputChange}
                      required
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '5px',
                        fontSize: '14px',
                        outline: 'none',
                        backgroundColor: 'white',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="cod">Thanh toán khi nhận hàng (COD)</option>
                      <option value="bank">Chuyển khoản ngân hàng</option>
                      <option value="card">Thẻ tín dụng/ghi nợ</option>
                      <option value="ewallet">Ví điện tử</option>
                    </select>
                  </div>
                  
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      marginBottom: '8px',
                      color: '#333'
                    }}>
                      Phương thức giao hàng *
                    </label>
                    <select
                      name="shippingMethod"
                      value={form.shippingMethod}
                      onChange={handleInputChange}
                      required
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '5px',
                        fontSize: '14px',
                        outline: 'none',
                        backgroundColor: 'white',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="standard">Giao hàng tiêu chuẩn (3-5 ngày) - 30,000 VND</option>
                      <option value="express">Giao hàng nhanh (1-2 ngày) - 50,000 VND</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    marginBottom: '8px',
                    color: '#333'
                  }}>
                    Ghi chú đơn hàng
                  </label>
                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={handleInputChange}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #e0e0e0',
                      borderRadius: '5px',
                      fontSize: '14px',
                      outline: 'none',
                      resize: 'vertical',
                      transition: 'border-color 0.3s ease'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#000';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#e0e0e0';
                    }}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: '100%',
                  padding: '15px',
                  backgroundColor: submitting ? '#ccc' : '#000',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: '500',
                  transition: 'background-color 0.3s ease'
                }}
              >
                {submitting ? 'Đang xử lý...' : `Đặt hàng - ${total.toLocaleString()} VND`}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div style={{ width: '350px', flexShrink: 0 }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '30px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              position: 'sticky',
              top: '20px'
            }}>
              <h3 style={{
                fontSize: '1.3rem',
                fontWeight: '500',
                marginBottom: '20px',
                color: '#333'
              }}>
                Tóm tắt đơn hàng
              </h3>
              
              {/* Order Items */}
              <div style={{ marginBottom: '20px' }}>
                {orderItems.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      gap: '12px',
                      padding: '12px 0',
                      borderBottom: index < orderItems.length - 1 ? '1px solid #f0f0f0' : 'none'
                    }}
                  >
                    <div style={{
                      width: '50px',
                      height: '50px',
                      backgroundColor: '#f0f0f0',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem',
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
                        fontSize: '1.2rem'
                      }}>
                        📦
                      </div>
                    </div>
                    
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{
                        fontSize: '13px',
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
                        fontSize: '11px',
                        color: '#666',
                        margin: '0 0 4px 0',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {item.ShopName}
                      </p>
                      
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span style={{
                          fontSize: '12px',
                          color: '#666'
                        }}>
                          {item.Quantity} × {item.Price.toLocaleString()} VND
                        </span>
                        
                        <span style={{
                          fontSize: '13px',
                          fontWeight: '500',
                          color: '#000'
                        }}>
                          {(item.Price * item.Quantity).toLocaleString()} VND
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
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
                  <span>{shipping.toLocaleString()} VND</span>
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
              
              {/* Security Notice */}
              <div style={{
                backgroundColor: '#f8f8f8',
                padding: '15px',
                borderRadius: '5px',
                fontSize: '12px',
                color: '#666',
                lineHeight: '1.4'
              }}>
                🔒 Thông tin của bạn được bảo mật và mã hóa. Chúng tôi cam kết không chia sẻ thông tin cá nhân với bên thứ ba.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
