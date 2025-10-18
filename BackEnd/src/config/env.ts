import dotenv from 'dotenv';

// Load environment variables from .env.local first, then .env
dotenv.config({ path: '.env.local' });
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'devsecret',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'devrefresh',
  jwtExpires: process.env.JWT_EXPIRES || '24h',
  jwtRefreshExpires: process.env.JWT_REFRESH_EXPIRES || '7d',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Google OAuth
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5173',
  
  // Database connection details
  db: {
    user: process.env.DB_USER || 'thien',
    password: process.env.DB_PASSWORD || '1909',
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_DATABASE || 'live_support',
    port: parseInt(process.env.DB_PORT || '1433', 10),
    options: {
      encrypt: process.env.DB_ENCRYPT === 'true',
      trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
    },
  },
  
  // WebSocket configuration
  socket: {
    port: parseInt(process.env.SOCKET_PORT || '4000', 10),
    path: process.env.SOCKET_PATH || '/socket.io',
    transports: process.env.SOCKET_TRANSPORTS?.split(',') || ['websocket', 'polling'],
  },
  
  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    maxSize: process.env.LOG_FILE_MAX_SIZE || '20m',
    maxFiles: process.env.LOG_FILE_MAX_FILES || '14d',
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  
  // Development flags
  debug: process.env.DEBUG_MODE === 'true',
  enableSwagger: process.env.ENABLE_SWAGGER === 'true',
  enableCors: process.env.ENABLE_CORS === 'true',
  
  // Redis configuration
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },
};
