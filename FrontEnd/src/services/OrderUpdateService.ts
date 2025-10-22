// Order Update Service - Xử lý cập nhật đơn hàng trong chat
export interface OrderUpdate {
  orderId: string;
  status: string;
  message: string;
  timestamp: string;
  details?: {
    trackingNumber?: string;
    estimatedDelivery?: string;
    actualDelivery?: string;
    location?: string;
  };
}

export interface OrderStatusUpdate {
  orderId: string;
  oldStatus: string;
  newStatus: string;
  message: string;
  timestamp: string;
}

export class OrderUpdateService {
  private static instance: OrderUpdateService;
  private orderUpdates: Map<string, OrderUpdate[]> = new Map();
  private listeners: ((update: OrderUpdate) => void)[] = [];

  static getInstance(): OrderUpdateService {
    if (!OrderUpdateService.instance) {
      OrderUpdateService.instance = new OrderUpdateService();
    }
    return OrderUpdateService.instance;
  }

  // Thêm listener cho order updates
  addListener(listener: (update: OrderUpdate) => void) {
    this.listeners.push(listener);
  }

  // Xóa listener
  removeListener(listener: (update: OrderUpdate) => void) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  // Tạo order update message
  createOrderUpdateMessage(update: OrderUpdate): any {
    const statusMessages = {
      'pending': 'Đơn hàng đã được đặt và đang chờ xử lý',
      'processing': 'Đơn hàng đang được xử lý',
      'shipped': 'Đơn hàng đã được giao cho đơn vị vận chuyển',
      'delivered': 'Đơn hàng đã được giao thành công',
      'cancelled': 'Đơn hàng đã bị hủy',
      'returned': 'Đơn hàng đã được trả lại'
    };

    const statusMessage = statusMessages[update.status as keyof typeof statusMessages] || update.message;

    return {
      id: `order_update_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: `📦 Cập nhật đơn hàng #${update.orderId}\n\n${statusMessage}`,
      senderId: 'system',
      senderName: 'Hệ thống',
      senderRole: 'System',
      roomId: update.orderId,
      timestamp: update.timestamp,
      type: 'order_update',
      orderUpdate: update
    };
  }

  // Tạo order card message
  createOrderCardMessage(order: any): any {
    return {
      id: `order_card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: 'Thông tin đơn hàng của bạn:',
      senderId: 'system',
      senderName: 'Hệ thống',
      senderRole: 'System',
      roomId: order.id,
      timestamp: new Date().toISOString(),
      type: 'order_card',
      order: {
        id: order.id,
        status: order.status,
        total: order.total,
        items: order.items || [],
        createdAt: order.createdAt,
        estimatedDelivery: order.estimatedDelivery
      }
    };
  }

  // Gửi order update
  sendOrderUpdate(update: OrderUpdate) {
    // Lưu update vào storage
    if (!this.orderUpdates.has(update.orderId)) {
      this.orderUpdates.set(update.orderId, []);
    }
    this.orderUpdates.get(update.orderId)!.push(update);

    // Tạo message
    const message = this.createOrderUpdateMessage(update);

    // Thông báo cho tất cả listeners
    this.listeners.forEach(listener => {
      try {
        listener(update);
      } catch (error) {
        console.error('Error in order update listener:', error);
      }
    });

    // Dispatch event để frontend có thể lắng nghe
    window.dispatchEvent(new CustomEvent('orderUpdate', {
      detail: { update, message }
    }));

    console.log('📦 Order update sent:', update);
    return message;
  }

  // Lấy lịch sử updates của một đơn hàng
  getOrderUpdates(orderId: string): OrderUpdate[] {
    return this.orderUpdates.get(orderId) || [];
  }

  // Lấy tất cả order updates
  getAllOrderUpdates(): Map<string, OrderUpdate[]> {
    return this.orderUpdates;
  }

  // Xóa order updates của một đơn hàng
  clearOrderUpdates(orderId: string) {
    this.orderUpdates.delete(orderId);
  }

  // Xóa tất cả order updates
  clearAllOrderUpdates() {
    this.orderUpdates.clear();
  }

  // Tạo order status update từ webhook hoặc API
  createStatusUpdate(orderId: string, _oldStatus: string, newStatus: string, details?: any): OrderUpdate {
    const statusMessages = {
      'pending': 'Đơn hàng đã được đặt và đang chờ xử lý',
      'processing': 'Đơn hàng đang được xử lý tại kho',
      'shipped': 'Đơn hàng đã được giao cho đơn vị vận chuyển',
      'delivered': 'Đơn hàng đã được giao thành công',
      'cancelled': 'Đơn hàng đã bị hủy',
      'returned': 'Đơn hàng đã được trả lại'
    };

    const message = statusMessages[newStatus as keyof typeof statusMessages] || `Đơn hàng đã chuyển sang trạng thái: ${newStatus}`;

    return {
      orderId,
      status: newStatus,
      message,
      timestamp: new Date().toISOString(),
      details: details || {}
    };
  }

  // Simulate order status changes (for testing)
  simulateOrderStatusChange(orderId: string, currentStatus: string) {
    const statusFlow = ['pending', 'processing', 'shipped', 'delivered'];
    const currentIndex = statusFlow.indexOf(currentStatus);
    
    if (currentIndex < statusFlow.length - 1) {
      const nextStatus = statusFlow[currentIndex + 1];
      const update = this.createStatusUpdate(orderId, currentStatus, nextStatus, {
        trackingNumber: `TRK${Date.now()}`,
        estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('vi-VN')
      });
      
      this.sendOrderUpdate(update);
      return update;
    }
    
    return null;
  }
}
