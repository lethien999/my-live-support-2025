import React, { useState, useEffect, useRef } from 'react';
import AuthChatService from '../services/AuthChatService';
import ConversationService, { Conversation, Message } from '../services/ConversationService';
import chatSocketManager from '../services/ChatSocketManager';
import { formatTime } from '../utils/dateUtils';

const CustomerChatPage: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeChat();
    
    // Listen for real-time messages
    const handleReceiveMessage = (message: any) => {
      // console.log('📨 Customer received message:', message);
      if (selectedConversation && message.roomId === selectedConversation.id) {
        const newMessage: Message = {
          id: message.id,
          conversationId: message.roomId,
          senderId: message.senderId,
          senderType: message.sender.role === 'Agent' ? 'Agent' : 'Customer',
          content: message.content,
          timestamp: message.createdAt,
          isRead: false
        };
        setMessages(prev => [...prev, newMessage]);
      }
      
      // Update conversation list to show new message count
      setConversations(prev => prev.map(conv => 
        conv.id === message.roomId 
          ? { ...conv, lastMessage: message.content, lastMessageAt: message.createdAt }
          : conv
      ));
    };
    
    chatSocketManager.on('message:new', handleReceiveMessage);
    
    return () => {
      chatSocketManager.off('message:new', handleReceiveMessage);
      chatSocketManager.disconnect();
    };
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
      joinRoom(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeChat = async () => {
    try {
      setLoading(true);
      const user = await AuthChatService.getCurrentUser();
      if (!user) throw new Error('Không thể xác thực người dùng');
      
      setCurrentUserId(user.id.toString());
      await chatSocketManager.connect();
      await loadConversations();
      setLoading(false);
    } catch (error) {
      console.error('Error initializing chat:', error);
      setError('Không thể khởi tạo chat');
      setLoading(false);
    }
  };

  const loadConversations = async () => {
    try {
      // console.log('🔄 Loading conversations...');
      const fetchedConversations = await ConversationService.getCustomerConversations();
      // console.log('📋 Fetched conversations:', fetchedConversations);
      setConversations(fetchedConversations);
      
      const urlParams = new URLSearchParams(window.location.search);
      const cId = urlParams.get('c');
      // console.log('🔍 URL conversation ID:', cId);
      
      if (cId) {
        const conversation = fetchedConversations.find(c => c.id === cId);
        // console.log('🎯 Found conversation by URL:', conversation);
        if (conversation) setSelectedConversation(conversation);
      } else if (fetchedConversations.length > 0) {
        // console.log('🎯 Setting first conversation:', fetchedConversations[0]);
        setSelectedConversation(fetchedConversations[0]);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      setError('Không thể tải danh sách cuộc trò chuyện');
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const messagesData = await ConversationService.getMessages(conversationId);
      setMessages(messagesData);
    } catch (error) {
      console.error('Error loading messages:', error);
      setError('Không thể tải tin nhắn');
    }
  };

  const joinRoom = async (conversationId: string) => {
    try {
      await chatSocketManager.joinConversation(conversationId);
    } catch (error) {
      console.error('Error joining room:', error);
    }
  };

  const sendMessage = async (content: string) => {
    if (!selectedConversation || !content.trim() || sending) return;

    console.log('🔍 Debug sendMessage:', {
      selectedConversation: selectedConversation,
      conversationId: selectedConversation?.id,
      content: content,
      sending: sending
    });

    try {
      setSending(true);
      console.log('🔄 Sending message:', { conversationId: selectedConversation.id, content });
      await ConversationService.sendMessage({
        conversationId: selectedConversation.id,
        content: content,
        clientTempId: `temp_${Date.now()}`
      });
      
      const newMsg: Message = {
        id: `temp_${Date.now()}`,
        conversationId: selectedConversation.id,
        senderId: currentUserId,
        senderType: 'Customer',
        content: content,
        timestamp: new Date().toISOString(),
        isRead: false
      };
      
      setMessages(prev => [...prev, newMsg]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Không thể gửi tin nhắn');
    } finally {
      setSending(false);
    }
  };

  const selectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    const url = new URL(window.location.href);
    url.searchParams.set('c', conversation.id);
    window.history.pushState({}, '', url.toString());
  };

  const filteredConversations = conversations.filter(conv =>
    conv.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.lastMessage?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Inline styles để đảm bảo hoạt động
  const containerStyle: React.CSSProperties = {
    height: '100vh',
    width: '100vw',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  };

  const sidebarStyle: React.CSSProperties = {
    width: '400px',
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderRight: '1px solid rgba(0, 0, 0, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 0 30px rgba(0, 0, 0, 0.1)'
  };

  const headerStyle: React.CSSProperties = {
    padding: '24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
  };

  const chatAreaStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    background: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(10px)'
  };

  const messageBubbleStyle = (isOwn: boolean): React.CSSProperties => ({
    maxWidth: '400px',
    padding: '12px 20px',
    borderRadius: isOwn ? '20px 20px 5px 20px' : '20px 20px 20px 5px',
    background: isOwn 
      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
      : '#ffffff',
    color: isOwn ? 'white' : '#333',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
    marginBottom: '8px',
    wordWrap: 'break-word'
  });

  const inputStyle: React.CSSProperties = {
    padding: '20px',
    borderTop: '1px solid rgba(0, 0, 0, 0.1)',
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)'
  };

  if (loading) {
    return (
      <div style={containerStyle}>
      <div style={{ 
        display: 'flex', 
          alignItems: 'center',
        justifyContent: 'center', 
          width: '100%',
          height: '100%',
          color: 'white',
          textAlign: 'center'
        }}>
          <div>
        <div style={{
              width: '80px',
              height: '80px',
              background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              animation: 'pulse 2s infinite'
            }}>
              <span style={{ fontSize: '40px' }}>💬</span>
            </div>
            <h2 style={{ fontSize: '24px', marginBottom: '10px' }}>Đang tải chat...</h2>
            <p style={{ fontSize: '16px', opacity: 0.8 }}>Vui lòng chờ trong giây lát</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={containerStyle}>
      <div style={{ 
        display: 'flex', 
          alignItems: 'center',
        justifyContent: 'center', 
          width: '100%',
          height: '100%',
          color: 'white',
          textAlign: 'center'
        }}>
          <div>
            <div style={{
              width: '80px',
              height: '80px',
              background: 'rgba(255, 0, 0, 0.2)',
              borderRadius: '50%',
              display: 'flex',
        alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 20px'
      }}>
              <span style={{ fontSize: '40px' }}>❌</span>
        </div>
            <h2 style={{ fontSize: '24px', marginBottom: '10px' }}>Có lỗi xảy ra</h2>
            <p style={{ fontSize: '16px', marginBottom: '20px', opacity: 0.8 }}>{error}</p>
        <button
          onClick={() => window.location.reload()}
          style={{
                background: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            border: 'none',
                padding: '12px 24px',
                borderRadius: '25px',
                fontSize: '16px',
            cursor: 'pointer',
                transition: 'all 0.3s ease'
          }}
        >
          Thử lại
        </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Left Sidebar */}
      <div style={sidebarStyle}>
        {/* Header */}
        <div style={headerStyle}>
    <div style={{ 
      display: 'flex', 
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px'
              }}>
                💬
              </div>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Tin nhắn</h1>
                <p style={{ fontSize: '14px', opacity: 0.8, margin: 0 }}>Trò chuyện với shop</p>
              </div>
            </div>
          </div>
          
          {/* Search Bar */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Tìm kiếm cuộc trò chuyện..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                paddingLeft: '40px',
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '25px',
                color: 'white',
                fontSize: '14px',
                outline: 'none'
              }}
            />
            <span style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '16px'
            }}>
              🔍
            </span>
          </div>
        </div>

        {/* Filter Options */}
        <div style={{
          padding: '16px',
          background: 'rgba(255, 255, 255, 0.5)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'none',
              border: 'none',
              color: '#666',
              fontSize: '14px',
              cursor: 'pointer',
              padding: '8px 12px',
              borderRadius: '8px',
              transition: 'all 0.2s ease'
            }}>
              <span>🔽</span>
              <span>Bộ lọc</span>
            </button>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#666',
              fontSize: '14px',
              cursor: 'pointer'
            }}>
              <input type="checkbox" style={{ margin: 0 }} />
              <span>Chỉ chưa đọc</span>
            </label>
          </div>
        </div>

        {/* Conversation List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px'
        }}>
          {filteredConversations.length === 0 ? (
            <div style={{
              padding: '24px',
              textAlign: 'center',
              color: '#666'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: '#f0f0f0',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                fontSize: '32px'
              }}>
                💬
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
                Chưa có cuộc trò chuyện
              </h3>
              <p style={{ fontSize: '14px' }}>Bắt đầu trò chuyện với shop ngay!</p>
            </div>
          ) : (
            <div>
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => selectConversation(conversation)}
                  style={{
                    padding: '16px',
                    cursor: 'pointer',
                    borderRadius: '16px',
                    marginBottom: '8px',
                    transition: 'all 0.2s ease',
                    background: selectedConversation?.id === conversation.id 
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : 'transparent',
                    color: selectedConversation?.id === conversation.id ? 'white' : '#333',
                    transform: selectedConversation?.id === conversation.id ? 'scale(1.02)' : 'scale(1)',
                    boxShadow: selectedConversation?.id === conversation.id 
                      ? '0 4px 15px rgba(102, 126, 234, 0.3)'
                      : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
      <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: selectedConversation?.id === conversation.id 
                        ? 'rgba(255, 255, 255, 0.2)'
                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
        color: 'white',
                      fontWeight: 'bold',
                      fontSize: '18px',
                      flexShrink: 0
                    }}>
                      {conversation.shopName.charAt(0)}
                    </div>
                    
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
                        marginBottom: '4px'
                      }}>
                        <h3 style={{
                          fontSize: '16px',
                          fontWeight: 'bold',
                          margin: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {conversation.shopName}
                        </h3>
                        <span style={{
                          fontSize: '12px',
                          opacity: 0.7
                        }}>
                          {formatTime(conversation.lastMessageAt || conversation.createdAt)}
                        </span>
                      </div>
                      
                      <p style={{
                        fontSize: '14px',
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        opacity: 0.8
                      }}>
                        {conversation.lastMessage || 'Chưa có tin nhắn'}
                      </p>
                      
                      {conversation.unreadCount > 0 && (
                        <div style={{ marginTop: '8px' }}>
                          <span style={{
                            fontSize: '12px',
                            fontWeight: 'bold',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            background: selectedConversation?.id === conversation.id 
                              ? 'rgba(255, 255, 255, 0.2)'
                              : '#ff4757',
                            color: 'white'
                          }}>
                            {conversation.unreadCount} tin nhắn mới
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
        </div>
          )}
        </div>
      </div>

      {/* Right Chat Area */}
      <div style={chatAreaStyle}>
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div style={{
              padding: '24px',
              borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '20px'
                  }}>
                    {selectedConversation.shopName.charAt(0)}
                  </div>
                  <div>
                    <h3 style={{
                      fontSize: '20px',
                      fontWeight: 'bold',
                      margin: 0,
                      color: '#333'
                    }}>
                      {selectedConversation.shopName}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        background: '#00d084',
                        borderRadius: '50%',
                        animation: 'pulse 2s infinite'
                      }}></div>
                      <p style={{
                        fontSize: '14px',
                        color: '#666',
                        margin: 0
                      }}>
                        Đang hoạt động
                      </p>
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button style={{
                    padding: '12px',
                    background: 'none',
                    border: 'none',
                    color: '#666',
                    cursor: 'pointer',
                    borderRadius: '50%',
                    transition: 'all 0.2s ease'
                  }}>
                    📞
                  </button>
                  <button style={{
                    padding: '12px',
                    background: 'none',
                    border: 'none',
                    color: '#666',
                    cursor: 'pointer',
                    borderRadius: '50%',
                    transition: 'all 0.2s ease'
                  }}>
                    ⋮
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div style={{
          flex: 1, 
          overflowY: 'auto',
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
              padding: '24px'
            }}>
              {messages.length === 0 ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  textAlign: 'center',
                  color: '#666'
                }}>
                  <div>
                    <div style={{
                      width: '120px',
                      height: '120px',
                      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 24px',
                      fontSize: '48px'
                    }}>
                      💬
                    </div>
                    <h3 style={{
                      fontSize: '24px',
                      fontWeight: 'bold',
                      marginBottom: '12px',
                      color: '#333'
                    }}>
                      Chưa có tin nhắn nào
                    </h3>
                    <p style={{
                      fontSize: '16px',
                      marginBottom: '24px'
                    }}>
                      Bắt đầu cuộc trò chuyện với {selectedConversation.shopName}
                    </p>
                    <div style={{
          display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
          gap: '8px'
                    }}>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        background: '#667eea',
                        borderRadius: '50%',
                        animation: 'bounce 1s infinite'
                      }}></div>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        background: '#764ba2',
                        borderRadius: '50%',
                        animation: 'bounce 1s infinite 0.1s'
                      }}></div>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        background: '#ff6b6b',
                        borderRadius: '50%',
                        animation: 'bounce 1s infinite 0.2s'
                      }}></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {messages.map((message) => {
                    const isOwn = message.senderId === currentUserId;
                    return (
                      <div key={message.id} style={{
                        display: 'flex',
                        justifyContent: isOwn ? 'flex-end' : 'flex-start'
                      }}>
                        <div style={messageBubbleStyle(isOwn)}>
                          <div style={{ fontSize: '16px', lineHeight: '1.5' }}>
                            {message.content}
                          </div>
                          <div style={{
                            fontSize: '12px',
                            marginTop: '8px',
                            opacity: 0.7
                          }}>
                            {formatTime(message.timestamp)}
                            {message.isRead && isOwn && (
                              <span style={{ marginLeft: '8px' }}>✓✓</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message Input */}
            <div style={inputStyle}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newMessage.trim()) {
                          sendMessage(newMessage);
                        }
                      }
                    }}
                    placeholder="Nhập tin nhắn..."
                    style={{
                      width: '100%',
                      padding: '16px 20px',
                      border: '1px solid #ddd',
                      borderRadius: '25px',
                      fontSize: '16px',
                      outline: 'none',
                      background: 'white',
                      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
                    }}
                    disabled={sending}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button style={{
                    padding: '12px',
                    background: 'none',
                    border: 'none',
                    color: '#666',
                    cursor: 'pointer',
                    borderRadius: '50%',
                    transition: 'all 0.2s ease'
                  }}>
                    📷
                  </button>
                  <button style={{
                    padding: '12px',
                    background: 'none',
                    border: 'none',
                    color: '#666',
                    cursor: 'pointer',
                    borderRadius: '50%',
                    transition: 'all 0.2s ease'
                  }}>
                    😊
                  </button>
                  <button
                    onClick={() => {
                      if (newMessage.trim()) {
                        sendMessage(newMessage);
                      }
                    }}
                    disabled={!newMessage.trim() || sending}
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      padding: '12px',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      opacity: (!newMessage.trim() || sending) ? 0.5 : 1,
                      transform: 'scale(1)',
                      fontSize: '20px'
                    }}
                  >
                    ➤
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
            textAlign: 'center'
          }}>
            <div style={{ maxWidth: '500px' }}>
              <div style={{
                width: '160px',
                height: '160px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 32px',
                fontSize: '64px'
              }}>
                💬
              </div>
              <h3 style={{
                fontSize: '32px',
                fontWeight: 'bold',
                marginBottom: '16px',
                color: '#333'
              }}>
                Chọn cuộc trò chuyện
              </h3>
              <p style={{
                fontSize: '18px',
                color: '#666'
              }}>
                Chọn một cuộc trò chuyện từ danh sách bên trái để bắt đầu chat
              </p>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
          60% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
};

export default CustomerChatPage;