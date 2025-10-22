import sql from 'mssql';

// SQL Server connection helper - same as dev-server.ts
async function getSQLServerConnection() {
  const dbConfig = {
    user: 'thien',
    password: '1909',
    server: 'localhost',
    database: 'live_support',
    options: {
      encrypt: false,
      trustServerCertificate: true,
    },
  };

  try {
    const pool = await sql.connect(dbConfig);
    return pool;
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}

export interface TokenData {
  tokenId: number;
  userId: number;
  token: string;
  tokenType: 'access' | 'refresh';
  expiresAt: Date;
  createdAt: Date;
  isActive: boolean;
}

export class TokenService {
  // Generate secure token
  static generateToken(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const random2 = Math.random().toString(36).substring(2, 15);
    return `access_${timestamp}_${random}_${random2}`;
  }

  // Create token in database
  static async createToken(userId: number, tokenType: 'access' | 'refresh', expiresInMinutes: number = 60): Promise<string> {
    const sql = await getSQLServerConnection();
    const token = this.generateToken();
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    await sql.query`
      INSERT INTO UserTokens (UserID, Token, TokenType, ExpiresAt, IsActive)
      VALUES (${userId}, ${token}, ${tokenType}, ${expiresAt}, 1)
    `;

    return token;
  }

  // Validate token from database
  static async validateToken(token: string): Promise<{ isValid: boolean; userId?: number; userEmail?: string }> {
    const sql = await getSQLServerConnection();
    
    const result = await sql.query`
      SELECT ut.UserID, ut.Token, ut.ExpiresAt, ut.IsActive, u.Email
      FROM UserTokens ut
      INNER JOIN Users u ON ut.UserID = u.UserID
      WHERE ut.Token = ${token} 
        AND ut.IsActive = 1 
        AND ut.ExpiresAt > GETDATE()
    `;

    if (result.recordset.length === 0) {
      return { isValid: false };
    }

    const tokenData = result.recordset[0];
    return {
      isValid: true,
      userId: tokenData.UserID,
      userEmail: tokenData.Email
    };
  }

  // Revoke token (logout)
  static async revokeToken(token: string): Promise<void> {
    const sql = await getSQLServerConnection();
    
    await sql.query`
      UPDATE UserTokens 
      SET IsActive = 0 
      WHERE Token = ${token}
    `;
  }

  // Revoke all tokens for user (logout all devices)
  static async revokeAllUserTokens(userId: number): Promise<void> {
    const sql = await getSQLServerConnection();
    
    await sql.query`
      UPDATE UserTokens 
      SET IsActive = 0 
      WHERE UserID = ${userId}
    `;
  }

  // Clean expired tokens
  static async cleanExpiredTokens(): Promise<void> {
    const sql = await getSQLServerConnection();
    
    await sql.query`
      UPDATE UserTokens 
      SET IsActive = 0 
      WHERE ExpiresAt < GETDATE()
    `;
  }
}
