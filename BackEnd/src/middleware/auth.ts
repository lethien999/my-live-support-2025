import { Request, Response, NextFunction } from 'express';
import { HybridTokenService } from '../services/HybridTokenService';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    userId: string;
    email: string;
    role: string;
  };
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    // Use HybridTokenService for validation
    const validation = await HybridTokenService.validateToken(token);
    
    if (!validation.isValid || !validation.userEmail || !validation.userId) {
      return res.status(401).json({ error: 'Invalid token.' });
    }

    req.user = {
      id: validation.userId.toString(),
      userId: validation.userId.toString(),
      email: validation.userEmail,
      role: validation.role || 'Customer'
    };
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Invalid token.' });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions.' });
    }

    next();
  };
};
