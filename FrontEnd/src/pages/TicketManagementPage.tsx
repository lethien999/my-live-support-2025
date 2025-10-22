import React, { useState, useEffect } from 'react';
import TicketService, { Ticket, TicketCategory, TicketPriority, TicketStatus } from '../services/TicketService';

// =============================================
// TICKET MANAGEMENT PAGE
// =============================================

const TicketManagementPage: React.FC = () => {
  // State management
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    status: '',
    priority: '',
    category: '',
    search: ''
  });
  
  // Metadata
  const [categories, setCategories] = useState<TicketCategory[]>([]);
  const [priorities, setPriorities] = useState<TicketPriority[]>([]);
  const [statuses, setStatuses] = useState<TicketStatus[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  
  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load tickets when filters change
  useEffect(() => {
    loadTickets();
  }, [filters]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Load metadata in parallel
      const [categoriesRes, prioritiesRes, statusesRes, statisticsRes] = await Promise.all([
        TicketService.getCategories(),
        TicketService.getPriorities(),
        TicketService.getStatuses(),
        TicketService.getStatistics()
      ]);

      setCategories(categoriesRes.categories);
      setPriorities(prioritiesRes.priorities);
      setStatuses(statusesRes.statuses);
      setStatistics(statisticsRes.statistics);
      
    } catch (error: any) {
      console.error('Error loading initial data:', error);
      setError('Không thể tải dữ liệu ban đầu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadTickets = async () => {
    try {
      // Convert string filters to numbers where needed
      const ticketFilters = {
        ...filters,
        status: filters.status ? parseInt(filters.status) : undefined,
        priority: filters.priority ? parseInt(filters.priority) : undefined,
        category: filters.category ? parseInt(filters.category) : undefined
      };
      
      const response = await TicketService.getTickets(ticketFilters);
      
      if (response.success) {
        setTickets(response.tickets);
        setPagination(response.pagination);
      } else {
        setError(response.message || 'Không thể tải danh sách ticket');
      }
    } catch (error: any) {
      console.error('Error loading tickets:', error);
      setError('Không thể tải danh sách ticket: ' + error.message);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filter changes
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const getPriorityColor = (priorityLevel: number) => {
    const priority = priorities.find(p => p.priorityLevel === priorityLevel);
    return priority?.colorCode || '#007bff';
  };

  const getStatusColor = (statusName: string) => {
    switch (statusName.toLowerCase()) {
      case 'mới': return '#28a745';
      case 'đang xử lý': return '#ffc107';
      case 'chờ phản hồi': return '#17a2b8';
      case 'đã giải quyết': return '#6c757d';
      case 'đã đóng': return '#343a40';
      default: return '#007bff';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Lỗi tải dữ liệu</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={loadInitialData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🎫 Quản lý Ticket</h1>
              <p className="text-gray-600">Hệ thống hỗ trợ khách hàng</p>
            </div>
            
            {/* Statistics */}
            {statistics && (
              <div className="flex space-x-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{statistics.totalTickets}</div>
                  <div className="text-sm text-gray-600">Tổng ticket</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{statistics.openTickets}</div>
                  <div className="text-sm text-gray-600">Đang mở</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">{statistics.closedTickets}</div>
                  <div className="text-sm text-gray-600">Đã đóng</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar - Filters */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🔍 Bộ lọc</h3>
              
              {/* Search */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tìm kiếm
                </label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Tìm theo tiêu đề, mô tả..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Status Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trạng thái
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tất cả</option>
                  {statuses.map(status => (
                    <option key={status.statusId} value={status.statusId}>
                      {status.statusName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Độ ưu tiên
                </label>
                <select
                  value={filters.priority}
                  onChange={(e) => handleFilterChange('priority', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tất cả</option>
                  {priorities.map(priority => (
                    <option key={priority.priorityId} value={priority.priorityId}>
                      {priority.priorityName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Danh mục
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tất cả</option>
                  {categories.map(category => (
                    <option key={category.categoryId} value={category.categoryId}>
                      {category.categoryName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clear Filters */}
              <button
                onClick={() => setFilters({
                  page: 1,
                  limit: 20,
                  status: '',
                  priority: '',
                  category: '',
                  search: ''
                })}
                className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
              >
                Xóa bộ lọc
              </button>
            </div>
          </div>

          {/* Right Content - Ticket List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm">
              {/* Ticket List Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Danh sách Ticket ({pagination.total})
                  </h3>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                    + Tạo ticket mới
                  </button>
                </div>
              </div>

              {/* Ticket List */}
              <div className="divide-y divide-gray-200">
                {tickets.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <div className="text-gray-400 text-6xl mb-4">🎫</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Không có ticket nào</h3>
                    <p className="text-gray-600">Thử thay đổi bộ lọc hoặc tạo ticket mới</p>
                  </div>
                ) : (
                  tickets.map(ticket => (
                    <div
                      key={ticket.ticketId}
                      className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="text-sm font-medium text-gray-900">
                              {ticket.ticketNumber}
                            </span>
                            <span
                              className="px-2 py-1 text-xs font-medium rounded-full text-white"
                              style={{ backgroundColor: getStatusColor(ticket.statusName) }}
                            >
                              {ticket.statusName}
                            </span>
                            <span
                              className="px-2 py-1 text-xs font-medium rounded-full text-white"
                              style={{ backgroundColor: getPriorityColor(ticket.priorityLevel) }}
                            >
                              {ticket.priorityName}
                            </span>
                          </div>
                          
                          <h4 className="text-lg font-medium text-gray-900 mb-1">
                            {ticket.title}
                          </h4>
                          
                          <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                            {ticket.description}
                          </p>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>👤 {ticket.customerName}</span>
                            <span>📁 {ticket.categoryName}</span>
                            <span>📅 {formatDate(ticket.createdAt)}</span>
                            {ticket.agentName && (
                              <span>👨‍💼 {ticket.agentName}</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="ml-4 flex-shrink-0">
                          <div className="text-right text-sm text-gray-500">
                            {ticket.comments && ticket.comments.length > 0 && (
                              <div className="mb-1">
                                💬 {ticket.comments.length} bình luận
                              </div>
                            )}
                            {ticket.attachments && ticket.attachments.length > 0 && (
                              <div>
                                📎 {ticket.attachments.length} tệp đính kèm
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Hiển thị {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} trong {pagination.total} ticket
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Trước
                      </button>
                      
                      {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                        const page = pagination.page - 2 + i;
                        if (page < 1 || page > pagination.pages) return null;
                        
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-1 text-sm border rounded-md ${
                              page === pagination.page
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.pages}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Sau
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedTicket.ticketNumber} - {selectedTicket.title}
                </h3>
                <p className="text-sm text-gray-600">
                  Tạo bởi {selectedTicket.customerName} • {formatDate(selectedTicket.createdAt)}
                </p>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Ticket Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                  <span
                    className="inline-block px-3 py-1 text-sm font-medium rounded-full text-white"
                    style={{ backgroundColor: getStatusColor(selectedTicket.statusName) }}
                  >
                    {selectedTicket.statusName}
                  </span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Độ ưu tiên</label>
                  <span
                    className="inline-block px-3 py-1 text-sm font-medium rounded-full text-white"
                    style={{ backgroundColor: getPriorityColor(selectedTicket.priorityLevel) }}
                  >
                    {selectedTicket.priorityName}
                  </span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
                  <span className="text-sm text-gray-900">{selectedTicket.categoryName}</span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Agent</label>
                  <span className="text-sm text-gray-900">
                    {selectedTicket.agentName || 'Chưa được giao'}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedTicket.description}</p>
                </div>
              </div>

              {/* Comments */}
              {selectedTicket.comments && selectedTicket.comments.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">💬 Bình luận</h4>
                  <div className="space-y-4">
                    {selectedTicket.comments.map(comment => (
                      <div key={comment.commentId} className="border-l-4 border-blue-200 pl-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-sm font-medium text-gray-900">
                            {comment.userName}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(comment.createdAt)}
                          </span>
                          {comment.isInternal && (
                            <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                              Nội bộ
                            </span>
                          )}
                        </div>
                        <p className="text-gray-700">{comment.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Attachments */}
              {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">📎 Tệp đính kèm</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedTicket.attachments.map(attachment => (
                      <div key={attachment.attachmentId} className="border border-gray-200 rounded-md p-4">
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">📄</div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {attachment.fileName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(attachment.fileSize)} • {attachment.fileType}
                            </p>
                            <p className="text-xs text-gray-500">
                              Tải lên bởi {attachment.uploadedByName} • {formatDate(attachment.uploadedAt)}
                            </p>
                          </div>
                          <button className="text-blue-600 hover:text-blue-800 text-sm">
                            Tải xuống
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                Đóng
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                Chỉnh sửa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketManagementPage;
