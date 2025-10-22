import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { config } from '@/config/env';
import { AuthTokens, JWTPayload } from '@/types/common';
import DatabaseService from './database.service';
import logger from '@/config/logger';
import { HybridTokenService } from './HybridTokenService';

export class AuthService {
  private static db = DatabaseService.getInstance();

  static async register(email: string, password: string, name: string) {
    // Check if user already exists
    const existingUser = await this.db.getUserByEmail(email);
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await this.db.createUser(email, passwordHash, name);
    
    // Assign customer role
    await this.db.assignUserRole(user.UserID, 'Customer');

    // Generate tokens
    const tokens = await this.generateTokens(user.UserID, user.Email, 'Customer');

    // Log audit
    await this.db.logAudit(user.UserID, 'USER_REGISTER', 'Users', user.UserID, null, JSON.stringify({ email, name }));

    logger.info(`User registered: ${email}`);

    return {
      user: {
        id: user.UserID,
        email: user.Email,
        name: user.FullName,
        role: 'Customer',
      },
      tokens,
    };
  }

  static async login(email: string, password: string): Promise<{ user: any; tokens: AuthTokens }> {
    try {
      // Connect to SQL Server
      const sql = require('mssql');
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

      await sql.connect(config);
      
      // Find user by email
      const result = await sql.query`
        SELECT UserID, Email, FullName, PasswordHash, Status
        FROM Users 
        WHERE Email = ${email} AND Status = 'Active'
      `;

      if (result.recordset.length === 0) {
        throw new Error('Invalid credentials');
      }

      const user = result.recordset[0];
      
      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.PasswordHash);
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      // Get user role
      const roleResult = await sql.query`
        SELECT r.RoleName
        FROM UserRoles ur
        JOIN Roles r ON ur.RoleID = r.RoleID
        WHERE ur.UserID = ${user.UserID}
      `;

      const role = roleResult.recordset.length > 0 ? roleResult.recordset[0].RoleName : 'Customer';

      // Generate tokens
      const tokens = await this.generateTokens(user.UserID, user.Email, role);

      logger.info(`User logged in: ${email}`);

      return {
        user: {
          id: user.UserID,
          email: user.Email,
          name: user.FullName,
          role: role,
        },
        tokens,
      };
    } catch (error) {
      logger.error('Login error:', error);
      throw new Error('Invalid credentials');
    }
  }

  static async generateTokens(userId: number, email: string, role: string): Promise<AuthTokens> {
    // Use HybridTokenService to create both JWT and Database tokens
    const tokens = await HybridTokenService.generateTokens(userId, email, role);
    
    return { 
      accessToken: tokens.jwtToken, 
      refreshToken: tokens.refreshToken 
    };
  }

  static async verifyToken(token: string): Promise<JWTPayload> {
    try {
      const validation = await HybridTokenService.validateToken(token);
      
      if (!validation.isValid || !validation.userEmail || !validation.userId) {
        throw new Error('Invalid token');
      }

      return {
        userId: validation.userId.toString(),
        email: validation.userEmail,
        role: validation.role || 'Customer'
      };
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  static async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const tokens = await HybridTokenService.refreshTokens(refreshToken);
      
      return { 
        accessToken: tokens.jwtToken, 
        refreshToken: tokens.refreshToken 
      };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  static async forgotPassword(email: string) {
    const user = await this.db.getUserByEmail(email);

    if (!user) {
      // Don't reveal if user exists or not
      return { message: 'If the email exists, a reset link has been sent.' };
    }

    // In a real app, you would send an email with reset token
    // For now, we'll just log it
    const resetToken = uuidv4();
    logger.info('Password reset requested', { 
      userId: user.UserID, 
      email: user.Email, 
      resetToken 
    });

    return { message: 'If the email exists, a reset link has been sent.' };
  }

  static async resetPassword(token: string, newPassword: string) {
    // In a real app, you would validate the token from email
    // For now, we'll log the attempt
    logger.info('Password reset attempted', { token });

    // This is a simplified implementation
    // In reality, you'd store and validate reset tokens
    throw new Error('Password reset not implemented yet');
  }

  static async logout(refreshToken: string) {
    // In a real app, you would invalidate the refresh token
    // For now, we'll just return success
    return { message: 'Logged out successfully' };
  }
}