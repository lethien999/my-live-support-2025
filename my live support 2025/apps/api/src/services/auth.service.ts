import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/libs/prisma';
import { config } from '@/config/env';
import { AuthTokens, JWTPayload } from '@/types/common';
import logger from '@/config/logger';

export class AuthService {
  static async register(email: string, password: string, name: string) {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: 'customer',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    logger.info('User registered', { userId: user.id, email: user.email });

    return user;
  }

  static async login(email: string, password: string): Promise<{ user: any; tokens: AuthTokens }> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.status !== 'active') {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    logger.info('User logged in', { userId: user.id, email: user.email });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      tokens,
    };
  }

  static async generateTokens(userId: string, email: string, role: string): Promise<AuthTokens> {
    const payload: JWTPayload = { userId, email, role };
    
    const accessToken = jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpires,
    });

    const refreshToken = uuidv4();
    const refreshExpires = new Date();
    refreshExpires.setDate(refreshExpires.getDate() + 7); // 7 days

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt: refreshExpires,
      },
    });

    return { accessToken, refreshToken };
  }

  static async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      throw new Error('Invalid or expired refresh token');
    }

    if (tokenRecord.user.status !== 'active') {
      throw new Error('User account is not active');
    }

    // Delete old refresh token
    await prisma.refreshToken.delete({
      where: { id: tokenRecord.id },
    });

    // Generate new tokens
    return this.generateTokens(tokenRecord.user.id, tokenRecord.user.email, tokenRecord.user.role);
  }

  static async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists or not
      return { message: 'If the email exists, a reset link has been sent.' };
    }

    // In a real app, you would send an email with reset token
    // For demo purposes, we'll just log it
    const resetToken = uuidv4();
    logger.info('Password reset requested', { 
      userId: user.id, 
      email: user.email, 
      resetToken 
    });

    return { message: 'If the email exists, a reset link has been sent.' };
  }

  static async resetPassword(token: string, newPassword: string) {
    // In a real app, you would validate the token from email
    // For demo purposes, we'll accept any token
    logger.info('Password reset attempted', { token });

    // This is a simplified implementation
    // In reality, you'd store and validate reset tokens
    throw new Error('Password reset not implemented in demo mode');
  }

  static async logout(refreshToken: string) {
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });

    return { message: 'Logged out successfully' };
  }
}
