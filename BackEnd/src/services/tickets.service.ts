import { TicketFilters, PaginationParams, PaginatedResponse } from '@/types/common';
import DatabaseService from './database.service';
import logger from '@/config/logger';

export class TicketService {
  private static db = DatabaseService.getInstance();

  static async createTicket(
    customerId: number,
    data: {
      subject: string;
      description: string;
      priority?: string;
      departmentId?: number;
    }
  ) {
    // Create ticket
    const ticket = await this.db.createTicket(
      data.subject,
      data.description,
      customerId,
      data.priority || 'Medium',
      data.departmentId
    );

    // Create chat room for the ticket
    await this.db.createChatRoom(ticket.TicketID, `Room for ${ticket.TicketNumber}`);

    logger.info('Ticket created', { ticketId: ticket.TicketID, customerId });

    return ticket;
  }

  static async getTickets(
    filters: TicketFilters,
    pagination: PaginationParams,
    userRole: string,
    userId: number
  ): Promise<PaginatedResponse<any>> {
    let tickets: any[] = [];
    let total = 0;

    if (userRole === 'Customer') {
      tickets = await this.db.getTicketsByCustomer(userId);
    } else if (userRole === 'Agent') {
      tickets = await this.db.getTicketsByAgent(userId);
    } else if (userRole === 'Admin') {
      // Admin can see all tickets
      const query = `
        SELECT t.*, d.DepartmentName, u.FullName as CustomerName, u2.FullName as AssignedToName
        FROM Tickets t
        LEFT JOIN Departments d ON t.DepartmentID = d.DepartmentID
        LEFT JOIN Users u ON t.CustomerID = u.UserID
        LEFT JOIN Users u2 ON t.AssignedTo = u2.UserID
        ORDER BY t.CreatedAt DESC
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY
      `;
      tickets = await this.db.query(query, [pagination.skip, pagination.limit]);
    }

    // Apply additional filters
    if (filters.status) {
      tickets = tickets.filter(t => t.Status === filters.status);
    }
    if (filters.priority) {
      tickets = tickets.filter(t => t.Priority === filters.priority);
    }
    if (filters.q) {
      const searchTerm = filters.q.toLowerCase();
      tickets = tickets.filter(t => 
        t.Subject.toLowerCase().includes(searchTerm) || 
        t.Description.toLowerCase().includes(searchTerm)
      );
    }

    total = tickets.length;

    return {
      data: tickets,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        pages: Math.ceil(total / pagination.limit),
      },
    };
  }

  static async getTicketById(id: number, userRole: string, userId: number) {
    const query = `
      SELECT t.*, d.DepartmentName, u.FullName as CustomerName, u2.FullName as AssignedToName
      FROM Tickets t
      LEFT JOIN Departments d ON t.DepartmentID = d.DepartmentID
      LEFT JOIN Users u ON t.CustomerID = u.UserID
      LEFT JOIN Users u2 ON t.AssignedTo = u2.UserID
      WHERE t.TicketID = @ticketId
    `;

    const tickets = await this.db.query(query, [id]);
    const ticket = tickets[0];

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    // Check permissions
    if (userRole === 'Customer' && ticket.CustomerID !== userId) {
      throw new Error('Access denied');
    }

    // Get chat room and messages
    const roomQuery = `
      SELECT cr.*, m.*, u.FullName as SenderName, u.Email as SenderEmail
      FROM ChatRooms cr
      LEFT JOIN Messages m ON cr.RoomID = m.RoomID
      LEFT JOIN Users u ON m.SenderID = u.UserID
      WHERE cr.TicketID = @ticketId
      ORDER BY m.CreatedAt ASC
    `;

    const messages = await this.db.query(roomQuery, [id]);

    return {
      ...ticket,
      messages: messages.filter((m: any) => m.MessageID) // Filter out null messages
    };
  }

  static async updateTicket(
    id: number,
    data: {
      status?: string;
      priority?: string;
      assigneeId?: number;
      departmentId?: number;
    },
    userId: number
  ) {
    // Get current ticket
    const currentTicket = await this.db.query(
      'SELECT * FROM Tickets WHERE TicketID = @ticketId',
      [id]
    );

    if (!currentTicket[0]) {
      throw new Error('Ticket not found');
    }

    // Update ticket
    const updateQuery = `
      UPDATE Tickets 
      SET Status = @status, Priority = @priority, AssignedTo = @assigneeId, DepartmentID = @departmentId, UpdatedAt = GETDATE()
      WHERE TicketID = @ticketId
    `;

    await this.db.execute(updateQuery, [
      data.status || currentTicket[0].Status,
      data.priority || currentTicket[0].Priority,
      data.assigneeId || currentTicket[0].AssignedTo,
      data.departmentId || currentTicket[0].DepartmentID,
      id
    ]);

    // Log status change if status changed
    if (data.status && data.status !== currentTicket[0].Status) {
      await this.db.updateTicketStatus(id, data.status, userId, 'Status updated');
    }

    logger.info('Ticket updated', { ticketId: id, updatedBy: userId, changes: data });

    // Return updated ticket
    const updatedTicket = await this.db.query(
      'SELECT * FROM Tickets WHERE TicketID = @ticketId',
      [id]
    );

    return updatedTicket[0];
  }

  static async getDepartments() {
    return await this.db.query('SELECT * FROM Departments WHERE IsActive = 1 ORDER BY DepartmentName');
  }

  static async getAgents() {
    const query = `
      SELECT u.UserID as id, u.FullName as name, u.Email as email
      FROM Users u
      INNER JOIN UserRoles ur ON u.UserID = ur.UserID
      INNER JOIN Roles r ON ur.RoleID = r.RoleID
      WHERE r.RoleName = 'Agent' AND u.Status = 'Active'
      ORDER BY u.FullName
    `;
    
    return await this.db.query(query);
  }
}