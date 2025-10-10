import { z } from 'zod';

export const createTicketSchema = z.object({
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject too long'),
  description: z.string().min(1, 'Description is required').max(2000, 'Description too long'),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']).optional(),
  departmentId: z.string().optional(),
});

export const updateTicketSchema = z.object({
  status: z.enum(['Open', 'Pending', 'Resolved', 'Closed']).optional(),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']).optional(),
  assigneeId: z.string().optional(),
  departmentId: z.string().optional(),
});

export const ticketQuerySchema = z.object({
  status: z.enum(['Open', 'Pending', 'Resolved', 'Closed']).optional(),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']).optional(),
  assignee: z.string().optional(),
  customer: z.string().optional(),
  q: z.string().optional(),
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type TicketQueryInput = z.infer<typeof ticketQuerySchema>;
