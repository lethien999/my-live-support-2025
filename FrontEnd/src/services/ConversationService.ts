// ConversationService - API wrapper for conversation management
import AuthChatService from './AuthChatService';
import { getApiUrl } from '../config/api';

export interface Conversation {
  id: string;
  customerId: string;
  shopId: string;
  orderId?: string;
  shopName: string;
  customerName: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  isActive: boolean;
  createdAt: string;
  agentId?: string;
  agentName?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: 'Customer' | 'Agent';
  content: string;
  timestamp: string;
  isRead: boolean;
  senderName?: string;
  clientTempId?: string;
}

export interface CreateConversationRequest {
  customerId: string;
  shopId: string;
  orderId?: string;
}

export interface SendMessageRequest {
  conversationId: string;
  content: string;
  clientTempId?: string;
}

class ConversationService {
  private baseUrl = 'http://localhost:4000';

  // Get authentication headers
  private async getHeaders(): Promise<HeadersInit> {
    const token = await AuthChatService.getToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  // Open or get existing conversation
  async openConversation(request: CreateConversationRequest): Promise<Conversation> {
    try {
      // console.log('🔄 ConversationService: Opening conversation:', request);
      
      const response = await fetch(`${this.baseUrl}/api/conversations/open`, {
        method: 'POST',
        headers: await this.getHeaders(),
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to open conversation: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      // console.log('✅ ConversationService: Conversation opened:', data);
      
      return data.conversation;
    } catch (error) {
      console.error('❌ ConversationService: Error opening conversation:', error);
      throw error;
    }
  }

  // Get conversation details
  async getConversation(conversationId: string): Promise<Conversation> {
    try {
      // console.log('🔄 ConversationService: Getting conversation:', conversationId);
      
      const response = await fetch(`${this.baseUrl}/api/conversations/${conversationId}`, {
        headers: await this.getHeaders()
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get conversation: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      // console.log('✅ ConversationService: Conversation loaded:', data);
      
      return data.conversation;
    } catch (error) {
      console.error('❌ ConversationService: Error getting conversation:', error);
      throw error;
    }
  }

  // Get conversations for agent
  async getAgentConversations(): Promise<Conversation[]> {
    try {
      // console.log('🔄 ConversationService: Getting agent conversations');
      
      const response = await fetch(`${this.baseUrl}/api/conversations/agent`, {
        method: 'GET',
        headers: await this.getHeaders()
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get agent conversations: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      // console.log('✅ ConversationService: Agent conversations loaded:', data.conversations.length);
      
      return data.conversations;
    } catch (error) {
      console.error('❌ ConversationService: Error getting agent conversations:', error);
      throw error;
    }
  }

  // Get conversations for customer
  async getCustomerConversations(): Promise<Conversation[]> {
    try {
      // console.log('🔄 ConversationService: Getting customer conversations');
      
      const response = await fetch(`${this.baseUrl}/api/conversations/customer`, {
        headers: await this.getHeaders()
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get customer conversations: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      // console.log('✅ ConversationService: Customer conversations loaded:', data.conversations?.length || 0);
      
      return data.conversations || [];
    } catch (error) {
      console.error('❌ ConversationService: Error getting customer conversations:', error);
      throw error;
    }
  }

  // Get conversations for shop agent
  async getShopConversations(shopId: string): Promise<Conversation[]> {
    try {
      // console.log('🔄 ConversationService: Getting shop conversations:', shopId);
      
      const response = await fetch(`${this.baseUrl}/api/conversations/shop/${shopId}`, {
        headers: await this.getHeaders()
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get shop conversations: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      // console.log('✅ ConversationService: Shop conversations loaded:', data.conversations?.length || 0);
      
      return data.conversations || [];
    } catch (error) {
      console.error('❌ ConversationService: Error getting shop conversations:', error);
      throw error;
    }
  }

  // Get messages for conversation
  async getMessages(conversationId: string, limit = 50, offset = 0): Promise<Message[]> {
    try {
      // console.log('🔄 ConversationService: Getting messages for:', conversationId);
      
      const response = await fetch(`${this.baseUrl}/api/conversations/${conversationId}/messages?limit=${limit}&offset=${offset}`, {
        headers: await this.getHeaders()
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get messages: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      // console.log('✅ ConversationService: Messages loaded:', data.messages?.length || 0);
      
      return data.messages || [];
    } catch (error) {
      console.error('❌ ConversationService: Error getting messages:', error);
      throw error;
    }
  }

  // Sync messages since timestamp
  async syncMessages(conversationId: string, since: string): Promise<Message[]> {
    try {
      // console.log('🔄 ConversationService: Syncing messages since:', since);
      
      const response = await fetch(`${this.baseUrl}/api/messages/sync?conversationId=${conversationId}&since=${since}`, {
        headers: await this.getHeaders()
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to sync messages: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      // console.log('✅ ConversationService: Messages synced:', data.messages?.length || 0);
      
      return data.messages || [];
    } catch (error) {
      console.error('❌ ConversationService: Error syncing messages:', error);
      throw error;
    }
  }

  // Send message
  async sendMessage(request: SendMessageRequest): Promise<Message> {
    try {
      // console.log('🔄 ConversationService: Sending message:', request);
      
      const response = await fetch(`${this.baseUrl}/api/conversations/${request.conversationId}/messages`, {
        method: 'POST',
        headers: await this.getHeaders(),
        body: JSON.stringify({
          content: request.content,
          clientTempId: request.clientTempId
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to send message: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      // console.log('✅ ConversationService: Message sent:', data);
      
      return data.message;
    } catch (error) {
      console.error('❌ ConversationService: Error sending message:', error);
      throw error;
    }
  }

  // Mark conversation as read
  async markAsRead(conversationId: string): Promise<void> {
    try {
      // console.log('🔄 ConversationService: Marking as read:', conversationId);
      
      const response = await fetch(`${this.baseUrl}/api/conversations/${conversationId}/read`, {
        method: 'POST',
        headers: await this.getHeaders()
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to mark as read: ${response.status} - ${errorText}`);
      }

      // console.log('✅ ConversationService: Marked as read');
    } catch (error) {
      console.error('❌ ConversationService: Error marking as read:', error);
      throw error;
    }
  }

  // Get conversation health status
  async getHealth(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat/health`, {
        headers: await this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ ConversationService: Health check failed:', error);
      throw error;
    }
  }
}

export default new ConversationService();
