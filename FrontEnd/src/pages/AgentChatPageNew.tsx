import React, { useState, useEffect, useRef } from 'react';
import AuthChatService from '../services/AuthChatService';
import { EnhancedSocketServiceInstance } from '../services/EnhancedSocketService';

interface ChatRoom {
  id: number;
  roomName: string;
  customerName: string;
  customerEmail: string;
  customerAvatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isCustomerOnline: boolean;
  createdAt: string;
}

interface WaitingCustomer {
  id: number;
  name: string;
  email: string;
  avatar: string;
  lastMessage: string;
  lastMessageTime: string;
  hasActiveRoom: boolean;
}

interface Message {
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
  isUser?: boolean;
  readBy?: string[];
}

const AgentChatPageNew: React.FC = () => {
  // State management
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [waitingCustomers, setWaitingCustomers] = useState<WaitingCustomer[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'rooms' | 'waiting'>('rooms');
  
  // Enhanced chat features
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<{ userId: string; userName: string; isTyping: boolean }[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<{ userId: string; isOnline: boolean }[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ fileId: string; progress: number; status: string }[]>([]);
  const [_selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Use selectedFile in file upload handler
  const handleFileUpload = (file: File) => {
    setSelectedFile(file);
    if (selectedRoom) {
      EnhancedSocketServiceInstance.sendFile(selectedRoom.id.toString(), file);
    }
  };
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeAgentChat();
    
    return () => {
      EnhancedSocketServiceInstance.disconnect();
    };
  }, []);

  useEffect(() => {
    if (selectedRoom) {
      loadMessages(selectedRoom.id.toString());
      joinRoom(selectedRoom.id.toString());
    }
  }, [selectedRoom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

      if (currentUser.role !== 'Agent' && currentUser.role !== 'Admin') {
        setError('Chỉ Agent mới có thể truy cập trang này');
        setLoading(false);
        return;
      }

      setUser(currentUser);
      
      // Get token and connect to socket
      const token = await AuthChatService.getToken();
      if (!token) {
        setError('Token không hợp lệ');
        setLoading(false);
        return;
      }

      // Connect to Enhanced WebSocket
      await EnhancedSocketServiceInstance.connect(token);
      
      // Set up enhanced event listeners
      setupEnhancedSocketListeners();
      
      // Load rooms and waiting customers
      await loadAgentRooms();
      await loadWaitingCustomers();
      
      setLoading(false);
    } catch (error) {
      console.error('Error initializing agent chat:', error);
      setError('Không thể kết nối đến server chat');
      setLoading(false);
    }
  };

  const setupEnhancedSocketListeners = () => {
    // Listen for new messages
    const _unsubscribeMessage = EnhancedSocketServiceInstance.onMessage((message: Message) => {
      console.log('📨 Agent received enhanced message:', message);
      
      if (selectedRoom && message.roomId === selectedRoom.id.toString()) {
        setMessages(prev => {
          const exists = prev.some(msg => msg.id === message.id);
          if (exists) {
            console.log('📨 Message already exists, skipping');
            return prev;
          }
          
          console.log('📨 Adding new enhanced message to agent chat');
          return [...prev, {
            ...message,
            isUser: message.senderId === user.id
          }];
        });
      }
      
      // Update room's last message
      setRooms(prev => prev.map(room => 
        room.id.toString() === message.roomId 
          ? { 
              ...room, 
              lastMessage: message.content,
              lastMessageTime: message.timestamp,
              unreadCount: message.senderId !== user.id ? room.unreadCount + 1 : room.unreadCount
            }
          : room
      ));
    });
    void _unsubscribeMessage;

    // Listen for typing indicators
    const _unsubscribeTyping = EnhancedSocketServiceInstance.onTypingStatus((status) => {
      console.log('⌨️ Enhanced typing indicator:', status);
      setTypingUsers(prev => {
        const filtered = prev.filter(u => u.userId !== status.userId);
        if (status.isTyping) {
          return [...filtered, status];
        }
        return filtered;
      });
    });
    void _unsubscribeTyping;

    // Listen for online status
    const _unsubscribeOnline = EnhancedSocketServiceInstance.onOnlineStatus((status) => {
      console.log('🟢 Online status:', status);
      // Convert from { roomId, users } to { userId, isOnline } format
      if (status.users && Array.isArray(status.users)) {
        const userStatuses = status.users.map(user => ({
          userId: user.userId,
          isOnline: user.isOnline
        }));
        setOnlineUsers(prev => {
          const filtered = prev.filter(u => !userStatuses.some(us => us.userId === u.userId));
          return [...filtered, ...userStatuses];
        });
      }
    });
    void _unsubscribeOnline;

    // Listen for file upload progress
    const _unsubscribeUpload = EnhancedSocketServiceInstance.onUploadProgress((progress) => {
      console.log('📁 Upload progress:', progress);
      setUploadProgress(prev => {
        const filtered = prev.filter(p => p.fileId !== progress.fileId);
        return [...filtered, progress];
      });
    });
    void _unsubscribeUpload;

    // Listen for connection events
    const _unsubscribeConnect = EnhancedSocketServiceInstance.onConnect(() => {
      console.log('✅ Enhanced socket connected');
    });
    void _unsubscribeConnect;

    const _unsubscribeDisconnect = EnhancedSocketServiceInstance.onDisconnect(() => {
      console.log('❌ Enhanced socket disconnected');
    });
    void _unsubscribeDisconnect;

    // Listen for errors
    const _unsubscribeError = EnhancedSocketServiceInstance.onError((error) => {
      console.error('❌ Enhanced socket error:', error);
      setError('Kết nối socket bị lỗi');
    });
    void _unsubscribeError;

    // Return cleanup function
    return () => {
      // Cleanup will be handled by socket disconnect
      console.log('🧹 Cleaning up enhanced socket listeners');
    };
  };

  const loadAgentRooms = async () => {
    try {
      const token = AuthChatService.getToken();
      if (!token) return;

      const response = await fetch('/api/chat/agent/rooms', {
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
      console.log('📋 Agent rooms loaded:', data);
      
      if (data.success && data.rooms) {
        setRooms(data.rooms);
      }
    } catch (error) {
      console.error('❌ Error loading agent rooms:', error);
    }
  };

  const loadWaitingCustomers = async () => {
    try {
      const token = AuthChatService.getToken();
      if (!token) return;

      const response = await fetch('/api/chat/customers/waiting', {
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
      console.log('👥 Waiting customers loaded:', data);
      
      if (data.success && data.customers) {
        setWaitingCustomers(data.customers);
      }
    } catch (error) {
      console.error('❌ Error loading waiting customers:', error);
    }
  };

  const loadMessages = async (roomId: string) => {
    try {
      const token = AuthChatService.getToken();
      if (!token) return;

      const response = await fetch(`/api/chat/${roomId}/messages`, {
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
      console.log('📨 Messages loaded:', data);
      
      if (data.success && data.messages) {
        const messages: Message[] = data.messages.map((msg: any) => ({
          id: msg.MessageID?.toString() || msg.id?.toString() || Date.now().toString(),
          content: msg.Content || msg.content || 'No content',
          senderId: msg.SenderID?.toString() || msg.senderId?.toString() || '1',
          senderName: msg.senderName || 'Unknown',
          senderRole: msg.senderType || 'Customer',
          roomId: msg.RoomID?.toString() || msg.roomId?.toString() || roomId,
          timestamp: msg.CreatedAt || msg.createdAt || msg.timestamp || new Date().toISOString(),
          type: 'text' as const,
          isUser: msg.SenderID?.toString() === user.id
        }));
        
        setMessages(messages);
      }
    } catch (error) {
      console.error('❌ Error loading messages:', error);
      setMessages([]);
    }
  };

  const joinRoom = (roomId: string) => {
    EnhancedSocketServiceInstance.joinRoom(roomId);
    console.log('🚪 Agent joined enhanced room:', roomId);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedRoom) return;

    const messageContent = newMessage.trim();
    setNewMessage('');

    try {
      if (EnhancedSocketServiceInstance.isConnected()) {
        EnhancedSocketServiceInstance.sendMessage(selectedRoom.id.toString(), messageContent, 'text');
      } else {
        // Fallback: Send via API
        await sendMessageViaAPI(selectedRoom.id.toString(), messageContent);
      }
      
      scrollToBottom();
    } catch (error) {
      console.error('❌ Error sending message:', error);
      setNewMessage(messageContent); // Restore message if failed
    }
  };

  const sendMessageViaAPI = async (roomId: string, content: string) => {
    const token = AuthChatService.getToken();
    if (!token) throw new Error('No token available');

    const response = await fetch('/api/chat/send', {
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

    return await response.json();
  };

  const createRoomWithCustomer = async (customer: WaitingCustomer) => {
    try {
      const token = AuthChatService.getToken();
      if (!token) return;

      const response = await fetch('/api/chat/rooms/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: customer.id,
          agentId: user.id,
          roomName: `Chat with ${customer.name}`
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Reload rooms and waiting customers
        await loadAgentRooms();
        await loadWaitingCustomers();
        
        // Select the new room
        const newRoom = rooms.find(room => room.id === data.roomId);
        if (newRoom) {
          setSelectedRoom(newRoom);
        }
      }
    } catch (error) {
      console.error('❌ Error creating room:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Vừa xong';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} phút trước`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} giờ trước`;
    
    return date.toLocaleDateString('vi-VN');
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        Đang tải...
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
        fontSize: '18px',
        color: 'red'
      }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      height: '100vh', 
      backgroundColor: '#f5f5f5',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Agent Header Banner */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '40px',
        backgroundColor: '#1976d2',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px',
        fontWeight: 'bold',
        zIndex: 1000,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        👨‍💼 AGENT DASHBOARD - Customer messages on LEFT, Agent messages on RIGHT
      </div>
      {/* Left Sidebar - Chat List */}
      <div style={{ 
        width: '350px', 
        backgroundColor: 'white', 
        borderRight: '1px solid #e0e0e0',
        display: 'flex',
        flexDirection: 'column',
        marginTop: '40px' // Add margin for header
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
            Agent: {user?.name || user?.email}
          </p>
        </div>

        {/* Search Bar */}
        <div style={{ padding: '15px', borderBottom: '1px solid #e0e0e0' }}>
          <input
            type="text"
            placeholder="Tìm kiếm cuộc trò chuyện..."
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '20px',
              fontSize: '14px',
              outline: 'none'
            }}
          />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e0e0e0' }}>
          <button
            onClick={() => setActiveTab('rooms')}
            style={{
              flex: 1,
              padding: '15px',
              border: 'none',
              backgroundColor: activeTab === 'rooms' ? '#4CAF50' : 'white',
              color: activeTab === 'rooms' ? 'white' : '#666',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            Cuộc trò chuyện ({rooms.length})
          </button>
          <button
            onClick={() => setActiveTab('waiting')}
            style={{
              flex: 1,
              padding: '15px',
              border: 'none',
              backgroundColor: activeTab === 'waiting' ? '#4CAF50' : 'white',
              color: activeTab === 'waiting' ? 'white' : '#666',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            Chờ hỗ trợ ({waitingCustomers.length})
          </button>
        </div>

        {/* Chat List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {activeTab === 'rooms' ? (
            rooms.map((room) => (
              <div
                key={room.id}
                onClick={() => setSelectedRoom(room)}
                style={{
                  padding: '15px',
                  borderBottom: '1px solid #f0f0f0',
                  cursor: 'pointer',
                  backgroundColor: selectedRoom?.id === room.id ? '#e8f5e8' : 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <div style={{ position: 'relative' }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    backgroundColor: '#4CAF50',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    color: 'white'
                  }}>
                    {room.customerAvatar}
                  </div>
                  {room.isCustomerOnline && (
                    <div style={{
                      position: 'absolute',
                      bottom: '2px',
                      right: '2px',
                      width: '12px',
                      height: '12px',
                      backgroundColor: '#4CAF50',
                      borderRadius: '50%',
                      border: '2px solid white'
                    }} />
                  )}
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '4px'
                  }}>
                    <h4 style={{ 
                      margin: 0, 
                      fontSize: '16px', 
                      fontWeight: 'bold',
                      color: '#333',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {room.customerName}
                    </h4>
                    <span style={{ 
                      fontSize: '12px', 
                      color: '#999',
                      whiteSpace: 'nowrap'
                    }}>
                      {formatTime(room.lastMessageTime)}
                    </span>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center'
                  }}>
                    <p style={{ 
                      margin: 0, 
                      fontSize: '14px', 
                      color: '#666',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      flex: 1
                    }}>
                      {room.lastMessage}
                    </p>
                    {room.unreadCount > 0 && (
                      <span style={{
                        backgroundColor: '#f44336',
                        color: 'white',
                        borderRadius: '10px',
                        padding: '2px 6px',
                        fontSize: '12px',
                        minWidth: '18px',
                        textAlign: 'center'
                      }}>
                        {room.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            waitingCustomers.map((customer) => (
              <div
                key={customer.id}
                onClick={() => createRoomWithCustomer(customer)}
                style={{
                  padding: '15px',
                  borderBottom: '1px solid #f0f0f0',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  backgroundColor: 'white'
                }}
              >
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  backgroundColor: '#ff9800',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  color: 'white'
                }}>
                  {customer.avatar}
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '4px'
                  }}>
                    <h4 style={{ 
                      margin: 0, 
                      fontSize: '16px', 
                      fontWeight: 'bold',
                      color: '#333',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {customer.name}
                    </h4>
                    <span style={{ 
                      fontSize: '12px', 
                      color: '#999',
                      whiteSpace: 'nowrap'
                    }}>
                      {formatTime(customer.lastMessageTime)}
                    </span>
                  </div>
                  
                  <p style={{ 
                    margin: 0, 
                    fontSize: '14px', 
                    color: '#666',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {customer.lastMessage}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Side - Chat Area */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        backgroundColor: 'white',
        marginTop: '40px' // Add margin for header
      }}>
        {selectedRoom ? (
          <>
            {/* Chat Header */}
            <div style={{ 
              padding: '20px', 
              borderBottom: '1px solid #e0e0e0',
              backgroundColor: '#f8f8f8',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#4CAF50',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                color: 'white'
              }}>
                {selectedRoom.customerAvatar}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#333' }}>
                  {selectedRoom.customerName}
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '14px', color: '#666' }}>
                  {selectedRoom.isCustomerOnline ? 'Đang hoạt động' : 'Không hoạt động'}
                </p>
              </div>
            </div>

            {/* Messages Area */}
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
                    justifyContent: message.senderRole === 'Customer' ? 'flex-start' : 'flex-end',
                    marginBottom: '15px'
                  }}
                >
                  <div style={{
                    maxWidth: '70%',
                    padding: '12px 16px',
                    borderRadius: '18px',
                    backgroundColor: message.senderRole === 'Customer' ? '#e3f2fd' : '#4caf50',
                    color: message.senderRole === 'Customer' ? '#1976d2' : 'white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    wordWrap: 'break-word',
                    border: message.senderRole === 'Customer' ? '2px solid #2196f3' : '2px solid #388e3c',
                    position: 'relative'
                  }}>
                    {/* Enhanced Message content */}
                    {message.type === 'file' && message.fileUrl ? (
                      <div>
                        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                          📎 {message.fileName || 'File'}
                        </div>
                        <a 
                          href={message.fileUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ 
                            color: 'inherit', 
                            textDecoration: 'underline',
                            fontSize: '12px'
                          }}
                        >
                          Tải xuống file
                        </a>
                      </div>
                    ) : (
                      <div>{message.content}</div>
                    )}
                    
                    {/* Read receipts */}
                    {message.readBy && message.readBy.length > 0 && (
                      <div style={{
                        fontSize: '10px',
                        opacity: 0.7,
                        marginTop: '5px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px'
                      }}>
                        ✓ Đã đọc ({message.readBy.length})
                      </div>
                    )}
                    
                    {/* Timestamp */}
                    <p style={{ 
                      margin: '4px 0 0 0', 
                      fontSize: '11px', 
                      opacity: 0.7,
                      textAlign: 'right'
                    }}>
                      {formatTime(message.timestamp)}
                    </p>
                    
                    {/* Sender info */}
                    <div style={{
                      marginTop: '4px',
                      fontSize: '10px',
                      color: message.senderRole === 'Customer' ? 'rgba(25,118,210,0.8)' : 'rgba(255,255,255,0.8)',
                      fontWeight: '500'
                    }}>
                      {message.senderRole === 'Customer' ? '👤 Khách hàng' : '👨‍💼 Agent'}
                    </div>
                    
                    {/* Debug info */}
                    <div style={{
                      marginTop: '2px',
                      fontSize: '8px',
                      color: message.senderRole === 'Customer' ? 'rgba(25,118,210,0.6)' : 'rgba(255,255,255,0.6)',
                      fontStyle: 'italic'
                    }}>
                      {/* Debug info removed for production */}
                      Agent View - {message.senderRole === 'Customer' ? 'Customer' : 'Agent'} message
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div style={{ 
              padding: '20px', 
              borderTop: '1px solid #e0e0e0',
              backgroundColor: 'white'
            }}>
              {/* Enhanced Chat Input */}
              <div style={{ marginBottom: '10px' }}>
                {/* Typing Indicators */}
                {typingUsers.length > 0 && (
                  <div style={{ 
                    padding: '8px 16px', 
                    fontSize: '12px', 
                    color: '#666',
                    fontStyle: 'italic'
                  }}>
                    {typingUsers.map(user => user.userName).join(', ')} đang nhập...
                  </div>
                )}
                
                {/* Online Status */}
                {onlineUsers.length > 0 && (
                  <div style={{ 
                    padding: '4px 16px', 
                    fontSize: '12px', 
                    color: '#4CAF50',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}>
                    <span style={{ 
                      width: '8px', 
                      height: '8px', 
                      backgroundColor: '#4CAF50', 
                      borderRadius: '50%',
                      display: 'inline-block'
                    }}></span>
                    {onlineUsers.length} người đang online
                  </div>
                )}
              </div>

              {/* Upload Progress */}
              {uploadProgress.length > 0 && (
                <div style={{ marginBottom: '10px' }}>
                  {uploadProgress.map((progress) => (
                    <div key={progress.fileId} style={{
                      padding: '8px 16px',
                      backgroundColor: '#f0f0f0',
                      borderRadius: '8px',
                      marginBottom: '5px',
                      fontSize: '12px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>📁 Đang tải lên...</span>
                        <span>{progress.progress}%</span>
                      </div>
                      <div style={{
                        width: '100%',
                        height: '4px',
                        backgroundColor: '#e0e0e0',
                        borderRadius: '2px',
                        marginTop: '4px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${progress.progress}%`,
                          height: '100%',
                          backgroundColor: progress.status === 'completed' ? '#4CAF50' : '#2196F3',
                          transition: 'width 0.3s ease'
                        }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {/* File Upload Button */}
                <input
                  type="file"
                  id="file-upload"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileUpload(file);
                    }
                  }}
                  accept="image/*,.pdf,.doc,.docx,.txt,.zip,.rar"
                />
                <label
                  htmlFor="file-upload"
                  style={{
                    padding: '12px',
                    backgroundColor: '#2196F3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    fontSize: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '44px',
                    height: '44px'
                  }}
                  title="Gửi file"
                >
                  📎
                </label>

                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    // Send typing status
                    if (selectedRoom && !isTyping) {
                      setIsTyping(true);
                      EnhancedSocketServiceInstance.sendTypingStatus(selectedRoom.id.toString(), true);
                      setTimeout(() => {
                        setIsTyping(false);
                        EnhancedSocketServiceInstance.sendTypingStatus(selectedRoom.id.toString(), false);
                      }, 1000);
                    }
                  }}
                  placeholder="Nhập tin nhắn..."
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    border: '1px solid #ddd',
                    borderRadius: '25px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  style={{
                    padding: '12px 20px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '25px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    opacity: newMessage.trim() ? 1 : 0.5
                  }}
                >
                  Gửi
                </button>
              </form>
            </div>
          </>
        ) : (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100%',
            fontSize: '18px',
            color: '#666'
          }}>
            {activeTab === 'rooms' 
              ? 'Chọn một cuộc trò chuyện để bắt đầu'
              : 'Chọn một khách hàng để bắt đầu hỗ trợ'
            }
          </div>
        )}
      </div>
      
      {/* Performance Dashboard */}
      {/* Performance Dashboard temporarily disabled */}
    </div>
  );
};

export default AgentChatPageNew;
