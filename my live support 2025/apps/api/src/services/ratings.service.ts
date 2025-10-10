import { prisma } from '@/libs/prisma';
import logger from '@/config/logger';

export class RatingService {
  static async createRating(data: {
    ticketId: string;
    score: number;
    comment?: string;
  }) {
    // Check if ticket exists and is closed
    const ticket = await prisma.ticket.findUnique({
      where: { id: data.ticketId },
    });

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    if (ticket.status !== 'Closed') {
      throw new Error('Can only rate closed tickets');
    }

    // Check if rating already exists
    const existingRating = await prisma.rating.findUnique({
      where: { ticketId: data.ticketId },
    });

    if (existingRating) {
      throw new Error('Ticket already rated');
    }

    const rating = await prisma.rating.create({
      data: {
        ticketId: data.ticketId,
        score: data.score,
        comment: data.comment,
      },
      include: {
        ticket: {
          select: {
            id: true,
            subject: true,
            customer: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    logger.info('Rating created', { 
      ratingId: rating.id, 
      ticketId: data.ticketId, 
      score: data.score 
    });

    return rating;
  }

  static async getRatings(pagination: { page: number; limit: number }) {
    const skip = (pagination.page - 1) * pagination.limit;

    const [ratings, total] = await Promise.all([
      prisma.rating.findMany({
        include: {
          ticket: {
            select: {
              id: true,
              subject: true,
              customer: {
                select: { id: true, name: true },
              },
              assignee: {
                select: { id: true, name: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pagination.limit,
      }),
      prisma.rating.count(),
    ]);

    return {
      data: ratings,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        pages: Math.ceil(total / pagination.limit),
      },
    };
  }

  static async getRatingStats() {
    const stats = await prisma.rating.aggregate({
      _avg: { score: true },
      _count: { score: true },
    });

    const scoreDistribution = await prisma.rating.groupBy({
      by: ['score'],
      _count: { score: true },
      orderBy: { score: 'asc' },
    });

    return {
      average: stats._avg.score || 0,
      total: stats._count.score || 0,
      distribution: scoreDistribution.map(item => ({
        score: item.score,
        count: item._count.score,
      })),
    };
  }
}
