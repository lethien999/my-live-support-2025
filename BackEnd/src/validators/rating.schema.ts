import { z } from 'zod';

export const createRatingSchema = z.object({
  ticketId: z.string().min(1, 'Ticket ID is required'),
  score: z.number().int().min(1, 'Score must be at least 1').max(5, 'Score must be at most 5'),
  comment: z.string().max(500, 'Comment too long').optional(),
});

export type CreateRatingInput = z.infer<typeof createRatingSchema>;
