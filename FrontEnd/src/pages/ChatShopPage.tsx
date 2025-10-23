import React, { useState, useEffect, useRef } from 'react';
import AuthChatService from '../services/AuthChatService';
import ConversationService, { Conversation, Message } from '../services/ConversationService';
import chatSocketManager from '../services/ChatSocketManager';
import { formatTime } from '../utils/dateUtils';
import ChatRatingModal from '../components/ChatRatingModal';
import { getApiUrl } from '../config/api';

const ChatShopPage: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeChat();
    
    // Listen for real-time messages
    const handleReceiveMessage = (message: any) => {
      // console.log('📨 Agent received message:', message);
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
  }, []); // Remove selectedConversation dependency to prevent infinite loop

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
      joinRoom(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showChatMenu) {
        const target = event.target as HTMLElement;
        if (!target.closest('[data-chat-menu]')) {
          setShowChatMenu(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showChatMenu]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeChat = async () => {
    try {
      setLoading(true);
      
      // Check if agent is logged in, if not, auto-login
      let user = await AuthChatService.getCurrentUser();
      if (!user) {
        // console.log('🔄 Agent not logged in, attempting auto-login...');
        const loginSuccess = await AuthChatService.autoLoginAgent();
        if (loginSuccess) {
          user = await AuthChatService.getCurrentUser();
        } else {
          throw new Error('Không thể đăng nhập agent');
        }
      }
      
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
      // console.log('🔄 Loading agent conversations...');
      const fetchedConversations = await ConversationService.getAgentConversations();
      // console.log('📋 Fetched agent conversations:', fetchedConversations);
      setConversations(fetchedConversations);
      
      const urlParams = new URLSearchParams(window.location.search);
      const cId = urlParams.get('c');
      if (cId) {
        const conversation = fetchedConversations.find(c => c.id === cId);
        if (conversation) setSelectedConversation(conversation);
      } else if (fetchedConversations.length > 0) {
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
    if (!selectedConversation || (!content.trim() && selectedFiles.length === 0) || sending) return;

    console.log('🔍 Debug sendMessage:', {
      selectedConversation: selectedConversation,
      conversationId: selectedConversation?.id,
      content: content,
      files: selectedFiles.length,
      contentTrim: content.trim()
    });

    try {
      setSending(true);
      
      // Send files first if any
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('conversationId', selectedConversation.id);
          formData.append('senderId', currentUserId);
          formData.append('senderType', 'Agent');
          
          try {
            const response = await fetch('http://localhost:4000/api/chat/upload', {
              method: 'POST',
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
      if (content.trim()) {
        await ConversationService.sendMessage({
          conversationId: selectedConversation.id,
          content: content,
          clientTempId: `temp_${Date.now()}`
        });
      }
      
      const newMsg: Message = {
        id: `temp_${Date.now()}`,
        conversationId: selectedConversation.id,
        senderId: currentUserId,
        senderType: 'Agent',
        content: content || `📎 Đã gửi ${selectedFiles.length} file(s)`,
        timestamp: new Date().toISOString(),
        isRead: false
      };
      
      setMessages(prev => [...prev, newMsg]);
      setNewMessage('');
      setSelectedFiles([]); // Clear selected files
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Không thể gửi tin nhắn');
    } finally {
      setSending(false);
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

  const handleRatingSubmit = async () => {
    if (rating === 0 || !selectedConversation) return;

    try {
      const token = await AuthChatService.getToken();
      const response = await fetch(getApiUrl('/api/chat/rating'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          roomId: selectedConversation.conversationId,
          rating: rating,
          comment: ratingComment
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to submit rating: ${response.status}`);
      }

      setShowRatingModal(false);
      setRating(0);
      setRatingComment('');
      setShowChatMenu(false);
      
      alert('Cảm ơn bạn đã đánh giá!');
      console.log('✅ Rating submitted successfully');
    } catch (error) {
      console.error('❌ Error submitting rating:', error);
      alert('Không thể gửi đánh giá. Vui lòng thử lại.');
    }
  };

  const emojis = ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾'];

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
    background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
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
    background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
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
      ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)' 
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
              <span style={{ fontSize: '40px' }}>🏪</span>
            </div>
            <h2 style={{ fontSize: '24px', marginBottom: '10px' }}>Đang tải shop chat...</h2>
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
                🏪
              </div>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Shop Chat</h1>
                <p style={{ fontSize: '14px', opacity: 0.8, margin: 0 }}>Hỗ trợ khách hàng</p>
              </div>
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
                borderRadius: '8px',
                color: 'white',
                padding: '8px 16px',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
            >
              🏠 Trang chủ
            </button>
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
                🏪
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
                Chưa có cuộc trò chuyện
              </h3>
              <p style={{ fontSize: '14px' }}>Khách hàng sẽ xuất hiện ở đây!</p>
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
                      ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)'
                      : 'transparent',
                    color: selectedConversation?.id === conversation.id ? 'white' : '#333',
                    transform: selectedConversation?.id === conversation.id ? 'scale(1.02)' : 'scale(1)',
                    boxShadow: selectedConversation?.id === conversation.id 
                      ? '0 4px 15px rgba(255, 107, 107, 0.3)'
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
                        : 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
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
                    background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
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
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
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
                  <div style={{ position: 'relative' }} data-chat-menu>
                    <button 
                      onClick={() => setShowChatMenu(!showChatMenu)}
                      style={{
                        padding: '12px',
                        background: 'none',
                        border: 'none',
                        color: '#666',
                        cursor: 'pointer',
                        borderRadius: '50%',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      ⋮
                    </button>
                    
                    {/* Dropdown Menu */}
                    {showChatMenu && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        right: '0',
                        background: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        zIndex: 1000,
                        minWidth: '200px',
                        marginTop: '8px'
                      }}>
                        <button
                          onClick={() => {
                            setShowRatingModal(true);
                            setShowChatMenu(false);
                          }}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            background: 'none',
                            border: 'none',
                            textAlign: 'left',
                            cursor: 'pointer',
                            fontSize: '14px',
                            color: '#374151',
                            borderBottom: '1px solid #f3f4f6',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          ⭐ Đánh giá chat
                        </button>
                        
                        <button
                          onClick={() => {
                            alert('Tính năng báo cáo sắp có');
                            setShowChatMenu(false);
                          }}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            background: 'none',
                            border: 'none',
                            textAlign: 'left',
                            cursor: 'pointer',
                            fontSize: '14px',
                            color: '#374151',
                            borderBottom: '1px solid #f3f4f6',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          🚨 Báo cáo
                        </button>
                        
                        <button
                          onClick={() => {
                            alert('Tính năng chia sẻ sắp có');
                            setShowChatMenu(false);
                          }}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            background: 'none',
                            border: 'none',
                            textAlign: 'left',
                            cursor: 'pointer',
                            fontSize: '14px',
                            color: '#374151',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          📤 Chia sẻ
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.05) 0%, rgba(238, 90, 36, 0.05) 100%)',
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
                      background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.1) 0%, rgba(238, 90, 36, 0.1) 100%)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 24px',
                      fontSize: '48px'
                    }}>
                      🏪
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
                        background: '#ff6b6b',
                        borderRadius: '50%',
                        animation: 'bounce 1s infinite'
                      }}></div>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        background: '#ee5a24',
                        borderRadius: '50%',
                        animation: 'bounce 1s infinite 0.1s'
                      }}></div>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        background: '#ff9ff3',
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
                                    <div style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
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
                                    <div style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
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
                                        color: '#667eea',
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
                  {/* File Upload Button */}
                  <label style={{
                    padding: '12px',
                    background: 'none',
                    border: 'none',
                    color: '#666',
                    cursor: 'pointer',
                    borderRadius: '50%',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
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
                      padding: '12px',
                      background: 'none',
                      border: 'none',
                      color: '#666',
                      cursor: 'pointer',
                      borderRadius: '50%',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    😊
                  </button>
                  <button
                    onClick={() => {
                      if (newMessage.trim() || selectedFiles.length > 0) {
                        sendMessage(newMessage);
                      }
                    }}
                    disabled={(!newMessage.trim() && selectedFiles.length === 0) || sending}
                    style={{
                      background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
                      color: 'white',
                      border: 'none',
                      padding: '12px',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      opacity: ((!newMessage.trim() && selectedFiles.length === 0) || sending) ? 0.5 : 1,
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
            background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.05) 0%, rgba(238, 90, 36, 0.05) 100%)',
            textAlign: 'center'
          }}>
            <div style={{ maxWidth: '500px' }}>
              <div style={{
                width: '160px',
                height: '160px',
                background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 32px',
                fontSize: '64px'
              }}>
                🏪
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
      
      {/* Rating Modal */}
      <ChatRatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        onSubmit={handleRatingSubmit}
        rating={rating}
        setRating={setRating}
        comment={ratingComment}
        setComment={setRatingComment}
      />
    </div>
  );
};

export default ChatShopPage;
