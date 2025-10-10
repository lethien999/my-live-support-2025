import { Request, Response } from 'express';
import { RatingService } from '@/services/ratings.service';
import { createRatingSchema } from '@/validators/rating.schema';
import logger from '@/config/logger';

export class RatingController {
  static async createRating(req: any, res: Response) {
    try {
      const validatedData = createRatingSchema.parse(req.body);
      const rating = await RatingService.createRating(validatedData);

      res.status(201).json({
        message: 'Rating created successfully',
        rating,
      });
    } catch (error: any) {
      logger.error('Create rating error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async getRatings(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await RatingService.getRatings({ page, limit });

      res.json(result);
    } catch (error: any) {
      logger.error('Get ratings error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getRatingStats(req: Request, res: Response) {
    try {
      const stats = await RatingService.getRatingStats();

      res.json({ stats });
    } catch (error: any) {
      logger.error('Get rating stats error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
