import React from 'react';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
    description?: string;
    category?: string;
  };
  onViewProduct?: (productId: string) => void;
  onAddToCart?: (productId: string) => void;
}

interface OrderCardProps {
  order: {
    id: string;
    status: string;
    total: number;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
      image: string;
    }>;
    createdAt: string;
    estimatedDelivery?: string;
  };
  onViewOrder?: (orderId: string) => void;
  onTrackOrder?: (orderId: string) => void;
}

interface QuickActionProps {
  title: string;
  description: string;
  icon: string;
  action: string;
  onAction?: (action: string) => void;
}

// Product Card Component
export const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onViewProduct, 
  onAddToCart 
}) => {
  return (
    <div style={{
      backgroundColor: '#2d2d2d',
      borderRadius: '12px',
      padding: '16px',
      margin: '8px 0',
      border: '1px solid #404040',
      maxWidth: '300px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
    }}>
      {/* Product Image */}
      <div style={{
        width: '100%',
        height: '120px',
        backgroundColor: '#3a3a3a',
        borderRadius: '8px',
        marginBottom: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}>
        <img 
          src={product.image} 
          alt={product.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
          }}
        />
        <div style={{
          display: 'none',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          color: '#666'
        }}>
          📦
        </div>
      </div>

      {/* Product Info */}
      <div>
        <h4 style={{
          margin: '0 0 8px 0',
          fontSize: '14px',
          fontWeight: '600',
          color: '#ffffff',
          lineHeight: '1.3'
        }}>
          {product.name}
        </h4>
        
        {product.description && (
          <p style={{
            margin: '0 0 8px 0',
            fontSize: '12px',
            color: '#b0b0b0',
            lineHeight: '1.4'
          }}>
            {product.description}
          </p>
        )}

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px'
        }}>
          <span style={{
            fontSize: '16px',
            fontWeight: '700',
            color: '#4CAF50'
          }}>
            {product.price.toLocaleString('vi-VN')}₫
          </span>
          
          {product.category && (
            <span style={{
              fontSize: '10px',
              color: '#666',
              backgroundColor: '#404040',
              padding: '2px 6px',
              borderRadius: '4px'
            }}>
              {product.category}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '8px'
        }}>
          <button
            onClick={() => onViewProduct?.(product.id)}
            style={{
              flex: 1,
              padding: '8px 12px',
              backgroundColor: 'transparent',
              color: '#007bff',
              border: '1px solid #007bff',
              borderRadius: '6px',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#007bff';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#007bff';
            }}
          >
            Xem chi tiết
          </button>
          
          <button
            onClick={() => onAddToCart?.(product.id)}
            style={{
              flex: 1,
              padding: '8px 12px',
              backgroundColor: '#4CAF50',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#45a049';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#4CAF50';
            }}
          >
            Thêm giỏ
          </button>
        </div>
      </div>
    </div>
  );
};

