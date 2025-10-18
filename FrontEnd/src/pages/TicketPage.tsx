import React, { useState, useEffect } from 'react';
import AuthChatService from '../services/AuthChatService';
import { getApiUrl, API_CONFIG } from '../config/api';

interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: 'Open' | 'Pending' | 'Resolved' | 'Closed';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  departmentId?: string;
  assigneeId?: string;
  customerId: string;
  createdAt: string;
  updatedAt: string;
}

interface Department {
  id: string;
  name: string;
}

interface Agent {
  id: string;
  name: string;
  email: string;
}

const TicketPage: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    departmentId: '',
    assignee: '',
    search: ''
  });

  // Form states
  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    departmentId: ''
  });

  const [updateTicket, setUpdateTicket] = useState({
    status: '',
    priority: '',
    assignee: '',
    description: ''
  });

  useEffect(() => {
    const currentUser = AuthChatService.getCurrentUser();
    console.log('🎫 TicketPage - Current user:', currentUser);
    if (!currentUser) {
      window.location.href = '/login';
      return;
    }
    
    setUser(currentUser);
    loadData();
    
    // Listen for ticket updates
    const handleTicketUpdate = () => {
      console.log('TicketPage: Ticket updated, reloading...');
      loadData();
    };
    
    window.addEventListener('ticketUpdated', handleTicketUpdate);
    
    return () => {
      window.removeEventListener('ticketUpdated', handleTicketUpdate);
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load tickets
      const ticketsResponse = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.TICKETS), {
        headers: {
          'Authorization': `Bearer ${AuthChatService.getToken()}`
        }
      });
      const ticketsData = await ticketsResponse.json();
      setTickets(ticketsData.tickets || []);

      // Load departments (categories)
      try {
        const departmentsResponse = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.DEPARTMENTS));
        const departmentsData = await departmentsResponse.json();
        setDepartments(departmentsData.departments || []);
      } catch (error) {
        console.warn('⚠️ API departments failed, using mock data:', error);
        // Fallback: Use mock departments
        const mockDepartments = [
          { id: '1', name: 'Payment - Khẩn cấp', priority: 'Urgent' },
          { id: '2', name: 'Order & Shipping - Cao', priority: 'High' },
          { id: '3', name: 'Product & Return - Trung bình', priority: 'Medium' },
          { id: '4', name: 'Technical Support - Thấp', priority: 'Low' },
          { id: '5', name: 'General Inquiry - Trung bình', priority: 'Medium' }
        ];
        setDepartments(mockDepartments);
      }

      // Load agents (only for admin/agent)
      if (user?.role === 'admin' || user?.role === 'agent') {
        const agentsResponse = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.AGENTS), {
          headers: {
            'Authorization': `Bearer ${AuthChatService.getToken()}`
          }
        });
        const agentsData = await agentsResponse.json();
        setAgents(agentsData.agents || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Auto-assign priority based on department
      const getPriorityByDepartment = (departmentId: string) => {
        const department = departments.find(d => d.id === departmentId);
        if (!department) return 'Medium';
        
        switch (department.name.toLowerCase()) {
          case 'payment': return 'Urgent'; // Payment issues are urgent
          case 'order': return 'High';    // Order issues are high priority
          case 'shipping': return 'High'; // Shipping issues are high priority
          case 'return': return 'Medium'; // Returns are medium priority
          case 'product': return 'Medium'; // Product questions are medium priority
          default: return 'Medium';       // Others are medium priority
        }
      };

      const ticketData = {
        ...newTicket,
        priority: getPriorityByDepartment(newTicket.departmentId)
      };

      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.TICKETS), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AuthChatService.getToken()}`
        },
        body: JSON.stringify(ticketData)
      });

      if (response.ok) {
        setNewTicket({ subject: '', description: '', departmentId: '' });
        setShowCreateForm(false);
        loadData();
        // Dispatch ticket updated event
        window.dispatchEvent(new CustomEvent('ticketUpdated'));
        alert('Yêu cầu hỗ trợ đã được gửi thành công! Độ ưu tiên sẽ được xác định dựa trên loại vấn đề.');
      } else {
        const error = await response.json();
        alert(`Lỗi: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
        alert('Có lỗi xảy ra khi gửi yêu cầu hỗ trợ');
    }
  };

  const handleUpdateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    try {
      const response = await fetch(getApiUrl(`/api/tickets/${selectedTicket.id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AuthChatService.getToken()}`
        },
        body: JSON.stringify(updateTicket)
      });

      if (response.ok) {
        setSelectedTicket(null);
        loadData();
        alert('Yêu cầu hỗ trợ đã được cập nhật thành công!');
      } else {
        const error = await response.json();
        alert(`Lỗi: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating ticket:', error);
        alert('Có lỗi xảy ra khi cập nhật yêu cầu hỗ trợ');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return '#059669';
      case 'Pending': return '#d97706';
      case 'Resolved': return '#2563eb';
      case 'Closed': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent': return '#dc2626';
      case 'High': return '#ea580c';
      case 'Medium': return '#d97706';
      case 'Low': return '#059669';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'Open': return 'Mở';
      case 'Pending': return 'Đang xử lý';
      case 'Resolved': return 'Đã giải quyết';
      case 'Closed': return 'Đã đóng';
      default: return status;
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'Urgent': return 'Khẩn cấp';
      case 'High': return 'Cao';
      case 'Medium': return 'Trung bình';
      case 'Low': return 'Thấp';
      default: return priority;
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    return (
      (!filters.status || ticket.status === filters.status) &&
      (!filters.priority || ticket.priority === filters.priority) &&
      (!filters.departmentId || ticket.departmentId === filters.departmentId) &&
      (!filters.assignee || ticket.assignee === filters.assignee) &&
      (!filters.search || 
        ticket.subject.toLowerCase().includes(filters.search.toLowerCase()) ||
        ticket.description.toLowerCase().includes(filters.search.toLowerCase()))
    );
  });

  if (loading) {
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
          <p style={{ color: '#5f6368' }}>Đang tải tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: '600',
            color: '#1f2937',
            margin: 0
          }}>
            Hỗ trợ khách hàng
          </h1>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              Role: {user?.role || 'Unknown'}
            </span>
            <button
              onClick={() => setShowCreateForm(true)}
              style={{
                backgroundColor: '#059669',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                border: 'none',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#047857';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#059669';
              }}
            >
              + Tạo ticket mới
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          marginBottom: '2rem'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Tìm kiếm
              </label>
              <input
                type="text"
                placeholder="Tìm kiếm tickets..."
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Trạng thái
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '1rem'
                }}
              >
                <option value="">Tất cả trạng thái</option>
                  <option value="Open">Mở</option>
                  <option value="Pending">Đang xử lý</option>
                  <option value="Resolved">Đã giải quyết</option>
                  <option value="Closed">Đã đóng</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Độ ưu tiên
              </label>
              <select
                value={filters.priority}
                onChange={(e) => setFilters({...filters, priority: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '1rem'
                }}
              >
                <option value="">Tất cả độ ưu tiên</option>
                  <option value="Urgent">Khẩn cấp</option>
                  <option value="High">Cao</option>
                  <option value="Medium">Trung bình</option>
                  <option value="Low">Thấp</option>
              </select>
            </div>

            {departments.length > 0 && (
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Phòng ban
                </label>
                <select
                  value={filters.departmentId}
                  onChange={(e) => setFilters({...filters, departmentId: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                >
                  <option value="">Tất cả phòng ban</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Tickets List */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}>
          {filteredTickets.length === 0 ? (
            <div style={{
              padding: '3rem',
              textAlign: 'center',
              color: '#6b7280'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
              <p>Không có tickets nào</p>
            </div>
          ) : (
            filteredTickets.map(ticket => (
              <div
                key={ticket.id}
                style={{
                  padding: '1.5rem',
                  borderBottom: '1px solid #e5e7eb',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onClick={() => setSelectedTicket(ticket)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '0.5rem'
                }}>
                  <h3 style={{
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    color: '#1f2937',
                    margin: 0
                  }}>
                    {ticket.subject}
                  </h3>
                  
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span style={{
                      backgroundColor: getStatusColor(ticket.status),
                      color: 'white',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      fontWeight: '500'
                    }}>
                      {getStatusText(ticket.status)}
                    </span>
                    
                    <span style={{
                      backgroundColor: getPriorityColor(ticket.priority),
                      color: 'white',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      fontWeight: '500'
                    }}>
                      {getPriorityText(ticket.priority)}
                    </span>
                  </div>
                </div>
                
                <p style={{
                  color: '#6b7280',
                  margin: '0.5rem 0',
                  fontSize: '0.9rem',
                  lineHeight: '1.5'
                }}>
                  {ticket.description && ticket.description.length > 100 
                    ? `${ticket.description.substring(0, 100)}...` 
                    : ticket.description || 'Không có mô tả'
                  }
                </p>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.8rem',
                  color: '#9ca3af'
                }}>
                  <span>Phòng ban: {departments.find(d => d.id === ticket.departmentId)?.name || 'Chưa phân loại'}</span>
                  <span>Tạo lúc: {new Date(ticket.createdAt).toLocaleString('vi-VN')}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create Ticket Modal */}
        {showCreateForm && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '12px',
              width: '90%',
              maxWidth: '500px',
              maxHeight: '90vh',
              overflow: 'auto'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                marginBottom: '1.5rem',
                color: '#1f2937'
              }}>
                Gửi yêu cầu hỗ trợ
              </h2>
              
              <form onSubmit={handleCreateTicket}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Tiêu đề *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTicket.subject}
                    onChange={(e) => setNewTicket({...newTicket, subject: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '1rem'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Mô tả *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={newTicket.description}
                    onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '1rem',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Phòng ban *
                  </label>
                  <select
                    value={newTicket.departmentId}
                    onChange={(e) => setNewTicket({...newTicket, departmentId: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '1rem'
                    }}
                  >
                    <option value="">Chọn phòng ban</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>

                {/* Priority Info */}
                <div style={{
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '8px',
                  padding: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.5rem'
                  }}>
                    <span style={{ color: '#059669', fontSize: '1rem' }}>ℹ️</span>
                    <span style={{ fontWeight: '500', color: '#059669' }}>
                      Độ ưu tiên tự động
                    </span>
                  </div>
                  <p style={{
                    fontSize: '0.9rem',
                    color: '#6b7280',
                    margin: 0,
                    lineHeight: '1.4'
                  }}>
                    Độ ưu tiên sẽ được tự động xác định dựa trên phòng ban bạn chọn:
                    <br />• <strong>Payment</strong>: Khẩn cấp
                    <br />• <strong>Order & Shipping</strong>: Cao
                    <br />• <strong>Product & Return</strong>: Trung bình
                  </p>
                </div>

                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  justifyContent: 'flex-end'
                }}>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    style={{
                      padding: '0.75rem 1.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      backgroundColor: 'white',
                      color: '#374151',
                      fontSize: '1rem',
                      cursor: 'pointer'
                    }}
                  >
                    Hủy
                  </button>
                  
                  <button
                    type="submit"
                    style={{
                      padding: '0.75rem 1.5rem',
                      border: 'none',
                      borderRadius: '6px',
                      backgroundColor: '#059669',
                      color: 'white',
                      fontSize: '1rem',
                      cursor: 'pointer'
                    }}
                  >
                    Gửi yêu cầu
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Ticket Detail Modal */}
        {selectedTicket && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '12px',
              width: '90%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflow: 'auto'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem'
              }}>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  color: '#1f2937',
                  margin: 0
                }}>
                  Chi tiết Ticket
                </h2>
                
                <button
                  onClick={() => setSelectedTicket(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    color: '#6b7280'
                  }}
                >
                  ×
                </button>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  {selectedTicket.subject}
                </h3>
                
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  <span style={{
                    backgroundColor: getStatusColor(selectedTicket.status),
                    color: 'white',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    fontSize: '0.8rem',
                    fontWeight: '500'
                  }}>
                    {getStatusText(selectedTicket.status)}
                  </span>
                  
                  <span style={{
                    backgroundColor: getPriorityColor(selectedTicket.priority),
                    color: 'white',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    fontSize: '0.8rem',
                    fontWeight: '500'
                  }}>
                    {getPriorityText(selectedTicket.priority)}
                  </span>
                </div>

                <p style={{
                  color: '#374151',
                  lineHeight: '1.6',
                  marginBottom: '1rem'
                }}>
                  {selectedTicket.description}
                </p>

                <div style={{
                  fontSize: '0.9rem',
                  color: '#6b7280',
                  marginBottom: '1rem'
                }}>
                  <p><strong>Phòng ban:</strong> {departments.find(d => d.id === selectedTicket.departmentId)?.name || 'Chưa phân loại'}</p>
                  <p><strong>Tạo lúc:</strong> {new Date(selectedTicket.createdAt).toLocaleString('vi-VN')}</p>
                  <p><strong>Cập nhật lúc:</strong> {new Date(selectedTicket.updatedAt).toLocaleString('vi-VN')}</p>
                </div>
              </div>

              {/* Update Form for Admin/Agent */}
              {(user?.role === 'admin' || user?.role === 'agent') && (
                <form onSubmit={handleUpdateTicket}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>
                    Cập nhật Ticket
                  </h3>
                  
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                      Trạng thái
                    </label>
                    <select
                      value={updateTicket.status}
                      onChange={(e) => setUpdateTicket({...updateTicket, status: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '1rem'
                      }}
                    >
                      <option value="">Giữ nguyên</option>
                  <option value="Open">Mở</option>
                  <option value="Pending">Đang xử lý</option>
                  <option value="Resolved">Đã giải quyết</option>
                  <option value="Closed">Đã đóng</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                      Độ ưu tiên
                    </label>
                    <select
                      value={updateTicket.priority}
                      onChange={(e) => setUpdateTicket({...updateTicket, priority: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '1rem'
                      }}
                    >
                      <option value="">Giữ nguyên</option>
                      <option value="low">Thấp</option>
                      <option value="medium">Trung bình</option>
                      <option value="high">Cao</option>
                      <option value="urgent">Khẩn cấp</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                      Giao cho
                    </label>
                    <select
                      value={updateTicket.assignee}
                      onChange={(e) => setUpdateTicket({...updateTicket, assignee: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '1rem'
                      }}
                    >
                      <option value="">Chọn agent</option>
                      {agents.map(agent => (
                        <option key={agent.id} value={agent.id}>{agent.name}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '1rem',
                    justifyContent: 'flex-end'
                  }}>
                    <button
                      type="button"
                      onClick={() => setSelectedTicket(null)}
                      style={{
                        padding: '0.75rem 1.5rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        backgroundColor: 'white',
                        color: '#374151',
                        fontSize: '1rem',
                        cursor: 'pointer'
                      }}
                    >
                      Đóng
                    </button>
                    
                    <button
                      type="submit"
                      style={{
                        padding: '0.75rem 1.5rem',
                        border: 'none',
                        borderRadius: '6px',
                        backgroundColor: '#059669',
                        color: 'white',
                        fontSize: '1rem',
                        cursor: 'pointer'
                      }}
                    >
                      Cập nhật
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketPage;
