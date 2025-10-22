import React, { useState, useEffect, useRef, useCallback } from 'react';
import AuthChatService from '../services/AuthChatService';
import { getApiUrl } from '../config/api';

// Simple time formatter to replace timeago.js
const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Vừa xong';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} phút trước`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} giờ trước`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ngày trước`;
  }
};

// Custom SVG icons to replace react-icons
const SendIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const PaperClipIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
  </svg>
);

const SmileIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const StarIcon = ({ filled = false }: { filled?: boolean }) => (
  <svg className="w-5 h-5" fill={filled ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const MessageIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

interface ChatMessage {
  messageId: string;
  roomId: string;
  senderId: string;
  content: string;
  messageType: 'text' | 'image' | 'file';
  createdAt: string;
  isRead: boolean;
  senderName?: string;
  senderRole?: string;
}

interface ChatRoom {
  roomId: string;
  roomName: string;
  customerId: string;
  agentId?: string;
  ticketId?: string;
  isActive: boolean;
  lastMessage?: string;
  lastMessageAt?: string;
  createdAt: string;
  averageRating?: number;
  totalRatings?: number;
}

interface UnifiedChatProps {
  roomId: string;
  userRole: 'Customer' | 'Agent' | 'Admin';
  onRoomUpdate?: (room: ChatRoom) => void;
  showRating?: boolean;
}

const UnifiedChat: React.FC<UnifiedChatProps> = ({ 
  roomId, 
  userRole, 
  onRoomUpdate,
  showRating = true 
}) => {
  // State management
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<any>(null);

  // Initialize chat
  useEffect(() => {
    initializeChat();
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [roomId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeChat = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const currentUser = await AuthChatService.getCurrentUser();
      setUser(currentUser);

      // Load room details
      await loadRoomDetails();
      
      // Load messages
      await loadMessages();
      
      // Initialize socket connection
      await initializeSocket();

      setLoading(false);
    } catch (error) {
      console.error('❌ Error initializing chat:', error);
      setError('Không thể khởi tạo chat');
      setLoading(false);
    }
  };

  const loadRoomDetails = async () => {
    try {
      const token = await AuthChatService.getToken();
      const response = await fetch(getApiUrl(`/api/chat/rooms/${roomId}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to load room: ${response.status}`);
      }

      const data = await response.json();
      setRoom(data.room);
      
      if (onRoomUpdate) {
        onRoomUpdate(data.room);
      }
    } catch (error) {
      console.error('❌ Error loading room details:', error);
      throw error;
    }
  };

  const loadMessages = async () => {
    try {
      const token = await AuthChatService.getToken();
      const response = await fetch(getApiUrl(`/api/chat/rooms/${roomId}/messages`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to load messages: ${response.status}`);
      }

      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('❌ Error loading messages:', error);
      throw error;
    }
  };

  const initializeSocket = async () => {
    try {
      // Initialize socket connection (simplified for now)
      setIsConnected(true);
      console.log('✅ Socket connected');
    } catch (error) {
      console.error('❌ Socket connection error:', error);
      setIsConnected(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !room) return;

    const messageContent = newMessage.trim();
    setNewMessage('');

    try {
      const token = await AuthChatService.getToken();
      const response = await fetch(getApiUrl('/api/chat/send'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sender: user.id,
          text: messageContent,
          roomId: roomId,
          senderType: userRole
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status}`);
      }

      const data = await response.json();
      
      // Add message to local state
      const newMsg: ChatMessage = {
        messageId: data.data.MessageID.toString(),
        roomId: roomId,
        senderId: user.id.toString(),
        content: messageContent,
        messageType: 'text',
        createdAt: new Date().toISOString(),
        isRead: false,
        senderName: user.name,
        senderRole: userRole
      };

      setMessages(prev => [...prev, newMsg]);
      
      // Update room last message
      if (room) {
        const updatedRoom = {
          ...room,
          lastMessage: messageContent,
          lastMessageAt: new Date().toISOString()
        };
        setRoom(updatedRoom);
        
        if (onRoomUpdate) {
          onRoomUpdate(updatedRoom);
        }
      }

    } catch (error) {
      console.error('❌ Error sending message:', error);
      setNewMessage(messageContent); // Restore message on error
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleRatingSubmit = async () => {
    if (rating === 0) return;

    try {
      const token = await AuthChatService.getToken();
      const response = await fetch(getApiUrl('/api/chat/rating'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          roomId: roomId,
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
      
      // Reload room details to get updated rating
      await loadRoomDetails();
      
      console.log('✅ Rating submitted successfully');
    } catch (error) {
      console.error('❌ Error submitting rating:', error);
    }
  };

  const renderStars = (rating: number, interactive: boolean = false) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={interactive ? () => setRating(star) : undefined}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
            disabled={!interactive}
          >
            {star <= rating ? (
              <StarIcon filled={true} className="text-yellow-400 text-lg" />
            ) : (
              <StarIcon filled={false} className="text-gray-300 text-lg" />
            )}
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-600">Đang tải chat...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-red-500">
          <p className="text-lg font-semibold mb-2">❌ Lỗi</p>
          <p>{error}</p>
          <button 
            onClick={initializeChat}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <UserIcon className="text-white text-lg" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {room?.roomName || 'Chat Room'}
            </h3>
            <p className="text-sm text-gray-500">
              {userRole === 'Customer' ? 'Agent Support' : 'Customer Chat'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Connection Status */}
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          
          {/* Rating Display */}
          {room?.averageRating && room.averageRating > 0 && (
            <div className="flex items-center space-x-1">
              {renderStars(Math.round(room.averageRating))}
              <span className="text-sm text-gray-500">({room.totalRatings})</span>
            </div>
          )}
          
          {/* Rating Button */}
          {showRating && userRole === 'Customer' && (
            <button
              onClick={() => setShowRatingModal(true)}
              className="p-2 text-gray-500 hover:text-yellow-500 transition-colors"
              title="Đánh giá chat"
            >
              <StarIcon filled={false} className="text-lg" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.map((message) => (
          <div
            key={message.messageId}
            className={`flex ${message.senderId === user?.id?.toString() ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.senderId === user?.id?.toString()
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-900'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <p className={`text-xs mt-1 ${
                message.senderId === user?.id?.toString() ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {formatTime(message.createdAt)}
              </p>
            </div>
          </div>
        ))}
        
        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="flex justify-start">
            <div className="bg-gray-200 px-4 py-2 rounded-lg">
              <p className="text-sm text-gray-600">
                {typingUsers.join(', ')} đang gõ...
              </p>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t p-4 bg-gray-50">
        <div className="flex items-center space-x-2">
          <button className="p-2 text-gray-500 hover:text-gray-700">
            <PaperClipIcon className="text-lg" />
          </button>
          
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nhập tin nhắn..."
              className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <SendIcon className="text-lg" />
          </button>
        </div>
      </div>

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Đánh giá chat</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mức độ hài lòng
              </label>
              {renderStars(rating, true)}
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nhận xét (tùy chọn)
              </label>
              <textarea
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                placeholder="Chia sẻ trải nghiệm của bạn..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowRatingModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Hủy
              </button>
              <button
                onClick={handleRatingSubmit}
                disabled={rating === 0}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Gửi đánh giá
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedChat;
