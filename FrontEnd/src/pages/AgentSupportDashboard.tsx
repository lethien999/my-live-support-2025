import React, { useState, useEffect } from 'react';
import AuthChatService from '../services/AuthChatService';
import { getApiUrl } from '../config/api';

// =============================================
// AGENT SUPPORT DASHBOARD
// =============================================

interface Ticket {
  ticketId: number;
  ticketNumber: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  customerId: number;
  customerName: string;
  customerEmail: string;
  orderId?: number;
  orderNumber?: string;
  createdAt: string;
  updatedAt: string;
  agentId?: number;
  agentName?: string;
  chatRoomId?: number;
}

interface ChatRoom {
  roomId: number;
  roomName: string;
  customerId: number;
  customerName: string;
  ticketId?: number;
  ticketNumber?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  isActive: boolean;
}

const AgentSupportDashboard: React.FC = () => {
  // State management
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [_selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [_selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Filters
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    search: ''
  });

  // Initialize dashboard
  useEffect(() => {
    initializeAgentDashboard();
  }, []);

  // Load data when filters change
  useEffect(() => {
    if (currentUser) {
      loadTickets();
      loadChatRooms();
    }
  }, [filters, currentUser]);

  // Set loading to false after data is loaded
  useEffect(() => {
    if (currentUser && tickets.length >= 0 && chatRooms.length >= 0) {
      setLoading(false);
    }
  }, [currentUser, tickets, chatRooms]);

  const initializeAgentDashboard = async () => {
    try {
      setLoading(true);
      console.log('🚀 Initializing Agent Dashboard...');
      AuthChatService.init();
      let user = AuthChatService.getCurrentUser();

      console.log('🔍 Current user:', user);

      // Auto-login as agent if no user
      if (!user || user.role !== 'Agent') {
        console.log('🔍 AgentDashboard - No agent user, attempting auto-login...');

        try {
          const loginResponse = await fetch(getApiUrl('/api/auth/login'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'agent@muji.com', password: '123456' })
          });

          const loginData = await loginResponse.json();
          console.log('🔍 Login response:', loginData);
          
          if (loginData.success) {
            console.log('✅ AgentDashboard - Auto-login successful');
            sessionStorage.setItem('accessToken', loginData.tokens.accessToken);
            sessionStorage.setItem('refreshToken', loginData.tokens.refreshToken);
            sessionStorage.setItem('currentUser', JSON.stringify(loginData.user));

            user = loginData.user;
            setCurrentUser(user);
            console.log('✅ User set:', user);
            
            // Wait a bit for sessionStorage to be updated
            await new Promise(resolve => setTimeout(resolve, 100));
          } else {
            throw new Error('Auto-login failed');
          }
        } catch (loginError) {
          console.error('❌ AgentDashboard - Auto-login error:', loginError);
          setError('Không thể đăng nhập với quyền Agent. Vui lòng thử lại.');
          setLoading(false);
          return;
        }
      } else {
        setCurrentUser(user);
        console.log('✅ User already logged in:', user);
      }

    } catch (error) {
      console.error('❌ AgentDashboard - Initialization error:', error);
      setError('Không thể khởi tạo dashboard. Vui lòng thử lại.');
      setLoading(false);
    }
  };

  const loadTickets = async () => {
    try {
      console.log('🔍 Loading agent tickets...');
      const token = await AuthChatService.getToken();
      console.log('🔍 Token:', token ? 'Present' : 'Missing');
      
      if (!token) {
        console.error('❌ No token available');
        setError('Không có token xác thực');
        return;
      }
      
      const response = await fetch(getApiUrl('/api/agent/tickets'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('🔍 Tickets response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Tickets API error:', errorText);
        throw new Error(`Failed to load tickets: ${response.status}`);
      }

      const data = await response.json();
      console.log('🔍 Tickets data:', data);
      
      // Map backend data to frontend format
      const mappedTickets = (data.tickets || []).map((ticket: any) => ({
        ticketId: ticket.ticketId,
        ticketNumber: ticket.ticketNumber,
        title: ticket.title,
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority,
        customerId: ticket.customerId,
        customerName: ticket.customerName,
        customerEmail: ticket.customerEmail,
        orderId: ticket.orderId,
        orderNumber: ticket.orderNumber,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
        agentId: ticket.agentId,
        agentName: ticket.agentName
      }));
      
      setTickets(mappedTickets);
      console.log('✅ Agent tickets loaded:', mappedTickets.length);

    } catch (error) {
      console.error('❌ Error loading agent tickets:', error);
      setError('Không thể tải danh sách tickets: ' + (error as Error).message);
    }
  };

  const loadChatRooms = async () => {
    try {
      console.log('🔍 Loading agent chat rooms...');
      const token = await AuthChatService.getToken();
      
      if (!token) {
        console.error('❌ No token available for chat rooms');
        setError('Không có token xác thực');
        return;
      }
      
      const response = await fetch(getApiUrl('/api/agent/chat-rooms'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('🔍 Chat rooms response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Chat rooms API error:', errorText);
        throw new Error(`Failed to load chat rooms: ${response.status}`);
      }

      const data = await response.json();
      console.log('🔍 Chat rooms data:', data);
      
      // Map backend data to frontend format
      const mappedRooms = (data.rooms || []).map((room: any) => ({
        roomId: room.roomId,
        roomName: room.name,
        customerId: room.customerId,
        customerName: room.customerName,
        ticketId: room.ticketId,
        ticketNumber: room.ticketNumber,
        lastMessage: room.lastMessage,
        lastMessageAt: room.lastMessageAt,
        unreadCount: room.unreadCount || 0,
        isActive: room.isActive
      }));
      
      setChatRooms(mappedRooms);
      console.log('✅ Agent chat rooms loaded:', mappedRooms.length);

    } catch (error) {
      console.error('❌ Error loading chat rooms:', error);
      setError('Không thể tải danh sách chat rooms: ' + (error as Error).message);
    }
  };

  const handleAssignTicket = async (ticket: Ticket) => {
    try {
      const token = await AuthChatService.getToken();
      if (!token) {
        console.error('❌ No token available for assignment');
        setError('Không có token xác thực');
        return;
      }
      
      const response = await fetch(getApiUrl(`/api/agent/tickets/${ticket.ticketId}/assign`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Assign ticket error:', errorText);
        throw new Error('Failed to assign ticket');
      }

      const data = await response.json();
      if (data.success) {
        console.log('✅ Ticket assigned successfully');
        loadTickets(); // Reload tickets
        loadChatRooms(); // Reload chat rooms
      }

    } catch (error) {
      console.error('❌ Error assigning ticket:', error);
      setError('Không thể phân công ticket: ' + (error as Error).message);
    }
  };

  const handleStartChat = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    console.log('Starting chat for ticket:', ticket.ticketNumber);
    
    // Find the chat room for this ticket
    const room = chatRooms.find(r => r.ticketId === ticket.ticketId);
    if (room && room.roomId) {
      // Navigate to support chat with room ID and agent role
      console.log('Found existing room:', room.roomId);
      window.location.href = `/support-chat?roomId=${room.roomId}&role=agent`;
    } else {
      // If no room exists, create one by assigning the ticket first
      console.log('No room found, assigning ticket first...');
      try {
        await handleAssignTicket(ticket);
        // Reload chat rooms and wait for them to be updated
        await loadChatRooms();
        
        // Find the newly created room
        const updatedRooms = await fetch(getApiUrl('/api/agent/chat-rooms'), {
          headers: {
            'Authorization': `Bearer ${await AuthChatService.getToken()}`,
            'Content-Type': 'application/json'
          }
        }).then(res => res.json());
        
        const mappedRooms = (updatedRooms.rooms || []).map((room: any) => ({
          roomId: room.roomId,
          roomName: room.name,
          customerId: room.customerId,
          customerName: room.customerName,
          ticketId: room.ticketId,
          ticketNumber: room.ticketNumber,
          lastMessage: room.lastMessage,
          lastMessageAt: room.lastMessageAt,
          unreadCount: room.unreadCount || 0,
          isActive: room.isActive
        }));
        
        const newRoom = mappedRooms.find((r: any) => r.ticketId === ticket.ticketId);
        if (newRoom && newRoom.roomId) {
          console.log('Found new room:', newRoom.roomId);
          window.location.href = `/support-chat?roomId=${newRoom.roomId}&role=agent`;
        } else {
          console.error('❌ Could not find room after assignment');
          setError('Không thể tạo phòng chat cho ticket này');
        }
      } catch (error) {
        console.error('❌ Error in handleStartChat:', error);
        setError('Không thể bắt đầu chat: ' + (error as Error).message);
      }
    }
  };

  const handleJoinChatRoom = (room: ChatRoom) => {
    setSelectedRoom(room);
    console.log('Joining chat room:', room.roomId);
    
    if (room.roomId) {
      window.location.href = `/support-chat?roomId=${room.roomId}&role=agent`;
    } else {
      console.error('❌ Room ID is undefined');
      setError('Không thể tham gia phòng chat: Room ID không hợp lệ');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'open': return '#3b82f6';
      case 'in-progress': return '#f59e0b';
      case 'resolved': return '#10b981';
      case 'closed': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'low': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'high': return '#f97316';
      case 'urgent': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Không xác định';
      }
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Không xác định';
    }
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
        Đang tải Agent Dashboard...
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
        height: '50px',
        backgroundColor: '#1976d2',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        fontSize: '16px',
        fontWeight: 'bold',
        zIndex: 1000,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ marginRight: '10px' }}>👨‍💼</span>
          Agent Support Dashboard
        </div>
        <div style={{ fontSize: '14px' }}>
          {currentUser?.name || 'Agent'} | {tickets.length} tickets | {chatRooms.length} chat rooms
        </div>
      </div>

      {/* Main Content */}
      <div style={{ 
        marginTop: '50px',
        display: 'flex', 
        width: '100%',
        height: 'calc(100vh - 50px)'
      }}>
        {/* Left Panel - Tickets */}
        <div style={{ 
          width: '50%', 
          backgroundColor: 'white',
          borderRight: '1px solid #e0e0e0',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Tickets Header */}
          <div style={{ 
            padding: '20px', 
            borderBottom: '1px solid #e0e0e0',
            backgroundColor: '#f8f9fa'
          }}>
            <h2 style={{ margin: '0 0 15px 0', fontSize: '20px', fontWeight: '600' }}>
              📋 Tickets cần xử lý
            </h2>
            
            {/* Filters */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="Open">Mở</option>
                <option value="In-Progress">Đang xử lý</option>
                <option value="Resolved">Đã giải quyết</option>
                <option value="Closed">Đã đóng</option>
              </select>
              
              <select
                value={filters.priority}
                onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                <option value="">Tất cả độ ưu tiên</option>
                <option value="Low">Thấp</option>
                <option value="Medium">Trung bình</option>
                <option value="High">Cao</option>
                <option value="Urgent">Khẩn cấp</option>
              </select>
            </div>

            <div style={{ fontSize: '14px', color: '#666' }}>
              Hiển thị {tickets.length} tickets
            </div>
          </div>

          {/* Tickets List */}
          <div style={{ flex: 1, overflow: 'auto', padding: '10px' }}>
            {tickets.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px', 
                color: '#666',
                fontSize: '16px'
              }}>
                🎉 Không có ticket nào cần xử lý!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {tickets.map(ticket => (
                  <div key={ticket.ticketId} style={{
                    padding: '15px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    backgroundColor: 'white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8f9fa';
                    e.currentTarget.style.borderColor = '#1976d2';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.borderColor = '#e0e0e0';
                  }}
                  onClick={() => setSelectedTicket(ticket)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '5px' }}>
                          {ticket.ticketNumber}
                        </div>
                        <div style={{ fontSize: '14px', color: '#333', marginBottom: '8px' }}>
                          {ticket.title}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>
                          👤 {ticket.customerName || 'Khách hàng'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          📧 {ticket.customerEmail || 'N/A'}
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500',
                          color: 'white',
                          backgroundColor: getStatusColor(ticket.status)
                        }}>
                          {ticket.status}
                        </span>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500',
                          color: 'white',
                          backgroundColor: getPriorityColor(ticket.priority)
                        }}>
                          {ticket.priority}
                        </span>
                      </div>
                    </div>

                    <div style={{ fontSize: '13px', color: '#666', marginBottom: '10px' }}>
                      👤 {ticket.customerName} ({ticket.customerEmail})
                    </div>

                    <div style={{ fontSize: '12px', color: '#999', marginBottom: '10px' }}>
                      📅 {formatDate(ticket.createdAt)}
                      {ticket.orderNumber && (
                        <span style={{ marginLeft: '15px' }}>
                          📦 Đơn #{ticket.orderNumber}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      {!ticket.agentId && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAssignTicket(ticket);
                          }}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#1976d2',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Nhận ticket
                        </button>
                      )}
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartChat(ticket);
                        }}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        💬 Chat hỗ trợ
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Chat Rooms */}
        <div style={{ 
          width: '50%', 
          backgroundColor: 'white',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Chat Rooms Header */}
          <div style={{ 
            padding: '20px', 
            borderBottom: '1px solid #e0e0e0',
            backgroundColor: '#f8f9fa'
          }}>
            <h2 style={{ margin: '0 0 15px 0', fontSize: '20px', fontWeight: '600' }}>
              💬 Chat Rooms đang hoạt động
            </h2>
            
            <div style={{ fontSize: '14px', color: '#666' }}>
              Hiển thị {chatRooms.length} chat rooms
            </div>
          </div>

          {/* Chat Rooms List */}
          <div style={{ flex: 1, overflow: 'auto', padding: '10px' }}>
            {chatRooms.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px', 
                color: '#666',
                fontSize: '16px'
              }}>
                💬 Chưa có chat room nào đang hoạt động
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {chatRooms.map(room => (
                  <div key={room.roomId} style={{
                    padding: '15px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    backgroundColor: room.isActive ? '#e8f5e8' : 'white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = room.isActive ? '#d4edda' : '#f8f9fa';
                    e.currentTarget.style.borderColor = '#1976d2';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = room.isActive ? '#e8f5e8' : 'white';
                    e.currentTarget.style.borderColor = '#e0e0e0';
                  }}
                  onClick={() => handleJoinChatRoom(room)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '5px' }}>
                          {room.roomName}
                        </div>
                        <div style={{ fontSize: '14px', color: '#333', marginBottom: '8px' }}>
                          👤 {room.customerName}
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {room.unreadCount > 0 && (
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '500',
                            color: 'white',
                            backgroundColor: '#ef4444'
                          }}>
                            {room.unreadCount} tin nhắn mới
                          </span>
                        )}
                        
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500',
                          color: 'white',
                          backgroundColor: room.isActive ? '#10b981' : '#6b7280'
                        }}>
                          {room.isActive ? 'Đang hoạt động' : 'Tạm dừng'}
                        </span>
                      </div>
                    </div>

                    {room.ticketNumber && (
                      <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
                        🎫 Ticket: {room.ticketNumber}
                      </div>
                    )}

                    {room.lastMessage && (
                      <div style={{ fontSize: '12px', color: '#999', marginBottom: '10px' }}>
                        💬 {room.lastMessage}
                      </div>
                    )}

                    {room.lastMessageAt && (
                      <div style={{ fontSize: '11px', color: '#999' }}>
                        📅 {formatDate(room.lastMessageAt)}
                      </div>
                    )}

                    <div style={{ marginTop: '10px' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleJoinChatRoom(room);
                        }}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#1976d2',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '13px',
                          cursor: 'pointer',
                          width: '100%'
                        }}
                      >
                        🔗 Tham gia chat
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentSupportDashboard;
