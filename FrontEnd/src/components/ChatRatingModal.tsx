import React from 'react';

interface ChatRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  rating: number;
  setRating: (rating: number) => void;
  comment: string;
  setComment: (comment: string) => void;
}

const ChatRatingModal: React.FC<ChatRatingModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  rating,
  setRating,
  comment,
  setComment
}) => {
  const renderStars = (rating: number, interactive: boolean = false) => {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={interactive ? () => setRating(star) : undefined}
            style={{
              background: 'none',
              border: 'none',
              cursor: interactive ? 'pointer' : 'default',
              fontSize: '20px',
              color: star <= rating ? '#fbbf24' : '#d1d5db',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={interactive ? (e) => e.currentTarget.style.transform = 'scale(1.1)' : undefined}
            onMouseLeave={interactive ? (e) => e.currentTarget.style.transform = 'scale(1)' : undefined}
            disabled={!interactive}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        width: '400px',
        maxWidth: '90vw',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#1f2937',
          marginBottom: '16px',
          textAlign: 'center'
        }}>
          Đánh giá chat
        </h3>
        
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '8px'
          }}>
            Mức độ hài lòng
          </label>
          {renderStars(rating, true)}
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '8px'
          }}>
            Nhận xét (tùy chọn)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Chia sẻ trải nghiệm của bạn..."
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              resize: 'vertical',
              minHeight: '80px',
              outline: 'none'
            }}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
          />
        </div>
        
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              background: 'none',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              color: '#6b7280',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f9fafb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            Hủy
          </button>
          <button
            onClick={onSubmit}
            disabled={rating === 0}
            style={{
              padding: '8px 16px',
              background: rating === 0 ? '#9ca3af' : '#3b82f6',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              color: 'white',
              cursor: rating === 0 ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (rating > 0) {
                e.currentTarget.style.backgroundColor = '#2563eb';
              }
            }}
            onMouseLeave={(e) => {
              if (rating > 0) {
                e.currentTarget.style.backgroundColor = '#3b82f6';
              }
            }}
          >
            Gửi đánh giá
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatRatingModal;
