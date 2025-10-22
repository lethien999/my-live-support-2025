// Chat Routing Service - Chuyển chat từ chatbot sang agent
export interface ChatRoutingRequest {
  roomId: string;
  customerId: string;
  customerName: string;
  reason: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  context?: {
    lastMessage?: string;
    messageCount?: number;
    timeInChat?: number;
    productInterested?: string;
  };
}

export interface ChatRoutingResponse {
  success: boolean;
  agentId?: string;
  agentName?: string;
  estimatedWaitTime?: number;
  message?: string;
}

export class ChatRoutingService {
  private static instance: ChatRoutingService;
  private routingQueue: ChatRoutingRequest[] = [];
  private availableAgents: Set<string> = new Set();
  private listeners: ((response: ChatRoutingResponse) => void)[] = [];

  static getInstance(): ChatRoutingService {
    if (!ChatRoutingService.instance) {
      ChatRoutingService.instance = new ChatRoutingService();
    }
    return ChatRoutingService.instance;
  }

  // Thêm listener cho routing responses
  addListener(listener: (response: ChatRoutingResponse) => void) {
    this.listeners.push(listener);
  }

  // Xóa listener
  removeListener(listener: (response: ChatRoutingResponse) => void) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  // Yêu cầu chuyển chat sang agent
  async requestAgentTransfer(request: ChatRoutingRequest): Promise<ChatRoutingResponse> {
    try {
      console.log('🔄 Chat routing request:', request);

      // Thêm vào queue
      this.routingQueue.push(request);

      // Gửi request đến backend
      const response = await fetch('/api/chat/route-to-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Thông báo cho listeners
      this.listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error('Error in chat routing listener:', error);
        }
      });

      // Dispatch event
      window.dispatchEvent(new CustomEvent('chatRoutingResponse', {
        detail: data
      }));

      return data;
    } catch (error) {
      console.error('Error requesting agent transfer:', error);
      return {
        success: false,
        message: 'Không thể chuyển chat sang agent. Vui lòng thử lại sau.'
      };
    }
  }

  // Tạo routing request từ context hiện tại
  createRoutingRequest(
    roomId: string, 
    customerId: string, 
    customerName: string, 
    reason: string,
    context?: any
  ): ChatRoutingRequest {
    return {
      roomId,
      customerId,
      customerName,
      reason,
      priority: this.determinePriority(reason, context),
      context: {
        lastMessage: context?.lastMessage,
        messageCount: context?.messageCount || 0,
        timeInChat: context?.timeInChat || 0,
        productInterested: context?.productInterested
      }
    };
  }

  // Xác định độ ưu tiên dựa trên lý do
  private determinePriority(reason: string, context?: any): 'low' | 'medium' | 'high' | 'urgent' {
    const urgentKeywords = ['urgent', 'emergency', 'cấp bách', 'khẩn cấp', 'lỗi', 'bug'];
    const highKeywords = ['complaint', 'khiếu nại', 'phàn nàn', 'không hài lòng', 'refund', 'hoàn tiền'];
    const mediumKeywords = ['question', 'câu hỏi', 'hỏi', 'tư vấn', 'advice'];
    
    const lowerReason = reason.toLowerCase();
    
    if (urgentKeywords.some(keyword => lowerReason.includes(keyword))) {
      return 'urgent';
    }
    
    if (highKeywords.some(keyword => lowerReason.includes(keyword))) {
      return 'high';
    }
    
    if (mediumKeywords.some(keyword => lowerReason.includes(keyword))) {
      return 'medium';
    }
    
    // Nếu có nhiều tin nhắn hoặc thời gian chat lâu
    if (context?.messageCount > 5 || context?.timeInChat > 300000) { // 5 phút
      return 'high';
    }
    
    return 'low';
  }

  // Lấy queue hiện tại
  getRoutingQueue(): ChatRoutingRequest[] {
    return [...this.routingQueue];
  }

  // Xóa request khỏi queue
  removeFromQueue(roomId: string) {
    this.routingQueue = this.routingQueue.filter(req => req.roomId !== roomId);
  }

  // Đánh dấu agent có sẵn
  setAgentAvailable(agentId: string) {
    this.availableAgents.add(agentId);
  }

  // Đánh dấu agent không có sẵn
  setAgentUnavailable(agentId: string) {
    this.availableAgents.delete(agentId);
  }

  // Lấy danh sách agent có sẵn
  getAvailableAgents(): string[] {
    return Array.from(this.availableAgents);
  }

  // Tạo quick action cho routing
  createRoutingQuickAction(roomId: string, customerId: string, customerName: string) {
    return {
      id: 'route_to_agent',
      text: 'Chuyển sang nhân viên',
      icon: '👨‍💼',
      action: 'route_to_agent',
      category: 'support',
      onClick: () => {
        const request = this.createRoutingRequest(
          roomId,
          customerId,
          customerName,
          'Khách hàng yêu cầu hỗ trợ từ nhân viên'
        );
        this.requestAgentTransfer(request);
      }
    };
  }

  // Tạo routing message cho agent
  createRoutingMessage(request: ChatRoutingRequest): any {
    return {
      id: `routing_${Date.now()}`,
      content: `🔄 Yêu cầu chuyển chat sang agent\n\nKhách hàng: ${request.customerName}\nLý do: ${request.reason}\nĐộ ưu tiên: ${request.priority}`,
      senderId: 'system',
      senderName: 'Hệ thống',
      senderRole: 'System',
      roomId: request.roomId,
      timestamp: new Date().toISOString(),
      type: 'routing_request',
      routingRequest: request
    };
  }
}
