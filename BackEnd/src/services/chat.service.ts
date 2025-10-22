import { ChatMessage } from '@/types/common';
import DatabaseService from './database.service';
import logger from '@/config/logger';

export class ChatService {
  private static db = DatabaseService.getInstance();

  static async sendMessage(data: {
    roomId: number;
    senderId: number;
    content: string;
    messageType?: string;
    filePath?: string;
    fileName?: string;
    fileSize?: number;
  }) {
    const message = await this.db.sendMessage(
      data.roomId,
      data.senderId,
      data.content
    );

    logger.info('Message sent', { 
      messageId: message.MessageID, 
      roomId: data.roomId, 
      senderId: data.senderId 
    });

    return message;
  }

  static async getMessages(roomId: number, limit: number = 50, offset: number = 0): Promise<ChatMessage[]> {
    const messages = await this.db.getMessages(roomId, limit, offset);
    
    return messages.map(msg => ({
      id: msg.MessageID.toString(),
      roomId: msg.RoomID.toString(),
      senderId: msg.SenderID.toString(),
      type: msg.MessageType,
      content: msg.Content,
      fileId: msg.FilePath ? msg.MessageID.toString() : undefined,
      createdAt: msg.CreatedAt,
      sender: {
        id: msg.SenderID.toString(),
        name: msg.SenderName,
        role: 'Customer' // This should be fetched from user roles
      },
      file: msg.FilePath ? {
        id: msg.MessageID.toString(),
        filename: msg.FileName,
        mime: 'application/octet-stream', // Should be determined from file extension
        size: msg.FileSize || 0,
        url: msg.FilePath
      } : undefined
    }));
  }

  static async getRoomByTicketId(ticketId: number) {
    const query = `
      SELECT cr.*, t.TicketNumber, t.Subject
      FROM ChatRooms cr
      INNER JOIN Tickets t ON cr.TicketID = t.TicketID
      WHERE cr.TicketID = @ticketId AND cr.IsActive = 1
    `;

    const rooms = await this.db.query(query, [ticketId]);
    return rooms[0];
  }

  static async createRoom(ticketId: number, roomName?: string) {
    const room = await this.db.createChatRoom(ticketId, roomName || `Room-${ticketId}`);
    
    logger.info('Chat room created', { roomId: room.RoomID, ticketId });

    return room;
  }

  static async markMessagesAsRead(roomId: number, userId: number) {
    const query = `
      UPDATE Messages 
      SET IsRead = 1 
      WHERE RoomID = @roomId AND SenderID != @userId AND IsRead = 0
    `;

    await this.db.execute(query, [roomId, userId]);

    logger.info('Messages marked as read', { roomId, userId });
  }

  static async getUnreadMessageCount(userId: number) {
    const query = `
      SELECT COUNT(*) as unreadCount
      FROM Messages m
      INNER JOIN ChatRooms cr ON m.RoomID = cr.RoomID
      INNER JOIN Tickets t ON cr.TicketID = t.TicketID
      WHERE (t.CustomerID = @userId OR t.AssignedTo = @userId)
      AND m.SenderID != @userId
      AND m.IsRead = 0
    `;

    const result = await this.db.query(query, [userId]);
    return result[0].unreadCount;
  }

  static async getActiveRooms(userId: number, userRole: string) {
    let query = '';
    
    if (userRole === 'Customer') {
      query = `
        SELECT cr.*, t.TicketNumber, t.Subject, t.Status, t.Priority,
               u.FullName as AssignedToName
        FROM ChatRooms cr
        INNER JOIN Tickets t ON cr.TicketID = t.TicketID
        LEFT JOIN Users u ON t.AssignedTo = u.UserID
        WHERE t.CustomerID = @userId AND cr.IsActive = 1
        ORDER BY cr.CreatedAt DESC
      `;
    } else if (userRole === 'Agent') {
      query = `
        SELECT cr.*, t.TicketNumber, t.Subject, t.Status, t.Priority,
               u.FullName as CustomerName
        FROM ChatRooms cr
        INNER JOIN Tickets t ON cr.TicketID = t.TicketID
        INNER JOIN Users u ON t.CustomerID = u.UserID
        WHERE t.AssignedTo = @userId AND cr.IsActive = 1
        ORDER BY cr.CreatedAt DESC
      `;
    } else if (userRole === 'Admin') {
      query = `
        SELECT cr.*, t.TicketNumber, t.Subject, t.Status, t.Priority,
               u.FullName as CustomerName, u2.FullName as AssignedToName
        FROM ChatRooms cr
        INNER JOIN Tickets t ON cr.TicketID = t.TicketID
        INNER JOIN Users u ON t.CustomerID = u.UserID
        LEFT JOIN Users u2 ON t.AssignedTo = u2.UserID
        WHERE cr.IsActive = 1
        ORDER BY cr.CreatedAt DESC
      `;
    }

    return await this.db.query(query, userRole === 'Admin' ? [] : [userId]);
  }

  static async getTypingUsers(roomId: number) {
    // This would typically be handled by Socket.IO in real-time
    // For now, return empty array
    return [];
  }

  static async setTypingStatus(roomId: number, userId: number, isTyping: boolean) {
    // This would typically be handled by Socket.IO in real-time
    // For now, just log the action
    logger.info('Typing status changed', { roomId, userId, isTyping });
  }
}
