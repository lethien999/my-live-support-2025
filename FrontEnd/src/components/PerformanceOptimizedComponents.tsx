import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
// import { EnhancedSocketServiceInstance } from '../services/EnhancedSocketService';

// Performance-optimized Chat Room List Component
interface ChatRoom {
  id: string;
  roomName: string;
  customerName: string;
  customerEmail: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isCustomerOnline: boolean;
}

interface ChatRoomListProps {
  rooms: ChatRoom[];
  selectedRoomId?: string;
  onRoomSelect: (room: ChatRoom) => void;
  onRoomSearch: (query: string) => void;
}

// Memoized Chat Room Item để tránh re-render không cần thiết
const ChatRoomItem = memo<{
  room: ChatRoom;
  isSelected: boolean;
  onClick: () => void;
}>(({ room, isSelected, onClick }) => {
  const formatTime = useCallback((timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Vừa xong';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} phút trước`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} giờ trước`;
    
    return date.toLocaleDateString('vi-VN');
  }, []);

  return (
    <div
      onClick={onClick}
      style={{
        padding: '16px',
        borderBottom: '1px solid #e0e0e0',
        cursor: 'pointer',
        backgroundColor: isSelected ? '#e3f2fd' : 'white',
        transition: 'background-color 0.2s ease',
        position: 'relative'
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = '#f5f5f5';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = 'white';
        }
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            marginBottom: '4px'
          }}>
            <h3 style={{ 
              margin: 0, 
              fontSize: '16px', 
              fontWeight: 'bold',
              color: '#1976d2',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {room.customerName}
            </h3>
            {room.isCustomerOnline && (
              <span style={{
                width: '8px',
                height: '8px',
                backgroundColor: '#4CAF50',
                borderRadius: '50%',
                animation: 'pulse 2s infinite'
              }}></span>
            )}
          </div>
          
          <p style={{ 
            margin: '0 0 4px 0', 
            fontSize: '14px', 
            color: '#666',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {room.lastMessage || 'Chưa có tin nhắn'}
          </p>
          
          <p style={{ 
            margin: 0, 
            fontSize: '12px', 
            color: '#999'
          }}>
            {formatTime(room.lastMessageTime)}
          </p>
        </div>
        
        {room.unreadCount > 0 && (
          <div style={{
            backgroundColor: '#f44336',
            color: 'white',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 'bold',
            minWidth: '20px'
          }}>
            {room.unreadCount > 99 ? '99+' : room.unreadCount}
          </div>
        )}
      </div>
    </div>
  );
});

// Virtualized Chat Room List cho performance tốt hơn với nhiều rooms
export const OptimizedChatRoomList = memo<ChatRoomListProps>(({ 
  rooms, 
  selectedRoomId, 
  onRoomSelect, 
  onRoomSearch 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });
  const containerRef = useRef<HTMLDivElement>(null);
  const itemHeight = 80; // Approximate height of each room item

  // Debounced search để tránh quá nhiều re-render
  const debouncedSearch = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return (query: string) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        onRoomSearch(query);
      }, 300);
    };
  }, [onRoomSearch]);

  // Filtered rooms với memoization
  const filteredRooms = useMemo(() => {
    if (!searchQuery) return rooms;
    return rooms.filter(room => 
      room.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [rooms, searchQuery]);

  // Visible rooms cho virtualization
  const visibleRooms = useMemo(() => {
    return filteredRooms.slice(visibleRange.start, visibleRange.end);
  }, [filteredRooms, visibleRange]);

  // Handle scroll để load thêm rooms
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const scrollPercentage = scrollTop / (scrollHeight - clientHeight);
    
    if (scrollPercentage > 0.8) {
      setVisibleRange(prev => ({
        start: prev.start,
        end: Math.min(prev.end + 10, filteredRooms.length)
      }));
    }
  }, [filteredRooms.length]);

  // Handle search input
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  }, [debouncedSearch]);

  return (
    <div style={{ 
      width: '350px', 
      backgroundColor: 'white', 
      borderRight: '1px solid #e0e0e0',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh'
    }}>
      {/* Header */}
      <div style={{ 
        padding: '20px', 
        borderBottom: '1px solid #e0e0e0',
        backgroundColor: '#4CAF50',
        color: 'white'
      }}>
        <h2 style={{ margin: 0, fontSize: '20px' }}>MUJI Support</h2>
        <p style={{ margin: '5px 0 0 0', fontSize: '14px', opacity: 0.9 }}>
          Agent Dashboard
        </p>
      </div>

      {/* Search Bar */}
      <div style={{ padding: '15px', borderBottom: '1px solid #e0e0e0' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Tìm kiếm cuộc trò chuyện..."
          style={{
            width: '100%',
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '20px',
            fontSize: '14px',
            outline: 'none',
            transition: 'border-color 0.2s ease'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#4CAF50';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#ddd';
          }}
        />
      </div>

      {/* Room List với virtualization */}
      <div 
        ref={containerRef}
        style={{ 
          flex: 1, 
          overflowY: 'auto',
          position: 'relative'
        }}
        onScroll={handleScroll}
      >
        {/* Virtual spacer for items before visible range */}
        <div style={{ height: visibleRange.start * itemHeight }} />
        
        {/* Visible room items */}
        {visibleRooms.map((room) => (
          <ChatRoomItem
            key={room.id}
            room={room}
            isSelected={selectedRoomId === room.id}
            onClick={() => onRoomSelect(room)}
          />
        ))}
        
        {/* Virtual spacer for items after visible range */}
        <div style={{ height: (filteredRooms.length - visibleRange.end) * itemHeight }} />
        
        {/* Loading indicator */}
        {visibleRange.end < filteredRooms.length && (
          <div style={{
            padding: '20px',
            textAlign: 'center',
            color: '#666',
            fontSize: '14px'
          }}>
            Đang tải thêm...
          </div>
        )}
      </div>
    </div>
  );
});

