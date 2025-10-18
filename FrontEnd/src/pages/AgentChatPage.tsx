import React, { useState, useRef, useEffect } from 'react';
import AuthChatService from '../services/AuthChatService';
import PrivateChatManager from '../services/PrivateChatManager';

interface Message {
  id: string;
  content: string;
  sender: string;
  senderId: string;
  senderRole: string;
  timestamp: string;
  isUser: boolean;
  isSystem?: boolean;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  role: string;
  chat: any;
}

const AgentChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState<any>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatManager = PrivateChatManager.getInstance();

  useEffect(() => {
    const currentUser = AuthChatService.getCurrentUser();
    if (!currentUser) {
      // Redirect to login if not authenticated
      window.history.pushState({}, '', '/login');
      window.dispatchEvent(new PopStateEvent('popstate'));
      return;
    }
    
    // Only agents can access this page
    if (currentUser.role !== 'agent' && currentUser.role !== 'admin') {
      window.history.pushState({}, '', '/dashboard');
      window.dispatchEvent(new PopStateEvent('popstate'));
      return;
    }
    
    setUser(currentUser);
    
    // Initialize message handler
    const messageHandler = (message: Message) => {
      console.log(`Received message in agent chat:`, message);
      
      setMessages(prev => {
        // Check if message already exists to avoid duplicates
        const exists = prev.some(msg => msg.id === message.id);
        if (exists) {
          console.log('Message already exists, skipping:', message.id);
          return prev;
        }
        
        // Set isUser based on whether this message is from current user
        const isFromCurrentUser = message.senderId === currentUser.id;
        const processedMessage = {
          ...message,
          isUser: isFromCurrentUser
        };
        
        console.log('Adding new message:', processedMessage);
        
        // Only auto-scroll if this is a new message from someone else
        if (!isFromCurrentUser) {
          setTimeout(() => {
            handleUserScroll();
          }, 100);
        }
        
        return [...prev, processedMessage];
      });
    };

    // Register user with chat manager
    chatManager.registerUser(currentUser.id, currentUser, messageHandler);
    
    // Load available customers
    const availableCustomers = chatManager.getAvailableCustomers();
    setCustomers(availableCustomers);
    
    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      console.log('AgentChatPage: Storage change detected:', e.key);
      
      // Only handle private chat changes
      if (e.key && e.key.startsWith('private_chat_') && e.newValue) {
        console.log('AgentChatPage: Updating customers list');
        const availableCustomers = chatManager.getAvailableCustomers();
        setCustomers(availableCustomers);
      }
      
      // Also listen for custom events
      if (e.key && e.key.startsWith('private_chat_event_') && e.newValue) {
        try {
          const eventData = JSON.parse(e.newValue);
          console.log('AgentChatPage: Received custom event:', eventData.type);
          
          if (eventData.type === 'user_registered') {
            console.log('AgentChatPage: New user registered, updating customers list');
            const availableCustomers = chatManager.getAvailableCustomers();
            setCustomers(availableCustomers);
          }
        } catch (error) {
          console.error('Error handling custom event:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Listen for message updates
    const handleMessageUpdate = () => {
      console.log('AgentChatPage: Message updated, refreshing customers list...');
      const availableCustomers = chatManager.getAvailableCustomers();
      setCustomers(availableCustomers);
    };
    
    window.addEventListener('messageUpdated', handleMessageUpdate);

    // Set up periodic refresh for customers list
    const refreshInterval = setInterval(() => {
      console.log('AgentChatPage: Periodic refresh of customers list');
      const availableCustomers = chatManager.getAvailableCustomers();
      setCustomers(availableCustomers);
    }, 2000); // Refresh every 2 seconds

    // Cleanup on unmount
    return () => {
      chatManager.unregisterUser(currentUser.id);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('messageUpdated', handleMessageUpdate);
      clearInterval(refreshInterval);
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Only scroll to bottom when user sends a message, not when loading
  const handleUserScroll = () => {
    // Only scroll if user is near bottom
    const messagesContainer = messagesEndRef.current?.parentElement;
    if (messagesContainer) {
      const isNearBottom = messagesContainer.scrollTop + messagesContainer.clientHeight >= messagesContainer.scrollHeight - 100;
      if (isNearBottom) {
        scrollToBottom();
      }
    }
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    
    // Assign agent to customer chat
    chatManager.assignAgentToChat(customer.id, user.id);
    
    // Load messages for this customer
    const customerMessages = customer.chat?.messages || [];
    
    // Process messages to set isUser correctly
    const processedMessages = customerMessages.map(msg => ({
      ...msg,
      isUser: msg.senderId === user.id
    }));
    
    setMessages(processedMessages);
    
    console.log(`Selected customer: ${customer.name}`);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedCustomer) return;

    console.log(`Sending message to ${selectedCustomer.name}: ${newMessage}`);

    // Send message to selected customer
    chatManager.sendMessage(user.id, newMessage, selectedCustomer.id);
    
    // Dispatch message updated event
    window.dispatchEvent(new CustomEvent('messageUpdated'));
    
    // Clear input immediately
    setNewMessage('');
    
    // Scroll to bottom only when user sends message
    setTimeout(() => {
      scrollToBottom();
    }, 100);
    
    console.log('Message sent to customer');
  };

  if (!user) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f8f9fa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <p style={{ color: '#5f6368' }}>Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      display: 'flex'
    }}>
      {/* Customer List Sidebar */}
      <div style={{
        width: '300px',
        backgroundColor: 'white',
        boxShadow: '2px 0 4px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e8eaed',
          backgroundColor: '#4285f4',
          color: 'white'
        }}>
          <h2 style={{
            fontSize: '1.2rem',
            fontWeight: '600',
            marginBottom: '0.5rem'
          }}>
            Khách hàng đang chờ
          </h2>
          <p style={{ fontSize: '0.9rem', opacity: 0.9 }}>
            {customers.length} khách hàng online
          </p>
        </div>

        {/* Customer List */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {customers.map((customer) => (
            <button
              key={customer.id}
              onClick={() => handleSelectCustomer(customer)}
              style={{
                width: '100%',
                padding: '1rem',
                border: 'none',
                backgroundColor: selectedCustomer?.id === customer.id ? '#f0f7ff' : 'transparent',
                borderLeft: selectedCustomer?.id === customer.id ? '3px solid #4285f4' : '3px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                transition: 'all 0.2s',
                borderBottom: '1px solid #f0f0f0'
              }}
              onMouseOver={(e) => {
                if (selectedCustomer?.id !== customer.id) {
                  e.target.style.backgroundColor = '#f8f9fa';
                }
              }}
              onMouseOut={(e) => {
                if (selectedCustomer?.id !== customer.id) {
                  e.target.style.backgroundColor = 'transparent';
                }
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#34a853',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                fontWeight: '600'
              }}>
                {customer.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{
                  fontWeight: '500',
                  color: 'black',
                  marginBottom: '0.25rem'
                }}>
                  {customer.name}
                </div>
                <div style={{
                  fontSize: '0.8rem',
                  color: '#5f6368'
                }}>
                  {customer.email}
                </div>
                <div style={{
                  fontSize: '0.7rem',
                  color: customer.chat?.status === 'waiting' ? '#ea4335' : '#34a853',
                  fontWeight: '500'
                }}>
                  {customer.chat?.status === 'waiting' ? 'Đang chờ' : 'Đang chat'}
                </div>
              </div>
            </button>
          ))}
          
          {customers.length === 0 && (
            <div style={{
              padding: '2rem',
              textAlign: 'center',
              color: '#5f6368'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>👥</div>
              <p>Chưa có khách hàng nào online</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column'
      }}>
        {selectedCustomer ? (
          <>
            {/* Chat Header */}
            <div style={{
              backgroundColor: 'white',
              padding: '1rem 2rem',
              borderBottom: '1px solid #e8eaed',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#34a853',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                fontWeight: '600'
              }}>
                {selectedCustomer.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 style={{
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: 'black',
                  marginBottom: '0.25rem'
                }}>
                  {selectedCustomer.name}
                </h3>
                <p style={{
                  fontSize: '0.9rem',
                  color: '#5f6368'
                }}>
                  {selectedCustomer.email}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1,
              padding: '1rem 2rem',
              overflow: 'auto',
              backgroundColor: '#f8f9fa'
            }}>
              {messages.map((message) => (
                <div
                  key={message.id}
                  style={{
                    marginBottom: '1rem',
                    display: 'flex',
                    justifyContent: message.isUser ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div style={{
                    maxWidth: '70%',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    backgroundColor: message.isUser ? '#4285f4' : 'white',
                    color: message.isUser ? 'white' : 'black',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    border: message.isSystem ? '1px solid #e8eaed' : 'none'
                  }}>
                    {message.isSystem && (
                      <div style={{
                        fontSize: '0.8rem',
                        color: '#5f6368',
                        marginBottom: '0.5rem',
                        textAlign: 'center',
                        fontStyle: 'italic'
                      }}>
                        {message.content}
                      </div>
                    )}
                    {!message.isSystem && (
                      <>
                        <div style={{
                          fontSize: '0.9rem',
                          marginBottom: '0.25rem'
                        }}>
                          {message.content}
                        </div>
                        <div style={{
                          fontSize: '0.7rem',
                          opacity: 0.7,
                          textAlign: 'right'
                        }}>
                          {message.timestamp}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div style={{
              backgroundColor: 'white',
              padding: '1rem 2rem',
              borderTop: '1px solid #e8eaed'
            }}>
              <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '1rem' }}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Nhập tin nhắn..."
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    border: '1px solid #e8eaed',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#4285f4',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '500',
                    cursor: 'pointer',
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
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f8f9fa'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>💬</div>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: 'black',
                marginBottom: '1rem'
              }}>
                Chọn khách hàng để bắt đầu chat
              </h3>
              <p style={{ color: '#5f6368' }}>
                Click vào khách hàng trong danh sách bên trái để bắt đầu cuộc trò chuyện
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentChatPage;
