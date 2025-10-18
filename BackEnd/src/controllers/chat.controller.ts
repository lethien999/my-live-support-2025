import { Request, Response } from 'express';
import Logger from '../config/logger';
import sql from 'mssql';

const config = {
  user: 'thien',
  password: '1909',
  server: 'localhost',
  database: 'live_support',
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

export class ChatController {
  // Get conversations for customer (shops they've chatted with)
  static async getConversations(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      await sql.connect(config);
      
      // Get conversations for customer from SQL Server
      const result = await sql.query`
        SELECT 
          c.RoomID as id,
          s.ShopName as shopName,
          s.ShopID as shopId,
          COALESCE(m.Content, 'Chưa có tin nhắn') as lastMessage,
          COALESCE(m.CreatedAt, c.CreatedAt) as lastMessageTime,
          0 as unreadCount,
          '🏪' as avatar,
          1 as isOnline,
          1 as isActive
        FROM ChatRooms c
        LEFT JOIN Shops s ON c.ShopID = s.ShopID
        LEFT JOIN (
          SELECT RoomID, Content, CreatedAt,
                 ROW_NUMBER() OVER (PARTITION BY RoomID ORDER BY CreatedAt DESC) as rn
          FROM Messages
        ) m ON c.RoomID = m.RoomID AND m.rn = 1
        WHERE c.CustomerID = ${userId}
        ORDER BY COALESCE(m.CreatedAt, c.CreatedAt) DESC
      `;

      res.json({
        success: true,
        conversations: result.recordset
      });
    } catch (error) {
      Logger.error('Error getting conversations:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get customers for agent (customers they've chatted with)
  static async getCustomers(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      await sql.connect(config);
      
      // Get customers from database for agent
      const customers = await sql.query`
        SELECT 
          c.ChatRoomID as id,
          'MUJI Store' as shopName,
          u.FullName as customerName,
          'General' as category,
          COALESCE(m.Content, 'Chưa có tin nhắn') as lastMessage,
          COALESCE(m.CreatedAt, c.CreatedAt) as lastMessageTime,
          0 as unreadCount,
          '👤' as avatar,
          1 as isOnline
        FROM ChatRooms c
        LEFT JOIN Tickets t ON c.TicketID = t.TicketID
        LEFT JOIN Users u ON t.CustomerID = u.UserID
        LEFT JOIN (
          SELECT RoomID, Content, CreatedAt,
                 ROW_NUMBER() OVER (PARTITION BY RoomID ORDER BY CreatedAt DESC) as rn
          FROM Messages
        ) m ON c.RoomID = m.RoomID AND m.rn = 1
        WHERE t.AssignedTo = ${parseInt(userId)}
        ORDER BY c.CreatedAt DESC
      `;
      
      res.json({
        success: true,
        customers: customers.recordset
      });
    } catch (error) {
      Logger.error('Error getting customers for agent:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get messages for a specific chat room
  static async getMessages(req: Request, res: Response) {
    try {
      const { chatId } = req.params;
      const userId = (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      await sql.connect(config);
      
      const result = await sql.query`
        SELECT 
          m.MessageID as id,
          m.RoomID as roomId,
          m.SenderID as senderId,
          m.MessageType as senderType,
          m.Content as messageText,
          u.FullName as senderName,
          m.CreatedAt as createdAt
        FROM Messages m
        LEFT JOIN Users u ON m.SenderID = u.UserID
        WHERE m.RoomID = ${parseInt(chatId)}
        ORDER BY m.CreatedAt ASC
      `;

      res.json({
        success: true,
        messages: result.recordset
      });
    } catch (error) {
      Logger.error('Error getting messages:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Send a message
  static async sendMessage(req: Request, res: Response) {
    try {
      const { chatId, content, type = 'text' } = req.body;
      
      // TEMPORARY: Use hardcoded user for testing
      const userId = 3; // customer@muji.com
      const userRole = 'Customer';
      
      if (!chatId || !content) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      await sql.connect(config);
      
      // Insert message into database
      const result = await sql.query`
        INSERT INTO Messages (RoomID, SenderID, MessageType, Content, CreatedAt, IsRead)
        VALUES (${parseInt(chatId)}, ${userId}, ${userRole || 'Customer'}, ${content}, GETDATE(), 0)
        SELECT SCOPE_IDENTITY() as MessageID
      `;

      const messageId = result.recordset[0].MessageID;

      // Get user info for response
      const userResult = await sql.query`
        SELECT u.FullName, r.RoleName
        FROM Users u
        LEFT JOIN UserRoles ur ON u.UserID = ur.UserID
        LEFT JOIN Roles r ON ur.RoleID = r.RoleID
        WHERE u.UserID = ${userId}
      `;

      const userInfo = userResult.recordset[0];

      const newMessage = {
        id: messageId.toString(),
        roomId: parseInt(chatId),
        senderId: userId,
        senderType: userRole || 'Customer',
        messageText: content,
        senderName: userInfo?.FullName || 'Unknown',
        createdAt: new Date().toISOString(),
      };

      res.json({
        success: true,
        message: 'Message sent successfully',
        data: newMessage
      });
    } catch (error) {
      Logger.error('Error sending message:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Mark messages as read
  static async markAsRead(req: Request, res: Response) {
    try {
      const { chatId } = req.params;
      const userId = (req as any).user?.userId;
      if (!userId || !chatId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      await sql.connect(config);
      
      await sql.query`
        UPDATE Messages 
        SET IsRead = 1 
        WHERE RoomID = ${parseInt(chatId)} AND SenderID != ${parseInt(userId)}
      `;
      
      res.json({
        success: true,
        message: 'Messages marked as read'
      });
    } catch (error) {
      Logger.error('Error marking messages as read:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Create a new chat room
  static async createRoom(req: Request, res: Response) {
    try {
      const { customerId, shopId, roomName } = req.body;
      const userId = (req as any).user?.userId;
      if (!userId || !customerId || !shopId || !roomName) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      await sql.connect(config);
      
      // Check if room already exists
      const existingResult = await sql.query`
        SELECT RoomID FROM ChatRooms 
        WHERE CustomerID = ${parseInt(customerId)} AND ShopID = ${parseInt(shopId)}
      `;
      
      if (existingResult.recordset.length > 0) {
        return res.json({ 
          success: true,
          roomId: existingResult.recordset[0].RoomID, 
          exists: true 
        });
      }

      // Create new room
      const result = await sql.query`
        INSERT INTO ChatRooms (CustomerID, ShopID, RoomName, IsActive, CreatedAt)
        VALUES (${parseInt(customerId)}, ${parseInt(shopId)}, ${roomName}, 1, GETDATE())
        SELECT SCOPE_IDENTITY() as RoomID
      `;
      
      const roomId = result.recordset[0].RoomID;

      res.json({
        success: true,
        message: 'Chat room created successfully',
        data: {
          roomId,
          customerId: parseInt(customerId),
          shopId: parseInt(shopId),
          roomName,
          isActive: true,
          createdAt: new Date().toISOString(),
        }
      });
    } catch (error) {
      Logger.error('Error creating chat room:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}