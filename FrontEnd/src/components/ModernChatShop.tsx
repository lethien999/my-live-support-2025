// Modern Chat Shop Component - Beautiful Design
import React, { useState, useEffect, useRef } from 'react';
import AuthChatService from '../services/AuthChatService';
import { getApiUrl } from '../config/api';

// Custom SVG icons
const ChatIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const SendIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const AttachmentIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
  </svg>
);

const OnlineIcon = () => (
  <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
);

const OfflineIcon = () => (
  <div className="w-3 h-3 bg-gray-400 rounded-full border-2 border-white"></div>
);

const OrderIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const ShopIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

interface Order {
  orderId: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  items: any[];
}

interface Message {
  id: string;
  sender: 'customer' | 'shop';
  content: string;
  timestamp: string;
  type: 'text' | 'image' | 'file';
}

const ModernChatShop: React.FC = () => {
  console.log('🔄 ModernChatShop component loaded/reloaded');
  
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isShopOnline, setIsShopOnline] = useState(true);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadOrders();
  }, []); // Empty dependency array to prevent infinite loop

  // Remove auto-scroll effect
  // useEffect(() => {
  //   scrollToBottom();
  // }, [messages]);

  // Get orderId from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('orderId');
    if (orderId) {
      // Find and select the order
      const order = orders.find(o => o.orderId === orderId);
      if (order) {
        setSelectedOrder(order);
        loadMessages(order.orderId);
      }
    }
  }, [orders]);

  const loadOrders = async () => {
    console.log('🔄 loadOrders called');
    try {
      setLoading(true);
      
      // Get orderId from URL
      const params = new URLSearchParams(window.location.search);
      const orderId = params.get('orderId');
      console.log('🔍 OrderId from URL:', orderId);
      
      if (orderId) {
        // Load specific order from API
        const token = await AuthChatService.getToken();
        if (!token) {
          console.error('❌ No token available for loading orders');
          return;
        }

        try {
          const response = await fetch(getApiUrl('/api/orders'), {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();
            const orders = Array.isArray(data) ? data : (data.data || data.orders || []);
            
            // Filter to find the specific order
            const targetOrder = orders.find((order: any) => 
              order.OrderID?.toString() === orderId || 
              order.orderId?.toString() === orderId ||
              order.id?.toString() === orderId
            );
            
            if (targetOrder) {
              // Convert API order to component format
              const formattedOrder: Order = {
                orderId: targetOrder.OrderID?.toString() || targetOrder.orderId?.toString() || targetOrder.id?.toString(),
                orderNumber: targetOrder.OrderNumber || targetOrder.orderNumber || `#${orderId}`,
                status: targetOrder.Status || targetOrder.status || 'Đang xử lý',
                total: targetOrder.TotalAmount || targetOrder.totalAmount || targetOrder.total || 0,
                createdAt: targetOrder.CreatedAt || targetOrder.createdAt || new Date().toISOString(),
                items: targetOrder.Items || targetOrder.items || []
              };
              
              setOrders([formattedOrder]);
              setSelectedOrder(formattedOrder);
              loadMessages(formattedOrder.orderId);
            } else {
              console.log('❌ Order not found:', orderId);
              setOrders([]);
            }
          } else {
            console.error('❌ Failed to load orders:', response.status);
            setOrders([]);
          }
        } catch (error) {
          console.error('❌ Error loading orders from API:', error);
          setOrders([]);
        }
      } else {
        // No specific order, load all orders
        const token = await AuthChatService.getToken();
        if (!token) {
          console.error('❌ No token available for loading orders');
          return;
        }

        try {
          const response = await fetch(getApiUrl('/api/orders'), {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();
            const orders = Array.isArray(data) ? data : (data.data || data.orders || []);
            
            const formattedOrders: Order[] = orders.map((order: any) => ({
              orderId: order.OrderID?.toString() || order.orderId?.toString() || order.id?.toString(),
              orderNumber: order.OrderNumber || order.orderNumber || `#${order.OrderID || order.orderId || order.id}`,
              status: order.Status || order.status || 'Đang xử lý',
              total: order.TotalAmount || order.totalAmount || order.total || 0,
              createdAt: order.CreatedAt || order.createdAt || new Date().toISOString(),
              items: order.Items || order.items || []
            }));
            
            setOrders(formattedOrders);
            if (formattedOrders.length > 0) {
              setSelectedOrder(formattedOrders[0]);
              loadMessages(formattedOrders[0].orderId);
            }
          } else {
            console.error('❌ Failed to load orders:', response.status);
            setOrders([]);
          }
        } catch (error) {
          console.error('❌ Error loading orders from API:', error);
          setOrders([]);
        }
      }
      
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (orderId: string) => {
    console.log('🔄 loadMessages called for orderId:', orderId);
    try {
      const token = await AuthChatService.getToken();
      if (!token) {
        console.error('❌ No token available for loading messages');
        return;
      }

      // First, try to create/get room for this order
      try {
        const createRoomResponse = await fetch(getApiUrl('/api/chat/rooms/create-by-order'), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            orderId: orderId,
            shopId: 1
          })
        });

        if (createRoomResponse.ok) {
          const roomData = await createRoomResponse.json();
          console.log('✅ Room created/found:', roomData);
          
          // Now load messages for this room
          const roomId = roomData.data.roomId;
          const messagesResponse = await fetch(getApiUrl(`/api/chat/${roomId}/messages`), {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (messagesResponse.ok) {
            const messagesData = await messagesResponse.json();
            console.log('✅ Messages loaded:', messagesData.messages?.length || 0, 'messages');
            setMessages(messagesData.messages || []);
          } else {
            console.error('❌ Failed to load messages:', messagesResponse.status);
            setMessages([]);
          }
        } else {
          console.error('❌ Failed to create room:', createRoomResponse.status);
          setMessages([]);
        }
      } catch (error) {
        console.error('❌ Error in room creation/message loading:', error);
        setMessages([]);
      }
    } catch (error) {
      console.error('❌ Error loading messages:', error);
      setMessages([]);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedOrder) return;

    const messageContent = newMessage.trim();
    setNewMessage('');

    try {
      console.log('🔄 Sending message:', messageContent);
      
      const token = await AuthChatService.getToken();
      if (!token) {
        console.error('❌ No token available for sending message');
        return;
      }

      // First, create/get room for this order
      const createRoomResponse = await fetch(getApiUrl('/api/chat/rooms/create-by-order'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: selectedOrder.orderId,
          shopId: 1
        })
      });

      if (!createRoomResponse.ok) {
        console.error('❌ Failed to create room:', createRoomResponse.status);
        return;
      }

      const roomData = await createRoomResponse.json();
      const roomId = roomData.data.roomId;
      console.log('✅ Room ID:', roomId);

      // Now send the message
      const sendResponse = await fetch(getApiUrl('/api/chat/send'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sender: 3, // Customer ID
          text: messageContent,
          roomId: roomId,
          senderType: 'Customer'
        })
      });

      if (sendResponse.ok) {
        const sendData = await sendResponse.json();
        console.log('✅ Message sent:', sendData);
        
        // Reload messages to show the new message
        await loadMessages(selectedOrder.orderId);
      } else {
        console.error('❌ Failed to send message:', sendResponse.status);
        setNewMessage(messageContent); // Restore message on error
      }

    } catch (error) {
      console.error('❌ Error sending message:', error);
      setNewMessage(messageContent); // Restore message on error
    }
  };

  const [showScrollButton, setShowScrollButton] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollButton(false);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setShowScrollButton(!isAtBottom);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-lg border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <ShopIcon />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">MUJI Shop Chat</h1>
                <div className="flex items-center space-x-2">
                  {isShopOnline ? <OnlineIcon /> : <OfflineIcon />}
                  <span className="text-sm text-gray-600">
                    {isShopOnline ? 'Shop đang online' : 'Shop offline'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-sm text-gray-500">Hỗ trợ 24/7</p>
              <p className="text-sm font-semibold text-gray-900">1900 255 579</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4 h-[calc(100vh-100px)]">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
          
          {/* Left Panel - Orders List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg h-full overflow-hidden">
              <div className="p-6 border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <h2 className="text-xl font-bold flex items-center space-x-2">
                  <OrderIcon />
                  <span>Đơn hàng của bạn</span>
                </h2>
                <p className="text-blue-100 text-sm mt-1">
                  Chọn đơn hàng để chat với shop
                </p>
              </div>
              
              <div className="p-3 space-y-2 overflow-y-auto">
                {orders.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <OrderIcon />
                    </div>
                    <p className="text-gray-500 text-sm">Chưa có đơn hàng nào</p>
                    <p className="text-gray-400 text-xs mt-1">Mua hàng để bắt đầu chat</p>
                  </div>
                ) : (
                  orders.map((order) => (
                    <div
                      key={order.orderId}
                      onClick={() => {
                        setSelectedOrder(order);
                        loadMessages(order.orderId);
                      }}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                        selectedOrder?.orderId === order.orderId
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-900">{order.orderNumber}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.status === 'Đã giao' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        {order.items.length} sản phẩm
                      </p>
                      <p className="text-sm font-semibold text-gray-900">
                        {formatPrice(order.total)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Chat Messages */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg h-full flex flex-col overflow-hidden">
              
              {/* Chat Header */}
              <div className="p-6 border-b bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <ChatIcon />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">
                        {selectedOrder ? `Chat về ${selectedOrder.orderNumber}` : 'Chọn đơn hàng'}
                      </h3>
                      <p className="text-green-100 text-sm">
                        {selectedOrder ? `${selectedOrder.items.length} sản phẩm • ${formatPrice(selectedOrder.total)}` : 'Để bắt đầu chat'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {isShopOnline ? <OnlineIcon /> : <OfflineIcon />}
                    <span className="text-sm">
                      {isShopOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div 
                className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50 to-white relative"
                onScroll={handleScroll}
              >
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <ChatIcon />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Chưa có tin nhắn nào
                    </h3>
                    <p className="text-gray-500 text-sm">
                      Hãy gửi tin nhắn đầu tiên để bắt đầu chat với shop
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((message, index) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender === 'customer' ? 'justify-end' : 'justify-start'} ${
                          index === 0 ? 'mt-0' : ''
                        }`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                            message.sender === 'customer'
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                              : 'bg-white text-gray-900 border border-gray-200'
                          }`}
                        >
                          <p className="text-sm leading-relaxed">{message.content}</p>
                          <p className={`text-xs mt-2 ${
                            message.sender === 'customer' ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {formatTime(message.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div ref={messagesEndRef} />
                
                {/* Scroll to bottom button */}
                {showScrollButton && (
                  <button
                    onClick={scrollToBottom}
                    className="absolute bottom-4 right-4 bg-blue-500 text-white rounded-full p-3 shadow-lg hover:bg-blue-600 transition-colors"
                    title="Xuống cuối"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t bg-gray-50">
                <div className="flex items-center space-x-3">
                  <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors">
                    <AttachmentIcon />
                  </button>
                  
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      placeholder="Nhập tin nhắn cho shop..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      disabled={!selectedOrder}
                    />
                  </div>
                  
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || !selectedOrder}
                    className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <SendIcon />
                  </button>
                </div>
                
                {!selectedOrder && (
                  <p className="text-center text-gray-500 text-sm mt-2">
                    Vui lòng chọn đơn hàng để bắt đầu chat
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernChatShop;
