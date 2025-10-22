import { Request, Response } from 'express';
import { HybridTokenService } from './HybridTokenService';

// Helper function to validate token and get user email
async function validateTokenAndGetUserEmail(authHeader: string | undefined): Promise<{ success: boolean; userEmail?: string; error?: string }> {
  if (!authHeader) {
    return { success: false, error: 'Token không hợp lệ' };
  }
  
  const token = authHeader.replace('Bearer ', '');
  
  try {
    const validation = await HybridTokenService.validateToken(token);
    
    if (!validation.isValid) {
      return { success: false, error: 'Token không hợp lệ hoặc đã hết hạn' };
    }
    
    return { success: true, userEmail: validation.userEmail };
  } catch (error) {
    console.error('Hybrid token validation error:', error);
    return { success: false, error: 'Lỗi xác thực token' };
  }
}

// Import SQL Server connection function from dev-server
async function getSQLServerConnection() {
  const sql = require('mssql');
  const config = {
    user: 'thien',
    password: '1909',
    server: 'localhost',
    database: 'live_support',
    port: 1433,
    options: {
      encrypt: false,
      trustServerCertificate: true,
    },
  };
  
  try {
    await sql.connect(config);
    return sql;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

// Import activeTokens from dev-server (we'll need to pass this as parameter)
let activeTokens: Map<string, string> = new Map();

// Function to set activeTokens from dev-server
export function setActiveTokens(tokens: Map<string, string>) {
  activeTokens = tokens;
}

// =============================================
// TICKET SYSTEM BACKEND API
// =============================================

// Get all tickets with filters
export const getTickets = async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      priority, 
      category, 
      agentId, 
      customerId,
      search 
    } = req.query;

    const sql = await getSQLServerConnection();
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (status) {
      whereClause += ' AND t.StatusID = ?';
      params.push(parseInt(status as string));
    }
    if (priority) {
      whereClause += ' AND t.PriorityID = ?';
      params.push(parseInt(priority as string));
    }
    if (category) {
      whereClause += ' AND t.CategoryID = ?';
      params.push(parseInt(category as string));
    }
    if (agentId) {
      whereClause += ' AND t.AgentID = ?';
      params.push(parseInt(agentId as string));
    }
    if (customerId) {
      whereClause += ' AND t.CustomerID = ?';
      params.push(parseInt(customerId as string));
    }
    if (search) {
      whereClause += ' AND (t.Title LIKE ? OR t.Description LIKE ? OR t.TicketNumber LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    const query = `
      SELECT 
        t.TicketID,
        t.TicketNumber,
        t.Title,
        t.Description,
        t.CreatedAt,
        t.UpdatedAt,
        t.ClosedAt,
        t.EstimatedResolution,
        t.ActualResolution,
        t.CustomerSatisfaction,
        t.CustomerFeedback,
        
        -- Customer info
        c.UserID as CustomerID,
        c.FullName as CustomerName,
        c.Email as CustomerEmail,
        c.Avatar as CustomerAvatar,
        
        -- Agent info
        a.UserID as AgentID,
        a.FullName as AgentName,
        a.Email as AgentEmail,
        
        -- Category info
        cat.CategoryName,
        
        -- Priority info
        p.PriorityName,
        p.PriorityLevel,
        p.ColorCode as PriorityColor,
        
        -- Status info
        s.StatusName,
        s.IsClosed as StatusIsClosed,
        
        -- Order info
        o.OrderNumber,
        
        -- Shop info
        sh.ShopName
        
      FROM Tickets t
      LEFT JOIN Users c ON t.CustomerID = c.UserID
      LEFT JOIN Users a ON t.AgentID = a.UserID
      LEFT JOIN TicketCategories cat ON t.CategoryID = cat.CategoryID
      LEFT JOIN TicketPriorities p ON t.PriorityID = p.PriorityID
      LEFT JOIN TicketStatuses s ON t.StatusID = s.StatusID
      LEFT JOIN Orders o ON t.OrderID = o.OrderID
      LEFT JOIN Shops sh ON t.ShopID = sh.ShopID
      ${whereClause}
      ORDER BY t.CreatedAt DESC
      OFFSET ${offset} ROWS
      FETCH NEXT ${parseInt(limit as string)} ROWS ONLY
    `;

    const result = await sql.query(query, params);
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) as Total
      FROM Tickets t
      ${whereClause}
    `;
    const countResult = await sql.query(countQuery, params);
    const total = countResult.recordset[0].Total;

    res.json({
      success: true,
      tickets: result.recordset,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });

  } catch (error) {
    console.error('❌ Error getting tickets:', error);
    res.status(500).json({ success: false, message: 'Failed to get tickets' });
  }
};

