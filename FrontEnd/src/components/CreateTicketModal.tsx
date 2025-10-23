import React, { useState, useEffect } from 'react';
import { formatDate } from '../utils/dateUtils';
import TicketService, { TicketCategory, TicketPriority } from '../services/TicketService';
import AuthChatService from '../services/AuthChatService';
import { getApiUrl } from '../config/api';

// =============================================
// IMPROVED TICKET CREATION MODAL
// =============================================

interface Order {
  orderId: number;
  orderNumber: string;
  orderDate: string;
  totalAmount: number;
  status: string;
  items: Array<{
    productId: number;
    productName: string;
    quantity: number;
    price: number;
    shopName: string;
  }>;
}

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateTicketModal: React.FC<CreateTicketModalProps> = ({ isOpen, onClose, onSuccess }) => {
  // State management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    orderId: '',
    issueType: '',
    title: '',
    description: '',
    priority: '',
    attachments: [] as File[]
  });
  
  // Options
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<TicketCategory[]>([]);
  const [priorities, setPriorities] = useState<TicketPriority[]>([]);
  
  // Auto-generated title suggestions
  const [_titleSuggestions, setTitleSuggestions] = useState<string[]>([]);

  // Load data when modal opens
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  // Update title suggestions when order or issue type changes
  useEffect(() => {
    generateTitleSuggestions();
  }, [formData.orderId, formData.issueType]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load user's orders and filter completed ones without tickets
      const ordersResponse = await fetch(`${getApiUrl('/api/orders')}`, {
        headers: {
          'Authorization': `Bearer ${await AuthChatService.getToken()}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        const allOrders = ordersData.data || [];
        
        // Filter completed orders (Delivered status)
        const completedOrders = allOrders.filter((order: any) => 
          order.Status === 'Delivered' || order.Status === 'Completed'
        );
        
        console.log('🔍 CreateTicketModal: All orders:', allOrders.length);
        console.log('🔍 CreateTicketModal: Completed orders:', completedOrders.length);
        console.log('🔍 CreateTicketModal: Completed orders data:', completedOrders);
        
        // TODO: Filter out orders that already have tickets
        // For now, show all completed orders
        setOrders(completedOrders);
      }
      
      // Load categories and priorities
      const [categoriesRes, prioritiesRes] = await Promise.all([
        TicketService.getCategories(),
        TicketService.getPriorities()
      ]);
      
      setCategories(categoriesRes.categories);
      setPriorities(prioritiesRes.priorities);
      
    } catch (error: any) {
      console.error('Error loading data:', error);
      setError('Không thể tải dữ liệu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const generateTitleSuggestions = () => {
    const selectedOrder = orders.find(o => o.OrderID.toString() === formData.orderId);
    const suggestions: string[] = [];
    
    if (selectedOrder && formData.issueType) {
      switch (formData.issueType) {
        case 'product-defect':
          suggestions.push(
            `Sản phẩm lỗi trong đơn hàng #${selectedOrder.OrderNumber}`,
            `Hàng hóa bị hỏng khi nhận từ đơn #${selectedOrder.OrderNumber}`,
            `Sản phẩm không đúng mô tả trong đơn ${selectedOrder.OrderNumber}`
          );
          break;
        case 'missing-item':
          suggestions.push(
            `Thiếu sản phẩm trong đơn hàng #${selectedOrder.OrderNumber}`,
            `Không nhận đủ hàng từ đơn ${selectedOrder.OrderNumber}`,
            `Sản phẩm bị thiếu trong đơn #${selectedOrder.OrderNumber}`
          );
          break;
        case 'wrong-item':
          suggestions.push(
            `Nhận sai sản phẩm trong đơn #${selectedOrder.OrderNumber}`,
            `Hàng hóa không đúng với đơn hàng ${selectedOrder.OrderNumber}`,
            `Sản phẩm khác với đã đặt trong đơn #${selectedOrder.OrderNumber}`
          );
          break;
        case 'damaged-package':
          suggestions.push(
            `Bao bì bị hỏng đơn hàng #${selectedOrder.OrderNumber}`,
            `Đóng gói không cẩn thận đơn ${selectedOrder.OrderNumber}`,
            `Hộp đựng bị vỡ trong đơn #${selectedOrder.OrderNumber}`
          );
          break;
        case 'quality-issue':
          suggestions.push(
            `Chất lượng sản phẩm kém đơn #${selectedOrder.OrderNumber}`,
            `Hàng hóa không đạt chất lượng đơn ${selectedOrder.OrderNumber}`,
            `Sản phẩm có vấn đề chất lượng đơn #${selectedOrder.OrderNumber}`
          );
          break;
        default:
          suggestions.push(
            `Vấn đề với đơn hàng #${selectedOrder.OrderNumber}`,
            `Cần hỗ trợ đơn ${selectedOrder.OrderNumber}`,
            `Yêu cầu xử lý đơn #${selectedOrder.OrderNumber}`
          );
      }
    }
    
    setTitleSuggestions(suggestions);
  };

  const _______handleFileUpload = (_event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(_event.target.files || []);
    const validFiles = files.filter(file => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/avi'];
      
      if (file.size > maxSize) {
        alert(`File ${file.name} quá lớn (tối đa 10MB)`);
        return false;
      }
      
      if (!allowedTypes.includes(file.type)) {
        alert(`File ${file.name} không được hỗ trợ (chỉ JPG, PNG, GIF, MP4, AVI)`);
        return false;
      }
      
      return true;
    });
    
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...validFiles]
    }));
  };
  void _______handleFileUpload;

  const _______removeAttachment = (_index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== _index)
    }));
  };
  void _______removeAttachment;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.orderId || !formData.issueType || !formData.title || !formData.description) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }
    
    // Validate order selection
    if (!formData.orderId) {
      setError('Vui lòng chọn đơn hàng để tạo ticket hỗ trợ');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Create ticket - call API directly
      const ticketData = {
        title: formData.title,
        description: formData.description,
        departmentId: 1, // Default department
        priority: 'Medium', // Default priority
        orderId: formData.orderId ? parseInt(formData.orderId) : null
      };
      
      const response = await fetch(getApiUrl('/api/tickets'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await AuthChatService.getToken()}`
        },
        body: JSON.stringify(ticketData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 409) {
          // Duplicate ticket error
          setError('🚫 ' + errorData.error);
        } else {
          throw new Error(errorData.error || 'HTTP error! status: ' + response.status);
        }
        return;
      }
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Ticket created successfully:', result);
        onSuccess();
        onClose();
        
        // Reset form
        setFormData({
          orderId: '',
          issueType: '',
          title: '',
          description: '',
          priority: '',
          attachments: []
        });
      } else {
        setError(result.message || 'Không thể tạo ticket');
      }
      
    } catch (error: any) {
      console.error('Error creating ticket:', error);
      setError('Không thể tạo ticket: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const _______uploadAttachments = async (_ticketId: number, _files: File[]) => {
    const formData = new FormData();
    _files.forEach(file => {
      formData.append('attachments', file);
    });
    
    const response = await fetch(`${getApiUrl('/api/tickets')}/${_ticketId}/attachments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${await AuthChatService.getToken()}`
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('Không thể upload file đính kèm');
    }
  };
  void _______uploadAttachments;

  const _______getCategoryIdByIssueType = (_issueType: string): number => {
    const categoryMap: { [key: string]: string } = {
      'product-defect': 'Sản phẩm',
      'missing-item': 'Đơn hàng',
      'wrong-item': 'Đơn hàng',
      'damaged-package': 'Đơn hàng',
      'quality-issue': 'Sản phẩm'
    };
    
    const categoryName = categoryMap[_issueType] || 'Khác';
    const category = categories.find(c => c.categoryName === categoryName);
    return category?.categoryId || 1;
  };
  void _______getCategoryIdByIssueType;

  const _______getPriorityIdByIssueType = (_issueType: string): number => {
    const priorityMap: { [key: string]: string } = {
      'product-defect': 'Cao',
      'missing-item': 'Khẩn cấp',
      'wrong-item': 'Khẩn cấp',
      'damaged-package': 'Trung bình',
      'quality-issue': 'Cao'
    };
    
    const priorityName = priorityMap[_issueType] || 'Trung bình';
    const priority = priorities.find(p => p.priorityName === priorityName);
    return priority?.priorityId || 2;
  };
  void _______getPriorityIdByIssueType;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDateSafe = (dateString: string) => {
    return formatDate(dateString);
  };

  if (!isOpen) return null;
  
  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
          width: '100%',
          maxWidth: '600px',
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '24px 24px 0 24px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                backgroundColor: '#dbeafe', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                marginRight: '12px'
              }}>
                <span style={{ fontSize: '20px' }}>🎫</span>
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#111827' }}>
                  Tạo yêu cầu hỗ trợ
                </h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
                  Mô tả vấn đề với đơn hàng của bạn
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6b7280'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Order Selection */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Chọn đơn hàng *
              </label>
              <select
                value={formData.orderId}
                onChange={(e) => setFormData(prev => ({ ...prev, orderId: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: 'white'
                }}
                required
              >
                <option value="">-- Chọn đơn hàng --</option>
                {orders.map(order => (
                  <option key={order.OrderID} value={order.OrderID}>
                    Đơn #{order.OrderNumber} - {formatDate(order.CreatedAt)} - {formatCurrency(order.TotalAmount)}
                  </option>
                ))}
              </select>
            </div>

            {/* Issue Type */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '12px' }}>
                Loại vấn đề *
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { value: 'product-defect', label: 'Sản phẩm bị lỗi', icon: '🔧' },
                  { value: 'missing-item', label: 'Thiếu sản phẩm', icon: '📦' },
                  { value: 'wrong-item', label: 'Nhận sai sản phẩm', icon: '🔄' },
                  { value: 'damaged-package', label: 'Bao bì bị hỏng', icon: '📦' },
                  { value: 'quality-issue', label: 'Chất lượng kém', icon: '⭐' },
                  { value: 'other', label: 'Vấn đề khác', icon: '❓' }
                ].map(option => (
                  <label key={option.value} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="issueType"
                      value={option.value}
                      checked={formData.issueType === option.value}
                      onChange={(e) => setFormData(prev => ({ ...prev, issueType: e.target.value }))}
                      style={{ marginRight: '12px' }}
                    />
                    <span style={{ marginRight: '8px', fontSize: '16px' }}>{option.icon}</span>
                    <span style={{ fontSize: '14px', color: '#374151' }}>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Tiêu đề *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Nhập tiêu đề yêu cầu hỗ trợ..."
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
                required
              />
            </div>

            {/* Description */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Mô tả chi tiết *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Mô tả chi tiết vấn đề bạn gặp phải..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  resize: 'none'
                }}
                required
              />
            </div>

            {/* Error Message */}
            {error && (
              <div style={{ 
                padding: '12px', 
                backgroundColor: '#fef2f2', 
                border: '1px solid #fecaca', 
                borderRadius: '8px',
                color: '#dc2626',
                fontSize: '14px'
              }}>
                ❌ {error}
              </div>
            )}

            {/* Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '12px 24px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  color: '#374151',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: loading ? '#9ca3af' : '#2563eb',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Đang tạo...' : 'Tạo ticket'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateTicketModal;
