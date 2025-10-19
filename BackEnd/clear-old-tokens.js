const http = require('http');

// Clear old tokens by logging in with new token
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
    
    console.log('🆕 NEW TOKENS GENERATED:');
    console.log('Access Token:', accessToken);
    console.log('Refresh Token:', refreshToken);
    console.log('');
    console.log('📋 CÁCH SỬA LỖI 403:');
    console.log('1. Mở Developer Tools (F12)');
    console.log('2. Vào tab Console');
    console.log('3. Chạy lệnh sau:');
    console.log(`sessionStorage.setItem("accessToken", "${accessToken}");`);
    console.log(`sessionStorage.setItem("refreshToken", "${refreshToken}");`);
    console.log('4. Refresh trang Admin Dashboard');
    console.log('');
    console.log('🔧 HOẶC:');
    console.log('5. Đăng xuất và đăng nhập lại với admin@muji.com / 111111');
  });
});

loginReq.on('error', (e) => {
  console.error('❌ Login Error:', e.message);
});

loginReq.write(loginData);
loginReq.end();