// Performance-optimized Message List Component
interface MessageListProps {
  messages: any[];
  _______currentUserId?: string;
  _______onMarkAsRead?: (messageId: string) => void;
  onLoadMore: () => void;
  hasMore: boolean;
  loading: boolean;
}

export const OptimizedMessageList = memo<MessageListProps>(({
  messages,
  _______currentUserId: _currentUserId,
  _______onMarkAsRead: _onMarkAsRead,
  onLoadMore,
  hasMore,
  loading
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });
  const messageHeight = 60; // Approximate height of each message

  // Intersection Observer để lazy load messages
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && hasMore && !loading) {
            onLoadMore();
          }
        });
      },
      { threshold: 0.1 }
    );

    const loadMoreTrigger = document.getElementById('load-more-trigger');
    if (loadMoreTrigger) {
      observer.observe(loadMoreTrigger);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore]);

  // Visible messages cho virtualization
  const visibleMessages = useMemo(() => {
    return messages.slice(visibleRange.start, visibleRange.end);
  }, [messages, visibleRange]);

  // Handle scroll để update visible range
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const scrollPercentage = scrollTop / (scrollHeight - clientHeight);
    
    // Update visible range based on scroll position
    const totalMessages = messages.length;
    const visibleCount = Math.ceil(clientHeight / messageHeight);
    const start = Math.max(0, Math.floor(scrollPercentage * totalMessages) - visibleCount);
    const end = Math.min(totalMessages, start + visibleCount * 2);
    
    setVisibleRange({ start, end });
  }, [messages.length, messageHeight]);

  return (
    <div 
      ref={containerRef}
      style={{ 
        flex: 1, 
        padding: '20px', 
        overflowY: 'auto',
        backgroundColor: '#fafafa'
      }}
      onScroll={handleScroll}
    >
      {/* Load more trigger */}
      {hasMore && (
        <div id="load-more-trigger" style={{ height: '20px' }} />
      )}
      
      {/* Virtual spacer for messages before visible range */}
      <div style={{ height: visibleRange.start * messageHeight }} />
      
      {/* Visible messages */}
      {visibleMessages.map((message) => (
        <div key={message.id} style={{ marginBottom: '12px' }}>
          {/* Message content sẽ được render bởi EnhancedMessage component */}
        </div>
      ))}
      
      {/* Virtual spacer for messages after visible range */}
      <div style={{ height: (messages.length - visibleRange.end) * messageHeight }} />
      
      {/* Loading indicator */}
      {loading && (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          color: '#666',
          fontSize: '14px'
        }}>
          Đang tải tin nhắn...
        </div>
      )}
    </div>
  );
});

// Performance monitoring hook
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    renderCount: 0,
    lastRenderTime: 0,
    averageRenderTime: 0
  });

  const startTime = useRef(performance.now());

  useEffect(() => {
    const endTime = performance.now();
    const renderTime = endTime - startTime.current;
    
    setMetrics(prev => ({
      renderCount: prev.renderCount + 1,
      lastRenderTime: renderTime,
      averageRenderTime: (prev.averageRenderTime * prev.renderCount + renderTime) / (prev.renderCount + 1)
    }));
    
    startTime.current = performance.now();
  });

  return metrics;
};

// Memory usage monitoring
export const useMemoryMonitor = () => {
  const [memoryInfo, setMemoryInfo] = useState<any>(null);

  useEffect(() => {
    const updateMemoryInfo = () => {
      if ('memory' in performance) {
        setMemoryInfo((performance as any).memory);
      }
    };

    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 5000);

    return () => clearInterval(interval);
  }, []);

  return memoryInfo;
};

// Debounce hook cho performance
export const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Throttle hook cho performance
export const useThrottle = <T,>(value: T, limit: number): T => {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRan = useRef<number>(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
};
