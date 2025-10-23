import React, { useState, useEffect } from 'react';
import AuthChatService from '../services/AuthChatService';
import { getApiUrl } from '../config/api';

interface ChatRating {
  ratingId: string;
  roomId: string;
  customerId: string;
  agentId?: string;
  rating: number;
  comment?: string;
  createdAt: string;
  customerName: string;
  agentName?: string;
  roomName: string;
}

interface RatingStats {
  totalRatings: number;
  averageRating: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

const RatingManagementPage: React.FC = () => {
  const [ratings, setRatings] = useState<ChatRating[]>([]);
  const [stats, setStats] = useState<RatingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState({
    rating: 'all',
    dateFrom: '',
    dateTo: ''
  });

  useEffect(() => {
    loadRatings();
    loadStats();
  }, []);

  const loadRatings = async () => {
    try {
      setLoading(true);
      const token = await AuthChatService.getToken();
      
      const response = await fetch(getApiUrl('/api/chat/ratings'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load ratings');
      }

      const data = await response.json();
      setRatings(data.ratings || []);
    } catch (error) {
      console.error('Error loading ratings:', error);
      setError('Không thể tải danh sách đánh giá');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const token = await AuthChatService.getToken();
      
      const response = await fetch(getApiUrl('/api/chat/rating-stats'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load stats');
      }

      const data = await response.json();
      setStats(data.stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            style={{
              color: star <= rating ? '#fbbf24' : '#d1d5db',
              fontSize: '16px'
            }}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return '#28a745';
    if (rating >= 3) return '#ffc107';
    return '#dc3545';
  };

  const filteredRatings = ratings.filter(rating => {
    if (filter.rating !== 'all' && rating.rating !== parseInt(filter.rating)) {
      return false;
    }
    if (filter.dateFrom && new Date(rating.createdAt) < new Date(filter.dateFrom)) {
      return false;
    }
    if (filter.dateTo && new Date(rating.createdAt) > new Date(filter.dateTo)) {
      return false;
    }
    return true;
  });

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
        Đang tải đánh giá...
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          marginBottom: '24px'
        }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '600',
            color: '#1f2937',
            margin: '0 0 8px 0'
          }}>
            Quản lý đánh giá chat
          </h1>
          <p style={{
            color: '#6b7280',
            margin: 0
          }}>
            Theo dõi và phân tích đánh giá từ khách hàng
          </p>
        </div>

        {/* Statistics */}
        {stats && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginBottom: '24px'
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              textAlign: 'center'
            }}>
              <h3 style={{
                fontSize: '32px',
                fontWeight: '600',
                color: '#1f2937',
                margin: '0 0 8px 0'
              }}>
                {stats.totalRatings}
              </h3>
              <p style={{
                color: '#6b7280',
                margin: 0
              }}>
                Tổng đánh giá
              </p>
            </div>

            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              textAlign: 'center'
            }}>
              <h3 style={{
                fontSize: '32px',
                fontWeight: '600',
                color: '#1f2937',
                margin: '0 0 8px 0'
              }}>
                {stats.averageRating.toFixed(1)}
              </h3>
              <p style={{
                color: '#6b7280',
                margin: 0
              }}>
                Điểm trung bình
              </p>
            </div>

            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              textAlign: 'center'
            }}>
              <h3 style={{
                fontSize: '32px',
                fontWeight: '600',
                color: '#28a745',
                margin: '0 0 8px 0'
              }}>
                {stats.ratingDistribution[5]}
              </h3>
              <p style={{
                color: '#6b7280',
                margin: 0
              }}>
                Đánh giá 5 sao
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          marginBottom: '24px'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#1f2937',
            margin: '0 0 16px 0'
          }}>
            Bộ lọc
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Đánh giá
              </label>
              <select
                value={filter.rating}
                onChange={(e) => setFilter(prev => ({ ...prev, rating: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                <option value="all">Tất cả</option>
                <option value="5">5 sao</option>
                <option value="4">4 sao</option>
                <option value="3">3 sao</option>
                <option value="2">2 sao</option>
                <option value="1">1 sao</option>
              </select>
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Từ ngày
              </label>
              <input
                type="date"
                value={filter.dateFrom}
                onChange={(e) => setFilter(prev => ({ ...prev, dateFrom: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Đến ngày
              </label>
              <input
                type="date"
                value={filter.dateTo}
                onChange={(e) => setFilter(prev => ({ ...prev, dateTo: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>
        </div>

        {/* Ratings List */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '20px',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#1f2937',
              margin: 0
            }}>
              Danh sách đánh giá ({filteredRatings.length})
            </h3>
          </div>

          {error && (
            <div style={{
              padding: '20px',
              textAlign: 'center',
              color: '#dc3545'
            }}>
              {error}
            </div>
          )}

          {filteredRatings.length === 0 ? (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              color: '#6b7280'
            }}>
              Không có đánh giá nào
            </div>
          ) : (
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {filteredRatings.map((rating) => (
                <div
                  key={rating.ratingId}
                  style={{
                    padding: '20px',
                    borderBottom: '1px solid #f3f4f6',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    minWidth: '80px'
                  }}>
                    {renderStars(rating.rating)}
                    <span style={{
                      fontSize: '12px',
                      color: getRatingColor(rating.rating),
                      fontWeight: '500'
                    }}>
                      {rating.rating}/5
                    </span>
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '8px'
                    }}>
                      <div>
                        <h4 style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#1f2937',
                          margin: '0 0 4px 0'
                        }}>
                          {rating.customerName}
                        </h4>
                        <p style={{
                          fontSize: '14px',
                          color: '#6b7280',
                          margin: 0
                        }}>
                          Chat: {rating.roomName}
                          {rating.agentName && ` • Agent: ${rating.agentName}`}
                        </p>
                      </div>
                      <span style={{
                        fontSize: '12px',
                        color: '#6b7280'
                      }}>
                        {new Date(rating.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>

                    {rating.comment && (
                      <div style={{
                        backgroundColor: '#f9fafb',
                        padding: '12px',
                        borderRadius: '8px',
                        marginTop: '8px'
                      }}>
                        <p style={{
                          fontSize: '14px',
                          color: '#374151',
                          margin: 0,
                          fontStyle: 'italic'
                        }}>
                          "{rating.comment}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RatingManagementPage;
