import dotenv from 'dotenv';
import { server } from './app';
import { config } from '@/config/env';
import logger from '@/config/logger';

// Load environment variables
dotenv.config();

const PORT = config.port;

server.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
  logger.info(`🔌 WebSocket: http://localhost:${PORT}/ws`);
  logger.info(`🌍 Environment: ${config.nodeEnv}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});
