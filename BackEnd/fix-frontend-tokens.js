const http = require('http');

// Force generate new tokens and provide clear instructions
const loginData = JSON.stringify({
  email: 'admin@muji.com',
  password: '111111'
});

const loginOptions = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(loginData)
  }
};

const loginReq = http.request(loginOptions, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const response = JSON.parse(data);
    const accessToken = response.tokens?.accessToken;
    const refreshToken = response.tokens?.refreshToken;
    
    console.log('🆕 FRESH TOKENS GENERATED:');
    console.log('Access Token:', accessToken);
    console.log('Refresh Token:', refreshToken);
    console.log('');
    console.log('🚨 URGENT: Frontend is using OLD tokens!');
    console.log('');
    console.log('📋 STEP-BY-STEP FIX:');
    console.log('1. Open Developer Tools (F12)');
    console.log('2. Go to Console tab');
    console.log('3. Type: allow pasting');
    console.log('4. Press Enter');
    console.log('5. Paste this code:');
    console.log('');
    console.log('// Clear old tokens');
    console.log('sessionStorage.clear();');
    console.log('localStorage.clear();');
    console.log('');
    console.log('// Set new tokens');
    console.log(`sessionStorage.setItem("accessToken", "${accessToken}");`);
    console.log(`sessionStorage.setItem("refreshToken", "${refreshToken}");`);
    console.log('');
    console.log('6. Press Enter');
    console.log('7. Refresh the page (F5)');
    console.log('');
    console.log('✅ This will fix ALL 403 and 401 errors!');
  });
});

loginReq.on('error', (e) => {
  console.error('❌ Login Error:', e.message);
});

loginReq.write(loginData);
loginReq.end();
