// scripts/test-frontend-connection.ts
import { io } from 'socket.io-client';

async function testFrontendConnection() {
  console.log('🔍 Testing Frontend WebSocket Connection...');
  
  return new Promise((resolve) => {
    const socket = io('http://localhost:4000', {
      transports: ['websocket', 'polling'],
      timeout: 5000,
      forceNew: true
    });

    let connected = false;

    socket.on('connect', () => {
      console.log('✅ Frontend WebSocket connection successful');
      console.log(`   - Socket ID: ${socket.id}`);
      console.log(`   - Transport: ${socket.io.engine.transport.name}`);
      connected = true;
      socket.disconnect();
      resolve(true);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Frontend WebSocket connection failed:', error.message);
      resolve(false);
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      if (!connected) {
        console.error('❌ Frontend WebSocket connection timeout');
        socket.disconnect();
        resolve(false);
      }
    }, 10000);
  });
}

async function testHealthEndpoint() {
  console.log('🔍 Testing Health Endpoint...');
  
  try {
    const response = await fetch('http://localhost:4000/health');
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Health endpoint accessible');
      console.log(`   - Status: ${data.status}`);
      console.log(`   - Uptime: ${data.uptime}s`);
      console.log(`   - Redis: ${data.redis || 'Not checked'}`);
      return true;
    } else {
      console.error('❌ Health endpoint returned error:', data);
      return false;
    }
  } catch (error) {
    console.error('❌ Health endpoint not accessible:', error);
    return false;
  }
}

async function runFrontendTest() {
  console.log('🚀 Starting Frontend Connection Test');
  console.log('====================================');
  
  const healthTest = await testHealthEndpoint();
  console.log('');
  
  const socketTest = await testFrontendConnection();
  console.log('');
  
  console.log('📊 Frontend Test Results');
  console.log('========================');
  console.log(`Health Endpoint: ${healthTest ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`WebSocket Connection: ${socketTest ? '✅ PASS' : '❌ FAIL'}`);
  console.log('');
  
  if (healthTest && socketTest) {
    console.log('🎉 Frontend tests passed! Ready to connect.');
    console.log('');
    console.log('🚀 Next steps:');
    console.log('   1. Start frontend: cd FrontEnd && npm run dev');
    console.log('   2. Open: http://localhost:5173');
    console.log('   3. Test real-time chat functionality');
  } else {
    console.log('❌ Frontend tests failed. Please check backend server.');
    process.exit(1);
  }
}

// Run the test
runFrontendTest().catch(console.error);
