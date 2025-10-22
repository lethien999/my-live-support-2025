// Quick Reply Service - Tạo quick reply buttons cho chatbot
export interface QuickReplyButton {
  id: string;
  text: string;
  icon?: string;
  action?: string;
  category?: string;
}

export class QuickReplyService {
  // Quick reply buttons cho tin nhắn đầu tiên
  static getWelcomeQuickReplies(): QuickReplyButton[] {
    return [
      {
        id: 'product_info',
        text: 'Có phải hàng chính hãng không?',
        icon: '✅',
        action: 'ask_authenticity',
        category: 'product'
      },
      {
        id: 'delivery_info',
        text: 'Đặt hàng thì đơn hàng của tôi được giao?',
        icon: '🚚',
        action: 'ask_delivery',
        category: 'delivery'
      },
      {
        id: 'stock_info',
        text: 'Hàng có sẵn không?',
        icon: '📦',
        action: 'ask_stock',
        category: 'stock'
      },
      {
        id: 'price_info',
        text: 'Giá cả như thế nào?',
        icon: '💰',
        action: 'ask_price',
        category: 'price'
      },
      {
        id: 'support_info',
        text: 'Cần hỗ trợ kỹ thuật',
        icon: '🔧',
        action: 'ask_support',
        category: 'support'
      }
    ];
  }

  // Quick reply buttons cho câu hỏi về sản phẩm
  static getProductQuickReplies(): QuickReplyButton[] {
    return [
      {
        id: 'product_details',
        text: 'Chi tiết sản phẩm',
        icon: '📋',
        action: 'ask_product_details',
        category: 'product'
      },
      {
        id: 'product_specs',
        text: 'Thông số kỹ thuật',
        icon: '⚙️',
        action: 'ask_specs',
        category: 'product'
      },
      {
        id: 'product_reviews',
        text: 'Đánh giá khách hàng',
        icon: '⭐',
        action: 'ask_reviews',
        category: 'product'
      },
      {
        id: 'product_compare',
        text: 'So sánh sản phẩm',
        icon: '⚖️',
        action: 'ask_compare',
        category: 'product'
      }
    ];
  }

  // Quick reply buttons cho câu hỏi về giao hàng
  static getDeliveryQuickReplies(): QuickReplyButton[] {
    return [
      {
        id: 'delivery_time',
        text: 'Thời gian giao hàng',
        icon: '⏰',
        action: 'ask_delivery_time',
        category: 'delivery'
      },
      {
        id: 'delivery_fee',
        text: 'Phí giao hàng',
        icon: '💳',
        action: 'ask_delivery_fee',
        category: 'delivery'
      },
      {
        id: 'delivery_tracking',
        text: 'Theo dõi đơn hàng',
        icon: '📍',
        action: 'ask_tracking',
        category: 'delivery'
      },
      {
        id: 'delivery_return',
        text: 'Đổi trả hàng',
        icon: '🔄',
        action: 'ask_return',
        category: 'delivery'
      }
    ];
  }

  // Quick reply buttons cho câu hỏi về giá
  static getPriceQuickReplies(): QuickReplyButton[] {
    return [
      {
        id: 'price_current',
        text: 'Giá hiện tại',
        icon: '💰',
        action: 'ask_current_price',
        category: 'price'
      },
      {
        id: 'price_discount',
        text: 'Khuyến mãi',
        icon: '🎁',
        action: 'ask_discount',
        category: 'price'
      },
      {
        id: 'price_bulk',
        text: 'Giá sỉ',
        icon: '📦',
        action: 'ask_bulk_price',
        category: 'price'
      },
      {
        id: 'price_payment',
        text: 'Phương thức thanh toán',
        icon: '💳',
        action: 'ask_payment',
        category: 'price'
      }
    ];
  }

