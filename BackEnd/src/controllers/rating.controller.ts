import { Request, Response } from 'express';
import { getConnection } from '../db';

export class RatingController {
  // Create rating
  static async createRating(req: Request, res: Response) {
    try {
      const { productId, rating, comment } = req.body;
      const userId = (req as any).user?.userId;

      if (!productId || !rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Invalid rating data' });
      }

      const sql = await getConnection();
      
      // Check if user already rated this product
      const existingRating = await sql.query`
        SELECT RatingID FROM Ratings WHERE ProductID = ${productId} AND UserID = ${userId}
      `;

      if (existingRating.recordset.length > 0) {
        return res.status(400).json({ error: 'You have already rated this product' });
      }

      const result = await sql.query`
        INSERT INTO Ratings (ProductID, UserID, Rating, Comment, CreatedAt)
        VALUES (${productId}, ${userId}, ${rating}, ${comment || ''}, GETDATE());
        SELECT SCOPE_IDENTITY() AS RatingID;
      `;

      res.status(201).json({
        success: true,
        message: 'Rating created successfully',
        ratingId: result.recordset[0].RatingID
      });
    } catch (error) {
      console.error('Create rating error:', error);
      res.status(500).json({ error: 'Failed to create rating' });
    }
  }

  // Get ratings
  static async getRatings(req: Request, res: Response) {
    try {
      const sql = await getConnection();
      
      const result = await sql.query`
        SELECT r.RatingID, r.ProductID, r.UserID, r.Rating, r.Comment, r.CreatedAt,
               u.FullName as UserName, p.ProductName
        FROM Ratings r
        JOIN Users u ON r.UserID = u.UserID
        JOIN Products p ON r.ProductID = p.ProductID
        ORDER BY r.CreatedAt DESC
      `;

      res.status(200).json({
        success: true,
        ratings: result.recordset
      });
    } catch (error) {
      console.error('Get ratings error:', error);
      res.status(500).json({ error: 'Failed to get ratings' });
    }
  }

  // Get rating stats
  static async getRatingStats(req: Request, res: Response) {
    try {
      const sql = await getConnection();
      
      const stats = await sql.query`
        SELECT 
          COUNT(*) as TotalRatings,
          AVG(CAST(Rating as FLOAT)) as AverageRating,
          COUNT(CASE WHEN Rating = 5 THEN 1 END) as FiveStar,
          COUNT(CASE WHEN Rating = 4 THEN 1 END) as FourStar,
          COUNT(CASE WHEN Rating = 3 THEN 1 END) as ThreeStar,
          COUNT(CASE WHEN Rating = 2 THEN 1 END) as TwoStar,
          COUNT(CASE WHEN Rating = 1 THEN 1 END) as OneStar
        FROM Ratings
      `;

      res.status(200).json({
        success: true,
        stats: stats.recordset[0]
      });
    } catch (error) {
      console.error('Get rating stats error:', error);
      res.status(500).json({ error: 'Failed to get rating stats' });
    }
  }
}
