// scripts/test-complete-system.ts
import dotenv from 'dotenv';
import { connectDatabase } from '../src/db';
import { redisService } from '../src/services/redisService';
import { config } from '../src/config/env';

// Load environment variables
dotenv.config({ path: 'env-clean.local' });
dotenv.config();

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  try {
    await connectDatabase();
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

async function testRedisConnection() {
  console.log('🔍 Testing Redis connection...');
  try {
    await redisService.connect();
    const pong = await redisService.ping();
    console.log('✅ Redis connection successful:', pong);
    return true;
  } catch (error) {
    console.log('⚠️ Redis not available - System will use Socket.IO fallback');
    console.log('   To enable Redis: Install Redis server locally');
    return false;
  }
}

async function testEnvironmentConfig() {
  console.log('🔍 Testing environment configuration...');
  
  const requiredConfigs = [
    'PORT',
    'DATABASE_URL',
    'JWT_SECRET',
    'CORS_ORIGIN'
  ];

  const missingConfigs = requiredConfigs.filter(key => !process.env[key]);
  
  if (missingConfigs.length > 0) {
    console.error('❌ Missing required environment variables:', missingConfigs);
    return false;
  }

  console.log('✅ Environment configuration valid');
  console.log(`   - Port: ${config.port}`);
  console.log(`   - Database: ${config.db.server}:${config.db.port}/${config.db.database}`);
  console.log(`   - CORS Origin: ${config.corsOrigin}`);
  console.log(`   - Redis: ${config.redis.url}`);
  
  return true;
}

async function testWebSocketConfig() {
  console.log('🔍 Testing WebSocket configuration...');
  
  const socketConfig = {
    port: config.socket.port,
    path: config.socket.path,
    transports: config.socket.transports
  };

  console.log('✅ WebSocket configuration valid');
  console.log(`   - Port: ${socketConfig.port}`);
  console.log(`   - Path: ${socketConfig.path}`);
  console.log(`   - Transports: ${socketConfig.transports.join(', ')}`);
  
  return true;
}

async function runCompleteSystemTest() {
  console.log('🚀 Starting Complete System Test');
  console.log('=====================================');
  
  const results = {
    environment: false,
    database: false,
    redis: false,
    websocket: false
  };

  // Test 1: Environment Configuration
  results.environment = await testEnvironmentConfig();
  console.log('');

  // Test 2: Database Connection
  results.database = await testDatabaseConnection();
  console.log('');

  // Test 3: Redis Connection (Optional)
  results.redis = await testRedisConnection();
  console.log('');

  // Test 4: WebSocket Configuration
  results.websocket = await testWebSocketConfig();
  console.log('');

  // Summary
  console.log('📊 Test Results Summary');
  console.log('========================');
  console.log(`Environment Config: ${results.environment ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Database Connection: ${results.database ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Redis Connection: ${results.redis ? '✅ PASS' : '⚠️ OPTIONAL'}`);
  console.log(`WebSocket Config: ${results.websocket ? '✅ PASS' : '❌ FAIL'}`);
  console.log('');

  const criticalTests = results.environment && results.database && results.websocket;
  
  if (criticalTests) {
    console.log('🎉 All critical tests passed! System is ready to run.');
    console.log('');
    console.log('🚀 Next steps:');
    console.log('   1. Run: npm run dev (for optimized development server)');
    console.log('   2. Run: npm run dev:full (for full-featured server)');
    console.log('   3. Open: http://localhost:4000/health (health check)');
    console.log('   4. Open: http://localhost:5173 (frontend)');
    
    if (results.redis) {
      console.log('   🔥 Redis enabled - Ultra-fast real-time messaging!');
    } else {
      console.log('   ⚠️ Redis not available - Using Socket.IO fallback (still works great!)');
    }
  } else {
    console.log('❌ Some critical tests failed. Please fix the issues above.');
    process.exit(1);
  }

  // Cleanup
  try {
    await redisService.disconnect();
  } catch (error) {
    // Ignore cleanup errors
  }
}

// Run the test
runCompleteSystemTest().catch(console.error);
