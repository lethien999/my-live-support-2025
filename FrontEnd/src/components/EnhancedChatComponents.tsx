import React, { useState, useRef, useEffect, memo } from 'react';

// Enhanced Message Component với memoization
interface MessageProps {
  message: {
    id: string;
    content: string;
    senderId: string;
    senderName: string;
    senderRole: string;
    roomId: string;
    timestamp: string;
    type: 'text' | 'image' | 'file' | 'system';
    fileUrl?: string;
    fileName?: string;
    readBy?: string[];
  };
  currentUserId: string;
  onMarkAsRead?: (messageId: string) => void;
}

export const EnhancedMessage = memo<MessageProps>(({ message, currentUserId, onMarkAsRead }) => {
  const [isHovered, setIsHovered] = useState(false);
  const messageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto mark as read when message comes into view
    if (messageRef.current && message.senderId !== currentUserId && !message.readBy?.includes(currentUserId)) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && onMarkAsRead) {
            onMarkAsRead(message.id);
          }
        },
        { threshold: 0.5 }
      );
      observer.observe(messageRef.current);
      return () => observer.disconnect();
    }
  }, [message.id, message.senderId, currentUserId, message.readBy, onMarkAsRead]);

  const isOwnMessage = message.senderId === currentUserId;
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      ref={messageRef}
      style={{
        display: 'flex',
        justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
        marginBottom: '12px',
        animation: 'fadeInUp 0.3s ease-out'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{
        maxWidth: '70%',
        padding: '12px 16px',
        borderRadius: '18px',
        backgroundColor: isOwnMessage ? '#4CAF50' : '#E3F2FD',
        color: isOwnMessage ? 'white' : '#1976D2',
        wordWrap: 'break-word',
        border: isOwnMessage ? '2px solid #388E3C' : '2px solid #2196F3',
        position: 'relative',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: isHovered ? '0 4px 12px rgba(0,0,0,0.15)' : '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        {/* Message Content */}
        {message.type === 'file' && message.fileUrl ? (
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📎 {message.fileName || 'File'}
            </div>
            <a 
              href={message.fileUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                color: 'inherit', 
                textDecoration: 'underline',
                fontSize: '12px',
                padding: '4px 8px',
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: '4px',
                display: 'inline-block'
              }}
            >
              Tải xuống
            </a>
          </div>
        ) : (
          <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
            {message.content}
          </div>
        )}
        
        {/* Message Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '8px',
          fontSize: '11px',
          opacity: 0.7
        }}>
          <span>{formatTime(message.timestamp)}</span>
          
          {/* Read Receipts */}
          {isOwnMessage && message.readBy && message.readBy.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              ✓ Đã đọc ({message.readBy.length})
            </div>
          )}
        </div>

        {/* Message Status Indicator */}
        {isOwnMessage && (
          <div style={{
            position: 'absolute',
            top: '-8px',
            right: '8px',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            backgroundColor: message.readBy?.length ? '#4CAF50' : '#FFC107',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            color: 'white'
          }}>
            {message.readBy?.length ? '✓' : '⏳'}
          </div>
        )}
      </div>
    </div>
  );
});

// Typing Indicator Component
interface TypingIndicatorProps {
  typingUsers: { userId: string; userName: string; isTyping: boolean }[];
}

export const TypingIndicator = memo<TypingIndicatorProps>(({ typingUsers }) => {
  const activeTypers = typingUsers.filter(user => user.isTyping);
  
  if (activeTypers.length === 0) return null;

  return (
    <div style={{
      padding: '8px 16px',
      fontSize: '12px',
      color: '#666',
      fontStyle: 'italic',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      animation: 'pulse 1.5s infinite'
    }}>
      <div style={{
        display: 'flex',
        gap: '2px'
      }}>
        <div style={{
          width: '4px',
          height: '4px',
          backgroundColor: '#666',
          borderRadius: '50%',
          animation: 'bounce 1.4s infinite ease-in-out both'
        }}></div>
        <div style={{
          width: '4px',
          height: '4px',
          backgroundColor: '#666',
          borderRadius: '50%',
          animation: 'bounce 1.4s infinite ease-in-out both',
          animationDelay: '0.2s'
        }}></div>
        <div style={{
          width: '4px',
          height: '4px',
          backgroundColor: '#666',
          borderRadius: '50%',
          animation: 'bounce 1.4s infinite ease-in-out both',
          animationDelay: '0.4s'
        }}></div>
      </div>
      <span>
        {activeTypers.map(user => user.userName).join(', ')} đang nhập...
      </span>
    </div>
  );
});

// Online Status Component
interface OnlineStatusProps {
  onlineUsers: { userId: string; isOnline: boolean }[];
  maxDisplay?: number;
}

