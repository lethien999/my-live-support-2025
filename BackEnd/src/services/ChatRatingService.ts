// Chat Rating System
import { Request, Response } from 'express';
import { getConnection } from '../db';
import logger from '../config/logger';

export interface ChatRating {
  ratingId: string;
  roomId: string;
  customerId: string;
  agentId?: string;
  rating: number; // 1-5 stars
  comment?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface RatingStats {
  averageRating: number;
  totalRatings: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export class ChatRatingService {
  // Create chat rating
  static async createRating(req: Request, res: Response) {
    try {
      const { roomId, rating, comment } = req.body;
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ error: 'Token không hợp lệ' });
      }

      // Get user from token
      const sql = await getConnection();
      const userResult = await sql.query`
        SELECT UserID, FullName, Role FROM Users 
        WHERE Email = 'customer@muji.com' OR Email = 'agent@muji.com'
      `;
      
      if (userResult.recordset.length === 0) {
        return res.status(404).json({ error: 'User không tồn tại' });
      }

      const user = userResult.recordset[0];
      
      // Validate rating
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating phải từ 1-5 sao' });
      }

      // Check if room exists
      const roomResult = await sql.query`
        SELECT RoomID, CustomerID, AgentID FROM ChatRooms 
        WHERE RoomID = ${parseInt(roomId)}
      `;
      
      if (roomResult.recordset.length === 0) {
        return res.status(404).json({ error: 'Chat room không tồn tại' });
      }

      const room = roomResult.recordset[0];
      
      // Check if user can rate this room
      const canRate = user.Role === 'Admin' || 
                     room.CustomerID.toString() === user.UserID.toString() ||
                     room.AgentID?.toString() === user.UserID.toString();

      if (!canRate) {
        return res.status(403).json({ error: 'Bạn không có quyền đánh giá chat này' });
      }

      // Check if user already rated this room
      const existingRating = await sql.query`
        SELECT RatingID FROM ChatRatings 
        WHERE RoomID = ${parseInt(roomId)} AND UserID = ${user.UserID}
      `;

      if (existingRating.recordset.length > 0) {
        return res.status(400).json({ error: 'Bạn đã đánh giá chat này rồi' });
      }

      // Create rating
      const result = await sql.query`
        INSERT INTO ChatRatings (RoomID, UserID, Rating, Comment, CreatedAt)
        VALUES (${parseInt(roomId)}, ${user.UserID}, ${rating}, ${comment || ''}, GETDATE());
        SELECT SCOPE_IDENTITY() AS RatingID;
      `;

      const ratingId = result.recordset[0].RatingID;

      // Update room rating stats
      await this.updateRoomRatingStats(parseInt(roomId));

      logger.info('Chat rating created', { 
        ratingId, 
        roomId, 
        userId: user.UserID, 
        rating 
      });

