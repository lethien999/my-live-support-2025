import React, { useState, useEffect } from 'react';
import TicketService from '../services/TicketService';
import AuthChatService from '../services/AuthChatService';
import CreateTicketModal from '../components/CreateTicketModal';

interface Ticket {
  ticketId: number;
  ticketNumber: string;
  title: string;
  description: string;
  statusName: string;
  priorityLevel: string;
  createdAt: string;
  customerName?: string;
  customerEmail?: string;
}

const TicketPageNew: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Debug log for modal state
  console.log('🔍 Modal state:', { showDetailsModal, selectedTicket: selectedTicket?.ticketNumber });
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    search: ''
  });

  // Auto-login for testing
  useEffect(() => {
    const initializeTicketPage = async () => {
      try {
        console.log('🔧 TicketPageNew: Initializing...');
        const user = await AuthChatService.getCurrentUser();
        console.log('🔧 TicketPageNew: Current user:', user);
        
        if (!user) {
          console.log('🔧 TicketPageNew: No user found, attempting auto-login...');
          // Auto-login as customer for testing
          const loginResult = await AuthChatService.login('customer@muji.com', '123456');
          console.log('🔧 TicketPageNew: Auto-login result:', loginResult);
        }
        
        console.log('🔧 TicketPageNew: Loading tickets...');
        await loadTickets();
      } catch (error) {
        console.error('Initialize ticket page error:', error);
        setError('Không thể khởi tạo trang ticket');
      }
    };

    initializeTicketPage();
  }, []);

  const loadTickets = async () => {
    try {
      console.log('🔧 TicketPageNew: loadTickets called');
      setLoading(true);
      setError(null);
      
      const response = await TicketService.getTickets({
        status: filters.status ? parseInt(filters.status) : undefined,
        priority: filters.priority ? parseInt(filters.priority) : undefined,
        search: filters.search || undefined
      });
      
      console.log('🔧 TicketPageNew: Tickets response:', response);
      
      // Handle different response formats
      const ticketsData = Array.isArray(response) ? response : (response.data || response.tickets || []);
      console.log('🔧 TicketPageNew: Processed tickets data:', ticketsData);
      setTickets(ticketsData);
    } catch (error) {
      console.error('Load tickets error:', error);
      setError('Không thể tải danh sách ticket');
      setTickets([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [filters]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'in progress': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-gray-100 text-gray-800';
      case 'closed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCreateTicket = () => {
    setShowCreateModal(true);
  };

  const handleTicketCreated = () => {
    setShowCreateModal(false);
    loadTickets();
  };

  const handleViewDetails = (ticket: Ticket) => {
    console.log('🔍 handleViewDetails called with ticket:', ticket);
    alert(`Opening ticket: ${ticket.ticketNumber} - ${ticket.title}`);
    setSelectedTicket(ticket);
    setShowDetailsModal(true);
    console.log('🔍 Modal should be visible now');
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải danh sách ticket...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Quản lý Ticket</h1>
          <p className="mt-2 text-gray-600">Theo dõi và quản lý các yêu cầu hỗ trợ</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Lỗi</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            {/* Search */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tìm kiếm
              </label>
              <input
                type="text"
                placeholder="Tìm theo tiêu đề hoặc mô tả..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trạng thái
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tất cả</option>
                <option value="1">Open</option>
                <option value="2">In Progress</option>
                <option value="3">Resolved</option>
                <option value="4">Closed</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Độ ưu tiên
              </label>
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tất cả</option>
                <option value="1">Low</option>
                <option value="2">Medium</option>
                <option value="3">High</option>
              </select>
            </div>

            {/* Create Button */}
            <button
              onClick={handleCreateTicket}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Tạo Ticket Mới
            </button>
          </div>
        </div>

        {/* Tickets List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {tickets.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có ticket nào</h3>
              <p className="text-gray-600 mb-4">Bạn chưa tạo ticket nào hoặc không có ticket phù hợp với bộ lọc.</p>
              <button
                onClick={handleCreateTicket}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Tạo Ticket Đầu Tiên
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ticket #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tiêu đề
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Độ ưu tiên
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày tạo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tickets.map((ticket) => (
                    <tr key={ticket.ticketId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {ticket.ticketNumber}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-w-xs truncate" title={ticket.title}>
                          {ticket.title}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.statusName)}`}>
                          {ticket.statusName}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(ticket.priorityLevel)}`}>
                          {ticket.priorityLevel}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {(() => {
                          try {
                            const date = new Date(ticket.createdAt);
                            if (isNaN(date.getTime())) {
                              return 'Không xác định';
                            }
                            return date.toLocaleDateString('vi-VN');
                          } catch (error) {
                            console.error('Error formatting date:', error);
                            return 'Không xác định';
                          }
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleViewDetails(ticket)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Xem chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create Ticket Modal */}
        {showCreateModal && (
          <CreateTicketModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSuccess={handleTicketCreated}
          />
        )}

        {/* Ticket Details Modal - Inline Styles Version */}
        {showDetailsModal && selectedTicket && (
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999
            }}
            onClick={() => setShowDetailsModal(false)}
          >
            <div 
              style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '24px',
                maxWidth: '600px',
                width: '90%',
                maxHeight: '80vh',
                overflowY: 'auto',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                  Chi tiết Ticket
                </h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    color: '#6B7280',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  ×
                </button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                    Ticket Number
                  </label>
                  <p style={{ margin: 0, fontSize: '14px', color: '#111827', fontFamily: 'monospace', fontWeight: 'bold' }}>
                    {selectedTicket.ticketNumber}
                  </p>
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                    Tiêu đề
                  </label>
                  <p style={{ margin: 0, fontSize: '14px', color: '#111827', fontWeight: '600' }}>
                    {selectedTicket.title}
                  </p>
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                    Mô tả
                  </label>
                  <div style={{ 
                    backgroundColor: '#F9FAFB', 
                    padding: '12px', 
                    borderRadius: '6px',
                    fontSize: '14px',
                    color: '#111827',
                    whiteSpace: 'pre-wrap',
                    minHeight: '60px'
                  }}>
                    {selectedTicket.description || 'Không có mô tả'}
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                      Trạng thái
                    </label>
                    <span style={{
                      display: 'inline-flex',
                      padding: '4px 12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      borderRadius: '9999px',
                      backgroundColor: '#D1FAE5',
                      color: '#065F46'
                    }}>
                      {selectedTicket.statusName}
                    </span>
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                      Độ ưu tiên
                    </label>
                    <span style={{
                      display: 'inline-flex',
                      padding: '4px 12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      borderRadius: '9999px',
                      backgroundColor: '#FEF3C7',
                      color: '#92400E'
                    }}>
                      {selectedTicket.priorityLevel}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                    Ngày tạo
                  </label>
                  <p style={{ margin: 0, fontSize: '14px', color: '#111827' }}>
                    {new Date(selectedTicket.createdAt).toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>
              
              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  style={{
                    backgroundColor: '#2563EB',
                    color: 'white',
                    padding: '8px 24px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#1D4ED8'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#2563EB'}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketPageNew;