import { Request, Response } from 'express';
import { AuthService } from '@/services/auth.service';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '@/validators/auth.schema';
import { prisma } from '@/libs/prisma';
import logger from '@/config/logger';

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const validatedData = registerSchema.parse(req.body);
      const user = await AuthService.register(
        validatedData.email,
        validatedData.password,
        validatedData.name
      );

      res.status(201).json({
        message: 'User registered successfully',
        user,
      });
    } catch (error: any) {
      logger.error('Registration error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const validatedData = loginSchema.parse(req.body);
      const result = await AuthService.login(validatedData.email, validatedData.password);

      res.json({
        message: 'Login successful',
        ...result,
      });
    } catch (error: any) {
      logger.error('Login error:', error);
      res.status(401).json({ error: error.message });
    }
  }

  static async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token is required' });
      }

      const tokens = await AuthService.refreshToken(refreshToken);

      res.json({
        message: 'Token refreshed successfully',
        ...tokens,
      });
    } catch (error: any) {
      logger.error('Token refresh error:', error);
      res.status(401).json({ error: error.message });
    }
  }

  static async forgotPassword(req: Request, res: Response) {
    try {
      const validatedData = forgotPasswordSchema.parse(req.body);
      const result = await AuthService.forgotPassword(validatedData.email);

      res.json(result);
    } catch (error: any) {
      logger.error('Forgot password error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async resetPassword(req: Request, res: Response) {
    try {
      const validatedData = resetPasswordSchema.parse(req.body);
      const result = await AuthService.resetPassword(validatedData.token, validatedData.password);

      res.json(result);
    } catch (error: any) {
      logger.error('Reset password error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async me(req: any, res: Response) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ user });
    } catch (error: any) {
      logger.error('Get user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async logout(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token is required' });
      }

      const result = await AuthService.logout(refreshToken);
      res.json(result);
    } catch (error: any) {
      logger.error('Logout error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
