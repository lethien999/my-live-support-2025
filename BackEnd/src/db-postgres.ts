// src/db-postgres.ts - PostgreSQL database connection
import { Pool } from 'pg';

let pool: Pool | null = null;

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'live_support',
  user: process.env.DB_USER || 'muji_user',
  password: process.env.DB_PASSWORD || 'muji_password',
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
};

export async function connectDatabase(): Promise<void> {
  try {
    pool = new Pool(config);
    
    // Test the connection
    const client = await pool.connect();
    console.log('✅ PostgreSQL connected successfully');
    
    // Test query
    const result = await client.query('SELECT NOW()');
    console.log('📊 Database time:', result.rows[0].now);
    
    client.release();
  } catch (error) {
    console.error('❌ Failed to connect to PostgreSQL:', error);
    throw error;
  }
}

export async function getConnection(): Promise<Pool> {
  if (!pool) {
    await connectDatabase();
  }
  return pool!;
}

export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('🔌 PostgreSQL connection closed');
  }
}
