import React, { useState, useEffect } from 'react';
import { getApiUrl, API_CONFIG } from '../config/api';
import { navigateTo } from '../utils/navigation';
// import { mockCategories, mockProducts } from '../data/mockData';

const HomePage: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load categories from API
      const categoriesResponse = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.CATEGORIES));
      const categoriesData = await categoriesResponse.json();
      setCategories(categoriesData.categories || []);
      
      // Load featured products from API
      const productsResponse = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.PRODUCTS));
      const productsData = await productsResponse.json();
      setFeaturedProducts((productsData.data || []).slice(0, 6));
      
    } catch (error) {
      console.error('Error loading data:', error);
      // Fallback to mock data
      const { mockCategories, mockProducts } = await import('../data/mockData');
      setCategories(mockCategories);
      setFeaturedProducts(mockProducts.slice(0, 6));
    } finally {
      setLoading(false);
    }
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
      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #000 0%, #333 100%)',
        color: 'white',
        padding: '80px 0',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <h1 style={{
            fontSize: '3rem',
            fontWeight: '300',
            marginBottom: '20px',
            letterSpacing: '2px'
          }}>
            MUJI
          </h1>
          <p style={{
            fontSize: '1.2rem',
            fontWeight: '300',
            marginBottom: '40px',
            opacity: 0.9
          }}>
            Sản phẩm chất lượng cao cho cuộc sống đơn giản
          </p>
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
            <button
              onClick={() => {
                navigateTo('/products');
              }}
              style={{
                padding: '15px 30px',
                backgroundColor: 'white',
                color: 'black',
                border: 'none',
                borderRadius: '0',
                fontSize: '16px',
                fontWeight: '400',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#f0f0f0';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Xem sản phẩm
            </button>
            <button
              onClick={() => {
                navigateTo('/customer-chat');
              }}
              style={{
                padding: '15px 30px',
                backgroundColor: 'transparent',
                color: 'white',
                border: '2px solid white',
                borderRadius: '0',
                fontSize: '16px',
                fontWeight: '400',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.color = 'black';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'white';
              }}
            >
              Hỗ trợ trực tuyến
            </button>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section style={{ padding: '60px 0', backgroundColor: 'white' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <h2 style={{
            textAlign: 'center',
            fontSize: '2rem',
            fontWeight: '300',
            marginBottom: '50px',
            color: '#333'
          }}>
            Danh mục sản phẩm
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '30px'
          }}>
            {categories.map((category) => (
              <div
                key={category.CategoryID}
                onClick={() => {
                  navigateTo(`/products?category=${category.CategoryID}`);
                }}
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  padding: '30px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
                  e.currentTarget.style.borderColor = '#000';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
                  e.currentTarget.style.borderColor = '#e0e0e0';
                }}
              >
                <div style={{
                  fontSize: '3rem',
                  marginBottom: '20px'
                }}>
                  {category.Icon}
                </div>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: '400',
                  marginBottom: '10px',
                  color: '#333'
                }}>
                  {category.CategoryName}
                </h3>
                <p style={{
                  color: '#666',
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}>
                  {category.Description || 'Khám phá các sản phẩm chất lượng cao'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section style={{ padding: '60px 0', backgroundColor: '#f8f8f8' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <h2 style={{
            textAlign: 'center',
            fontSize: '2rem',
            fontWeight: '300',
            marginBottom: '50px',
            color: '#333'
          }}>
            Sản phẩm nổi bật
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '30px'
          }}>
            {featuredProducts.slice(0, 6).map((product) => (
              <div
                key={product.ProductID}
                onClick={() => {
                  navigateTo(`/product/${product.ProductID}`);
                }}
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
                }}
              >
                <div style={{
                  height: '200px',
                  backgroundColor: '#f0f0f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '3rem'
                }}>
                  {product.Image}
                </div>
                <div style={{ padding: '20px' }}>
                  <h3 style={{
                    fontSize: '1.2rem',
                    fontWeight: '400',
                    marginBottom: '10px',
                    color: '#333'
                  }}>
                    {product.ProductName}
                  </h3>
                  <p style={{
                    color: '#666',
                    fontSize: '14px',
                    marginBottom: '15px',
                    lineHeight: '1.4'
                  }}>
                    {product.Description?.substring(0, 100)}...
                  </p>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{
                      fontSize: '1.2rem',
                      fontWeight: '500',
                      color: '#000'
                    }}>
                      {product.Price ? `${product.Price.toLocaleString()} VND` : 'Liên hệ'}
                    </span>
                    <span style={{
                      fontSize: '12px',
                      color: '#666',
                      backgroundColor: '#f0f0f0',
                      padding: '4px 8px',
                      borderRadius: '4px'
                    }}>
                      {product.CategoryName}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: '60px 0', backgroundColor: 'white' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <h2 style={{
            textAlign: 'center',
            fontSize: '2rem',
            fontWeight: '300',
            marginBottom: '50px',
            color: '#333'
          }}>
            Tại sao chọn MUJI?
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '40px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '20px' }}>✨</div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '400', marginBottom: '15px' }}>
                Chất lượng cao
              </h3>
              <p style={{ color: '#666', lineHeight: '1.6' }}>
                Sản phẩm được chọn lọc kỹ lưỡng, đảm bảo chất lượng tốt nhất cho khách hàng
              </p>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🚚</div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '400', marginBottom: '15px' }}>
                Giao hàng nhanh
              </h3>
              <p style={{ color: '#666', lineHeight: '1.6' }}>
                Giao hàng toàn quốc với thời gian nhanh chóng và dịch vụ chuyên nghiệp
              </p>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '20px' }}>💬</div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '400', marginBottom: '15px' }}>
                Hỗ trợ 24/7
              </h3>
              <p style={{ color: '#666', lineHeight: '1.6' }}>
                Đội ngũ hỗ trợ chuyên nghiệp sẵn sàng giải đáp mọi thắc mắc của bạn
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;