// OrderService - Handle order-related operations including shop contact
import AuthChatService from './AuthChatService';
import ConversationService from './ConversationService';
import { getApiUrl } from '../config/api';

export interface Order {
  id: string;
  orderId: string;
  customerId: string;
  shopId: string;
  shopName: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  shopId: string;
  shopName: string;
}

class OrderService {
  private baseUrl = 'http://localhost:4000';

  // Get authentication headers
  private async getHeaders(): Promise<HeadersInit> {
    const token = await AuthChatService.getToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  // Get orders for customer
  async getCustomerOrders(): Promise<Order[]> {
    try {
      console.log('🔄 OrderService: Getting customer orders');
      
      const response = await fetch(`${this.baseUrl}/api/orders`, {
        headers: await this.getHeaders()
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get orders: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ OrderService: Orders loaded:', data.orders?.length || 0);
      
      return data.orders || [];
    } catch (error) {
      console.error('❌ OrderService: Error getting orders:', error);
      throw error;
    }
  }

  // Get order details
  async getOrderDetails(orderId: string): Promise<Order | null> {
    try {
      console.log('🔄 OrderService: Getting order details:', orderId);
      
      const response = await fetch(`${this.baseUrl}/api/orders/${orderId}`, {
        headers: await this.getHeaders()
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.log('⚠️ OrderService: Order not found:', orderId);
          return null;
        }
        const errorText = await response.text();
        console.error('❌ OrderService: API error:', response.status, errorText);
        throw new Error(`Failed to get order: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ OrderService: Order details loaded:', data);
      
      return data.order;
    } catch (error) {
      console.error('❌ OrderService: Error getting order details:', error);
      throw error;
    }
  }

  // Contact shop for order - Main function
  async contactShopForOrder(orderId: string): Promise<string> {
    try {
      console.log('🔄 OrderService: Contacting shop for order:', orderId);
      
      // Get current user
      const user = await AuthChatService.getCurrentUser();
      if (!user) {
        throw new Error('Không thể xác thực người dùng');
      }

      // Get order details
      const order = await this.getOrderDetails(orderId);
      if (!order) {
        throw new Error('Không tìm thấy đơn hàng');
      }

      // Extract shop information from order items
      const shops = this.extractShopsFromOrder(order);
      if (shops.length === 0) {
        throw new Error('Không tìm thấy thông tin shop trong đơn hàng');
      }

      // For now, contact the first shop (you can modify this logic)
      const targetShop = shops[0];
      
      console.log('🔄 OrderService: Opening conversation with shop:', targetShop.shopId);
      
      // Open conversation with shop
      const conversation = await ConversationService.openConversation({
        customerId: user.id.toString(),
        shopId: targetShop.shopId,
        orderId: orderId
      });

      console.log('✅ OrderService: Conversation opened:', conversation.id);
      
      return conversation.id;
    } catch (error) {
      console.error('❌ OrderService: Error contacting shop:', error);
      throw error;
    }
  }

  // Extract unique shops from order items
  private extractShopsFromOrder(order: Order): Array<{ shopId: string; shopName: string }> {
    const shopMap = new Map<string, string>();
    
    order.items.forEach(item => {
      if (!shopMap.has(item.shopId)) {
        shopMap.set(item.shopId, item.shopName);
      }
    });
    
    return Array.from(shopMap.entries()).map(([shopId, shopName]) => ({
      shopId,
      shopName
    }));
  }

  // Get shops for order (for multi-shop orders)
  async getShopsForOrder(orderId: string): Promise<Array<{ shopId: string; shopName: string }>> {
    try {
      const order = await this.getOrderDetails(orderId);
      if (!order) {
        return [];
      }
      
      return this.extractShopsFromOrder(order);
    } catch (error) {
      console.error('❌ OrderService: Error getting shops for order:', error);
      return [];
    }
  }

  // Contact specific shop for order
  async contactSpecificShop(orderId: string, shopId: string): Promise<string> {
    try {
      console.log('🔄 OrderService: Contacting specific shop:', { orderId, shopId });
      
      const user = await AuthChatService.getCurrentUser();
      if (!user) {
        throw new Error('Không thể xác thực người dùng');
      }

      const conversation = await ConversationService.openConversation({
        customerId: user.id.toString(),
        shopId: shopId,
        orderId: orderId
      });

      console.log('✅ OrderService: Conversation opened with specific shop:', conversation.id);
      
      return conversation.id;
    } catch (error) {
      console.error('❌ OrderService: Error contacting specific shop:', error);
      throw error;
    }
  }
}

export default new OrderService();
