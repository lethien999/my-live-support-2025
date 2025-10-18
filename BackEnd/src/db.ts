// src/db.ts
import sql from 'mssql';
import { DatabaseConfig, MessageRecord } from './types';
import { config } from './config/env';

const dbConfig: DatabaseConfig = {
  user: config.db.user,
  password: config.db.password,
  server: config.db.server,
  database: config.db.database,
  port: config.db.port,
  options: {
    encrypt: config.db.options.encrypt,
    trustServerCertificate: config.db.options.trustServerCertificate,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
    acquireTimeoutMillis: 60000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 200,
  },
};

let pool: sql.ConnectionPool | null = null;

export async function connectDatabase(): Promise<void> {
  try {
    if (!pool) {
      console.log('🔌 Connecting to database...');
      pool = await sql.connect(dbConfig);
      console.log('✅ Database connected successfully');
      
      // Connection pool options are set in dbConfig
      // MSSQL driver handles pooling automatically
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

export async function getConnection(): Promise<sql.ConnectionPool> {
  if (!pool) {
    await connectDatabase();
  }
  return pool!;
}

export async function insertMessage(params: {
  roomId: string;
  senderId: string;
  body: string;
  createdAt: string;
}): Promise<string> {
  try {
    const pool = await getConnection();

    const result = await sql.query`
      INSERT INTO Messages (RoomID, SenderID, Content, MessageType, CreatedAt)
      OUTPUT INSERTED.MessageID
      VALUES (${parseInt(params.roomId)}, ${parseInt(params.senderId)}, ${params.body}, 'text', ${params.createdAt})
    `;

    const messageId = result.recordset[0].MessageID.toString();
    console.log(`📝 Message inserted: ID=${messageId}, Room=${params.roomId}, Sender=${params.senderId}`);
    
    return messageId;
  } catch (error) {
    console.error('❌ Error inserting message:', error);
    throw error;
  }
}

export async function getMessages(params: {
  roomId: string;
  limit?: number;
  beforeId?: string;
}): Promise<MessageRecord[]> {
  try {
    const pool = await getConnection();

    const limit = params.limit || 50;
    let query = `
      SELECT TOP ${limit} 
        MessageID as id,
        RoomID as roomId,
        SenderID as senderId,
        Content as body,
        CreatedAt as createdAt
      FROM Messages 
      WHERE RoomID = @roomId
    `;

    const request = pool.request();
    request.input('roomId', parseInt(params.roomId));

    if (params.beforeId) {
      query += ' AND MessageID < @beforeId';
      request.input('beforeId', parseInt(params.beforeId));
    }

    query += ' ORDER BY MessageID DESC';

    const result = await request.query(query);
    
    const messages: MessageRecord[] = result.recordset.map(row => ({
      id: row.id.toString(),
      roomId: row.roomId.toString(),
      senderId: row.senderId.toString(),
      body: row.body,
      createdAt: row.createdAt.toISOString()
    }));

    console.log(`📖 Retrieved ${messages.length} messages for room ${params.roomId}`);
    return messages;
  } catch (error) {
    console.error('❌ Error getting messages:', error);
    throw error;
  }
}

export async function createRoomIfNotExists(params: {
  roomId: string;
  customerId: string;
  shopId?: string;
}): Promise<void> {
  try {
    const pool = await getConnection();

    // Check if room exists
    const existingRoom = await sql.query`
      SELECT RoomID FROM ChatRooms WHERE RoomID = ${parseInt(params.roomId)}
    `;

    if (existingRoom.recordset.length === 0) {
      // Create new room
      await sql.query`
        INSERT INTO ChatRooms (RoomID, CustomerID, ShopID, CreatedAt)
        VALUES (${parseInt(params.roomId)}, ${parseInt(params.customerId)}, ${parseInt(params.shopId || '1')}, GETDATE())
      `;
      console.log(`🏠 Created new room: ${params.roomId}`);
    }
  } catch (error) {
    console.error('❌ Error creating room:', error);
    throw error;
  }
}
