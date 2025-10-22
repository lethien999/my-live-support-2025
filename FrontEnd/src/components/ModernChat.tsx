// Modern Chat Component - Based on reference project
import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import socketIO from 'socket.io-client';

// Simple time formatter to replace timeago.js
const formatTime = (dateString) => {
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

// Simple icons to replace react-icons
const SendIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
);

const GalleryIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ENDPOINT = "http://localhost:4000/";
const socketId = socketIO(ENDPOINT, { transports: ["websocket"] });

const ModernChat = ({ roomId, userRole = 'customer' }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [arrivalMessage, setArrivalMessage] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [images, setImages] = useState();
  const [activeStatus, setActiveStatus] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);
  
  // Get current user from localStorage
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const userId = currentUser.id;

  useEffect(() => {
    socketId.on("getMessage", (data) => {
      setArrivalMessage({
        sender: data.senderId,
        text: data.text,
        images: data.images,
        createdAt: Date.now(),
      });
    });
  }, []);

  useEffect(() => {
    arrivalMessage && setMessages((prev) => [...prev, arrivalMessage]);
  }, [arrivalMessage]);

  useEffect(() => {
    if (userId) {
      socketId.emit("addUser", userId);
      socketId.on("getUsers", (data) => {
        setOnlineUsers(data);
      });
    }
  }, [userId]);

  useEffect(() => {
    if (roomId) {
      socketId.emit("joinRoom", roomId);
    }
    
    return () => {
      if (roomId) {
        socketId.emit("leaveRoom", roomId);
      }
    };
  }, [roomId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load messages from API
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`http://localhost:4000/api/chat/messages/${roomId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setMessages(data.messages || []);
        }
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    };
    
    if (roomId) {
      loadMessages();
    }
  }, [roomId]);

  const sendMessageHandler = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;

    const message = {
      sender: userId,
      text: newMessage,
      roomId: roomId,
      senderType: userRole
    };

    // Emit to socket
    socketId.emit("sendMessage", {
      senderId: userId,
      receiverId: null, // Will be handled by room
      text: newMessage,
      roomId: roomId
    });

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:4000/api/chat/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      });

      if (response.ok) {
        const data = await response.json();
        setMessages([...messages, data.message]);
        updateLastMessage();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const updateLastMessage = async () => {
    socketId.emit("updateLastMessage", {
      lastMessage: newMessage,
      lastMessageId: userId,
      roomId: roomId
    });

    try {
      const token = localStorage.getItem('accessToken');
      await fetch(`http://localhost:4000/api/chat/rooms/${roomId}/last-message`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          lastMessage: newMessage,
          lastMessageId: userId
        })
      });
      
      setNewMessage("");
    } catch (error) {
      console.error('Error updating last message:', error);
    }
  };

  const handleImageUpload = async (e) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      if (reader.readyState === 2) {
        setImages(reader.result);
        imageSendingHandler(reader.result);
      }
    };
    
    reader.readAsDataURL(e.target.files[0]);
  };

  const imageSendingHandler = async (imageData) => {
    socketId.emit("sendMessage", {
      senderId: userId,
      receiverId: null,
      images: imageData,
      roomId: roomId
    });

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:4000/api/chat/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sender: userId,
          images: imageData,
          roomId: roomId,
          senderType: userRole
        })
      });

      if (response.ok) {
        const data = await response.json();
        setImages();
        setMessages([...messages, data.message]);
        updateLastMessageForImage();
      }
    } catch (error) {
      console.error('Error sending image:', error);
    }
  };

  const updateLastMessageForImage = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      await fetch(`http://localhost:4000/api/chat/rooms/${roomId}/last-message`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          lastMessage: "Photo",
          lastMessageId: userId
        })
      });
    } catch (error) {
      console.error('Error updating last message for image:', error);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-white rounded-lg shadow-lg">
      {/* Chat Header */}
      <div className="w-full flex p-4 items-center justify-between bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mr-3">
            <span className="text-blue-500 font-bold text-lg">
              {userRole === 'agent' ? 'A' : 'C'}
            </span>
          </div>
          <div>
            <h1 className="text-lg font-semibold">
              {userRole === 'agent' ? 'Customer Support' : 'Agent Support'}
            </h1>
            <p className="text-sm opacity-90">
              {activeStatus ? "Active Now" : "Offline"}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${activeStatus ? 'bg-green-400' : 'bg-gray-400'}`}></div>
          <span className="text-sm">Room #{roomId}</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <p>No messages yet. Start the conversation!</p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex w-full my-2 ${
                message.sender === userId ? "justify-end" : "justify-start"
              }`}
              ref={scrollRef}
            >
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.sender === userId 
                  ? "bg-blue-500 text-white" 
                  : "bg-white text-gray-800 border"
              }`}>
                {message.images && (
                  <img
                    src={message.images}
                    className="w-64 h-64 object-cover rounded-lg mb-2"
                    alt="Shared image"
                  />
                )}
                {message.text && (
                  <div>
                    <p className="text-sm">{message.text}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender === userId ? "text-blue-100" : "text-gray-500"
                    }`}>
                      {formatTime(message.createdAt)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Message Input */}
      <form
        className="p-4 bg-white border-t flex items-center space-x-2"
        onSubmit={sendMessageHandler}
      >
        <div className="flex-shrink-0">
          <input
            type="file"
            id="image"
            className="hidden"
            onChange={handleImageUpload}
            accept="image/*"
          />
          <label htmlFor="image" className="cursor-pointer text-gray-500 hover:text-gray-700">
            <GalleryIcon />
          </label>
        </div>
        
        <div className="flex-1 flex items-center bg-gray-100 rounded-full px-4 py-2">
          <input
            type="text"
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 bg-transparent outline-none text-gray-800"
            onFocus={() => setIsTyping(true)}
            onBlur={() => setIsTyping(false)}
          />
          <button
            type="submit"
            className="ml-2 p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
          >
            <SendIcon />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ModernChat;
