import jwt from 'jsonwebtoken';
import { TokenService } from './TokenService';

export class HybridTokenService {
  private static jwtSecret = 'your-jwt-secret-key-change-in-production';
  private static jwtExpiresIn = '1h';
  private static refreshExpiresIn = '7d';

  // Generate both JWT and Database token
  static async generateTokens(userId: number, email: string, role: string): Promise<{
    jwtToken: string;
    databaseToken: string;
    refreshToken: string;
  }> {
    // 1. Generate JWT (stateless, fast)
    const jwtPayload = {
      userId: userId.toString(),
      email,
      role,
      iat: Math.floor(Date.now() / 1000)
    };
    
    const jwtToken = jwt.sign(jwtPayload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn
    } as jwt.SignOptions);

    // 2. Generate Database token (stateful, revocable)
    const databaseToken = await TokenService.createToken(userId, 'access', 60);
    const refreshToken = await TokenService.createToken(userId, 'refresh', 7 * 24 * 60);

    return {
      jwtToken,
      databaseToken,
      refreshToken
    };
  }

  // Validate token with hybrid approach
  static async validateToken(token: string): Promise<{
    isValid: boolean;
    userEmail?: string;
    userId?: number;
    role?: string;
    source: 'jwt' | 'database' | 'cache';
  }> {
    console.log('🔍 HybridTokenService.validateToken called with:', token);
    
    try {
      // Step 1: Try JWT validation (fastest)
      try {
        const decoded = jwt.verify(token, this.jwtSecret) as any;
        console.log('✅ JWT validation successful:', decoded);
        
        // Step 2: Check if database token exists and is active
        const dbValidation = await TokenService.validateToken(token);
        console.log('🔍 Database validation result:', dbValidation);
        
        if (dbValidation.isValid) {
          return {
            isValid: true,
            userEmail: decoded.email,
            userId: parseInt(decoded.userId),
            role: decoded.role,
            source: 'jwt'
          };
        }
        
        // JWT valid but database token revoked
        console.log('❌ JWT valid but database token revoked');
        return {
          isValid: false,
          source: 'jwt'
        };
      } catch (jwtError: any) {
        console.log('❌ JWT validation failed:', jwtError.message);
        // JWT invalid, try database token
        const dbValidation = await TokenService.validateToken(token);
        console.log('🔍 Database validation result (fallback):', dbValidation);
        
        if (dbValidation.isValid) {
          // Database token valid but JWT expired
          // This can happen if JWT expires but database token is still active
          return {
            isValid: true,
            userEmail: dbValidation.userEmail,
            userId: dbValidation.userId,
            source: 'database'
          };
        }
        
        console.log('❌ Both JWT and database validation failed');
        return {
          isValid: false,
          source: 'database'
        };
      }
    } catch (error) {
      console.log('❌ HybridTokenService validation error:', error);
      return {
        isValid: false,
        source: 'database'
      };
    }
  }

  // Revoke token (database + cache)
  static async revokeToken(token: string): Promise<void> {
    await TokenService.revokeToken(token);
    // Remove from cache if exists
  }

  // Refresh tokens
  static async refreshTokens(refreshToken: string): Promise<{
    jwtToken: string;
    databaseToken: string;
    refreshToken: string;
  }> {
    const validation = await TokenService.validateToken(refreshToken);
    
    if (!validation.isValid || !validation.userEmail || !validation.userId) {
      throw new Error('Invalid refresh token');
    }

    // Revoke old tokens
    await TokenService.revokeToken(refreshToken);

    // Generate new tokens
    return await this.generateTokens(
      validation.userId,
      validation.userEmail,
      'Customer' // Default role, should get from database
    );
  }
}
