import React, { useState, useEffect, useRef } from 'react';
import SocketService, { Message, Room } from '../services/SocketService';
import AuthChatService from '../services/AuthChatService';

interface ShopChatPageProps {}

const ShopChatPage: React.FC<ShopChatPageProps> = () => {
  // State management
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState<{ [roomId: string]: string[] }>({});
  const [orderContext, setOrderContext] = useState<any>(null);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeChats: 0,
    unreadMessages: 0,
    onlineCustomers: 0
  });
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initializeAgentChat();
    
    // Listen for message updates
    const handleMessageUpdate = () => {
      console.log('ShopChatPage: Message updated, reloading conversations...');
      loadConversations();
    };
    
    window.addEventListener('messageUpdated', handleMessageUpdate);
    
    return () => {
      window.removeEventListener('messageUpdated', handleMessageUpdate);
      SocketService.disconnect();
    };
  }, []);

  const initializeAgentChat = async () => {
    try {
      setLoading(true);
      
      // Initialize auth service
      AuthChatService.init();
      const currentUser = AuthChatService.getCurrentUser();
      
      if (!currentUser) {
        setError('Vui lòng đăng nhập với tài khoản Agent');
        setLoading(false);
        return;
      }

      if (currentUser.role !== 'Agent') {
        setError('Chỉ Agent mới có thể truy cập trang này');
        setLoading(false);
        return;
      }

      setUser(currentUser);
      
      // Get token and connect to socket
      const token = AuthChatService.getToken();
      if (!token) {
        setError('Token không hợp lệ');
        setLoading(false);
        return;
      }

      // Connect to WebSocket
      await SocketService.connect(token);
      
      // Set up event listeners
      setupSocketListeners();
      
      // Request rooms (customer conversations)
      SocketService.requestRooms();
      
      // Check for order context
      checkOrderContext();
      
      // Load agent stats
      loadAgentStats();
      
      setLoading(false);
    } catch (error) {
      console.error('Error initializing agent chat:', error);
      setError('Không thể kết nối đến server chat');
      setLoading(false);
    }
  };

  const setupSocketListeners = () => {
    // Message listeners
    SocketService.onMessage((message: Message) => {
      console.log('📨 Agent received message:', message);
      setMessages(prev => [...prev, message]);
      scrollToBottom();
      
      // Update stats
      setStats(prev => ({
        ...prev,
        unreadMessages: prev.unreadMessages + 1
      }));
    });

    // Room listeners
    SocketService.onRooms((rooms: Room[]) => {
      console.log('🏠 Agent received rooms:', rooms);
      setRooms(rooms);
      
      // Calculate stats
      const activeChats = rooms.filter(r => r.isActive).length;
      const unreadMessages = rooms.reduce((sum, r) => sum + r.unreadCount, 0);
      const onlineCustomers = rooms.filter(r => r.isActive).length;
      
      setStats({
        totalCustomers: rooms.length,
        activeChats,
        unreadMessages,
        onlineCustomers
      });
      
      // Auto-select first room with unread messages
      const roomWithUnread = rooms.find(r => r.unreadCount > 0);
      if (roomWithUnread && !selectedRoom) {
        setSelectedRoom(roomWithUnread.id);
        SocketService.joinRoom(roomWithUnread.id);
      } else if (!selectedRoom && rooms.length > 0) {
        setSelectedRoom(rooms[0].id);
        SocketService.joinRoom(rooms[0].id);
      }
    });

    // Connection listeners
    SocketService.onConnection((connected: boolean) => {
      console.log('🔌 Agent connection status:', connected);
      if (!connected) {
        setError('Mất kết nối với server');
      } else {
        setError(null);
      }
    });

    // Typing listeners
    SocketService.onTyping((data) => {
      setIsTyping(prev => ({
        ...prev,
        [data.roomId]: data.isTyping 
          ? [...(prev[data.roomId] || []).filter(u => u !== data.user), data.user]
          : (prev[data.roomId] || []).filter(u => u !== data.user)
      }));
    });
  };

  const checkOrderContext = () => {
    const chatContext = localStorage.getItem('chatContext');
    if (chatContext) {
      try {
        const context = JSON.parse(chatContext);
        if (context.type === 'order') {
          console.log('📦 Agent received order context:', context);
          setOrderContext(context);
          
          // Clear context
          localStorage.removeItem('chatContext');
        }
      } catch (error) {
        console.error('Error parsing chat context:', error);
        localStorage.removeItem('chatContext');
      }
    }
  };

  const loadAgentStats = () => {
    // Mock stats - in real app, this would come from API
    setStats({
      totalCustomers: 0,
      activeChats: 0,
      unreadMessages: 0,
      onlineCustomers: 0
    });
  };

  const handleRoomSelect = (roomId: string) => {
    if (selectedRoom) {
      SocketService.leaveRoom(selectedRoom);
    }
    
    setSelectedRoom(roomId);
    SocketService.joinRoom(roomId);
    
    // Clear messages for new room
    setMessages([]);
    
    // Mark room as read
    setRooms(prev => prev.map(room => 
      room.id === roomId ? { ...room, unreadCount: 0 } : room
    ));
    
    // Update stats
    setStats(prev => ({
      ...prev,
      unreadMessages: Math.max(0, prev.unreadMessages - 1)
    }));
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!newMessage.trim() || !selectedRoom) return;

    try {
      // Send message via socket
      SocketService.sendMessage(selectedRoom, newMessage.trim());
      
      // Dispatch message updated event
      window.dispatchEvent(new CustomEvent('messageUpdated'));
      
      // Clear input
      setNewMessage('');
      
      // Stop typing indicator
      SocketService.stopTyping(selectedRoom);
      
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Không thể gửi tin nhắn');
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMessage(value);
    
    if (!selectedRoom) return;
    
    // Start typing indicator
    SocketService.startTyping(selectedRoom);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Stop typing after 1 second of no typing
    typingTimeoutRef.current = setTimeout(() => {
      SocketService.stopTyping(selectedRoom);
    }, 1000);
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCustomerName = (room: Room) => {
    // Extract customer name from room name or use room ID
    return room.name || `Khách hàng ${room.id}`;
  };

  const getPriorityColor = (room: Room) => {
    if (room.unreadCount > 3) return '#f44336'; // High priority
    if (room.unreadCount > 0) return '#ff9800'; // Medium priority
    return '#4caf50'; // Low priority
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '40px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #007bff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Đang khởi tạo Agent Dashboard...</h3>
          <p style={{ margin: 0, color: '#666' }}>Vui lòng chờ trong giây lát</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '40px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
          <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Lỗi Agent Dashboard</h3>
          <p style={{ margin: '0 0 20px 0', color: '#666' }}>{error}</p>
          <button
            onClick={initializeAgentChat}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      {/* Agent Sidebar */}
      <div style={{
        width: '350px',
        backgroundColor: 'white',
        borderRight: '1px solid #e0e0e0',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #e0e0e0',
          backgroundColor: '#fafafa'
        }}>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            margin: '0 0 5px 0',
            color: '#333'
          }}>
            Agent Dashboard
          </h1>
          <p style={{
            color: '#666',
            fontSize: '14px',
            margin: 0
          }}>
            Hỗ trợ khách hàng • {stats.totalCustomers} cuộc trò chuyện
          </p>
        </div>

        {/* Stats */}
        <div style={{
          padding: '15px 20px',
          borderBottom: '1px solid #e0e0e0',
          backgroundColor: '#f8f9fa'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#4caf50' }}>
                {stats.activeChats}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>Đang chat</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f44336' }}>
                {stats.unreadMessages}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>Chưa đọc</div>
            </div>
          </div>
        </div>

        {/* Customers List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {rooms.map((room) => (
            <div
              key={room.id}
              onClick={() => handleRoomSelect(room.id)}
              style={{
                padding: '15px 20px',
                borderBottom: '1px solid #f0f0f0',
                cursor: 'pointer',
                backgroundColor: selectedRoom === room.id ? '#e3f2fd' : 'white',
                borderLeft: selectedRoom === room.id ? '4px solid #2196f3' : '4px solid transparent',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '5px'
              }}>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  margin: 0,
                  color: '#333'
                }}>
                  {getCustomerName(room)}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  {room.unreadCount > 0 && (
                    <span style={{
                      backgroundColor: getPriorityColor(room),
                      color: 'white',
                      borderRadius: '12px',
                      padding: '2px 8px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {room.unreadCount}
                    </span>
                  )}
                  <span style={{
                    fontSize: '10px',
                    color: room.isActive ? '#4caf50' : '#999'
                  }}>
                    {room.isActive ? '🟢' : '🔴'}
                  </span>
                </div>
              </div>
              
              {room.lastMessage && (
                <p style={{
                  fontSize: '12px',
                  color: '#666',
                  margin: '0 0 5px 0',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {room.lastMessage.content}
                </p>
              )}
              
              <div style={{
                fontSize: '11px',
                color: '#999',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>Customer</span>
                <span>{room.isActive ? 'Online' : 'Offline'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'white'
      }}>
        {selectedRoom ? (
          <>
            {/* Chat Header */}
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #e0e0e0',
              backgroundColor: '#fafafa'
            }}>
              <h2 style={{
                fontSize: '16px',
                fontWeight: '600',
                margin: '0 0 4px 0',
                color: '#333'
              }}>
                {getCustomerName(rooms.find(r => r.id === selectedRoom)!)}
              </h2>
              <p style={{
                fontSize: '12px',
                color: '#666',
                margin: 0
              }}>
                {rooms.find(r => r.id === selectedRoom)?.isActive ? '🟢 Đang online' : '🔴 Offline'}
              </p>
            </div>

            {/* Order Context Banner */}
            {orderContext && (
              <div style={{
                padding: '15px 20px',
                backgroundColor: '#fff3e0',
                borderBottom: '1px solid #ffcc02',
                borderLeft: '4px solid #ff9800'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '8px'
                }}>
                  <span style={{ fontSize: '16px' }}>📦</span>
                  <h3 style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    margin: 0,
                    color: '#e65100'
                  }}>
                    Thông tin đơn hàng cần hỗ trợ
                  </h3>
                  <span style={{
                    backgroundColor: '#ff5722',
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '10px',
                    fontWeight: 'bold'
                  }}>
                    ƯU TIÊN CAO
                  </span>
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '10px',
                  fontSize: '12px',
                  color: '#424242'
                }}>
                  <div><strong>Mã đơn hàng:</strong> {orderContext.orderNumber}</div>
                  <div><strong>Cửa hàng:</strong> {orderContext.shopName}</div>
                  <div><strong>Ngày đặt:</strong> {new Date(orderContext.orderDate).toLocaleDateString('vi-VN')}</div>
                  <div><strong>Trạng thái:</strong> {orderContext.orderStatus}</div>
                  <div><strong>Tổng tiền:</strong> {orderContext.orderTotal.toLocaleString('vi-VN')} VND</div>
                  <div><strong>Khách hàng:</strong> {orderContext.context?.customerName}</div>
                </div>
                <div style={{
                  marginTop: '8px',
                  fontSize: '11px',
                  color: '#666',
                  fontStyle: 'italic'
                }}>
                  🚨 Khách hàng đang gặp vấn đề với đơn hàng này - Cần hỗ trợ ngay!
                </div>
              </div>
            )}

            {/* Messages */}
            <div style={{
              flex: 1,
              padding: '20px',
              overflowY: 'auto',
              backgroundColor: '#fafafa'
            }}>
              {messages.map((message) => (
                <div
                  key={message.id}
                  style={{
                    display: 'flex',
                    justifyContent: message.senderId === user?.id?.toString() ? 'flex-end' : 'flex-start',
                    marginBottom: '15px'
                  }}
                >
                  <div style={{
                    maxWidth: '70%',
                    padding: '12px 16px',
                    borderRadius: '18px',
                    backgroundColor: message.senderId === user?.id?.toString() ? '#007bff' : 'white',
                    color: message.senderId === user?.id?.toString() ? 'white' : '#333',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                    border: message.senderId === user?.id?.toString() ? 'none' : '1px solid #e0e0e0'
                  }}>
                    <div style={{
                      fontSize: '11px',
                      color: message.senderId === user?.id?.toString() ? 'rgba(255,255,255,0.8)' : '#999',
                      marginBottom: '4px'
                    }}>
                      {message.senderId === user?.id?.toString() ? 'Bạn (Agent)' : `${message.senderName} (Customer)`} • {formatTime(message.timestamp)}
                    </div>
                    <div>{message.content}</div>
                  </div>
                </div>
              ))}
              
              {/* Typing indicator */}
              {isTyping[selectedRoom] && isTyping[selectedRoom].length > 0 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-start',
                  marginBottom: '15px'
                }}>
                  <div style={{
                    padding: '12px 16px',
                    backgroundColor: 'white',
                    borderRadius: '18px',
                    border: '1px solid #e0e0e0',
                    fontSize: '12px',
                    color: '#666'
                  }}>
                    {isTyping[selectedRoom].join(', ')} đang nhập...
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div style={{
              padding: '20px',
              borderTop: '1px solid #e0e0e0',
              backgroundColor: 'white'
            }}>
              <form onSubmit={handleSendMessage}>
                <div style={{
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'center'
                }}>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={handleTyping}
                    placeholder="Nhập tin nhắn hỗ trợ..."
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      border: '1px solid #e0e0e0',
                      borderRadius: '24px',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s ease'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#007bff'}
                    onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    style={{
                      padding: '12px 20px',
                      backgroundColor: newMessage.trim() ? '#007bff' : '#ccc',
                      color: 'white',
                      border: 'none',
                      borderRadius: '24px',
                      cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
                      fontSize: '14px',
                      fontWeight: '600',
                      transition: 'background-color 0.2s ease'
                    }}
                  >
                    Gửi
                  </button>
                </div>
              </form>
            </div>
          </>
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#fafafa'
          }}>
            <div style={{
              textAlign: 'center',
              padding: '40px'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>🎧</div>
              <h2 style={{ margin: '0 0 10px 0', color: '#333' }}>Agent Dashboard</h2>
              <p style={{ margin: 0, color: '#666' }}>Chọn một khách hàng để bắt đầu hỗ trợ</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopChatPage;