import React from 'react';

const Footer: React.FC = () => {
  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <footer style={{
      backgroundColor: 'black',
      color: 'white',
      padding: '4rem 0 2rem',
      marginTop: 'auto'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 20px'
      }}>
        {/* Main Footer Content */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '3rem',
          marginBottom: '3rem'
        }}>
          {/* Company Info */}
          <div>
            <h3 style={{
              fontSize: '1.2rem',
              fontWeight: '400',
              marginBottom: '1.5rem',
              letterSpacing: '0.05em',
              fontFamily: 'Arial, sans-serif'
            }}>
              MUJI
            </h3>
            <p style={{
              fontSize: '0.9rem',
              lineHeight: '1.6',
              color: '#ccc',
              marginBottom: '1rem',
              fontWeight: '300'
            }}>
              Hệ thống hỗ trợ trực tiếp với thiết kế minimalist, mang đến trải nghiệm tốt nhất cho khách hàng.
            </p>
            <div style={{
              fontSize: '0.8rem',
              color: '#999',
              fontWeight: '300'
            }}>
              © 2025 MUJI Live Support. All rights reserved.
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{
              fontSize: '1rem',
              fontWeight: '400',
              marginBottom: '1.5rem',
              letterSpacing: '0.02em',
              fontFamily: 'Arial, sans-serif'
            }}>
              Liên kết nhanh
            </h4>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.8rem'
            }}>
              <a
                onClick={() => navigate('/products')}
                style={{
                  color: '#ccc',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  fontWeight: '300',
                  cursor: 'pointer',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#ccc'}
              >
                Sản phẩm
              </a>
              <a
                onClick={() => navigate('/chat')}
                style={{
                  color: '#ccc',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  fontWeight: '300',
                  cursor: 'pointer',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#ccc'}
              >
                Hỗ trợ chat
              </a>
              <a
                onClick={() => navigate('/tickets')}
                style={{
                  color: '#ccc',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  fontWeight: '300',
                  cursor: 'pointer',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#ccc'}
              >
                Ticket hỗ trợ
              </a>
              <a
                onClick={() => navigate('/dashboard')}
                style={{
                  color: '#ccc',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  fontWeight: '300',
                  cursor: 'pointer',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#ccc'}
              >
                Dashboard
              </a>
            </div>
          </div>

          {/* Support */}
          <div>
            <h4 style={{
              fontSize: '1rem',
              fontWeight: '400',
              marginBottom: '1.5rem',
              letterSpacing: '0.02em',
              fontFamily: 'Arial, sans-serif'
            }}>
              Hỗ trợ
            </h4>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.8rem'
            }}>
              <div style={{
                color: '#ccc',
                fontSize: '0.9rem',
                fontWeight: '300'
              }}>
                📞 Hotline: 1900 255 579
              </div>
              <div style={{
                color: '#ccc',
                fontSize: '0.9rem',
                fontWeight: '300'
              }}>
                📧 Email: support@muji.com
              </div>
              <div style={{
                color: '#ccc',
                fontSize: '0.9rem',
                fontWeight: '300'
              }}>
                🕒 Giờ làm việc: 8:00 - 22:00
              </div>
            </div>
          </div>

          {/* Social & Newsletter */}
          <div>
            <h4 style={{
              fontSize: '1rem',
              fontWeight: '400',
              marginBottom: '1.5rem',
              letterSpacing: '0.02em',
              fontFamily: 'Arial, sans-serif'
            }}>
              Kết nối
            </h4>
            <div style={{
              display: 'flex',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '1px solid #333',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'white';
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.color = 'black';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#333';
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'white';
              }}>
                📘
              </div>
              <div style={{
                width: '40px',
                height: '40px',
                border: '1px solid #333',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'white';
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.color = 'black';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#333';
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'white';
              }}>
                📷
              </div>
              <div style={{
                width: '40px',
                height: '40px',
                border: '1px solid #333',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'white';
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.color = 'black';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#333';
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'white';
              }}>
                🐦
              </div>
            </div>
            <div style={{
              fontSize: '0.8rem',
              color: '#999',
              fontWeight: '300'
            }}>
              Theo dõi chúng tôi để cập nhật tin tức mới nhất
            </div>
          </div>
        </div>

        {/* Bottom Border */}
        <div style={{
          borderTop: '1px solid #333',
          paddingTop: '2rem',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '0.8rem',
            color: '#999',
            fontWeight: '300',
            letterSpacing: '0.02em'
          }}>
            Thiết kế bởi MUJI Design Team | Phát triển với ❤️ tại Việt Nam
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;