import React, { useState, useEffect, useRef } from 'react';
import SocketService, { Message, Room } from '../services/SocketService';
import AuthChatService from '../services/AuthChatService';
import { getApiUrl, API_CONFIG } from '../config/api';

interface ChatPageProps {}

const ChatPage: React.FC<ChatPageProps> = () => {
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
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initializeChat();
    
    // Listen for message updates
    const handleMessageUpdate = () => {
      console.log('ChatPage: Message updated, reloading conversations...');
      loadConversations();
    };
    
    window.addEventListener('messageUpdated', handleMessageUpdate);
    
    return () => {
      window.removeEventListener('messageUpdated', handleMessageUpdate);
      SocketService.disconnect();
    };
  }, []);

  const loadConversations = async () => {
    try {
      const token = AuthChatService.getToken();
      if (!token) {
        throw new Error('No token available');
      }

      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.CHAT.ROOMS), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📨 Loaded conversations from API:', data);
      
      if (data.success && data.conversations) {
        // Convert API data to Room format
        const rooms: Room[] = data.conversations.map((conv: any) => ({
          id: conv.id.toString(),
          name: conv.shopName || 'Unknown Shop',
          type: 'customer-shop' as const,
          participants: [user?.id?.toString() || '3', conv.shopId?.toString() || '2'],
          lastMessage: conv.lastMessage ? {
            id: '1',
            content: conv.lastMessage,
            senderId: '1',
            senderName: 'Shop',
            senderRole: 'Agent',
            roomId: conv.id.toString(),
            timestamp: conv.lastMessageTime,
            type: 'text' as const
          } : undefined,
          unreadCount: conv.unreadCount || 0,
          isOnline: conv.isOnline || false,
          avatar: conv.avatar || '🏪'
        }));
        
        setRooms(rooms);
        console.log('✅ Converted to rooms:', rooms);
      }
    } catch (error) {
      console.error('❌ Error loading conversations:', error);
      // Fallback to mock data
      loadMockData();
    }
  };

  const loadMessages = async (roomId: string) => {
    try {
      const token = AuthChatService.getToken();
      if (!token) {
        throw new Error('No token available');
      }

      const response = await fetch(getApiUrl(`${API_CONFIG.ENDPOINTS.CHAT.MESSAGES}/${roomId}`), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📨 Loaded messages from API:', data);
      
      if (data.success && data.messages) {
        // Convert API data to Message format
        const messages: Message[] = data.messages.map((msg: any) => ({
          id: msg.id.toString(),
          content: msg.messageText || msg.content,
          senderId: msg.senderId?.toString() || '1',
          senderName: msg.senderName || 'Unknown',
          senderRole: msg.senderType || 'Customer',
          roomId: msg.roomId?.toString() || roomId,
          timestamp: msg.createdAt,
          type: 'text' as const
        }));
        
        setMessages(messages);
        console.log('✅ Converted to messages:', messages);
      }
    } catch (error) {
      console.error('❌ Error loading messages:', error);
      // Fallback to empty messages
      setMessages([]);
    }
  };

  const initializeChat = async () => {
    try {
      setLoading(true);
      
      // Initialize auth service
      AuthChatService.init();
      const currentUser = AuthChatService.getCurrentUser();
      
      if (!currentUser) {
        setError('Vui lòng đăng nhập để sử dụng chat');
        setLoading(false);
        return;
      }

      setUser(currentUser);
      
      // Load conversations from API first
      await loadConversations();
      
      // Get token and connect to socket
      const token = AuthChatService.getToken();
      if (!token) {
        setError('Token không hợp lệ');
        setLoading(false);
        return;
      }

      // Try to connect to WebSocket with fallback
      try {
        await SocketService.connect(token);
        setupSocketListeners();
        SocketService.requestRooms();
      } catch (socketError) {
        console.warn('⚠️ WebSocket connection failed, using fallback mode:', socketError);
        // Fallback: Load mock data when WebSocket fails
        loadMockData();
      }
      
      // Check for order context
      checkOrderContext();
      
      setLoading(false);
    } catch (error) {
      console.error('Error initializing chat:', error);
      setError('Không thể kết nối đến server chat. Đang sử dụng chế độ offline.');
      loadMockData();
      setLoading(false);
    }
  };

  const setupSocketListeners = () => {
    // Message listeners
    SocketService.onMessage((message: Message) => {
      console.log('📨 Received message:', message);
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    });

    // Room listeners
    SocketService.onRooms((rooms: Room[]) => {
      console.log('🏠 Received rooms:', rooms);
      setRooms(rooms);
      
      // Auto-select first room if none selected
      if (!selectedRoom && rooms.length > 0) {
        setSelectedRoom(rooms[0].id);
        SocketService.joinRoom(rooms[0].id);
      }
    });

    // Connection listeners
    SocketService.onConnection((connected: boolean) => {
      console.log('🔌 Connection status:', connected);
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

  const loadMockData = () => {
    // Mock rooms for fallback mode
    const mockRooms: Room[] = [
      {
        id: 'shop_1',
        name: 'MUJI Store - Clothing',
        type: 'customer-shop',
        participants: ['customer', 'shop'],
        lastMessage: {
          id: '1',
          content: 'Cảm ơn bạn đã quan tâm đến sản phẩm của chúng tôi',
          senderId: 'shop',
          senderName: 'MUJI Store',
          senderRole: 'Agent',
          roomId: 'shop_1',
          timestamp: new Date().toISOString(),
          type: 'text'
        },
        unreadCount: 2,
        isActive: true
      },
      {
        id: 'shop_2',
        name: 'MUJI Store - Beauty',
        type: 'customer-shop',
        participants: ['customer', 'shop'],
        lastMessage: {
          id: '2',
          content: 'Chúng tôi có nhiều sản phẩm chăm sóc da',
          senderId: 'shop',
          senderName: 'MUJI Store',
          senderRole: 'Agent',
          roomId: 'shop_2',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          type: 'text'
        },
        unreadCount: 0,
        isActive: false
      },
      {
        id: 'shop_3',
        name: 'MUJI Store - Home',
        type: 'customer-shop',
        participants: ['customer', 'shop'],
        lastMessage: {
          id: '3',
          content: 'Bộ chén đĩa gốm sứ đang được ưu đãi',
          senderId: 'shop',
          senderName: 'MUJI Store',
          senderRole: 'Agent',
          roomId: 'shop_3',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          type: 'text'
        },
        unreadCount: 1,
        isActive: true
      }
    ];
    
    setRooms(mockRooms);
    
    // Auto-select first room
    if (mockRooms.length > 0) {
      setSelectedRoom(mockRooms[0].id);
    }
    
    console.log('📱 Loaded mock data for offline mode');
  };

  const checkOrderContext = () => {
    const chatContext = localStorage.getItem('chatContext');
    if (chatContext) {
      try {
        const context = JSON.parse(chatContext);
        if (context.type === 'order') {
          console.log('📦 Order context received:', context);
          setOrderContext(context);
          
          // Auto-send order message
          setTimeout(() => {
            if (selectedRoom) {
              setNewMessage(context.message);
              handleSendMessage();
            }
          }, 1000);
          
          // Clear context
          localStorage.removeItem('chatContext');
        }
      } catch (error) {
        console.error('Error parsing chat context:', error);
        localStorage.removeItem('chatContext');
      }
    }
  };

  const handleRoomSelect = (roomId: string) => {
    if (selectedRoom) {
      SocketService.leaveRoom(selectedRoom);
    }
    
    setSelectedRoom(roomId);
    SocketService.joinRoom(roomId);
    
    // Load messages from API for the selected room
    loadMessages(roomId);
    
    // Clear messages for new room
    setMessages([]);
    
    // Mark room as read
    setRooms(prev => prev.map(room => 
      room.id === roomId ? { ...room, unreadCount: 0 } : room
    ));
  };

  const sendMessageViaAPI = async (roomId: string, content: string) => {
    try {
      const token = AuthChatService.getToken();
      if (!token) {
        throw new Error('No token available');
      }

      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.CHAT.SEND), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId: roomId,
          content: content,
          type: 'text'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📨 Message sent via API:', data);
      
      if (data.success && data.data) {
        // Add message to local state
        const newMessage: Message = {
          id: data.data.id,
          content: data.data.content,
          senderId: data.data.senderId?.toString() || user?.id?.toString() || '3',
          senderName: data.data.sender || user?.name || 'Bạn',
          senderRole: data.data.senderType || user?.role || 'Customer',
          roomId: data.data.roomId?.toString() || roomId,
          timestamp: data.data.createdAt,
          type: 'text'
        };
        
        setMessages(prev => [...prev, newMessage]);
        // Dispatch message updated event
        window.dispatchEvent(new CustomEvent('messageUpdated'));
      }
    } catch (error) {
      console.error('❌ Error sending message via API:', error);
      throw error;
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!newMessage.trim() || !selectedRoom) return;

    try {
      // Check if WebSocket is connected
      if (SocketService.isSocketConnected()) {
        // Send message via socket
        SocketService.sendMessage(selectedRoom, newMessage.trim());
      } else {
        // Fallback: Send message via API
        await sendMessageViaAPI(selectedRoom, newMessage.trim());
        
        // Simulate shop response after 2 seconds
        setTimeout(() => {
          const shopResponse: Message = {
            id: `msg_${Date.now()}_response`,
            content: 'Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm nhất có thể.',
            senderId: 'shop',
            senderName: 'MUJI Store',
            senderRole: 'Agent',
            roomId: selectedRoom,
            timestamp: new Date().toISOString(),
            type: 'text'
          };
          
          setMessages(prev => [...prev, shopResponse]);
          scrollToBottom();
        }, 2000);
      }
      
      // Clear input
      setNewMessage('');
      
      // Stop typing indicator
      if (SocketService.isSocketConnected()) {
        SocketService.stopTyping(selectedRoom);
      }
      
      scrollToBottom();
      
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

  const getRoomName = (room: Room) => {
    if (room.type === 'customer-shop') {
      return room.name || 'MUJI Store';
    }
    return room.name || 'Chat Room';
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
          <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Đang kết nối...</h3>
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
          <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Lỗi kết nối</h3>
          <p style={{ margin: '0 0 20px 0', color: '#666' }}>{error}</p>
          <button
            onClick={initializeChat}
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
      {/* Rooms Sidebar */}
      <div style={{
        width: '300px',
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
            Hỗ trợ trực tuyến
          </h1>
          <p style={{
            color: '#666',
            fontSize: '14px',
            margin: 0
          }}>
            Kết nối với các shop để được tư vấn • {rooms.length} cuộc trò chuyện
          </p>
        </div>

        {/* Rooms List */}
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
                  {getRoomName(room)}
                </h3>
                {room.unreadCount > 0 && (
                  <span style={{
                    backgroundColor: '#f44336',
                    color: 'white',
                    borderRadius: '12px',
                    padding: '2px 8px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {room.unreadCount}
                  </span>
                )}
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
                <span>{room.type === 'customer-shop' ? 'Shop' : 'Chat'}</span>
                <span>{room.isActive ? '🟢 Online' : '🔴 Offline'}</span>
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
                {getRoomName(rooms.find(r => r.id === selectedRoom)!)}
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
                backgroundColor: '#e3f2fd',
                borderBottom: '1px solid #bbdefb',
                borderLeft: '4px solid #2196f3'
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
                    color: '#1976d2'
                  }}>
                    Thông tin đơn hàng
                  </h3>
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
                      {message.senderName} • {formatTime(message.timestamp)}
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
                    placeholder="Nhập tin nhắn..."
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
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>💬</div>
              <h2 style={{ margin: '0 0 10px 0', color: '#333' }}>Chọn cuộc trò chuyện</h2>
              <p style={{ margin: 0, color: '#666' }}>Chọn một shop để bắt đầu chat</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;