// Get single ticket
export const getTicket = async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;
    const sql = await getSQLServerConnection();

    const query = `
      SELECT 
        t.*,
        c.FullName as CustomerName,
        c.Email as CustomerEmail,
        c.Avatar as CustomerAvatar,
        a.FullName as AgentName,
        a.Email as AgentEmail,
        cat.CategoryName,
        p.PriorityName,
        p.PriorityLevel,
        p.ColorCode as PriorityColor,
        s.StatusName,
        s.IsClosed as StatusIsClosed,
        o.OrderNumber,
        sh.ShopName
      FROM Tickets t
      LEFT JOIN Users c ON t.CustomerID = c.UserID
      LEFT JOIN Users a ON t.AgentID = a.UserID
      LEFT JOIN TicketCategories cat ON t.CategoryID = cat.CategoryID
      LEFT JOIN TicketPriorities p ON t.PriorityID = p.PriorityID
      LEFT JOIN TicketStatuses s ON t.StatusID = s.StatusID
      LEFT JOIN Orders o ON t.OrderID = o.OrderID
      LEFT JOIN Shops sh ON t.ShopID = sh.ShopID
      WHERE t.TicketID = ?
    `;

    const result = await sql.query(query, [parseInt(ticketId)]);

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    // Get ticket comments
    const commentsQuery = `
      SELECT 
        tc.*,
        u.FullName as UserName,
        u.Email as UserEmail,
        u.Avatar as UserAvatar
      FROM TicketComments tc
      LEFT JOIN Users u ON tc.UserID = u.UserID
      WHERE tc.TicketID = ?
      ORDER BY tc.CreatedAt ASC
    `;

    const commentsResult = await sql.query(commentsQuery, [parseInt(ticketId)]);

    // Get ticket history
    const historyQuery = `
      SELECT 
        th.*,
        u.FullName as UserName,
        u.Email as UserEmail
      FROM TicketHistory th
      LEFT JOIN Users u ON th.UserID = u.UserID
      WHERE th.TicketID = ?
      ORDER BY th.CreatedAt ASC
    `;

    const historyResult = await sql.query(historyQuery, [parseInt(ticketId)]);

    // Get ticket attachments
    const attachmentsQuery = `
      SELECT 
        ta.*,
        u.FullName as UploadedByName
      FROM TicketAttachments ta
      LEFT JOIN Users u ON ta.UploadedBy = u.UserID
      WHERE ta.TicketID = ?
      ORDER BY ta.UploadedAt ASC
    `;

    const attachmentsResult = await sql.query(attachmentsQuery, [parseInt(ticketId)]);

    res.json({
      success: true,
      ticket: {
        ...result.recordset[0],
        comments: commentsResult.recordset,
        history: historyResult.recordset,
        attachments: attachmentsResult.recordset
      }
    });

  } catch (error) {
    console.error('❌ Error getting ticket:', error);
    res.status(500).json({ success: false, message: 'Failed to get ticket' });
  }
};

