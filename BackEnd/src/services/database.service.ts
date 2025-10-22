import sql from 'mssql';
import logger from '@/config/logger';

// Database configuration
const dbConfig = {
  user: 'thien',
  password: '1909',
  server: 'localhost',
  database: 'MujiLiveSupport',
  port: 1433,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  }
};

export default class DatabaseService {
  private static instance: DatabaseService;

  private constructor() {}

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  async getConnection(): Promise<sql.ConnectionPool> {
    try {
      const pool = new sql.ConnectionPool(dbConfig);
      await pool.connect();
      return pool;
    } catch (error) {
      logger.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  async query(query: string, params: any[] = []): Promise<any[]> {
    const pool = await this.getConnection();
    
    try {
      const request = pool.request();
      
      // Add parameters
      params.forEach((param, index) => {
        request.input(`param${index}`, param);
      });
      
      const result = await request.query(query);
      await pool.close();
      return result.recordset;
    } catch (error) {
      await pool.close();
      logger.error('❌ Database query failed:', error);
      throw error;
    }
  }

  async execute(query: string, params: any[] = []): Promise<any> {
    const pool = await this.getConnection();
    
    try {
      const request = pool.request();
      
      // Add parameters
      params.forEach((param, index) => {
        request.input(`param${index}`, param);
      });
      
      const result = await request.query(query);
      await pool.close();
      return result;
    } catch (error) {
      await pool.close();
      logger.error('❌ Database execute failed:', error);
      throw error;
    }
  }

  // User methods
  async getUserByEmail(email: string): Promise<any> {
    const result = await this.query(
      'SELECT * FROM Users WHERE Email = @param0',
      [email]
    );
    return result[0];
  }

  async getUserById(id: number): Promise<any> {
    const result = await this.query(
      'SELECT * FROM Users WHERE UserID = @param0',
      [id]
    );
    return result[0];
  }

  async createUser(email: string, passwordHash: string, name: string): Promise<any> {
    const result = await this.execute(
      'INSERT INTO Users (Email, PasswordHash, FullName, CreatedAt) OUTPUT INSERTED.* VALUES (@param0, @param1, @param2, GETDATE())',
      [email, passwordHash, name]
    );
    return result.recordset[0];
  }

  async assignUserRole(userId: number, role: string): Promise<void> {
    await this.execute(
      'UPDATE Users SET Role = @param0 WHERE UserID = @param1',
      [role, userId]
    );
  }

  async logAudit(userId: number, action: string, tableName: string, recordId: number, oldValues: string | null, newValues: string | null): Promise<void> {
    await this.execute(
      'INSERT INTO AuditLogs (UserID, Action, TableName, RecordID, OldValues, NewValues, Timestamp) VALUES (@param0, @param1, @param2, @param3, @param4, @param5, GETDATE())',
      [userId, action, tableName, recordId, oldValues, newValues]
    );
  }

  // Product methods
  async getProducts(categoryId?: number, limit: number = 20, offset: number = 0): Promise<any[]> {
    let query = 'SELECT * FROM Products';
    const params: any[] = [];
    
    if (categoryId) {
      query += ' WHERE CategoryID = @param0';
      params.push(categoryId);
    }
    
    query += ' ORDER BY CreatedAt DESC OFFSET @param' + params.length + ' ROWS FETCH NEXT @param' + (params.length + 1) + ' ROWS ONLY';
    params.push(offset, limit);
    
    return await this.query(query, params);
  }

  async getProductById(id: number): Promise<any> {
    const result = await this.query(
      'SELECT * FROM Products WHERE ProductID = @param0',
      [id]
    );
    return result[0];
  }

  async getCategories(): Promise<any[]> {
    return await this.query('SELECT * FROM Categories ORDER BY CategoryName');
  }

  async getReviews(productId: number, limit: number = 10, offset: number = 0): Promise<any[]> {
    return await this.query(
      'SELECT * FROM Reviews WHERE ProductID = @param0 ORDER BY CreatedAt DESC OFFSET @param1 ROWS FETCH NEXT @param2 ROWS ONLY',
      [productId, offset, limit]
    );
  }

  async createReview(productId: number, userId: number, rating: number, comment: string): Promise<any> {
    const result = await this.execute(
      'INSERT INTO Reviews (ProductID, UserID, Rating, Comment, CreatedAt) OUTPUT INSERTED.* VALUES (@param0, @param1, @param2, @param3, GETDATE())',
      [productId, userId, rating, comment]
    );
    return result.recordset[0];
  }

  // Chat methods
  async sendMessage(roomId: number, senderId: number, content: string): Promise<any> {
    const result = await this.execute(
      'INSERT INTO Messages (RoomID, SenderID, Content, Timestamp) OUTPUT INSERTED.* VALUES (@param0, @param1, @param2, GETDATE())',
      [roomId, senderId, content]
    );
    return result.recordset[0];
  }

  async getMessages(roomId: number, limit: number = 50, offset: number = 0): Promise<any[]> {
    return await this.query(
      'SELECT * FROM Messages WHERE RoomID = @param0 ORDER BY Timestamp DESC OFFSET @param1 ROWS FETCH NEXT @param2 ROWS ONLY',
      [roomId, offset, limit]
    );
  }

  async createChatRoom(ticketId: number, roomName: string): Promise<any> {
    const result = await this.execute(
      'INSERT INTO ChatRooms (TicketID, RoomName, IsActive, CreatedAt) OUTPUT INSERTED.* VALUES (@param0, @param1, 1, GETDATE())',
      [ticketId, roomName]
    );
    return result.recordset[0];
  }

  async joinRoom(roomId: number, userId: number): Promise<void> {
    await this.execute(
      'INSERT INTO RoomMembers (RoomID, UserID, JoinedAt) VALUES (@param0, @param1, GETDATE())',
      [roomId, userId]
    );
  }

  async getRoomsByUser(userId: number): Promise<any[]> {
    return await this.query(
      'SELECT cr.* FROM ChatRooms cr INNER JOIN RoomMembers rm ON cr.RoomID = rm.RoomID WHERE rm.UserID = @param0',
      [userId]
    );
  }

  async getRoomsByRole(userRole: string, userId?: number): Promise<any[]> {
    if (userRole === 'Admin') {
      return await this.query('SELECT * FROM ChatRooms ORDER BY CreatedAt DESC');
    } else {
      return await this.query(
        'SELECT cr.* FROM ChatRooms cr INNER JOIN RoomMembers rm ON cr.RoomID = rm.RoomID WHERE rm.UserID = @param0',
        [userId!]
      );
    }
  }
}
