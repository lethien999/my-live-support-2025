import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { config } from '@/config/env';

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    if (stack) {
      log += `\n${stack}`;
    }
    
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss',
  }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    let log = `${timestamp} ${level}: ${message}`;
    if (stack) {
      log += `\n${stack}`;
    }
    return log;
  })
);

// Create transports
const transports: winston.transport[] = [];

// Console transport for development
if (config.nodeEnv === 'development') {
  transports.push(
    new winston.transports.Console({
      level: 'debug',
      format: consoleFormat,
    })
  );
}

// File transports for all environments
const logDir = 'logs';

// Error log file
transports.push(
  new DailyRotateFile({
    filename: `${logDir}/error-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    format: logFormat,
    maxSize: '20m',
    maxFiles: '14d',
    zippedArchive: true,
  })
);

// Combined log file
transports.push(
  new DailyRotateFile({
    filename: `${logDir}/combined-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    format: logFormat,
    maxSize: '20m',
    maxFiles: '30d',
    zippedArchive: true,
  })
);

// Application specific log files
transports.push(
  new DailyRotateFile({
    filename: `${logDir}/app-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    level: 'info',
    format: logFormat,
    maxSize: '20m',
    maxFiles: '7d',
    zippedArchive: true,
  })
);

// Security log file
transports.push(
  new DailyRotateFile({
    filename: `${logDir}/security-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    level: 'warn',
    format: logFormat,
    maxSize: '20m',
    maxFiles: '90d',
    zippedArchive: true,
  })
);

// Performance log file
transports.push(
  new DailyRotateFile({
    filename: `${logDir}/performance-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    level: 'info',
    format: logFormat,
    maxSize: '20m',
    maxFiles: '7d',
    zippedArchive: true,
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: config.nodeEnv === 'production' ? 'info' : 'debug',
  format: logFormat,
  transports,
  exceptionHandlers: [
    new winston.transports.File({ filename: `${logDir}/exceptions.log` }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: `${logDir}/rejections.log` }),
  ],
  exitOnError: false,
});

// Custom logging methods
export class Logger {
  // Application logs
  static info(message: string, meta?: any) {
    logger.info(message, meta);
  }

  static debug(message: string, meta?: any) {
    logger.debug(message, meta);
  }

  static warn(message: string, meta?: any) {
    logger.warn(message, meta);
  }

  static error(message: string, error?: Error | any, meta?: any) {
    if (error instanceof Error) {
      logger.error(message, { error: error.message, stack: error.stack, ...meta });
    } else {
      logger.error(message, { error, ...meta });
    }
  }

  // Security logs
  static security(event: string, details: any) {
    logger.warn(`SECURITY: ${event}`, {
      type: 'security',
      ...details,
    });
  }

  static auth(event: string, details: any) {
    logger.info(`AUTH: ${event}`, {
      type: 'authentication',
      ...details,
    });
  }

  static authorization(event: string, details: any) {
    logger.warn(`AUTHORIZATION: ${event}`, {
      type: 'authorization',
      ...details,
    });
  }

  // Performance logs
  static performance(operation: string, duration: number, details?: any) {
    logger.info(`PERFORMANCE: ${operation}`, {
      type: 'performance',
      duration,
      ...details,
    });
  }

  static slowQuery(query: string, duration: number, details?: any) {
    logger.warn(`SLOW_QUERY: ${query}`, {
      type: 'slow_query',
      duration,
      ...details,
    });
  }

  // API logs
  static apiRequest(method: string, url: string, details: any) {
    logger.info(`API_REQUEST: ${method} ${url}`, {
      type: 'api_request',
      method,
      url,
      ...details,
    });
  }

  static apiResponse(method: string, url: string, statusCode: number, duration: number, details?: any) {
    logger.info(`API_RESPONSE: ${method} ${url}`, {
      type: 'api_response',
      method,
      url,
      statusCode,
      duration,
      ...details,
    });
  }

  // Database logs
  static database(operation: string, details: any) {
    logger.info(`DATABASE: ${operation}`, {
      type: 'database',
      ...details,
    });
  }

  static databaseError(operation: string, error: Error, details?: any) {
    logger.error(`DATABASE_ERROR: ${operation}`, error, {
      type: 'database_error',
      ...details,
    });
  }

  // Cache logs
  static cache(operation: string, key: string, details?: any) {
    logger.debug(`CACHE: ${operation}`, {
      type: 'cache',
      key,
      ...details,
    });
  }

  static cacheError(operation: string, key: string, error: Error, details?: any) {
    logger.error(`CACHE_ERROR: ${operation}`, error, {
      type: 'cache_error',
      key,
      ...details,
    });
  }

  // Socket logs
  static socket(event: string, details: any) {
    logger.info(`SOCKET: ${event}`, {
      type: 'socket',
      ...details,
    });
  }

  static socketError(event: string, error: Error, details?: any) {
    logger.error(`SOCKET_ERROR: ${event}`, error, {
      type: 'socket_error',
      ...details,
    });
  }

  // Business logic logs
  static business(event: string, details: any) {
    logger.info(`BUSINESS: ${event}`, {
      type: 'business',
      ...details,
    });
  }

  static businessError(event: string, error: Error, details?: any) {
    logger.error(`BUSINESS_ERROR: ${event}`, error, {
      type: 'business_error',
      ...details,
    });
  }

  // System logs
  static system(event: string, details: any) {
    logger.info(`SYSTEM: ${event}`, {
      type: 'system',
      ...details,
    });
  }

  static systemError(event: string, error: Error, details?: any) {
    logger.error(`SYSTEM_ERROR: ${event}`, error, {
      type: 'system_error',
      ...details,
    });
  }

  // User activity logs
  static userActivity(userId: string, action: string, details: any) {
    logger.info(`USER_ACTIVITY: ${action}`, {
      type: 'user_activity',
      userId,
      action,
      ...details,
    });
  }

  // Audit logs
  static audit(event: string, details: any) {
    logger.info(`AUDIT: ${event}`, {
      type: 'audit',
      ...details,
    });
  }

  // Health check logs
  static health(service: string, status: 'healthy' | 'unhealthy', details?: any) {
    const level = status === 'healthy' ? 'info' : 'error';
    logger.log(level, `HEALTH: ${service}`, {
      type: 'health',
      service,
      status,
      ...details,
    });
  }

  // Metrics logs
  static metrics(metric: string, value: number, details?: any) {
    logger.info(`METRICS: ${metric}`, {
      type: 'metrics',
      metric,
      value,
      ...details,
    });
  }
}

// Request logging middleware
export const requestLogger = (req: any, res: any, next: any) => {
  const start = Date.now();
  
  // Log request
  Logger.apiRequest(req.method, req.url, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk: any, encoding: any) {
    const duration = Date.now() - start;
    
    Logger.apiResponse(req.method, req.url, res.statusCode, duration, {
      ip: req.ip,
      userId: req.user?.id,
    });

    originalEnd.call(this, chunk, encoding);
  };

  next();
};

// Error logging middleware
export const errorLogger = (error: Error, req: any, res: any, next: any) => {
  Logger.error('Request Error', error, {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
  });

  next(error);
};

// Performance monitoring middleware
export const performanceLogger = (req: any, res: any, next: any) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    if (duration > 1000) { // Log slow requests (>1s)
      Logger.slowQuery(`${req.method} ${req.url}`, duration, {
        ip: req.ip,
        userId: req.user?.id,
      });
    }
  });

  next();
};

export default Logger;