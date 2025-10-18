import helmet from 'helmet';
import cors from 'cors';
import { Request, Response, NextFunction } from 'express';
import { config } from '@/config/env';
import Logger from '@/config/logger';

// Security headers middleware
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "ws:", "wss:"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
});

// CORS configuration
export const corsConfig = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      config.corsOrigin,
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
    ];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      Logger.security('CORS blocked origin', { origin });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma',
  ],
  exposedHeaders: ['X-Total-Count', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  maxAge: 86400, // 24 hours
});

// Request ID middleware
export const requestId = (req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] as string || 
                   req.headers['x-correlation-id'] as string || 
                   generateRequestId();
  
  (req as any).requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  
  next();
};

// IP whitelist middleware
export const ipWhitelist = (allowedIPs: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (clientIP && allowedIPs.includes(clientIP)) {
      next();
    } else {
      Logger.security('IP not whitelisted', { 
        ip: clientIP, 
        url: req.url,
        userAgent: req.get('User-Agent'),
      });
      
      res.status(403).json({
        success: false,
        error: {
          message: 'Access denied',
          statusCode: 403,
        },
        timestamp: new Date().toISOString(),
      });
    }
  };
};

// Request size limiter
export const requestSizeLimiter = (maxSize: string = '10mb') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.get('content-length') || '0');
    const maxBytes = parseSize(maxSize);
    
    if (contentLength > maxBytes) {
      Logger.security('Request too large', {
        contentLength,
        maxBytes,
        url: req.url,
        ip: req.ip,
      });
      
      res.status(413).json({
        success: false,
        error: {
          message: 'Request entity too large',
          statusCode: 413,
        },
        timestamp: new Date().toISOString(),
      });
    } else {
      next();
    }
  };
};

// SQL injection protection
export const sqlInjectionProtection = (req: Request, res: Response, next: NextFunction) => {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
    /(\b(OR|AND)\s+['"]\s*=\s*['"])/i,
    /(\bUNION\s+SELECT\b)/i,
    /(\bDROP\s+TABLE\b)/i,
    /(\bINSERT\s+INTO\b)/i,
    /(\bDELETE\s+FROM\b)/i,
    /(\bUPDATE\s+.*\s+SET\b)/i,
  ];
  
  const checkValue = (value: any): boolean => {
    if (typeof value === 'string') {
      return sqlPatterns.some(pattern => pattern.test(value));
    }
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(checkValue);
    }
    return false;
  };
  
  const hasSqlInjection = checkValue(req.body) || checkValue(req.query) || checkValue(req.params);
  
  if (hasSqlInjection) {
    Logger.security('SQL injection attempt detected', {
      ip: req.ip,
      url: req.url,
      body: req.body,
      query: req.query,
      params: req.params,
      userAgent: req.get('User-Agent'),
    });
    
    res.status(400).json({
      success: false,
      error: {
        message: 'Invalid request',
        statusCode: 400,
      },
      timestamp: new Date().toISOString(),
    });
  } else {
    next();
  }
};

// XSS protection
export const xssProtection = (req: Request, res: Response, next: NextFunction) => {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
    /<link\b[^<]*(?:(?!<\/link>)<[^<]*)*<\/link>/gi,
    /<meta\b[^<]*(?:(?!<\/meta>)<[^<]*)*<\/meta>/gi,
  ];
  
  const checkValue = (value: any): boolean => {
    if (typeof value === 'string') {
      return xssPatterns.some(pattern => pattern.test(value));
    }
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(checkValue);
    }
    return false;
  };
  
  const hasXss = checkValue(req.body) || checkValue(req.query) || checkValue(req.params);
  
  if (hasXss) {
    Logger.security('XSS attempt detected', {
      ip: req.ip,
      url: req.url,
      body: req.body,
      query: req.query,
      params: req.params,
      userAgent: req.get('User-Agent'),
    });
    
    res.status(400).json({
      success: false,
      error: {
        message: 'Invalid request',
        statusCode: 400,
      },
      timestamp: new Date().toISOString(),
    });
  } else {
    next();
  }
};

// Security headers for API responses
export const apiSecurityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Add cache control for sensitive endpoints
  if (req.path.includes('/auth') || req.path.includes('/admin')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  
  next();
};

// Request sanitization
export const sanitizeRequest = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize string values
  const sanitizeValue = (value: any): any => {
    if (typeof value === 'string') {
      return value
        .trim()
        .replace(/[<>]/g, '') // Remove < and >
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+\s*=/gi, ''); // Remove event handlers
    }
    if (typeof value === 'object' && value !== null) {
      const sanitized: any = Array.isArray(value) ? [] : {};
      for (const key in value) {
        sanitized[key] = sanitizeValue(value[key]);
      }
      return sanitized;
    }
    return value;
  };
  
  req.body = sanitizeValue(req.body);
  req.query = sanitizeValue(req.query);
  req.params = sanitizeValue(req.params);
  
  next();
};

// Brute force protection
export const bruteForceProtection = (maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) => {
  const attempts = new Map<string, { count: number; resetTime: number }>();
  
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    const attempt = attempts.get(key);
    
    if (!attempt || now > attempt.resetTime) {
      attempts.set(key, { count: 1, resetTime: now + windowMs });
      next();
    } else if (attempt.count >= maxAttempts) {
      Logger.security('Brute force attempt detected', {
        ip: req.ip,
        url: req.url,
        attempts: attempt.count,
        userAgent: req.get('User-Agent'),
      });
      
      res.status(429).json({
        success: false,
        error: {
          message: 'Too many attempts, please try again later',
          statusCode: 429,
        },
        timestamp: new Date().toISOString(),
      });
    } else {
      attempt.count++;
      next();
    }
  };
};

// Helper functions
function generateRequestId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

function parseSize(size: string): number {
  const units: { [key: string]: number } = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024,
  };
  
  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/);
  if (!match) return 10 * 1024 * 1024; // Default 10MB
  
  const value = parseFloat(match[1]);
  const unit = match[2] || 'mb';
  
  return value * (units[unit] || units.mb);
}

// Security audit middleware
export const securityAudit = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // Log suspicious activities
    if (res.statusCode >= 400) {
      Logger.security('Suspicious activity detected', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        duration,
        userId: (req as any).user?.id,
      });
    }
    
    // Log admin activities
    if (req.path.includes('/admin') && (req as any).user) {
      Logger.audit('Admin action', {
        method: req.method,
        url: req.url,
        userId: (req as any).user.id,
        ip: req.ip,
        statusCode: res.statusCode,
        duration,
      });
    }
  });
  
  next();
};
