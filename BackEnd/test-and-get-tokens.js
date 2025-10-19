const http = require('http');

console.log('🔍 Testing backend connection...');

const testOptions = {
  hostname: 'localhost',
  port: 4000,
  path: '/health',
  method: 'GET'
};

const testReq = http.request(testOptions, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('✅ Backend is running!');
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
    
    // Now test login
    console.log('\n🔍 Testing login...');
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
      let loginData = '';
      res.on('data', (chunk) => loginData += chunk);
      res.on('end', () => {
        const response = JSON.parse(loginData);
        const accessToken = response.tokens?.accessToken;
        const refreshToken = response.tokens?.refreshToken;
        
        console.log('\n🆕 FRESH TOKENS:');
        console.log('Access Token:', accessToken);
        console.log('Refresh Token:', refreshToken);
        console.log('\n📋 COPY THIS TO CONSOLE:');
        console.log('sessionStorage.clear();');
        console.log('localStorage.clear();');
        console.log(`sessionStorage.setItem("accessToken", "${accessToken}");`);
        console.log(`sessionStorage.setItem("refreshToken", "${refreshToken}");`);
        console.log('\nThen refresh the page!');
      });
    });

    loginReq.on('error', (e) => {
      console.error('❌ Login Error:', e.message);
    });

    loginReq.write(loginData);
    loginReq.end();
  });
});

testReq.on('error', (e) => {
  console.error('❌ Backend not running:', e.message);
});

testReq.end();
