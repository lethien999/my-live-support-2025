import { Request, Response } from 'express';
import { TicketService } from '@/services/tickets.service';
import { createTicketSchema, updateTicketSchema, ticketQuerySchema } from '@/validators/ticket.schema';
import logger from '@/config/logger';

export class TicketController {
  static async createTicket(req: any, res: Response) {
    try {
      const validatedData = createTicketSchema.parse(req.body);
      const ticket = await TicketService.createTicket(req.user.id, validatedData);

      res.status(201).json({
        message: 'Ticket created successfully',
        ticket,
      });
    } catch (error: any) {
      logger.error('Create ticket error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async getTickets(req: any, res: Response) {
    try {
      const validatedQuery = ticketQuerySchema.parse(req.query);
      const pagination = {
        page: validatedQuery.page || 1,
        limit: validatedQuery.limit || 10,
        skip: ((validatedQuery.page || 1) - 1) * (validatedQuery.limit || 10),
      };

      const filters = {
        status: validatedQuery.status,
        priority: validatedQuery.priority,
        assignee: validatedQuery.assignee,
        customer: validatedQuery.customer,
        q: validatedQuery.q,
      };

      const result = await TicketService.getTickets(
        filters,
        pagination,
        req.user.role,
        req.user.id
      );

      res.json(result);
    } catch (error: any) {
      logger.error('Get tickets error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async getTicketById(req: any, res: Response) {
    try {
      const { id } = req.params;
      const ticket = await TicketService.getTicketById(id, req.user.role, req.user.id);

      res.json({ ticket });
    } catch (error: any) {
      logger.error('Get ticket error:', error);
      res.status(404).json({ error: error.message });
    }
  }

  static async updateTicket(req: any, res: Response) {
    try {
      const { id } = req.params;
      const validatedData = updateTicketSchema.parse(req.body);
      
      const ticket = await TicketService.updateTicket(id, validatedData, req.user.id);

      res.json({
        message: 'Ticket updated successfully',
        ticket,
      });
    } catch (error: any) {
      logger.error('Update ticket error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async getDepartments(req: Request, res: Response) {
    try {
      const departments = await TicketService.getDepartments();
      res.json({ departments });
    } catch (error: any) {
      logger.error('Get departments error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getAgents(req: Request, res: Response) {
    try {
      const agents = await TicketService.getAgents();
      res.json({ agents });
    } catch (error: any) {
      logger.error('Get agents error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
