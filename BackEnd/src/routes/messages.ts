// src/routes/messages.ts
import { Router, Request, Response } from 'express';
import { getMessages } from '../db';

const router = Router();

// GET /rooms/:roomId/messages?limit=50&beforeId
router.get('/:roomId/messages', async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const beforeId = req.query.beforeId as string;

    if (!roomId) {
      return res.status(400).json({ error: 'Room ID is required' });
    }

    const messages = await getMessages({
      roomId,
      limit,
      beforeId
    });

    res.json({
      success: true,
      messages: messages.reverse(), // Reverse to get chronological order
      count: messages.length
    });

  } catch (error) {
    console.error('❌ Error fetching messages:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch messages' 
    });
  }
});

export default router;