// Order Card Component
export const OrderCard: React.FC<OrderCardProps> = ({ 
  order, 
  onViewOrder, 
  onTrackOrder 
}) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return '#ff9800';
      case 'processing': return '#2196f3';
      case 'shipped': return '#9c27b0';
      case 'delivered': return '#4caf50';
      case 'cancelled': return '#f44336';
      default: return '#666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'Chờ xử lý';
      case 'processing': return 'Đang xử lý';
      case 'shipped': return 'Đã giao hàng';
      case 'delivered': return 'Đã nhận hàng';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  return (
    <div style={{
      backgroundColor: '#2d2d2d',
      borderRadius: '12px',
      padding: '16px',
      margin: '8px 0',
      border: '1px solid #404040',
      maxWidth: '350px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
    }}>
      {/* Order Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <h4 style={{
          margin: 0,
          fontSize: '14px',
          fontWeight: '600',
          color: '#ffffff'
        }}>
          Đơn hàng #{order.id}
        </h4>
        
        <span style={{
          fontSize: '10px',
          color: getStatusColor(order.status),
          backgroundColor: `${getStatusColor(order.status)}20`,
          padding: '4px 8px',
          borderRadius: '12px',
          fontWeight: '600'
        }}>
          {getStatusText(order.status)}
        </span>
      </div>

      {/* Order Items */}
      <div style={{ marginBottom: '12px' }}>
        {order.items.slice(0, 2).map((item, index) => (
          <div key={index} style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '8px',
            padding: '8px',
            backgroundColor: '#3a3a3a',
            borderRadius: '6px'
          }}>
            <img 
              src={item.image} 
              alt={item.name}
              style={{
                width: '40px',
                height: '40px',
                objectFit: 'cover',
                borderRadius: '4px',
                marginRight: '8px'
              }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
              }}
            />
            <div style={{
              display: 'none',
              width: '40px',
              height: '40px',
              backgroundColor: '#404040',
              borderRadius: '4px',
              marginRight: '8px',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px'
            }}>
              📦
            </div>
            
            <div style={{ flex: 1 }}>
              <p style={{
                margin: '0 0 2px 0',
                fontSize: '12px',
                color: '#ffffff',
                fontWeight: '500'
              }}>
                {item.name}
              </p>
              <p style={{
                margin: 0,
                fontSize: '11px',
                color: '#b0b0b0'
              }}>
                {item.quantity} x {item.price.toLocaleString('vi-VN')}₫
              </p>
            </div>
          </div>
        ))}
        
        {order.items.length > 2 && (
          <p style={{
            margin: '4px 0 0 0',
            fontSize: '11px',
            color: '#666',
            textAlign: 'center'
          }}>
            +{order.items.length - 2} sản phẩm khác
          </p>
        )}
      </div>

      {/* Order Footer */}
      <div style={{
        borderTop: '1px solid #404040',
        paddingTop: '12px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px'
        }}>
          <span style={{
            fontSize: '12px',
            color: '#b0b0b0'
          }}>
            Tổng cộng:
          </span>
          <span style={{
            fontSize: '16px',
            fontWeight: '700',
            color: '#4CAF50'
          }}>
            {order.total.toLocaleString('vi-VN')}₫
          </span>
        </div>

        {order.estimatedDelivery && (
          <p style={{
            margin: '0 0 12px 0',
            fontSize: '11px',
            color: '#666'
          }}>
            Dự kiến giao: {order.estimatedDelivery}
          </p>
        )}

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '8px'
        }}>
          <button
            onClick={() => onViewOrder?.(order.id)}
            style={{
              flex: 1,
              padding: '8px 12px',
              backgroundColor: 'transparent',
              color: '#007bff',
              border: '1px solid #007bff',
              borderRadius: '6px',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Xem chi tiết
          </button>
          
          <button
            onClick={() => onTrackOrder?.(order.id)}
            style={{
              flex: 1,
              padding: '8px 12px',
              backgroundColor: '#4CAF50',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Theo dõi
          </button>
        </div>
      </div>
    </div>
  );
};

// Quick Action Component
export const QuickAction: React.FC<QuickActionProps> = ({ 
  title, 
  description, 
  icon, 
  action, 
  onAction 
}) => {
  return (
    <div
      onClick={() => onAction?.(action)}
      style={{
        backgroundColor: '#2d2d2d',
        borderRadius: '12px',
        padding: '16px',
        margin: '8px 0',
        border: '1px solid #404040',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#3a3a3a';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#2d2d2d';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '8px'
      }}>
        <span style={{
          fontSize: '20px',
          marginRight: '12px'
        }}>
          {icon}
        </span>
        <h4 style={{
          margin: 0,
          fontSize: '14px',
          fontWeight: '600',
          color: '#ffffff'
        }}>
          {title}
        </h4>
      </div>
      
      <p style={{
        margin: 0,
        fontSize: '12px',
        color: '#b0b0b0',
        lineHeight: '1.4'
      }}>
        {description}
      </p>
    </div>
  );
};
