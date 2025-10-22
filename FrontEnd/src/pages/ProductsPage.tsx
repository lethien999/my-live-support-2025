import React, { useState, useEffect } from 'react';
import { getApiUrl, API_CONFIG } from '../config/api';
import AuthChatService from '../services/AuthChatService';
// import { mockCategories, mockProducts } from '../data/mockData';

const ProductsPage: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const addToCart = async (product: any) => {
    try {
      setAddingToCart(product.ProductID);
      
      const user = AuthChatService.getCurrentUser();
      const token = await AuthChatService.getToken();
      
      // Debug sessionStorage directly
      const directToken = sessionStorage.getItem('accessToken');
      const directUser = sessionStorage.getItem('currentUser');
      
      console.log('🔍 Add to cart debug:', {
        user,
        token,
        directToken,
        directUser,
        productId: product.ProductID
      });
      
      if (!user) {
        alert('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng');
        return;
      }

      // Get current user info for Google token authentication
      const currentUser = await AuthChatService.getCurrentUser();
      const userInfo = currentUser ? {
        email: currentUser.email,
        name: currentUser.name,
        role: currentUser.role
      } : null;

      const response = await fetch(getApiUrl('/api/cart/add'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.ProductID,
          quantity: 1,
          userInfo
        }),
      });

      console.log('🔍 Cart API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('🔍 Cart API error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        alert('Đã thêm sản phẩm vào giỏ hàng!');
        // Trigger cart update event
        window.dispatchEvent(new CustomEvent('cartUpdated'));
      } else {
        throw new Error(result.message || 'Có lỗi xảy ra');
      }
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Không thể thêm sản phẩm vào giỏ hàng: ' + (error as Error).message);
    } finally {
      setAddingToCart(null);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load categories from API
      const categoriesResponse = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.CATEGORIES));
      const categoriesData = await categoriesResponse.json();
      setCategories(categoriesData.categories || []);
      
      // Load products from API
      const productsResponse = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.PRODUCTS));
      const productsData = await productsResponse.json();
      setProducts(productsData.data || []);
      
    } catch (error) {
      console.error('Error loading data:', error);
      // Fallback to mock data
      const { mockCategories, mockProducts } = await import('../data/mockData');
      setCategories(mockCategories);
      setProducts(mockProducts);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === null || product.CategoryID === selectedCategory;
    const matchesSearch = product.ProductName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.Description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.Price - b.Price;
      case 'price-high':
        return b.Price - a.Price;
      case 'rating':
        return b.Rating - a.Rating;
      case 'name':
      default:
        return a.ProductName.localeCompare(b.ProductName);
    }
  });

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

  return (
    <div style={{ backgroundColor: '#fafafa', minHeight: '100vh' }}>
      {/* Header Section */}
      <section style={{
        background: 'linear-gradient(135deg, #000 0%, #333 100%)',
        color: 'white',
        padding: '60px 0',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: '300',
            marginBottom: '20px',
            letterSpacing: '2px'
          }}>
            Sản phẩm MUJI
          </h1>
          <p style={{
            fontSize: '1.1rem',
            fontWeight: '300',
            opacity: 0.9
          }}>
            Khám phá bộ sưu tập sản phẩm chất lượng cao với thiết kế tối giản
          </p>
        </div>
      </section>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
        <div style={{ display: 'flex', gap: '40px' }}>
          {/* Sidebar - Categories */}
          <div style={{ width: '250px', flexShrink: 0 }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '20px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              position: 'sticky',
              top: '20px'
            }}>
              <h3 style={{
                fontSize: '1.2rem',
                fontWeight: '500',
                marginBottom: '20px',
                color: '#333'
              }}>
                Danh mục
              </h3>
              
              <button
                onClick={() => setSelectedCategory(null)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  marginBottom: '8px',
                  backgroundColor: selectedCategory === null ? '#000' : 'transparent',
                  color: selectedCategory === null ? 'white' : '#333',
                  border: '1px solid #e0e0e0',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '14px',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  if (selectedCategory !== null) {
                    e.currentTarget.style.backgroundColor = '#f0f0f0';
                  }
                }}
                onMouseOut={(e) => {
                  if (selectedCategory !== null) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                Tất cả sản phẩm
              </button>

              {categories.map((category) => (
                <button
                  key={category.CategoryID}
                  onClick={() => setSelectedCategory(category.CategoryID)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    marginBottom: '8px',
                    backgroundColor: selectedCategory === category.CategoryID ? '#000' : 'transparent',
                    color: selectedCategory === category.CategoryID ? 'white' : '#333',
                    border: '1px solid #e0e0e0',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '14px',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                  onMouseOver={(e) => {
                    if (selectedCategory !== category.CategoryID) {
                      e.currentTarget.style.backgroundColor = '#f0f0f0';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (selectedCategory !== category.CategoryID) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <span style={{ fontSize: '16px' }}>{category.Icon}</span>
                  {category.CategoryName}
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div style={{ flex: 1 }}>
            {/* Search and Sort */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '30px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              display: 'flex',
              gap: '20px',
              alignItems: 'center'
            }}>
              <div style={{ flex: 1 }}>
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
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
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: '12px 16px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '5px',
                  fontSize: '14px',
                  outline: 'none',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value="name">Sắp xếp theo tên</option>
                <option value="price-low">Giá thấp đến cao</option>
                <option value="price-high">Giá cao đến thấp</option>
                <option value="rating">Đánh giá cao nhất</option>
              </select>
            </div>

            {/* Results Count */}
            <div style={{
              marginBottom: '20px',
              color: '#666',
              fontSize: '14px'
            }}>
              Hiển thị {sortedProducts.length} sản phẩm
              {selectedCategory && (
                <span> trong danh mục "{categories.find(c => c.CategoryID === selectedCategory)?.CategoryName}"</span>
              )}
              {searchQuery && (
                <span> cho từ khóa "{searchQuery}"</span>
              )}
            </div>

            {/* Products Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '30px'
            }}>
              {sortedProducts.map((product) => (
                <div
                  key={product.ProductID}
                  onClick={() => navigateTo(`/product/${product.ProductID}`)}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                    border: '1px solid #f0f0f0'
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
                  {/* Product Image */}
                  <div style={{
                    height: '200px',
                    backgroundColor: '#f8f8f8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '4rem',
                    position: 'relative'
                  }}>
                    {product.Image}
                    {product.IsFeatured && (
                      <div style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        backgroundColor: '#ff4444',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        Nổi bật
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div style={{ padding: '20px' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '8px'
                    }}>
                      <span style={{ fontSize: '16px' }}>{product.CategoryName === 'Clothing' ? '👕' : 
                                                           product.CategoryName === 'Beauty' ? '💄' : 
                                                           product.CategoryName === 'Home' ? '🏠' : 
                                                           product.CategoryName === 'Electronics' ? '📱' : '👜'}</span>
                      <span style={{
                        fontSize: '12px',
                        color: '#666',
                        backgroundColor: '#f0f0f0',
                        padding: '2px 6px',
                        borderRadius: '3px'
                      }}>
                        {product.CategoryName}
                      </span>
                    </div>

                    <h3 style={{
                      fontSize: '1.1rem',
                      fontWeight: '500',
                      marginBottom: '8px',
                      color: '#333',
                      lineHeight: '1.3'
                    }}>
                      {product.ProductName}
                    </h3>

                    <p style={{
                      color: '#666',
                      fontSize: '13px',
                      marginBottom: '15px',
                      lineHeight: '1.4',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {product.Description}
                    </p>

                    {/* Rating */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      marginBottom: '15px'
                    }}>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        {[...Array(5)].map((_, i) => (
                          <span key={i} style={{
                            color: i < Math.floor(product.Rating) ? '#ffc107' : '#e0e0e0',
                            fontSize: '14px'
                          }}>
                            ⭐
                          </span>
                        ))}
                      </div>
                      <span style={{ fontSize: '12px', color: '#666' }}>
                        ({product.ReviewCount})
                      </span>
                    </div>

                    {/* Price and Add to Cart */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '15px'
                    }}>
                      <span style={{
                        fontSize: '1.2rem',
                        fontWeight: '600',
                        color: '#000'
                      }}>
                        {product.Price.toLocaleString()} VND
                      </span>
                      <span style={{
                        fontSize: '12px',
                        color: product.StockQuantity > 10 ? '#28a745' : product.StockQuantity > 0 ? '#ffc107' : '#dc3545',
                        fontWeight: '500'
                      }}>
                        {product.StockQuantity > 10 ? 'Còn hàng' : product.StockQuantity > 0 ? 'Sắp hết' : 'Hết hàng'}
                      </span>
                    </div>

                    {/* Add to Cart Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product);
                      }}
                      disabled={addingToCart === product.ProductID || product.StockQuantity === 0}
                      style={{
                        width: '100%',
                        padding: '10px',
                        backgroundColor: product.StockQuantity === 0 ? '#ccc' : '#000',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: product.StockQuantity === 0 ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s ease',
                        opacity: addingToCart === product.ProductID ? 0.7 : 1
                      }}
                      onMouseOver={(e) => {
                        if (product.StockQuantity > 0) {
                          e.currentTarget.style.backgroundColor = '#333';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (product.StockQuantity > 0) {
                          e.currentTarget.style.backgroundColor = '#000';
                        }
                      }}
                    >
                      {addingToCart === product.ProductID ? 'Đang thêm...' : 
                       product.StockQuantity === 0 ? 'Hết hàng' : 'Thêm vào giỏ hàng'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* No Results */}
            {sortedProducts.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🔍</div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '10px', color: '#333' }}>
                  Không tìm thấy sản phẩm
                </h3>
                <p style={{ color: '#666', fontSize: '14px' }}>
                  Hãy thử tìm kiếm với từ khóa khác hoặc chọn danh mục khác
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;