// Create new ticket
export const createTicket = async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      categoryId,
      priorityId,
      orderId,
      shopId
    } = req.body;

    // Get user from token
    // Validate token
    const tokenValidation = await validateTokenAndGetUserEmail(req.headers.authorization);
    if (!tokenValidation.success) {
      return res.status(401).json({ success: false, message: tokenValidation.error });
    }

    const userEmail = tokenValidation.userEmail!;

    const sql = await getSQLServerConnection();

    // Get user ID
    const userResult = await sql.query`
      SELECT UserID FROM Users WHERE Email = ${userEmail}
    `;
    if (userResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const customerId = userResult.recordset[0].UserID;

    // Generate ticket number
    const ticketNumberResult = await sql.query`EXEC sp_GenerateTicketNumber`;
    const ticketNumber = ticketNumberResult.recordset[0].TicketNumber;

    // Get default status (New)
    const statusResult = await sql.query`
      SELECT StatusID FROM TicketStatuses WHERE StatusName = 'Mới'
    `;
    const statusId = statusResult.recordset[0].StatusID;

    // Create ticket
    const result = await sql.query`
      INSERT INTO Tickets (
        TicketNumber, Title, Description, CustomerID, CategoryID, 
        PriorityID, StatusID, OrderID, ShopID, CreatedAt, UpdatedAt
      )
      OUTPUT INSERTED.TicketID
      VALUES (
        ${ticketNumber}, ${title}, ${description}, ${customerId}, 
        ${parseInt(categoryId)}, ${parseInt(priorityId)}, ${statusId}, 
        ${orderId || null}, ${shopId || null}, ${new Date().toISOString()}, ${new Date().toISOString()}
      )
    `;

    const ticketId = result.recordset[0].TicketID;

    // Add to history
    await sql.query`
      INSERT INTO TicketHistory (TicketID, UserID, Action, Description)
      VALUES (${ticketId}, ${customerId}, 'Created', 'Ticket created by customer')
    `;

    res.json({
      success: true,
      message: 'Ticket created successfully',
      ticket: {
        ticketId,
        ticketNumber,
        title,
        description
      }
    });

  } catch (error) {
    console.error('❌ Error creating ticket:', error);
    res.status(500).json({ success: false, message: 'Failed to create ticket' });
  }
};

// Update ticket
export const updateTicket = async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;
    const {
      title,
      description,
      statusId,
      priorityId,
      agentId,
      estimatedResolution,
      customerSatisfaction,
      customerFeedback
    } = req.body;

    // Get user from token
    // Validate token
    const tokenValidation = await validateTokenAndGetUserEmail(req.headers.authorization);
    if (!tokenValidation.success) {
      return res.status(401).json({ success: false, message: tokenValidation.error });
    }

    const userEmail = tokenValidation.userEmail!;

    const sql = await getSQLServerConnection();

    // Get user ID
    const userResult = await sql.query`
      SELECT UserID FROM Users WHERE Email = ${userEmail}
    `;
    if (userResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const userId = userResult.recordset[0].UserID;

    // Get current ticket
    const currentTicketResult = await sql.query`
      SELECT * FROM Tickets WHERE TicketID = ${parseInt(ticketId)}
    `;
    if (currentTicketResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const currentTicket = currentTicketResult.recordset[0];

    // Build update query
    const updates: string[] = [];
    const params: any[] = [];

    if (title !== undefined) {
      updates.push('Title = ?');
      params.push(title);
    }
    if (description !== undefined) {
      updates.push('Description = ?');
      params.push(description);
    }
    if (statusId !== undefined) {
      updates.push('StatusID = ?');
      params.push(parseInt(statusId));
    }
    if (priorityId !== undefined) {
      updates.push('PriorityID = ?');
      params.push(parseInt(priorityId));
    }
    if (agentId !== undefined) {
      updates.push('AgentID = ?');
      params.push(parseInt(agentId));
    }
    if (estimatedResolution !== undefined) {
      updates.push('EstimatedResolution = ?');
      params.push(estimatedResolution);
    }
    if (customerSatisfaction !== undefined) {
      updates.push('CustomerSatisfaction = ?');
      params.push(parseInt(customerSatisfaction));
    }
    if (customerFeedback !== undefined) {
      updates.push('CustomerFeedback = ?');
      params.push(customerFeedback);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    updates.push('UpdatedAt = ?');
    params.push(new Date().toISOString());

    params.push(parseInt(ticketId));

    const updateQuery = `UPDATE Tickets SET ${updates.join(', ')} WHERE TicketID = ?`;
    await sql.query(updateQuery, params);

    // Add to history
    const historyActions: string[] = [];
    if (title !== undefined && title !== currentTicket.Title) {
      historyActions.push(`Title changed from "${currentTicket.Title}" to "${title}"`);
    }
    if (statusId !== undefined && statusId !== currentTicket.StatusID) {
      historyActions.push(`Status changed`);
    }
    if (priorityId !== undefined && priorityId !== currentTicket.PriorityID) {
      historyActions.push(`Priority changed`);
    }
    if (agentId !== undefined && agentId !== currentTicket.AgentID) {
      historyActions.push(`Assigned to agent`);
    }

    if (historyActions.length > 0) {
      await sql.query`
        INSERT INTO TicketHistory (TicketID, UserID, Action, Description)
        VALUES (${parseInt(ticketId)}, ${userId}, 'Updated', ${historyActions.join('; ')})
      `;
    }

    res.json({
      success: true,
      message: 'Ticket updated successfully'
    });

  } catch (error) {
    console.error('❌ Error updating ticket:', error);
    res.status(500).json({ success: false, message: 'Failed to update ticket' });
  }
};

// Add comment to ticket
export const addTicketComment = async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;
    const { comment, isInternal = false } = req.body;

    // Get user from token
    // Validate token
    const tokenValidation = await validateTokenAndGetUserEmail(req.headers.authorization);
    if (!tokenValidation.success) {
      return res.status(401).json({ success: false, message: tokenValidation.error });
    }

    const userEmail = tokenValidation.userEmail!;

    const sql = await getSQLServerConnection();

    // Get user ID
    const userResult = await sql.query`
      SELECT UserID FROM Users WHERE Email = ${userEmail}
    `;
    if (userResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const userId = userResult.recordset[0].UserID;

    // Add comment
    const result = await sql.query`
      INSERT INTO TicketComments (TicketID, UserID, Comment, IsInternal, CreatedAt)
      OUTPUT INSERTED.CommentID
      VALUES (${parseInt(ticketId)}, ${userId}, ${comment}, ${isInternal}, ${new Date().toISOString()})
    `;

    const commentId = result.recordset[0].CommentID;

    // Add to history
    await sql.query`
      INSERT INTO TicketHistory (TicketID, UserID, Action, Description)
      VALUES (${parseInt(ticketId)}, ${userId}, 'Comment Added', 'Comment added to ticket')
    `;

    res.json({
      success: true,
      message: 'Comment added successfully',
      comment: {
        commentId,
        comment,
        isInternal
      }
    });

  } catch (error) {
    console.error('❌ Error adding comment:', error);
    res.status(500).json({ success: false, message: 'Failed to add comment' });
  }
};

