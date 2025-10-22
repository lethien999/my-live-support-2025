// Ticket Service - API calls for ticket management
import AuthChatService from '../services/AuthChatService';
import { getApiUrl } from '../config/api';

// =============================================
// TICKET INTERFACES
// =============================================

interface Ticket {
  ticketId: number;
  ticketNumber: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  estimatedResolution?: string;
  actualResolution?: string;
  customerSatisfaction?: number;
  customerFeedback?: string;
  
  // Relations
  customerId: number;
  customerName: string;
  customerEmail: string;
  customerAvatar: string;
  
  agentId?: number;
  agentName?: string;
  agentEmail?: string;
  
  categoryId: number;
  categoryName: string;
  
  priorityId: number;
  priorityName: string;
  priorityLevel: number;
  priorityColor: string;
  
  statusId: number;
  statusName: string;
  statusIsClosed: boolean;
  
  orderId?: number;
  orderNumber?: string;
  
  shopId?: number;
  shopName?: string;
  
  // Additional data
  comments?: TicketComment[];
  history?: TicketHistory[];
  attachments?: TicketAttachment[];
}

interface TicketComment {
  commentId: number;
  ticketId: number;
  userId: number;
  userName: string;
  userEmail: string;
  userAvatar: string;
  comment: string;
  isInternal: boolean;
  createdAt: string;
}

interface TicketHistory {
  historyId: number;
  ticketId: number;
  userId: number;
  userName: string;
  userEmail: string;
  action: string;
  oldValue?: string;
  newValue?: string;
  description?: string;
  createdAt: string;
}

interface TicketAttachment {
  attachmentId: number;
  ticketId: number;
  fileName: string;
  filePath: string;
  fileSize: number;
  fileType: string;
  uploadedBy: number;
  uploadedByName: string;
  uploadedAt: string;
}

interface TicketCategory {
  categoryId: number;
  categoryName: string;
  description: string;
  isActive: boolean;
  createdAt: string;
}

interface TicketPriority {
  priorityId: number;
  priorityName: string;
  priorityLevel: number;
  colorCode: string;
  isActive: boolean;
  createdAt: string;
}

interface TicketStatus {
  statusId: number;
  statusName: string;
  statusDescription: string;
  isActive: boolean;
  isClosed: boolean;
  createdAt: string;
}

// =============================================
// TICKET SERVICE
// =============================================

class TicketService {
  private static async getAuthHeaders() {
    const token = await AuthChatService.getToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  // Get all tickets
  static async getTickets(params: {
    page?: number;
    limit?: number;
    status?: number;
    priority?: number;
    category?: number;
    agentId?: number;
    customerId?: number;
    search?: string;
  } = {}) {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });

      const response = await fetch(`${getApiUrl('/api/tickets')}?${queryParams}`, {
        method: 'GET',
        headers: await this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting tickets:', error);
      throw error;
    }
  }

  // Get single ticket
  static async getTicket(ticketId: number) {
    try {
      const response = await fetch(`${getApiUrl('/api/tickets')}/${ticketId}`, {
        method: 'GET',
        headers: await this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting ticket:', error);
      throw error;
    }
  }

  // Create new ticket
  static async createTicket(data: {
    title: string;
    description: string;
    categoryId: number;
    priorityId: number;
    orderId?: number;
    shopId?: number;
  }) {
    try {
      const response = await fetch(`${getApiUrl('/api/tickets')}`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating ticket:', error);
      throw error;
    }
  }

  // Update ticket
  static async updateTicket(ticketId: number, data: {
    title?: string;
    description?: string;
    statusId?: number;
    priorityId?: number;
    agentId?: number;
    estimatedResolution?: string;
    customerSatisfaction?: number;
    customerFeedback?: string;
  }) {
    try {
      const response = await fetch(`${getApiUrl('/api/tickets')}/${ticketId}`, {
        method: 'PUT',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating ticket:', error);
      throw error;
    }
  }

  // Add comment to ticket
  static async addComment(ticketId: number, comment: string, isInternal: boolean = false) {
    try {
      const response = await fetch(`${getApiUrl('/api/tickets')}/${ticketId}/comments`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify({ comment, isInternal })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  // Get ticket statistics
  static async getStatistics(params: {
    agentId?: number;
    dateFrom?: string;
    dateTo?: string;
  } = {}) {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });

      const response = await fetch(`${getApiUrl('/api/tickets')}/statistics?${queryParams}`, {
        method: 'GET',
        headers: await this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting ticket statistics:', error);
      throw error;
    }
  }

  // Get ticket categories
  static async getCategories() {
    try {
      const response = await fetch(`${getApiUrl('/api/tickets')}/categories`, {
        method: 'GET',
        headers: await this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting ticket categories:', error);
      throw error;
    }
  }

  // Get ticket priorities
  static async getPriorities() {
    try {
      const response = await fetch(`${getApiUrl('/api/tickets')}/priorities`, {
        method: 'GET',
        headers: await this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting ticket priorities:', error);
      throw error;
    }
  }

  // Get ticket statuses
  static async getStatuses() {
    try {
      const response = await fetch(`${getApiUrl('/api/tickets')}/statuses`, {
        method: 'GET',
        headers: await this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting ticket statuses:', error);
      throw error;
    }
  }
}

export default TicketService;
export type { Ticket, TicketComment, TicketHistory, TicketAttachment, TicketCategory, TicketPriority, TicketStatus };
