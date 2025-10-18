import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import logger from '@/config/logger';

// General API rate limiter
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    success: false,
    error: {
      message: 'Too many requests from this IP, please try again later',
      statusCode: 429,
    },
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('Rate limit exceeded:', {
      ip: req.ip,
      url: req.url,
      method: req.method,
      userAgent: req.get('User-Agent'),
    });
    
    res.status(429).json({
      success: false,
      error: {
        message: 'Too many requests from this IP, please try again later',
        statusCode: 429,
      },
      timestamp: new Date().toISOString(),
    });
  },
});

// Auth endpoints rate limiter
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 auth requests per windowMs
  message: {
    success: false,
    error: {
      message: 'Too many authentication attempts, please try again later',
      statusCode: 429,
    },
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req: Request, res: Response) => {
    logger.warn('Auth rate limit exceeded:', {
      ip: req.ip,
      url: req.url,
      method: req.method,
      userAgent: req.get('User-Agent'),
    });
    
    res.status(429).json({
      success: false,
      error: {
        message: 'Too many authentication attempts, please try again later',
        statusCode: 429,
      },
      timestamp: new Date().toISOString(),
    });
  },
});

// Password reset rate limiter
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: {
    success: false,
    error: {
      message: 'Too many password reset attempts, please try again later',
      statusCode: 429,
    },
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('Password reset rate limit exceeded:', {
      ip: req.ip,
      url: req.url,
      method: req.method,
      userAgent: req.get('User-Agent'),
    });
    
    res.status(429).json({
      success: false,
      error: {
        message: 'Too many password reset attempts, please try again later',
        statusCode: 429,
      },
      timestamp: new Date().toISOString(),
    });
  },
});

// Chat/Socket rate limiter
export const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 chat requests per minute
  message: {
    success: false,
    error: {
      message: 'Too many chat messages, please slow down',
      statusCode: 429,
    },
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('Chat rate limit exceeded:', {
      ip: req.ip,
      url: req.url,
      method: req.method,
      userAgent: req.get('User-Agent'),
    });
    
    res.status(429).json({
      success: false,
      error: {
        message: 'Too many chat messages, please slow down',
        statusCode: 429,
      },
      timestamp: new Date().toISOString(),
    });
  },
});

// File upload rate limiter
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 uploads per 15 minutes
  message: {
    success: false,
    error: {
      message: 'Too many file uploads, please try again later',
      statusCode: 429,
    },
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('Upload rate limit exceeded:', {
      ip: req.ip,
      url: req.url,
      method: req.method,
      userAgent: req.get('User-Agent'),
    });
    
    res.status(429).json({
      success: false,
      error: {
        message: 'Too many file uploads, please try again later',
        statusCode: 429,
      },
      timestamp: new Date().toISOString(),
    });
  },
});

// Admin endpoints rate limiter
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 admin requests per 15 minutes
  message: {
    success: false,
    error: {
      message: 'Too many admin requests, please try again later',
      statusCode: 429,
    },
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('Admin rate limit exceeded:', {
      ip: req.ip,
      url: req.url,
      method: req.method,
      userAgent: req.get('User-Agent'),
    });
    
    res.status(429).json({
      success: false,
      error: {
        message: 'Too many admin requests, please try again later',
        statusCode: 429,
      },
      timestamp: new Date().toISOString(),
    });
  },
});

// Create custom rate limiter
export const createCustomLimiter = (options: {
  windowMs: number;
  max: number;
  message: string;
  skipSuccessfulRequests?: boolean;
}) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: {
      success: false,
      error: {
        message: options.message,
        statusCode: 429,
      },
      timestamp: new Date().toISOString(),
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    handler: (req: Request, res: Response) => {
      logger.warn('Custom rate limit exceeded:', {
        ip: req.ip,
        url: req.url,
        method: req.method,
        userAgent: req.get('User-Agent'),
        limit: options.max,
        windowMs: options.windowMs,
      });
      
      res.status(429).json({
        success: false,
        error: {
          message: options.message,
          statusCode: 429,
        },
        timestamp: new Date().toISOString(),
      });
    },
  });
};

// Rate limit status middleware
export const rateLimitStatus = (req: Request, res: Response, next: Function) => {
  const rateLimitInfo = {
    limit: (req as any).rateLimit?.limit,
    remaining: (req as any).rateLimit?.remaining,
    reset: (req as any).rateLimit?.resetTime,
    retryAfter: (req as any).rateLimit?.retryAfter,
  };

  res.set({
    'X-RateLimit-Limit': rateLimitInfo.limit?.toString(),
    'X-RateLimit-Remaining': rateLimitInfo.remaining?.toString(),
    'X-RateLimit-Reset': rateLimitInfo.reset?.toString(),
  });

  next();
};