// Get ticket statistics
export const getTicketStatistics = async (req: Request, res: Response) => {
  try {
    const { agentId, dateFrom, dateTo } = req.query;

    const sql = await getSQLServerConnection();

    const result = await sql.query`
      EXEC sp_GetTicketStatistics ${agentId || null}, ${dateFrom || null}, ${dateTo || null}
    `;

    res.json({
      success: true,
      statistics: result.recordset[0]
    });

  } catch (error) {
    console.error('❌ Error getting ticket statistics:', error);
    res.status(500).json({ success: false, message: 'Failed to get ticket statistics' });
  }
};

// Get ticket categories
export const getTicketCategories = async (req: Request, res: Response) => {
  try {
    const sql = await getSQLServerConnection();

    const result = await sql.query`
      SELECT * FROM TicketCategories WHERE IsActive = 1 ORDER BY CategoryName
    `;

    res.json({
      success: true,
      categories: result.recordset
    });

  } catch (error) {
    console.error('❌ Error getting ticket categories:', error);
    res.status(500).json({ success: false, message: 'Failed to get ticket categories' });
  }
};

// Get ticket priorities
export const getTicketPriorities = async (req: Request, res: Response) => {
  try {
    const sql = await getSQLServerConnection();

    const result = await sql.query`
      SELECT * FROM TicketPriorities WHERE IsActive = 1 ORDER BY PriorityLevel
    `;

    res.json({
      success: true,
      priorities: result.recordset
    });

  } catch (error) {
    console.error('❌ Error getting ticket priorities:', error);
    res.status(500).json({ success: false, message: 'Failed to get ticket priorities' });
  }
};

// Get ticket statuses
export const getTicketStatuses = async (req: Request, res: Response) => {
  try {
    const sql = await getSQLServerConnection();

    const result = await sql.query`
      SELECT * FROM TicketStatuses WHERE IsActive = 1 ORDER BY StatusName
    `;

    res.json({
      success: true,
      statuses: result.recordset
    });

  } catch (error) {
    console.error('❌ Error getting ticket statuses:', error);
    res.status(500).json({ success: false, message: 'Failed to get ticket statuses' });
  }
};
