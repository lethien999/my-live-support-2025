// src/server.ts
import http from 'http';
import express from 'express';
import { Server } from 'socket.io';
import messagesRouter from './routes/messages';
import { initializeSockets } from './sockets';
import { connectDatabase } from './db';
import { config } from './config/env';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount routes
app.use('/rooms', messagesRouter);

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  path: config.socket.path,
  cors: {
    origin: config.corsOrigin,
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling'] as any
});

// Initialize Socket handlers with ChatGateway
initializeSockets(io);

// Start server
const port = config.port;

async function startServer() {
  try {
    // Connect to database first
    await connectDatabase();
    
    // Start HTTP server
    server.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`);
      console.log(`🔌 Socket.IO available at ws://localhost:${port}${config.socket.path}`);
      console.log(`📡 Health check: http://localhost:${port}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Start the server
startServer();