import { prisma } from '@/libs/prisma';
import { TicketFilters, PaginationParams, PaginatedResponse } from '@/types/common';
import logger from '@/config/logger';

export class TicketService {
  static async createTicket(
    customerId: string,
    data: {
      subject: string;
      description: string;
      priority?: string;
      departmentId?: string;
    }
  ) {
    const ticket = await prisma.ticket.create({
      data: {
        subject: data.subject,
        description: data.description,
        priority: data.priority as any || 'Medium',
        customerId,
        departmentId: data.departmentId,
      },
      include: {
        customer: {
          select: { id: true, name: true, email: true },
        },
        assignee: {
          select: { id: true, name: true, email: true },
        },
        department: {
          select: { id: true, name: true },
        },
      },
    });

    // Create room for the ticket
    await prisma.room.create({
      data: {
        ticketId: ticket.id,
      },
    });

    logger.info('Ticket created', { ticketId: ticket.id, customerId });

    return ticket;
  }

  static async getTickets(
    filters: TicketFilters,
    pagination: PaginationParams,
    userRole: string,
    userId: string
  ): Promise<PaginatedResponse<any>> {
    const where: any = {};

    // Apply filters based on user role
    if (userRole === 'customer') {
      where.customerId = userId;
    } else if (userRole === 'agent') {
      where.OR = [
        { assigneeId: userId },
        { assigneeId: null },
      ];
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.priority) {
      where.priority = filters.priority;
    }

    if (filters.assignee) {
      where.assigneeId = filters.assignee;
    }

    if (filters.customer) {
      where.customerId = filters.customer;
    }

    if (filters.q) {
      where.OR = [
        { subject: { contains: filters.q, mode: 'insensitive' } },
        { description: { contains: filters.q, mode: 'insensitive' } },
      ];
    }

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        include: {
          customer: {
            select: { id: true, name: true, email: true },
          },
          assignee: {
            select: { id: true, name: true, email: true },
          },
          department: {
            select: { id: true, name: true },
          },
          _count: {
            select: { messages: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      prisma.ticket.count({ where }),
    ]);

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

  static async getTicketById(id: string, userRole: string, userId: string) {
    const where: any = { id };

    if (userRole === 'customer') {
      where.customerId = userId;
    }

    const ticket = await prisma.ticket.findFirst({
      where,
      include: {
        customer: {
          select: { id: true, name: true, email: true },
        },
        assignee: {
          select: { id: true, name: true, email: true },
        },
        department: {
          select: { id: true, name: true },
        },
        room: {
          include: {
            messages: {
              include: {
                sender: {
                  select: { id: true, name: true, role: true },
                },
                file: true,
              },
              orderBy: { createdAt: 'asc' },
            },
          },
        },
        rating: true,
      },
    });

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    return ticket;
  }

  static async updateTicket(
    id: string,
    data: {
      status?: string;
      priority?: string;
      assigneeId?: string;
      departmentId?: string;
    },
    userId: string
  ) {
    const ticket = await prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: {
        status: data.status as any,
        priority: data.priority as any,
        assigneeId: data.assigneeId,
        departmentId: data.departmentId,
      },
      include: {
        customer: {
          select: { id: true, name: true, email: true },
        },
        assignee: {
          select: { id: true, name: true, email: true },
        },
        department: {
          select: { id: true, name: true },
        },
      },
    });

    logger.info('Ticket updated', { ticketId: id, updatedBy: userId, changes: data });

    return updatedTicket;
  }

  static async getDepartments() {
    return prisma.department.findMany({
      orderBy: { name: 'asc' },
    });
  }

  static async getAgents() {
    return prisma.user.findMany({
      where: { role: 'agent' },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    });
  }
}