export const OnlineStatus = memo<OnlineStatusProps>(({ onlineUsers, maxDisplay = 5 }) => {
  const onlineCount = onlineUsers.filter(user => user.isOnline).length;
  
  if (onlineCount === 0) return null;

  return (
    <div style={{
      padding: '4px 16px',
      fontSize: '12px',
      color: '#4CAF50',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      backgroundColor: 'rgba(76, 175, 80, 0.1)',
      borderRadius: '12px',
      margin: '4px 16px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
      }}>
        <span style={{
          width: '8px',
          height: '8px',
          backgroundColor: '#4CAF50',
          borderRadius: '50%',
          display: 'inline-block',
          animation: 'pulse 2s infinite'
        }}></span>
        <span style={{ fontWeight: 'bold' }}>
          {onlineCount} người đang online
        </span>
      </div>
      
      {/* Online User Avatars */}
      <div style={{
        display: 'flex',
        gap: '-4px'
      }}>
        {onlineUsers.slice(0, maxDisplay).map((user, index) => (
          <div
            key={user.userId}
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: '#4CAF50',
              border: '2px solid white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              color: 'white',
              fontWeight: 'bold',
              marginLeft: index > 0 ? '-4px' : '0',
              zIndex: maxDisplay - index
            }}
          >
            {user.userId.charAt(0).toUpperCase()}
          </div>
        ))}
        {onlineCount > maxDisplay && (
          <div style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            backgroundColor: '#666',
            border: '2px solid white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            color: 'white',
            fontWeight: 'bold',
            marginLeft: '-4px'
          }}>
            +{onlineCount - maxDisplay}
          </div>
        )}
      </div>
    </div>
  );
});

// File Upload Progress Component
interface FileUploadProgressProps {
  uploads: { fileId: string; progress: number; status: string; fileName?: string }[];
}

export const FileUploadProgress = memo<FileUploadProgressProps>(({ uploads }) => {
  if (uploads.length === 0) return null;

  return (
    <div style={{ marginBottom: '12px' }}>
      {uploads.map((upload) => (
        <div key={upload.fileId} style={{
          padding: '12px 16px',
          backgroundColor: '#f8f9fa',
          borderRadius: '12px',
          marginBottom: '8px',
          border: '1px solid #e9ecef',
          animation: 'slideDown 0.3s ease-out'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>📁</span>
              <span style={{ fontSize: '14px', fontWeight: '500' }}>
                {upload.fileName || 'Đang tải lên...'}
              </span>
            </div>
            <span style={{
              fontSize: '12px',
              fontWeight: 'bold',
              color: upload.status === 'completed' ? '#4CAF50' : '#2196F3'
            }}>
              {upload.progress}%
            </span>
          </div>
          
          {/* Progress Bar */}
          <div style={{
            width: '100%',
            height: '6px',
            backgroundColor: '#e9ecef',
            borderRadius: '3px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${upload.progress}%`,
              height: '100%',
              backgroundColor: upload.status === 'completed' ? '#4CAF50' : 
                              upload.status === 'failed' ? '#f44336' : '#2196F3',
              transition: 'width 0.3s ease, background-color 0.3s ease',
              borderRadius: '3px'
            }}></div>
          </div>
          
          {/* Status Text */}
          <div style={{
            fontSize: '11px',
            color: '#666',
            marginTop: '4px',
            textAlign: 'right'
          }}>
            {upload.status === 'completed' ? 'Hoàn thành' :
             upload.status === 'failed' ? 'Thất bại' : 'Đang tải lên...'}
          </div>
        </div>
      ))}
    </div>
  );
});

// Enhanced Chat Input Component
interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onFileSelect: (file: File) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export const EnhancedChatInput = memo<ChatInputProps>(({
  value,
  onChange,
  onSend,
  onFileSelect,
  onTypingStart,
  onTypingStop,
  disabled = false,
  placeholder = "Nhập tin nhắn..."
}) => {
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Typing indicators
    if (!isTyping && newValue.length > 0) {
      setIsTyping(true);
      onTypingStart();
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        onTypingStop();
      }
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) {
        onSend();
        if (isTyping) {
          setIsTyping(false);
          onTypingStop();
        }
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div style={{
      display: 'flex',
      gap: '12px',
      alignItems: 'center',
      padding: '16px',
      backgroundColor: 'white',
      borderTop: '1px solid #e0e0e0',
      borderRadius: '0 0 12px 12px'
    }}>
      {/* File Upload Button */}
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
        accept="image/*,.pdf,.doc,.docx,.txt,.zip,.rar"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
        style={{
          padding: '12px',
          backgroundColor: '#2196F3',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '44px',
          height: '44px',
          opacity: disabled ? 0.5 : 1,
          transition: 'all 0.2s ease',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        }}
        title="Gửi file"
      >
        📎
      </button>

      {/* Text Input */}
      <input
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          flex: 1,
          padding: '12px 16px',
          border: '2px solid #e0e0e0',
          borderRadius: '24px',
          fontSize: '14px',
          outline: 'none',
          transition: 'border-color 0.2s ease',
          backgroundColor: disabled ? '#f5f5f5' : 'white'
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#2196F3';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = '#e0e0e0';
        }}
      />

      {/* Send Button */}
      <button
        onClick={onSend}
        disabled={!value.trim() || disabled}
        style={{
          padding: '12px 20px',
          backgroundColor: value.trim() ? '#4CAF50' : '#ccc',
          color: 'white',
          border: 'none',
          borderRadius: '24px',
          cursor: value.trim() && !disabled ? 'pointer' : 'not-allowed',
          fontSize: '14px',
          fontWeight: 'bold',
          transition: 'all 0.2s ease',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
        onMouseEnter={(e) => {
          if (value.trim() && !disabled) {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        }}
      >
        Gửi
      </button>
    </div>
  );
});

// CSS Animations (to be added to global CSS)
export const chatAnimations = `
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}
`;