      res.status(201).json({
        success: true,
        message: 'Đánh giá chat thành công',
        data: {
          ratingId,
          roomId,
          userId: user.UserID,
          rating,
          comment,
          createdAt: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error('Error creating chat rating:', error);
      res.status(500).json({ error: 'Lỗi server khi tạo đánh giá' });
    }
  }

  // Get ratings for a room
  static async getRoomRatings(req: Request, res: Response) {
    try {
      const { roomId } = req.params;
      
      const sql = await getConnection();
      const result = await sql.query`
        SELECT cr.RatingID, cr.Rating, cr.Comment, cr.CreatedAt, u.FullName as UserName, u.Role
        FROM ChatRatings cr
        LEFT JOIN Users u ON cr.UserID = u.UserID
        WHERE cr.RoomID = ${parseInt(roomId)}
        ORDER BY cr.CreatedAt DESC
      `;

      const ratings = result.recordset.map(rating => ({
        ratingId: rating.RatingID,
        rating: rating.Rating,
        comment: rating.Comment,
        userName: rating.UserName,
        userRole: rating.Role,
        createdAt: rating.CreatedAt
      }));

      res.json({
        success: true,
        data: {
          roomId,
          ratings,
          totalRatings: ratings.length
        }
      });

    } catch (error) {
      logger.error('Error getting room ratings:', error);
      res.status(500).json({ error: 'Lỗi server khi lấy đánh giá' });
    }
  }

  // Get rating stats for a room
  static async getRoomRatingStats(req: Request, res: Response) {
    try {
      const { roomId } = req.params;
      
      const sql = await getConnection();
      const result = await sql.query`
        SELECT 
          AVG(CAST(Rating AS FLOAT)) as AverageRating,
          COUNT(*) as TotalRatings,
          SUM(CASE WHEN Rating = 1 THEN 1 ELSE 0 END) as Rating1,
          SUM(CASE WHEN Rating = 2 THEN 1 ELSE 0 END) as Rating2,
          SUM(CASE WHEN Rating = 3 THEN 1 ELSE 0 END) as Rating3,
          SUM(CASE WHEN Rating = 4 THEN 1 ELSE 0 END) as Rating4,
          SUM(CASE WHEN Rating = 5 THEN 1 ELSE 0 END) as Rating5
        FROM ChatRatings 
        WHERE RoomID = ${parseInt(roomId)}
      `;

      const stats = result.recordset[0];
      
      const ratingStats: RatingStats = {
        averageRating: Math.round((stats.AverageRating || 0) * 10) / 10,
        totalRatings: stats.TotalRatings || 0,
        ratingDistribution: {
          1: stats.Rating1 || 0,
          2: stats.Rating2 || 0,
          3: stats.Rating3 || 0,
          4: stats.Rating4 || 0,
          5: stats.Rating5 || 0
        }
      };

      res.json({
        success: true,
        data: {
          roomId,
          stats: ratingStats
        }
      });

    } catch (error) {
      logger.error('Error getting rating stats:', error);
      res.status(500).json({ error: 'Lỗi server khi lấy thống kê đánh giá' });
    }
  }

  // Get agent rating stats
  static async getAgentRatingStats(req: Request, res: Response) {
    try {
      const { agentId } = req.params;
      
      const sql = await getConnection();
      const result = await sql.query`
        SELECT 
          AVG(CAST(cr.Rating AS FLOAT)) as AverageRating,
          COUNT(*) as TotalRatings,
          SUM(CASE WHEN cr.Rating = 1 THEN 1 ELSE 0 END) as Rating1,
          SUM(CASE WHEN cr.Rating = 2 THEN 1 ELSE 0 END) as Rating2,
          SUM(CASE WHEN cr.Rating = 3 THEN 1 ELSE 0 END) as Rating3,
          SUM(CASE WHEN cr.Rating = 4 THEN 1 ELSE 0 END) as Rating4,
          SUM(CASE WHEN cr.Rating = 5 THEN 1 ELSE 0 END) as Rating5
        FROM ChatRatings cr
        INNER JOIN ChatRooms ch ON cr.RoomID = ch.RoomID
        WHERE ch.AgentID = ${parseInt(agentId)}
      `;

      const stats = result.recordset[0];
      
      const ratingStats: RatingStats = {
        averageRating: Math.round((stats.AverageRating || 0) * 10) / 10,
        totalRatings: stats.TotalRatings || 0,
        ratingDistribution: {
          1: stats.Rating1 || 0,
          2: stats.Rating2 || 0,
          3: stats.Rating3 || 0,
          4: stats.Rating4 || 0,
          5: stats.Rating5 || 0
        }
      };

      res.json({
        success: true,
        data: {
          agentId,
          stats: ratingStats
        }
      });

    } catch (error) {
      logger.error('Error getting agent rating stats:', error);
      res.status(500).json({ error: 'Lỗi server khi lấy thống kê đánh giá agent' });
    }
  }

  // Update room rating stats (internal method)
  private static async updateRoomRatingStats(roomId: number) {
    try {
      const sql = await getConnection();
      
      // Calculate average rating for the room
      const result = await sql.query`
        SELECT AVG(CAST(Rating AS FLOAT)) as AverageRating, COUNT(*) as TotalRatings
        FROM ChatRatings 
        WHERE RoomID = ${roomId}
      `;

      const stats = result.recordset[0];
      
      // Update ChatRooms table with rating stats
      await sql.query`
        UPDATE ChatRooms 
        SET 
          AverageRating = ${stats.AverageRating || 0},
          TotalRatings = ${stats.TotalRatings || 0},
          UpdatedAt = GETDATE()
        WHERE RoomID = ${roomId}
      `;

    } catch (error) {
      logger.error('Error updating room rating stats:', error);
    }
  }

  // Delete rating (admin only)
  static async deleteRating(req: Request, res: Response) {
    try {
      const { ratingId } = req.params;
      
      const sql = await getConnection();
      
      // Get rating info
      const ratingResult = await sql.query`
        SELECT RoomID FROM ChatRatings WHERE RatingID = ${parseInt(ratingId)}
      `;
      
      if (ratingResult.recordset.length === 0) {
        return res.status(404).json({ error: 'Rating không tồn tại' });
      }

      const roomId = ratingResult.recordset[0].RoomID;
      
      // Delete rating
      await sql.query`
        DELETE FROM ChatRatings WHERE RatingID = ${parseInt(ratingId)}
      `;

      // Update room stats
      await this.updateRoomRatingStats(roomId);

      logger.info('Chat rating deleted', { ratingId, roomId });

      res.json({
        success: true,
        message: 'Xóa đánh giá thành công'
      });

    } catch (error) {
      logger.error('Error deleting rating:', error);
      res.status(500).json({ error: 'Lỗi server khi xóa đánh giá' });
    }
  }
}
