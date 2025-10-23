import React, { useState, useEffect } from 'react';
import AuthChatService from '../services/AuthChatService';
import chatSocketManager from '../services/ChatSocketManager';

interface ChatRoom {
  id: number;
  roomName: string;
  customerName: string;
  customerEmail: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isActive: boolean;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  timestamp: string;
  isUser: boolean;
}

const AgentSupportChat: React.FC = () => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  useEffect(() => {
    initializeChat();
  }, []);

  // Setup socket connection and real-time message handling
  useEffect(() => {
    const handleReceiveMessage = (message: any) => {
      console.log('📨 Agent received real-time message:', message);
      
      if (selectedRoom && message.roomId === selectedRoom.id) {
        const newMessage: Message = {
          id: message.id,
          content: message.content,
          senderId: message.senderId,
          senderName: message.senderName || 'Unknown',
          timestamp: message.timestamp || new Date().toISOString(),
          isUser: message.senderId === user?.id?.toString()
        };
        
        setMessages(prev => [...prev, newMessage]);
        console.log('📨 Added message to UI:', newMessage);
      }
    };

    // Connect to socket
    const connectSocket = async () => {
      try {
        const token = sessionStorage.getItem('accessToken');
        if (token) {
          console.log('🔌 Connecting to socket...');
          await chatSocketManager.connect();
          console.log('✅ Socket connected');
        }
      } catch (error) {
        console.error('❌ Socket connection failed:', error);
      }
    };

    connectSocket();

    // Listen for real-time messages
    chatSocketManager.on('message:new', handleReceiveMessage);

    return () => {
      chatSocketManager.off('message:new', handleReceiveMessage);
    };
  }, [selectedRoom, user]);

  // Auto-reload messages every 10 seconds (reduced frequency since we have real-time)
  useEffect(() => {
    if (!selectedRoom) return;

    const interval = setInterval(() => {
      console.log('🔄 Auto-reloading messages...');
      loadMessages(selectedRoom.id);
    }, 10000);

    return () => clearInterval(interval);
  }, [selectedRoom]);

  const initializeChat = async () => {
    try {
      setLoading(true);
      console.log('🚀 Initializing Agent Support Chat...');

      // Auto-login as agent
      let currentUser = AuthChatService.getCurrentUser();
      if (!currentUser || currentUser.role !== 'Agent') {
        console.log('🔍 No agent user, attempting auto-login...');
        
        const loginResponse = await fetch('http://localhost:4000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'agent@muji.com', password: '123456' })
        });

        if (!loginResponse.ok) {
          throw new Error('Login failed');
        }

        const loginData = await loginResponse.json();
        if (loginData.success) {
          sessionStorage.setItem('accessToken', loginData.tokens.accessToken);
          sessionStorage.setItem('refreshToken', loginData.tokens.refreshToken);
          sessionStorage.setItem('currentUser', JSON.stringify(loginData.user));
          currentUser = loginData.user;
          console.log('✅ Auto-login successful');
        } else {
          throw new Error('Auto-login failed');
        }
      }

      setUser(currentUser);
      await loadChatRooms();
      setLoading(false);
    } catch (error) {
      console.error('❌ Error initializing chat:', error);
      setError('Không thể khởi tạo chat');
      setLoading(false);
    }
  };

  const loadChatRooms = async () => {
    try {
      console.log('🔍 Loading chat rooms...');
      
      // Get token directly from sessionStorage
      let token = sessionStorage.getItem('accessToken');
      console.log('🔍 Token from sessionStorage:', token ? 'Present' : 'Missing');
      
      if (!token) {
        console.error('❌ No token available in sessionStorage');
        setError('Không có token xác thực');
        return;
      }

      const response = await fetch('http://localhost:4000/api/agent/chat-rooms', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📋 Chat rooms response:', data);
      
      if (data.success && data.chatRooms) {
        const transformedRooms = data.chatRooms.map((room: any) => ({
          id: room.roomId,
          roomName: room.roomName,
          customerName: room.customerName,
          customerEmail: room.customerEmail,
          lastMessage: room.lastMessage || '',
          lastMessageTime: room.lastMessageAt || room.createdAt,
          unreadCount: room.unreadCount || 0,
          isActive: room.isActive
        }));
        
        setRooms(transformedRooms);
        console.log('✅ Chat rooms loaded:', transformedRooms.length);
      }
    } catch (error) {
      console.error('❌ Error loading chat rooms:', error);
      setError('Không thể tải danh sách phòng chat');
    }
  };

  const loadMessages = async (roomId: number) => {
    try {
      console.log('🔍 Loading messages for room:', roomId);
      
      // Get token directly from sessionStorage
      const token = sessionStorage.getItem('accessToken');
      if (!token) {
        console.error('❌ No token available for messages');
        return;
      }

      const response = await fetch(`http://localhost:4000/api/chat/messages/${roomId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📨 Messages response:', data);
      
      if (data.success && data.messages) {
        const transformedMessages = data.messages.map((msg: any) => ({
          id: msg.id?.toString() || Date.now().toString(),
          content: msg.content || 'No content',
          senderId: msg.senderId?.toString() || '1',
          senderName: msg.senderName || 'Unknown',
          timestamp: msg.timestamp || new Date().toISOString(),
          isUser: msg.senderId?.toString() === user?.id?.toString()
        }));
        
        setMessages(transformedMessages);
        console.log('✅ Messages loaded:', transformedMessages.length);
      }
    } catch (error) {
      console.error('❌ Error loading messages:', error);
      setMessages([]);
    }
  };

  const handleRoomSelect = (room: ChatRoom) => {
    setSelectedRoom(room);
    loadMessages(room.id);
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && selectedFiles.length === 0) || !selectedRoom) return;

    try {
      console.log('📤 Sending message:', newMessage, 'Files:', selectedFiles.length);
      
      // Get token
      const token = sessionStorage.getItem('accessToken');
      if (!token) {
        console.error('❌ No token available for sending message');
        return;
      }

      // Send files first if any
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('roomId', selectedRoom.id.toString());
          formData.append('senderId', user?.id?.toString() || '1');
          formData.append('senderName', user?.name || 'Agent');
          
          try {
            const response = await fetch('http://localhost:4000/api/chat/upload', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`
              },
              body: formData
            });
            
            if (response.ok) {
              const result = await response.json();
              console.log('📎 File uploaded:', result);
            }
          } catch (error) {
            console.error('❌ File upload error:', error);
          }
        }
      }

      // Send text message if any
      if (newMessage.trim()) {
        const response = await fetch(`http://localhost:4000/api/chat/send`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            chatId: selectedRoom.id,
            content: newMessage,
            type: 'text'
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('📤 Message sent successfully:', data);
      }
      
      // Add message to local state immediately for real-time feel
      const newMessageObj: Message = {
        id: Date.now().toString(),
        content: newMessage || `📎 Đã gửi ${selectedFiles.length} file(s)`,
        senderId: user?.id?.toString() || '1',
        senderName: user?.name || 'Agent',
        timestamp: new Date().toISOString(),
        isUser: true
      };
      
      setMessages(prev => [...prev, newMessageObj]);
      setNewMessage('');
      setSelectedFiles([]); // Clear selected files
      
      // Emit socket event for real-time broadcast
      try {
        chatSocketManager.emit('send_message', {
          roomId: selectedRoom.id,
          content: newMessage || `📎 Đã gửi ${selectedFiles.length} file(s)`,
          senderId: user?.id?.toString() || '1',
          senderName: user?.name || 'Agent',
          timestamp: new Date().toISOString()
        });
        console.log('📤 Socket message emitted');
      } catch (error) {
        console.error('❌ Socket emit failed:', error);
      }
      
      // Reload messages to get the latest from server
      setTimeout(() => {
        loadMessages(selectedRoom.id);
      }, 500);
      
    } catch (error) {
      console.error('❌ Error sending message:', error);
      setError('Không thể gửi tin nhắn');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const fileArray = Array.from(files);
      setSelectedFiles(prev => [...prev, ...fileArray]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const addEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const emojis = ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾'];

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#666'
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
        color: '#d32f2f'
      }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Sidebar */}
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
          backgroundColor: '#4CAF50',
          color: 'white'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px' }}>MUJI Support</h2>
              <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>Agent: {user?.name || 'Nhân viên hỗ trợ'}</p>
            </div>
            
            {/* Exit Button */}
            <button
              onClick={() => {
                window.history.pushState({}, '', '/');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '6px',
                color: 'white',
                padding: '6px 12px',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
            >
              🏠 Thoát
            </button>
          </div>
        </div>

        {/* Search */}
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

        {/* Rooms List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {rooms.length === 0 ? (
            <div style={{
              padding: '20px',
              textAlign: 'center',
              color: '#666'
            }}>
              Không có cuộc trò chuyện nào
            </div>
          ) : (
            rooms.map((room) => (
              <div
                key={room.id}
                onClick={() => handleRoomSelect(room)}
                style={{
                  padding: '15px',
                  borderBottom: '1px solid #f0f0f0',
                  cursor: 'pointer',
                  backgroundColor: selectedRoom?.id === room.id ? '#e8f5e8' : 'white',
                  transition: 'background-color 0.2s'
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                  {room.roomName}
                </div>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                  {room.customerName}
                </div>
                <div style={{ fontSize: '12px', color: '#999' }}>
                  {room.lastMessage || 'Chưa có tin nhắn'}
                </div>
                {room.unreadCount > 0 && (
                  <div style={{
                    position: 'absolute',
                    right: '10px',
                    top: '10px',
                    backgroundColor: '#f44336',
                    color: 'white',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px'
                  }}>
                    {room.unreadCount}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedRoom ? (
          <>
            {/* Chat Header */}
            <div style={{
              padding: '20px',
              backgroundColor: 'white',
              borderBottom: '1px solid #e0e0e0',
              display: 'flex',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px' }}>{selectedRoom.roomName}</h3>
                <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#666' }}>
                  {selectedRoom.customerName} • {selectedRoom.customerEmail}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1,
              padding: '20px',
              overflowY: 'auto',
              backgroundColor: '#f9f9f9'
            }}>
              {messages.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  color: '#666',
                  marginTop: '50px'
                }}>
                  Chưa có tin nhắn nào
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    style={{
                      marginBottom: '15px',
                      display: 'flex',
                      justifyContent: message.isUser ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <div style={{
                      maxWidth: '70%',
                      padding: '10px 15px',
                      borderRadius: '18px',
                      backgroundColor: message.isUser ? '#4CAF50' : 'white',
                      color: message.isUser ? 'white' : '#333',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }}>
                      <div style={{ marginBottom: '5px' }}>
                        {/* Check if message contains file URL */}
                        {message.content && message.content.startsWith('/uploads/chat-files/') ? (
                          <div>
                            {message.content.endsWith('.jpg') || message.content.endsWith('.jpeg') || 
                             message.content.endsWith('.png') || message.content.endsWith('.gif') || 
                             message.content.endsWith('.webp') ? (
                              <div>
                                <img 
                                  src={`http://localhost:4000${message.content}`}
                                  alt="Uploaded image"
                                  style={{
                                    maxWidth: '300px',
                                    maxHeight: '300px',
                                    borderRadius: '8px',
                                    cursor: 'pointer'
                                  }}
                                  onClick={() => window.open(`http://localhost:4000${message.content}`, '_blank')}
                                />
                                <div style={{ marginTop: '8px', fontSize: '14px', color: message.isUser ? 'rgba(255,255,255,0.8)' : '#666' }}>
                                  📷 Hình ảnh
                                </div>
                              </div>
                            ) : message.content.endsWith('.mp4') || message.content.endsWith('.webm') || 
                                  message.content.endsWith('.mov') || message.content.endsWith('.avi') ? (
                              <div>
                                <video 
                                  src={`http://localhost:4000${message.content}`}
                                  controls
                                  style={{
                                    maxWidth: '300px',
                                    maxHeight: '300px',
                                    borderRadius: '8px'
                                  }}
                                />
                                <div style={{ marginTop: '8px', fontSize: '14px', color: message.isUser ? 'rgba(255,255,255,0.8)' : '#666' }}>
                                  🎥 Video
                                </div>
                              </div>
                            ) : (
                              <div>
                                <a 
                                  href={`http://localhost:4000${message.content}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    color: message.isUser ? 'rgba(255,255,255,0.9)' : '#667eea',
                                    textDecoration: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                  }}
                                >
                                  📎 {message.content.split('/').pop()}
                                </a>
                              </div>
                            )}
                          </div>
                        ) : (
                          message.content
                        )}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        opacity: 0.7
                      }}>
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Message Input */}
            <div style={{
              padding: '20px',
              backgroundColor: 'white',
              borderTop: '1px solid #e0e0e0'
            }}>
              {/* File Preview */}
              {selectedFiles.length > 0 && (
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  marginBottom: '10px',
                  padding: '10px',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  border: '1px solid #e9ecef'
                }}>
                  {selectedFiles.map((file, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: 'white',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '14px',
                      color: '#666',
                      border: '1px solid #ddd',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                      maxWidth: '200px'
                    }}>
                      {file.type.startsWith('image/') ? (
                        <img 
                          src={URL.createObjectURL(file)} 
                          alt="Preview" 
                          style={{
                            width: '30px',
                            height: '30px',
                            objectFit: 'cover',
                            borderRadius: '4px'
                          }}
                        />
                      ) : file.type.startsWith('video/') ? (
                        <video 
                          src={URL.createObjectURL(file)} 
                          style={{
                            width: '30px',
                            height: '30px',
                            objectFit: 'cover',
                            borderRadius: '4px'
                          }}
                        />
                      ) : (
                        <span>📎</span>
                      )}
                      <span style={{ 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap',
                        maxWidth: '120px'
                      }}>
                        {file.name}
                      </span>
                      <button
                        onClick={() => removeFile(index)}
                        style={{
                          background: '#ff4757',
                          border: 'none',
                          borderRadius: '50%',
                          color: 'white',
                          cursor: 'pointer',
                          padding: '2px 6px',
                          fontSize: '12px',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = '#ff3742';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = '#ff4757';
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Emoji Picker */}
              {showEmojiPicker && (
                <div style={{
                  position: 'absolute',
                  bottom: '70px',
                  right: '20px',
                  background: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '12px',
                  padding: '15px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                  zIndex: 1000,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(8, 1fr)',
                  gap: '5px'
                }}>
                  {emojis.map((emoji, index) => (
                    <button
                      key={index}
                      onClick={() => addEmoji(emoji)}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '20px',
                        cursor: 'pointer',
                        padding: '5px',
                        borderRadius: '4px',
                        transition: 'background 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = '#f0f0f0';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'none';
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Nhập tin nhắn..."
                  style={{
                    flex: 1,
                    padding: '10px 15px',
                    border: '1px solid #ddd',
                    borderRadius: '20px',
                    outline: 'none',
                    fontSize: '14px'
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                
                {/* File Upload Button */}
                <label style={{
                  padding: '10px',
                  background: '#f8f9fa',
                  border: '1px solid #ddd',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  transition: 'all 0.2s ease'
                }}>
                  📷
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                </label>

                {/* Emoji Button */}
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  style={{
                    padding: '10px',
                    background: '#f8f9fa',
                    border: '1px solid #ddd',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    fontSize: '16px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  😊
                </button>

                <button
                  onClick={handleSendMessage}
                  disabled={(!newMessage.trim() && selectedFiles.length === 0)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    opacity: (!newMessage.trim() && selectedFiles.length === 0) ? 0.5 : 1
                  }}
                >
                  Gửi
                </button>
              </div>
            </div>
          </>
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            fontSize: '18px',
            color: '#666'
          }}>
            Chọn một cuộc trò chuyện để bắt đầu
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentSupportChat;
