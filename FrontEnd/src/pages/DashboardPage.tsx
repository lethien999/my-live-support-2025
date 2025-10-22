import React, { useState, useEffect } from 'react';
import AuthChatService from '../services/AuthChatService';
// import { getApiUrl } from '../config/api';

const DashboardPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({});

  useEffect(() => {
    AuthChatService.init();
    
    // Check authentication with delay to allow token loading
    const checkAuth = async () => {
      const currentUser = AuthChatService.getCurrentUser();
      console.log('🔍 Dashboard - checkAuth - currentUser:', currentUser);
      
      if (currentUser) {
        setUser(currentUser);
        loadStats(currentUser);
      } else {
        // Wait a bit more for token to load
        setTimeout(async () => {
          const retryUser = AuthChatService.getCurrentUser();
          console.log('🔍 Dashboard - retry check - currentUser:', retryUser);
          
          if (retryUser) {
            setUser(retryUser);
            loadStats(retryUser);
          } else {
            console.log('❌ Dashboard - No user found, redirecting to login');
            // Redirect to login if not authenticated
            window.history.pushState({}, '', '/login');
            window.dispatchEvent(new PopStateEvent('popstate'));
          }
        }, 1000);
      }
    };
    
    checkAuth();
  }, []);

  const loadStats = async (user: any) => {
    try {
      // Load real stats from API based on user role
      const token = await AuthChatService.getToken();
      console.log('🔍 Dashboard - loadStats - token:', token);
      
      if (!token) {
        console.log('❌ Dashboard - No token available, showing empty stats');
        setStats({
          Customer: {
            totalOrders: 0,
            totalSpent: 0,
            favoriteCategories: []
          }
        });
        setLoading(false);
        return;
      }

      // For now, return empty stats for new customers
      // In production, make API calls to get real stats
      const stats = {
        Admin: {
          totalUsers: 0,
          totalProducts: 0,
          totalOrders: 0,
          totalRevenue: 0,
          recentUsers: [],
          topProducts: [],
          recentConversations: []
        },
        Agent: {
          totalCustomers: 0,
          totalTickets: 0,
          resolvedTickets: 0,
          avgResponseTime: 0,
          recentTickets: [],
          recentConversations: []
        },
        Customer: {
          totalOrders: 0,
          totalSpent: 0,
          favoriteCategory: 'Chưa có',
          recentOrders: [],
          recentConversations: []
        }
      };

      setStats(stats[user.role as keyof typeof stats] || stats.Customer);
      setLoading(false);
    } catch (error) {
      console.error('Error loading stats:', error);
      setStats({});
      setLoading(false);
    }
  };

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
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

  if (!user) {
    return null;
  }

  const renderAdminDashboard = () => (
    <div>
      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '40px'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '25px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #3b82f6'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: '#666', fontSize: '14px', margin: '0 0 8px 0' }}>Tổng người dùng</p>
              <h3 style={{ fontSize: '2rem', fontWeight: '600', margin: 0, color: '#333' }}>
                {stats.totalUsers}
              </h3>
            </div>
            <div style={{ fontSize: '2rem' }}>👥</div>
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '25px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #28a745'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: '#666', fontSize: '14px', margin: '0 0 8px 0' }}>Tổng sản phẩm</p>
              <h3 style={{ fontSize: '2rem', fontWeight: '600', margin: 0, color: '#333' }}>
                {stats.totalProducts}
              </h3>
            </div>
            <div style={{ fontSize: '2rem' }}>📦</div>
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '25px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #ffc107'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: '#666', fontSize: '14px', margin: '0 0 8px 0' }}>Tổng đơn hàng</p>
              <h3 style={{ fontSize: '2rem', fontWeight: '600', margin: 0, color: '#333' }}>
                {stats.totalOrders}
              </h3>
            </div>
            <div style={{ fontSize: '2rem' }}>🛒</div>
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '25px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #dc3545'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: '#666', fontSize: '14px', margin: '0 0 8px 0' }}>Tổng doanh thu</p>
              <h3 style={{ fontSize: '2rem', fontWeight: '600', margin: 0, color: '#333' }}>
                {stats.totalRevenue?.toLocaleString()} VND
              </h3>
            </div>
            <div style={{ fontSize: '2rem' }}>💰</div>
          </div>
        </div>
      </div>

      {/* Charts and Tables */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
        marginBottom: '40px'
      }}>
        {/* Recent Users */}
        <div style={{
          backgroundColor: 'white',
          padding: '25px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '500', marginBottom: '20px', color: '#333' }}>
            Người dùng mới nhất
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {stats.recentUsers?.map((user: any, index: number) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                backgroundColor: '#f8f8f8',
                borderRadius: '6px'
              }}>
                <div style={{ fontSize: '1.5rem' }}>{user.avatar}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '500', color: '#333' }}>
                    {user.name}
                  </p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                    {user.email}
                  </p>
                </div>
                <span style={{
                  fontSize: '11px',
                  color: '#666',
                  backgroundColor: '#e0e0e0',
                  padding: '4px 8px',
                  borderRadius: '3px'
                }}>
                  {user.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div style={{
          backgroundColor: 'white',
          padding: '25px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '500', marginBottom: '20px', color: '#333' }}>
            Sản phẩm bán chạy
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {stats.topProducts?.map((product: any, index: number) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                backgroundColor: '#f8f8f8',
                borderRadius: '6px'
              }}>
                <div style={{ fontSize: '1.5rem' }}>{product.Image}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '500', color: '#333' }}>
                    {product.ProductName}
                  </p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                    {product.Price.toLocaleString()} VND
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '12px' }}>⭐</span>
                  <span style={{ fontSize: '12px', color: '#666' }}>{product.Rating}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderAgentDashboard = () => (
    <div>
      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '40px'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '25px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #3b82f6'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: '#666', fontSize: '14px', margin: '0 0 8px 0' }}>Khách hàng</p>
              <h3 style={{ fontSize: '2rem', fontWeight: '600', margin: 0, color: '#333' }}>
                {stats.totalCustomers}
              </h3>
            </div>
            <div style={{ fontSize: '2rem' }}>👥</div>
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '25px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #ffc107'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: '#666', fontSize: '14px', margin: '0 0 8px 0' }}>Tickets</p>
              <h3 style={{ fontSize: '2rem', fontWeight: '600', margin: 0, color: '#333' }}>
                {stats.totalTickets}
              </h3>
            </div>
            <div style={{ fontSize: '2rem' }}>🎫</div>
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '25px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #28a745'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: '#666', fontSize: '14px', margin: '0 0 8px 0' }}>Đã giải quyết</p>
              <h3 style={{ fontSize: '2rem', fontWeight: '600', margin: 0, color: '#333' }}>
                {stats.resolvedTickets}
              </h3>
            </div>
            <div style={{ fontSize: '2rem' }}>✅</div>
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '25px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #dc3545'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: '#666', fontSize: '14px', margin: '0 0 8px 0' }}>Thời gian phản hồi TB</p>
              <h3 style={{ fontSize: '2rem', fontWeight: '600', margin: 0, color: '#333' }}>
                {stats.avgResponseTime}h
              </h3>
            </div>
            <div style={{ fontSize: '2rem' }}>⏱️</div>
          </div>
        </div>
      </div>

      {/* Recent Tickets */}
      <div style={{
        backgroundColor: 'white',
        padding: '25px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '500', margin: 0, color: '#333' }}>
            Tickets gần đây
          </h3>
          <button
            onClick={() => navigateTo('/tickets')}
            style={{
              padding: '8px 16px',
              backgroundColor: '#000',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Xem tất cả
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {stats.recentTickets?.map((ticket: any, index: number) => (
            <div key={index} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '15px',
              backgroundColor: '#f8f8f8',
              borderRadius: '6px',
              borderLeft: `4px solid ${
                ticket.priority === 'High' ? '#dc3545' :
                ticket.priority === 'Medium' ? '#ffc107' : '#28a745'
              }`
            }}>
              <div style={{ flex: 1 }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '500', color: '#333' }}>
                  {ticket.subject}
                </p>
                <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                  Khách hàng: {ticket.customer}
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                <span style={{
                  fontSize: '11px',
                  color: '#666',
                  backgroundColor: '#e0e0e0',
                  padding: '4px 8px',
                  borderRadius: '3px'
                }}>
                  {ticket.status}
                </span>
                <span style={{
                  fontSize: '10px',
                  color: '#666'
                }}>
                  {ticket.priority}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCustomerDashboard = () => (
    <div>
      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '40px'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '25px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #3b82f6'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: '#666', fontSize: '14px', margin: '0 0 8px 0' }}>Tổng đơn hàng</p>
              <h3 style={{ fontSize: '2rem', fontWeight: '600', margin: 0, color: '#333' }}>
                {stats.totalOrders}
              </h3>
            </div>
            <div style={{ fontSize: '2rem' }}>🛒</div>
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '25px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #28a745'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: '#666', fontSize: '14px', margin: '0 0 8px 0' }}>Tổng chi tiêu</p>
              <h3 style={{ fontSize: '2rem', fontWeight: '600', margin: 0, color: '#333' }}>
                {stats.totalSpent?.toLocaleString()} VND
              </h3>
            </div>
            <div style={{ fontSize: '2rem' }}>💰</div>
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '25px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #ffc107'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: '#666', fontSize: '14px', margin: '0 0 8px 0' }}>Danh mục yêu thích</p>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '600', margin: 0, color: '#333' }}>
                {stats.favoriteCategory}
              </h3>
            </div>
            <div style={{ fontSize: '2rem' }}>❤️</div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div style={{
        backgroundColor: 'white',
        padding: '25px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '500', margin: 0, color: '#333' }}>
            Đơn hàng gần đây
          </h3>
          <button
            onClick={() => navigateTo('/products')}
            style={{
              padding: '8px 16px',
              backgroundColor: '#000',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Mua sắm
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {stats.recentOrders?.map((order: any, index: number) => (
            <div key={index} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '15px',
              backgroundColor: '#f8f8f8',
              borderRadius: '6px',
              borderLeft: `4px solid ${
                order.status === 'Delivered' ? '#28a745' :
                order.status === 'Shipped' ? '#3b82f6' : '#ffc107'
              }`
            }}>
              <div style={{ flex: 1 }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '500', color: '#333' }}>
                  {order.product}
                </p>
                <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                  Ngày: {order.date}
                </p>
              </div>
              <span style={{
                fontSize: '11px',
                color: '#666',
                backgroundColor: '#e0e0e0',
                padding: '4px 8px',
                borderRadius: '3px'
              }}>
                {order.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

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
            Dashboard
          </h1>
          <p style={{ color: '#666', fontSize: '14px' }}>
            Chào mừng trở lại, {user.name}! ({user.role})
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
        {user.role === 'Admin' && renderAdminDashboard()}
        {user.role === 'Agent' && renderAgentDashboard()}
        {user.role === 'Customer' && renderCustomerDashboard()}
      </div>
    </div>
  );
};

export default DashboardPage;