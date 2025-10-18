import React, { useState, useEffect } from 'react';
import AuthChatService from '../services/AuthChatService';
import { getApiUrl, API_CONFIG } from '../config/api';

interface Order {
  OrderID: number;
  OrderNumber: string;
  ShopName: string;
  Status: string;
  PaymentStatus: string;
  ShippingStatus: string;
  TotalAmount: number;
  CreatedAt: string;
  ShippedAt?: string;
  DeliveredAt?: string;
  TrackingNumber?: string;
  Items: OrderItem[];
}

interface OrderItem {
  ProductName: string;
  Quantity: number;
  UnitPrice: number;
  TotalPrice: number;
  Image: string;
  SKU: string;
}

const OrderManagementPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AuthChatService.init();
    const currentUser = AuthChatService.getCurrentUser();
    
    if (currentUser) {
      loadOrders();
    }
    
    // Listen for order updates (when new orders are created)
    const handleOrderUpdate = () => {
      console.log('🔄 OrderManagementPage: Order updated event received, reloading...');
      loadOrders();
    };
    
    console.log('👂 OrderManagementPage: Setting up orderUpdated listener');
    window.addEventListener('orderUpdated', handleOrderUpdate);
    
    return () => {
      console.log('🧹 OrderManagementPage: Removing orderUpdated listener');
      window.removeEventListener('orderUpdated', handleOrderUpdate);
    };
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      
      const token = AuthChatService.getToken();
      console.log('🔍 OrderManagementPage: Loading orders with token:', token);
      
      const response = await fetch(getApiUrl('/api/orders'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('🔍 OrderManagementPage: API response status:', response.status);
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      
      const data = await response.json();
      console.log('🔍 OrderManagementPage: API response data:', data);
      setOrders(data.data || []);
      
    } catch (error) {
      console.error('Error loading orders:', error);
      // Don't fallback to mock data - show empty state instead
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered': return '#28a745';
      case 'Shipped': return '#3b82f6';
      case 'Processing': return '#ffc107';
      case 'Cancelled': return '#dc3545';
      default: return '#666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'Delivered': return 'Đã giao hàng';
      case 'Shipped': return 'Đang giao hàng';
      case 'Processing': return 'Đang xử lý';
      case 'Cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  const handleContactShop = (order: Order) => {
    try {
      // Save detailed order context for chat
      localStorage.setItem('chatContext', JSON.stringify({
        type: 'order',
        orderNumber: order.OrderNumber,
        shopName: order.ShopName,
        orderId: order.OrderID,
        orderDate: order.CreatedAt,
        orderStatus: order.Status,
        orderTotal: order.TotalAmount || 0,
        orderItems: order.Items || [],
        // Pre-filled message with order details
        message: `Xin chào! Tôi có vấn đề với đơn hàng ${order.OrderNumber} (${order.ShopName}). Đơn hàng được đặt ngày ${new Date(order.CreatedAt).toLocaleDateString('vi-VN')} với tổng giá trị ${(order.TotalAmount || 0).toLocaleString('vi-VN')} VND. Hiện tại trạng thái: ${getStatusText(order.Status)}. Tôi cần hỗ trợ về vấn đề này.`,
        // Additional context for agent
        context: {
          orderNumber: order.OrderNumber,
          shopName: order.ShopName,
          orderDate: order.CreatedAt,
          status: order.Status,
          total: order.TotalAmount || 0,
          items: order.Items || [],
          customerName: 'Khách hàng mẫu', // This should come from user context
          priority: 'high' // Order-related issues are high priority
        }
      }));
      
      console.log('📦 Order context saved:', {
        orderNumber: order.OrderNumber,
        shopName: order.ShopName,
        total: order.TotalAmount || 0
      });
      
      // Navigate to chat page
      navigateTo('/chat');
    } catch (error) {
      console.error('❌ Error in handleContactShop:', error);
      alert('Có lỗi xảy ra khi liên hệ shop. Vui lòng thử lại.');
    }
  };

  const handleCancelOrder = (order: Order) => {
    if (order.Status === 'Processing' || order.Status === 'Pending') {
      if (confirm(`Bạn có chắc muốn hủy đơn hàng ${order.OrderNumber}?`)) {
        // Mock cancel order
        setOrders(prev => 
          prev.map(o => 
            o.OrderID === order.OrderID 
              ? { ...o, Status: 'Cancelled' }
              : o
          )
        );
        alert('Đơn hàng đã được hủy');
      }
    } else {
      alert('Không thể hủy đơn hàng này');
    }
  };

  const navigateTo = (path: string) => {
    console.log('🚀 Navigating to:', path);
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
    console.log('✅ Navigation event dispatched');
  };

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
            Quản lý đơn hàng
          </h1>
          <p style={{ color: '#666', fontSize: '14px' }}>
            Theo dõi và quản lý các đơn hàng của bạn
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
        {orders.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>📦</div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '10px', color: '#333' }}>
              Chưa có đơn hàng nào
            </h3>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              Hãy bắt đầu mua sắm để tạo đơn hàng đầu tiên
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {orders.map((order) => (
              <div
                key={order.OrderID}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  padding: '25px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                  border: '1px solid #f0f0f0'
                }}
              >
                {/* Order Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '20px',
                  paddingBottom: '15px',
                  borderBottom: '1px solid #f0f0f0'
                }}>
                  <div>
                    <h3 style={{
                      fontSize: '1.2rem',
                      fontWeight: '500',
                      margin: '0 0 8px 0',
                      color: '#333'
                    }}>
                      Đơn hàng #{order.OrderNumber}
                    </h3>
                    <p style={{
                      fontSize: '14px',
                      color: '#666',
                      margin: '0 0 4px 0'
                    }}>
                      Cửa hàng: {order.ShopName}
                    </p>
                    <p style={{
                      fontSize: '12px',
                      color: '#999',
                      margin: 0
                    }}>
                      Ngày đặt: {new Date(order.CreatedAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      display: 'inline-block',
                      padding: '6px 12px',
                      backgroundColor: getStatusColor(order.Status),
                      color: 'white',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '500',
                      marginBottom: '8px'
                    }}>
                      {getStatusText(order.Status)}
                    </div>
                    <p style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#000',
                      margin: 0
                    }}>
                      {(order.TotalAmount || 0).toLocaleString()} VND
                    </p>
                  </div>
                </div>

                {/* Order Items */}
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    margin: '0 0 15px 0',
                    color: '#333'
                  }}>
                    Sản phẩm ({order.Items.length})
                  </h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {order.Items.map((item, index) => (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          gap: '12px',
                          padding: '12px',
                          backgroundColor: '#f8f8f8',
                          borderRadius: '6px'
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
                          flexShrink: 0
                        }}>
                          {item.Image}
                        </div>
                        
                        <div style={{ flex: 1 }}>
                          <h5 style={{
                            fontSize: '14px',
                            fontWeight: '500',
                            margin: '0 0 4px 0',
                            color: '#333'
                          }}>
                            {item.ProductName}
                          </h5>
                          <p style={{
                            fontSize: '12px',
                            color: '#666',
                            margin: '0 0 4px 0'
                          }}>
                            SKU: {item.SKU}
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
                              {item.Quantity} × {(item.UnitPrice || 0).toLocaleString()} VND
                            </span>
                            <span style={{
                              fontSize: '13px',
                              fontWeight: '500',
                              color: '#000'
                            }}>
                              {(item.TotalPrice || 0).toLocaleString()} VND
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Details */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '15px',
                  marginBottom: '20px',
                  padding: '15px',
                  backgroundColor: '#f8f8f8',
                  borderRadius: '6px'
                }}>
                  <div>
                    <p style={{
                      fontSize: '12px',
                      color: '#666',
                      margin: '0 0 4px 0'
                    }}>
                      Trạng thái thanh toán:
                    </p>
                    <p style={{
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#333',
                      margin: 0
                    }}>
                      {order.PaymentStatus === 'Paid' ? 'Đã thanh toán' : order.PaymentStatus}
                    </p>
                  </div>
                  
                  <div>
                    <p style={{
                      fontSize: '12px',
                      color: '#666',
                      margin: '0 0 4px 0'
                    }}>
                      Trạng thái giao hàng:
                    </p>
                    <p style={{
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#333',
                      margin: 0
                    }}>
                      {getStatusText(order.ShippingStatus)}
                    </p>
                  </div>
                  
                  {order.TrackingNumber && (
                    <div>
                      <p style={{
                        fontSize: '12px',
                        color: '#666',
                        margin: '0 0 4px 0'
                      }}>
                        Mã vận đơn:
                      </p>
                      <p style={{
                        fontSize: '13px',
                        fontWeight: '500',
                        color: '#333',
                        margin: 0
                      }}>
                        {order.TrackingNumber}
                      </p>
                    </div>
                  )}
                  
                  {order.DeliveredAt && (
                    <div>
                      <p style={{
                        fontSize: '12px',
                        color: '#666',
                        margin: '0 0 4px 0'
                      }}>
                        Ngày giao hàng:
                      </p>
                      <p style={{
                        fontSize: '13px',
                        fontWeight: '500',
                        color: '#333',
                        margin: 0
                      }}>
                        {new Date(order.DeliveredAt).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div style={{
                  display: 'flex',
                  gap: '10px',
                  flexWrap: 'wrap'
                }}>
                  <button
                    onClick={() => handleContactShop(order)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '500',
                      transition: 'background-color 0.3s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#2563eb';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = '#3b82f6';
                    }}
                  >
                    💬 Liên hệ shop
                  </button>
                  
                  {(order.Status === 'Processing' || order.Status === 'Pending') && (
                    <button
                      onClick={() => handleCancelOrder(order)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '500',
                        transition: 'background-color 0.3s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#c82333';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = '#dc3545';
                      }}
                    >
                      ❌ Hủy đơn hàng
                    </button>
                  )}
                  
                  {order.Status === 'Delivered' && (
                    <button
                      onClick={() => alert('Tính năng đánh giá sắp có')}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '500',
                        transition: 'background-color 0.3s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#218838';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = '#28a745';
                      }}
                    >
                      ⭐ Đánh giá sản phẩm
                    </button>
                  )}
                  
                  <button
                    onClick={() => alert('Tính năng đặt lại sắp có')}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '500',
                      transition: 'background-color 0.3s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#5a6268';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = '#6c757d';
                    }}
                  >
                    🔄 Đặt lại
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderManagementPage;
