import { Router } from 'express';
import { AuthController } from '@/controllers/auth.controller';
import { TicketController } from '@/controllers/tickets.controller';
import { FileController } from '@/controllers/files.controller';
import { RatingController } from '@/controllers/ratings.controller';
import { requireAuth, requireRole } from '@/middleware/auth';
import { authLimiter } from '@/middleware/rateLimit';

const router = Router();

// Auth routes
router.post('/auth/register', authLimiter, AuthController.register);
router.post('/auth/login', authLimiter, AuthController.login);
router.post('/auth/refresh', AuthController.refreshToken);
router.post('/auth/forgot', authLimiter, AuthController.forgotPassword);
router.post('/auth/reset', authLimiter, AuthController.resetPassword);
router.post('/auth/logout', AuthController.logout);
router.get('/auth/me', requireAuth, AuthController.me);

// Ticket routes
router.post('/tickets', requireAuth, TicketController.createTicket);
router.get('/tickets', requireAuth, TicketController.getTickets);
router.get('/tickets/:id', requireAuth, TicketController.getTicketById);
router.patch('/tickets/:id', requireAuth, TicketController.updateTicket);
router.get('/departments', TicketController.getDepartments);
router.get('/agents', requireAuth, requireRole(['agent', 'admin']), TicketController.getAgents);

// File routes
router.post('/files', requireAuth, FileController.getUploadMiddleware(), FileController.uploadFile);
router.get('/files/:id', requireAuth, FileController.getFile);
router.delete('/files/:id', requireAuth, FileController.deleteFile);

// Rating routes
router.post('/ratings', requireAuth, RatingController.createRating);
router.get('/ratings', requireAuth, requireRole(['agent', 'admin']), RatingController.getRatings);
router.get('/ratings/stats', requireAuth, requireRole(['agent', 'admin']), RatingController.getRatingStats);

export default router;