  // Quick reply buttons cho hỗ trợ
  static getSupportQuickReplies(): QuickReplyButton[] {
    return [
      {
        id: 'support_contact',
        text: 'Liên hệ nhân viên',
        icon: '👨‍💼',
        action: 'contact_agent',
        category: 'support'
      },
      {
        id: 'support_route',
        text: 'Chuyển sang nhân viên',
        icon: '🔄',
        action: 'route_to_agent',
        category: 'support'
      },
      {
        id: 'support_guide',
        text: 'Hướng dẫn sử dụng',
        icon: '📖',
        action: 'ask_guide',
        category: 'support'
      },
      {
        id: 'support_warranty',
        text: 'Bảo hành',
        icon: '🛡️',
        action: 'ask_warranty',
        category: 'support'
      },
      {
        id: 'support_feedback',
        text: 'Góp ý',
        icon: '💬',
        action: 'give_feedback',
        category: 'support'
      }
    ];
  }

  // Lấy quick replies dựa trên context
  static getQuickReplies(context: {
    isFirstMessage?: boolean;
    lastMessage?: string;
    category?: string;
  }): QuickReplyButton[] {
    if (context.isFirstMessage) {
      return this.getWelcomeQuickReplies();
    }

    if (context.category) {
      switch (context.category) {
        case 'product':
          return this.getProductQuickReplies();
        case 'delivery':
          return this.getDeliveryQuickReplies();
        case 'price':
          return this.getPriceQuickReplies();
        case 'support':
          return this.getSupportQuickReplies();
        default:
          return this.getWelcomeQuickReplies();
      }
    }

    // Phân tích tin nhắn cuối để xác định category
    const lastMessage = context.lastMessage?.toLowerCase() || '';
    
    if (lastMessage.includes('sản phẩm') || lastMessage.includes('hàng') || lastMessage.includes('product')) {
      return this.getProductQuickReplies();
    }
    
    if (lastMessage.includes('giao hàng') || lastMessage.includes('delivery') || lastMessage.includes('ship')) {
      return this.getDeliveryQuickReplies();
    }
    
    if (lastMessage.includes('giá') || lastMessage.includes('price') || lastMessage.includes('cost')) {
      return this.getPriceQuickReplies();
    }
    
    if (lastMessage.includes('hỗ trợ') || lastMessage.includes('support') || lastMessage.includes('help')) {
      return this.getSupportQuickReplies();
    }

    return this.getWelcomeQuickReplies();
  }

  // Xử lý action khi click quick reply
  static handleQuickReplyAction(action: string, _context?: any): string {
    switch (action) {
      case 'ask_authenticity':
        return 'Tất cả sản phẩm của chúng tôi đều là hàng chính hãng 100%, có đầy đủ giấy tờ chứng minh nguồn gốc. Bạn có thể yên tâm về chất lượng!';
      
      case 'ask_delivery':
        return 'Chúng tôi giao hàng toàn quốc với nhiều phương thức vận chuyển. Thời gian giao hàng từ 1-3 ngày tùy khu vực. Bạn ở đâu để tôi tư vấn cụ thể?';
      
      case 'ask_stock':
        return 'Hiện tại sản phẩm vẫn còn hàng. Bạn muốn đặt bao nhiêu để tôi kiểm tra kho?';
      
      case 'ask_price':
        return 'Giá sản phẩm rất cạnh tranh và có nhiều ưu đãi hấp dẫn. Bạn quan tâm đến sản phẩm nào để tôi báo giá cụ thể?';
      
      case 'ask_support':
        return 'Tôi sẵn sàng hỗ trợ bạn! Bạn cần hỗ trợ về vấn đề gì?';
      
      case 'contact_agent':
        return 'Tôi sẽ chuyển bạn đến nhân viên tư vấn ngay. Vui lòng chờ một chút!';
      
      default:
        return 'Cảm ơn bạn đã quan tâm! Nhân viên của chúng tôi sẽ phản hồi chi tiết hơn sớm nhất có thể.';
    }
  }
}
