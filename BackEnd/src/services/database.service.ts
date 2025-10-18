import sql from 'mssql';

const config = {
  server: 'localhost',
  port: 1433,
  user: 'thien',
  password: '1909',
  database: 'live_support',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    requestTimeout: 30000,
    connectionTimeout: 30000
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

class DatabaseService {
  private static instance: DatabaseService;
  private pool: sql.ConnectionPool | null = null;

  private constructor() {}

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  async connect(): Promise<void> {
    if (!this.pool) {
      this.pool = await sql.connect(config);
      console.log('✅ Connected to SQL Server');
    }
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.close();
      this.pool = null;
      console.log('✅ Disconnected from SQL Server');
    }
  }

  async query(query: string, params?: any[] | object): Promise<any> {
    if (!this.pool) {
      await this.connect();
    }
    
    if (!this.pool) {
      throw new Error('Database connection failed');
    }
    
    const request = this.pool.request();
    
    if (params) {
      if (Array.isArray(params)) {
        // Array parameters (old way) - convert ? to @param0, @param1, etc.
        let paramIndex = 0;
        const newQuery = query.replace(/\?/g, () => `@param${paramIndex++}`);
        params.forEach((param, index) => {
          request.input(`param${index}`, param);
        });
        const result = await request.query(newQuery);
        return result.recordset;
      } else {
        // Object parameters (new way)
        Object.entries(params).forEach(([key, value]) => {
          request.input(key, value);
        });
        const result = await request.query(query);
        return result.recordset;
      }
    }
    
    const result = await request.query(query);
    return result.recordset;
  }

  async execute(query: string, params?: any[]): Promise<sql.IResult<any>> {
    if (!this.pool) {
      await this.connect();
    }
    
    if (!this.pool) {
      throw new Error('Database connection failed');
    }
    const request = this.pool.request();
    
    if (params) {
      params.forEach((param, index) => {
        request.input(`param${index}`, param);
      });
    }
    
    return await request.query(query);
  }

  // User operations
  async createUser(email: string, passwordHash: string, fullName: string, phone?: string, address?: string): Promise<any> {
    const query = `
      INSERT INTO Users (Email, PasswordHash, FullName, Phone, Address)
      OUTPUT INSERTED.UserID, INSERTED.Email, INSERTED.FullName, INSERTED.CreatedAt
      VALUES (@email, @passwordHash, @fullName, @phone, @address)
    `;
    
    if (!this.pool) {
      throw new Error('Database connection failed');
    }
    const result = await this.pool.request()
      .input('email', email)
      .input('passwordHash', passwordHash)
      .input('fullName', fullName)
      .input('phone', phone || null)
      .input('address', address || null)
      .query(query);
    return result.recordset[0];
  }

  async getUserByEmail(email: string): Promise<any> {
    const query = `
      SELECT u.*, r.RoleName
      FROM Users u
      LEFT JOIN UserRoles ur ON u.UserID = ur.UserID
      LEFT JOIN Roles r ON ur.RoleID = r.RoleID
      WHERE u.Email = @email AND u.Status = 'Active'
    `;
    
    if (!this.pool) {
      throw new Error('Database connection failed');
    }
    const result = await this.pool.request()
      .input('email', email)
      .query(query);
    return result.recordset[0];
  }

  async getUserById(userId: number): Promise<any> {
    const query = `
      SELECT u.*, r.RoleName
      FROM Users u
      LEFT JOIN UserRoles ur ON u.UserID = ur.UserID
      LEFT JOIN Roles r ON ur.RoleID = r.RoleID
      WHERE u.UserID = @userId AND u.Status = 'Active'
    `;
    
    if (!this.pool) {
      throw new Error('Database connection failed');
    }
    const result = await this.pool.request()
      .input('userId', userId)
      .query(query);
    return result.recordset[0];
  }

  async assignUserRole(userId: number, roleName: string): Promise<void> {
    const query = `
      INSERT INTO UserRoles (UserID, RoleID)
      SELECT @userId, r.RoleID
      FROM Roles r
      WHERE r.RoleName = @roleName
      AND NOT EXISTS (
        SELECT 1 FROM UserRoles ur 
        WHERE ur.UserID = @userId AND ur.RoleID = r.RoleID
      )
    `;
    
    if (!this.pool) {
      throw new Error('Database connection failed');
    }
    await this.pool.request()
      .input('userId', userId)
      .input('roleName', roleName)
      .query(query);
  }

  // Ticket operations
  async createTicket(subject: string, description: string, customerId: number, priority: string = 'Medium', departmentId?: number): Promise<any> {
    // Generate ticket number
    if (!this.pool) {
      throw new Error('Database connection failed');
    }
    const ticketNumberResult = await this.pool.request().query('EXEC SP_GenerateTicketNumber');
    const ticketNumber = ticketNumberResult.recordset[0].TicketNumber;
    
    const query = `
      INSERT INTO Tickets (TicketNumber, Subject, Description, Priority, CustomerID, DepartmentID)
      OUTPUT INSERTED.TicketID, INSERTED.TicketNumber, INSERTED.CreatedAt
      VALUES (@ticketNumber, @subject, @description, @priority, @customerId, @departmentId)
    `;
    
    if (!this.pool) {
      throw new Error('Database connection failed');
    }
    const result = await this.pool.request()
      .input('ticketNumber', ticketNumber)
      .input('subject', subject)
      .input('description', description)
      .input('priority', priority)
      .input('customerId', customerId)
      .input('departmentId', departmentId || null)
      .query(query);
    return result.recordset[0];
  }

  async getTicketsByCustomer(customerId: number): Promise<any[]> {
    const query = `
      SELECT t.*, d.DepartmentName, u.FullName as AssignedToName
      FROM Tickets t
      LEFT JOIN Departments d ON t.DepartmentID = d.DepartmentID
      LEFT JOIN Users u ON t.AssignedTo = u.UserID
      WHERE t.CustomerID = @customerId
      ORDER BY t.CreatedAt DESC
    `;
    
    return await this.query(query, [customerId]);
  }

  async getTicketsByAgent(agentId: number): Promise<any[]> {
    const query = `
      SELECT t.*, d.DepartmentName, u.FullName as CustomerName
      FROM Tickets t
      LEFT JOIN Departments d ON t.DepartmentID = d.DepartmentID
      LEFT JOIN Users u ON t.CustomerID = u.UserID
      WHERE t.AssignedTo = @agentId
      ORDER BY t.CreatedAt DESC
    `;
    
    return await this.query(query, [agentId]);
  }

  async updateTicketStatus(ticketId: number, newStatus: string, changedBy: number, comments?: string): Promise<void> {
    if (!this.pool) {
      throw new Error('Database connection failed');
    }
    const transaction = this.pool.transaction();
    
    try {
      await transaction.begin();
      
      // Get old status
      const oldStatusResult = await transaction.request()
        .input('ticketId', ticketId)
        .query('SELECT Status FROM Tickets WHERE TicketID = @ticketId');
      
      const oldStatus = oldStatusResult.recordset[0]?.Status;
      
      // Update ticket status
      await transaction.request()
        .input('ticketId', ticketId)
        .input('newStatus', newStatus)
        .query('UPDATE Tickets SET Status = @newStatus, UpdatedAt = GETDATE() WHERE TicketID = @ticketId');
      
      // Insert status history
      await transaction.request()
        .input('ticketId', ticketId)
        .input('oldStatus', oldStatus)
        .input('newStatus', newStatus)
        .input('changedBy', changedBy)
        .input('comments', comments || null)
        .query(`
          INSERT INTO TicketStatusHistory (TicketID, OldStatus, NewStatus, ChangedBy, Comments)
          VALUES (@ticketId, @oldStatus, @newStatus, @changedBy, @comments)
        `);
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // Chat operations
  async createChatRoom(ticketId: number, roomName?: string): Promise<any> {
    const query = `
      INSERT INTO ChatRooms (TicketID, RoomName)
      OUTPUT INSERTED.RoomID, INSERTED.CreatedAt
      VALUES (@ticketId, @roomName)
    `;
    
    if (!this.pool) {
      throw new Error('Database connection failed');
    }
    const result = await this.pool.request()
      .input('ticketId', ticketId)
      .input('roomName', roomName || null)
      .query(query);
    return result.recordset[0];
  }

  async sendMessage(roomId: number, senderId: number, content: string, messageType: string = 'Text', filePath?: string, fileName?: string, fileSize?: number): Promise<any> {
    const query = `
      INSERT INTO Messages (RoomID, SenderID, MessageType, Content, FilePath, FileName, FileSize)
      OUTPUT INSERTED.MessageID, INSERTED.CreatedAt
      VALUES (@roomId, @senderId, @messageType, @content, @filePath, @fileName, @fileSize)
    `;
    
    if (!this.pool) {
      throw new Error('Database connection failed');
    }
    const result = await this.pool.request()
      .input('roomId', roomId)
      .input('senderId', senderId)
      .input('messageType', messageType)
      .input('content', content)
      .input('filePath', filePath || null)
      .input('fileName', fileName || null)
      .input('fileSize', fileSize || null)
      .query(query);
    return result.recordset[0];
  }

  async getMessages(roomId: number, limit: number = 50, offset: number = 0): Promise<any[]> {
    if (!this.pool) {
      await this.connect();
    }
    
    if (!this.pool) {
      throw new Error('Database connection failed');
    }
    
    const query = `
      SELECT m.*, u.FullName as SenderName, u.Email as SenderEmail
      FROM Messages m
      INNER JOIN Users u ON m.SenderID = u.UserID
      WHERE m.RoomID = @roomId
      ORDER BY m.CreatedAt DESC
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;
    
    const request = this.pool.request();
    request.input('roomId', roomId);
    request.input('offset', offset);
    request.input('limit', limit);
    
    const result = await request.query(query);
    return result.recordset;
  }

  // Product operations
  async getProducts(categoryId?: number, limit: number = 20, offset: number = 0): Promise<any[]> {
    if (!this.pool) {
      await this.connect();
    }
    
    if (!this.pool) {
      throw new Error('Database connection failed');
    }
    
    let query = `
      SELECT p.*, c.CategoryName
      FROM Products p
      INNER JOIN Categories c ON p.CategoryID = c.CategoryID
      WHERE p.IsInStock = 1
    `;
    
    const request = this.pool.request();
    
    if (categoryId) {
      query += ' AND p.CategoryID = @categoryId';
      request.input('categoryId', categoryId);
    }
    
    query += `
      ORDER BY p.CreatedAt DESC
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;
    
    request.input('offset', offset);
    request.input('limit', limit);
    
    const result = await request.query(query);
    return result.recordset;
  }

  async getProductById(productId: number): Promise<any> {
    const query = `
      SELECT p.*, c.CategoryName
      FROM Products p
      INNER JOIN Categories c ON p.CategoryID = c.CategoryID
      WHERE p.ProductID = @productId
    `;
    
    const result = await this.query(query, [productId]);
    return result[0];
  }

  async getCategories(): Promise<any[]> {
    const query = `
      SELECT c.*, 
             (SELECT COUNT(*) FROM Products p WHERE p.CategoryID = c.CategoryID AND p.IsInStock = 1) as ProductCount
      FROM Categories c
      WHERE c.IsActive = 1
      ORDER BY c.SortOrder, c.CategoryName
    `;
    
    return await this.query(query);
  }

  // Review operations
  async createReview(productId: number, customerId: number, rating: number, comment?: string): Promise<any> {
    if (!this.pool) {
      throw new Error('Database connection failed');
    }
    const transaction = this.pool.transaction();
    
    try {
      await transaction.begin();
      
      // Insert review
      const reviewResult = await transaction.request()
        .input('productId', productId)
        .input('customerId', customerId)
        .input('rating', rating)
        .input('comment', comment || null)
        .query(`
          INSERT INTO Reviews (ProductID, CustomerID, Rating, Comment)
          OUTPUT INSERTED.ReviewID, INSERTED.CreatedAt
          VALUES (@productId, @customerId, @rating, @comment)
        `);
      
      // Update product rating
      await transaction.request()
        .input('productId', productId)
        .execute('SP_UpdateProductRating');
      
      await transaction.commit();
      return reviewResult.recordset[0];
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getReviews(productId: number, limit: number = 10, offset: number = 0): Promise<any[]> {
    if (!this.pool) {
      await this.connect();
    }
    
    if (!this.pool) {
      throw new Error('Database connection failed');
    }
    
    const query = `
      SELECT r.*, u.FullName as CustomerName
      FROM Reviews r
      INNER JOIN Users u ON r.CustomerID = u.UserID
      WHERE r.ProductID = @productId
      ORDER BY r.CreatedAt DESC
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;
    
    const request = this.pool.request();
    request.input('productId', productId);
    request.input('offset', offset);
    request.input('limit', limit);
    
    const result = await request.query(query);
    return result.recordset;
  }

  // Audit operations
  async logAudit(userId: number, action: string, tableName?: string, recordId?: number, oldValues?: string, newValues?: string, ipAddress?: string, userAgent?: string): Promise<void> {
    const query = `
      INSERT INTO AuditLogs (UserID, Action, TableName, RecordID, OldValues, NewValues, IPAddress, UserAgent)
      VALUES (@userId, @action, @tableName, @recordId, @oldValues, @newValues, @ipAddress, @userAgent)
    `;
    
    if (!this.pool) {
      throw new Error('Database connection failed');
    }
    await this.pool.request()
      .input('userId', userId)
      .input('action', action)
      .input('tableName', tableName || null)
      .input('recordId', recordId || null)
      .input('oldValues', oldValues || null)
      .input('newValues', newValues || null)
      .input('ipAddress', ipAddress || null)
      .input('userAgent', userAgent || null)
      .query(query);
  }
}

export default DatabaseService;
