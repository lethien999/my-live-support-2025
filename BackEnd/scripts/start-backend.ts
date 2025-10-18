import { spawn } from 'child_process';
import path from 'path';

console.log('🚀 Starting Live Support Backend Server...');

// Start backend server
const backendProcess = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, '..'),
  stdio: 'inherit',
  shell: true
});

backendProcess.on('error', (error) => {
  console.error('❌ Failed to start backend:', error);
  process.exit(1);
});

backendProcess.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ Backend exited with code ${code}`);
  } else {
    console.log('✅ Backend stopped gracefully');
  }
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down backend...');
  backendProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down backend...');
  backendProcess.kill('SIGTERM');
  process.exit(0);
});

console.log('✅ Backend server starting...');
console.log('📡 API will be available at: http://localhost:4000');
console.log('🔗 Frontend should connect to: http://localhost:4000/api');
console.log('\nPress Ctrl+C to stop the server');
