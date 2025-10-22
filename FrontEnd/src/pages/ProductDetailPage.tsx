import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getApiUrl } from '../config/api';
import AuthChatService from '../services/AuthChatService';

interface Product {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: string;
  inStock: boolean;
  stockCount: number;
  rating: number;
  reviewCount: number;
  tags: string[];
  specifications: {
    material: string;
    dimensions: string;
    weight: string;
    origin: string;
    warranty: string;
  };
  reviews: {
    id: string;
    userName: string;
    rating: number;
    comment: string;
    date: string;
  }[];
}

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [_selectedSpec, _setSelectedSpec] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'description' | 'specifications' | 'reviews'>('description');
  const [loading, setLoading] = useState(true);
  const [_cart, _setCart] = useState<Product[]>([]);

  // Load product data from API
  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        
        // Get product ID from route params
        const productId = id;
        
        if (!productId) {
          setLoading(false);
          return;
        }

        // Load product from API
        console.log('🔍 ProductDetailPage: Loading product with ID:', productId);
        const apiUrl = getApiUrl(`/api/products/${productId}`);
        console.log('🔍 ProductDetailPage: API URL:', apiUrl);
        
        const response = await fetch(apiUrl);
        console.log('🔍 ProductDetailPage: Response status:', response.status);
        
        const productData = await response.json();
        console.log('🔍 ProductDetailPage: Response data:', productData);
        
        if (response.ok) {
          setProduct(productData.product);
          console.log('✅ ProductDetailPage: Product loaded successfully');
        } else {
          console.error('❌ ProductDetailPage: Error loading product:', productData.error);
        }
        
      } catch (error) {
        console.error('Error loading product:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, []);

  const addToCart = async () => {
    if (!product || !product.inStock) {
      alert('Sản phẩm hiện đang hết hàng');
      return;
    }
    
    try {
      const token = await AuthChatService.getToken();
      if (!token) {
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
          productId: product.id,
          quantity: quantity,
          userInfo
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      alert(`Đã thêm ${quantity} sản phẩm vào giỏ hàng!`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Không thể thêm sản phẩm vào giỏ hàng');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const renderStars = (rating: number) => {
    return '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f8f9fa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <p style={{ color: '#5f6368' }}>Đang tải sản phẩm...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f8f9fa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
            Không tìm thấy sản phẩm
          </h2>
          <p style={{ color: '#6b7280' }}>
            Sản phẩm bạn tìm kiếm không tồn tại hoặc đã bị xóa
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8f9fa'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Breadcrumb */}
        <div style={{
          marginBottom: '2rem',
          fontSize: '0.9rem',
          color: '#6b7280'
        }}>
          <span style={{ cursor: 'pointer' }}>Trang chủ</span>
          <span style={{ margin: '0 0.5rem' }}>/</span>
          <span style={{ cursor: 'pointer' }}>Sản phẩm</span>
          <span style={{ margin: '0 0.5rem' }}>/</span>
          <span style={{ cursor: 'pointer' }}>Nội thất</span>
          <span style={{ margin: '0 0.5rem' }}>/</span>
          <span style={{ color: '#374151' }}>{product.name}</span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '3rem',
          marginBottom: '3rem'
        }}>
          {/* Product Images */}
          <div>
            {/* Main Image */}
            <div style={{
              width: '100%',
              height: '500px',
              backgroundImage: `url(${product.images[selectedImage]})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius: '12px',
              marginBottom: '1rem',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
            }} />

            {/* Thumbnail Images */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '0.5rem'
            }}>
              {product.images.map((image, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  style={{
                    width: '100%',
                    height: '80px',
                    backgroundImage: `url(${image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    border: selectedImage === index ? '2px solid #059669' : '2px solid transparent',
                    transition: 'border-color 0.2s'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: '300',
              color: '#1f2937',
              marginBottom: '1rem',
              lineHeight: '1.3'
            }}>
              {product.name}
            </h1>

            {/* Rating */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem'
            }}>
              <span style={{ color: '#fbbf24', fontSize: '1.2rem' }}>
                {renderStars(product.rating)}
              </span>
              <span style={{ fontSize: '1rem', color: '#6b7280' }}>
                {product.rating} ({product.reviewCount} đánh giá)
              </span>
            </div>

            {/* Price */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              <span style={{
                fontSize: '2rem',
                fontWeight: '600',
                color: '#059669'
              }}>
                {formatPrice(product.price)}
              </span>
              
              {product.originalPrice && (
                <span style={{
                  fontSize: '1.2rem',
                  color: '#9ca3af',
                  textDecoration: 'line-through'
                }}>
                  {formatPrice(product.originalPrice)}
                </span>
              )}
              
              {product.originalPrice && (
                <span style={{
                  backgroundColor: '#dc2626',
                  color: 'white',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  fontWeight: '500'
                }}>
                  -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                </span>
              )}
            </div>

            {/* Description */}
            <p style={{
              fontSize: '1rem',
              color: '#374151',
              lineHeight: '1.6',
              marginBottom: '2rem'
            }}>
              {product.description}
            </p>

            {/* Stock Status */}
            <div style={{
              marginBottom: '2rem',
              padding: '1rem',
              backgroundColor: product.inStock ? '#f0fdf4' : '#fef2f2',
              border: `1px solid ${product.inStock ? '#bbf7d0' : '#fecaca'}`,
              borderRadius: '8px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: product.inStock ? '#059669' : '#dc2626',
                fontWeight: '500'
              }}>
                <span>{product.inStock ? '✓' : '✗'}</span>
                <span>
                  {product.inStock 
                    ? `Còn hàng (${product.stockCount} sản phẩm)` 
                    : 'Hết hàng'
                  }
                </span>
              </div>
            </div>

            {/* Quantity Selector */}
            {product.inStock && (
              <div style={{ marginBottom: '2rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Số lượng
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    style={{
                      width: '40px',
                      height: '40px',
                      border: '1px solid #d1d5db',
                      backgroundColor: 'white',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '1.2rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    -
                  </button>
                  
                  <span style={{
                    fontSize: '1.2rem',
                    fontWeight: '500',
                    minWidth: '50px',
                    textAlign: 'center'
                  }}>
                    {quantity}
                  </span>
                  
                  <button
                    onClick={() => setQuantity(Math.min(product.stockCount, quantity + 1))}
                    style={{
                      width: '40px',
                      height: '40px',
                      border: '1px solid #d1d5db',
                      backgroundColor: 'white',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '1.2rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              <button
                onClick={addToCart}
                disabled={!product.inStock}
                style={{
                  flex: 1,
                  padding: '1rem 2rem',
                  backgroundColor: product.inStock ? '#059669' : '#9ca3af',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1.1rem',
                  fontWeight: '500',
                  cursor: product.inStock ? 'pointer' : 'not-allowed',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (product.inStock) {
                    e.currentTarget.style.backgroundColor = '#047857';
                  }
                }}
                onMouseLeave={(e) => {
                  if (product.inStock) {
                    e.currentTarget.style.backgroundColor = '#059669';
                  }
                }}
              >
                {product.inStock ? 'Thêm vào giỏ hàng' : 'Hết hàng'}
              </button>
              
              <button
                style={{
                  padding: '1rem',
                  backgroundColor: 'white',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '1.1rem',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                ♥
              </button>
            </div>

            {/* Tags */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.5rem',
              marginBottom: '2rem'
            }}>
              {product.tags.map(tag => (
                <span
                  key={tag}
                  style={{
                    backgroundColor: '#f3f4f6',
                    color: '#6b7280',
                    padding: '0.5rem 1rem',
                    borderRadius: '20px',
                    fontSize: '0.9rem',
                    fontWeight: '500'
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>

            {/* Features */}
            <div style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              <h3 style={{
                fontSize: '1.2rem',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '1rem'
              }}>
                Đặc điểm nổi bật
              </h3>
              
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0
              }}>
                <li style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.5rem',
                  color: '#374151'
                }}>
                  <span style={{ color: '#059669' }}>✓</span>
                  Chất liệu gỗ tự nhiên cao cấp
                </li>
                <li style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.5rem',
                  color: '#374151'
                }}>
                  <span style={{ color: '#059669' }}>✓</span>
                  Thiết kế ergonomic tốt cho sức khỏe
                </li>
                <li style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.5rem',
                  color: '#374151'
                }}>
                  <span style={{ color: '#059669' }}>✓</span>
                  Bảo hành 2 năm
                </li>
                <li style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#374151'
                }}>
                  <span style={{ color: '#059669' }}>✓</span>
                  Miễn phí vận chuyển toàn quốc
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}>
          {/* Tab Headers */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid #e5e7eb'
          }}>
            {[
              { key: 'description', label: 'Mô tả chi tiết' },
              { key: 'specifications', label: 'Thông số kỹ thuật' },
              { key: 'reviews', label: `Đánh giá (${product.reviewCount})` }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                style={{
                  flex: 1,
                  padding: '1rem 2rem',
                  backgroundColor: activeTab === tab.key ? '#f9fafb' : 'white',
                  color: activeTab === tab.key ? '#059669' : '#6b7280',
                  border: 'none',
                  borderBottom: activeTab === tab.key ? '2px solid #059669' : '2px solid transparent',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{ padding: '2rem' }}>
            {activeTab === 'description' && (
              <div>
                <h3 style={{
                  fontSize: '1.3rem',
                  fontWeight: '600',
                  color: '#1f2937',
                  marginBottom: '1rem'
                }}>
                  Mô tả chi tiết
                </h3>
                <p style={{
                  fontSize: '1rem',
                  color: '#374151',
                  lineHeight: '1.8',
                  marginBottom: '1.5rem'
                }}>
                  {product.longDescription}
                </p>
                
                <div style={{
                  backgroundColor: '#f9fafb',
                  padding: '1.5rem',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <h4 style={{
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    color: '#1f2937',
                    marginBottom: '0.5rem'
                  }}>
                    Lưu ý khi sử dụng:
                  </h4>
                  <ul style={{
                    color: '#6b7280',
                    lineHeight: '1.6',
                    margin: 0,
                    paddingLeft: '1.5rem'
                  }}>
                    <li>Tránh để sản phẩm tiếp xúc trực tiếp với ánh nắng mặt trời</li>
                    <li>Vệ sinh bằng khăn ẩm, tránh sử dụng hóa chất mạnh</li>
                    <li>Kiểm tra định kỳ các bu lông và vít</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'specifications' && (
              <div>
                <h3 style={{
                  fontSize: '1.3rem',
                  fontWeight: '600',
                  color: '#1f2937',
                  marginBottom: '1rem'
                }}>
                  Thông số kỹ thuật
                </h3>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '1rem'
                }}>
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div
                      key={key}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '1rem',
                        backgroundColor: '#f9fafb',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb'
                      }}
                    >
                      <span style={{
                        fontWeight: '500',
                        color: '#374151',
                        textTransform: 'capitalize'
                      }}>
                        {key === 'material' ? 'Chất liệu' :
                         key === 'dimensions' ? 'Kích thước' :
                         key === 'weight' ? 'Trọng lượng' :
                         key === 'origin' ? 'Xuất xứ' :
                         key === 'warranty' ? 'Bảo hành' : key}
                      </span>
                      <span style={{ color: '#6b7280' }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                <h3 style={{
                  fontSize: '1.3rem',
                  fontWeight: '600',
                  color: '#1f2937',
                  marginBottom: '1rem'
                }}>
                  Đánh giá từ khách hàng
                </h3>
                
                {product.reviews.map(review => (
                  <div
                    key={review.id}
                    style={{
                      padding: '1.5rem',
                      borderBottom: '1px solid #e5e7eb',
                      marginBottom: '1rem'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '0.5rem'
                    }}>
                      <div>
                        <h4 style={{
                          fontSize: '1rem',
                          fontWeight: '600',
                          color: '#1f2937',
                          marginBottom: '0.25rem'
                        }}>
                          {review.userName}
                        </h4>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <span style={{ color: '#fbbf24' }}>
                            {renderStars(review.rating)}
                          </span>
                          <span style={{
                            fontSize: '0.9rem',
                            color: '#6b7280'
                          }}>
                            {new Date(review.date).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <p style={{
                      color: '#374151',
                      lineHeight: '1.6',
                      marginTop: '0.5rem'
                    }}>
                      {review.comment}
                    </p>
                  </div>
                ))}
                
                <div style={{
                  textAlign: 'center',
                  padding: '2rem',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <h4 style={{
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    color: '#1f2937',
                    marginBottom: '0.5rem'
                  }}>
                    Bạn đã mua sản phẩm này?
                  </h4>
                  <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
                    Chia sẻ đánh giá của bạn để giúp khách hàng khác
                  </p>
                  <button style={{
                    backgroundColor: '#059669',
                    color: 'white',
                    padding: '0.75rem 2rem',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}>
                    Viết đánh giá
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
