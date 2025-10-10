import { prisma } from '@/libs/prisma';
import logger from '@/config/logger';

export class QueueService {
  static async getQueueStats() {
    const stats = await prisma.ticket.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    const unassignedTickets = await prisma.ticket.count({
      where: {
        status: { in: ['Open', 'Pending'] },
        assigneeId: null,
      },
    });

    const agentWorkload = await prisma.ticket.groupBy({
      by: ['assigneeId'],
      where: {
        status: { in: ['Open', 'Pending'] },
        assigneeId: { not: null },
      },
      _count: { assigneeId: true },
    });

    const agentWorkloadWithNames = await Promise.all(
      agentWorkload.map(async (workload) => {
        const agent = await prisma.user.findUnique({
          where: { id: workload.assigneeId! },
          select: { id: true, name: true },
        });
        return {
          agentId: workload.assigneeId,
          agentName: agent?.name || 'Unknown',
          ticketCount: workload._count.assigneeId,
        };
      })
    );

    return {
      statusDistribution: stats.map(item => ({
        status: item.status,
        count: item._count.status,
      })),
      unassignedTickets,
      agentWorkload: agentWorkloadWithNames,
    };
  }

  static async assignTicketToAgent(ticketId: string, agentId: string, assignedBy: string) {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    const agent = await prisma.user.findUnique({
      where: { id: agentId },
    });

    if (!agent || agent.role !== 'agent') {
      throw new Error('Invalid agent');
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        assigneeId: agentId,
        status: 'Pending',
      },
      include: {
        customer: {
          select: { id: true, name: true, email: true },
        },
        assignee: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    logger.info('Ticket assigned', { 
      ticketId, 
      agentId, 
      assignedBy 
    });

    return updatedTicket;
  }

  static async getNextUnassignedTicket() {
    const ticket = await prisma.ticket.findFirst({
      where: {
        status: { in: ['Open', 'Pending'] },
        assigneeId: null,
      },
      include: {
        customer: {
          select: { id: true, name: true, email: true },
        },
        department: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return ticket;
  }
}
