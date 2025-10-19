const http = require('http');

// Test current token in frontend
console.log('🔍 Testing current frontend token...');

// Simulate what frontend is sending
const testToken = 'real_token_1'; // Old token format
console.log('Frontend token:', testToken);

// Test with old token
const categoriesOptions = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/admin/categories',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${testToken}`
  }
};

const categoriesReq = http.request(categoriesOptions, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Status with old token:', res.statusCode);
    if (res.statusCode === 403) {
      console.log('❌ CONFIRMED: Old token causes 403 error');
      console.log('✅ SOLUTION: Need to update frontend token');
    }
  });
});

categoriesReq.on('error', (e) => {
  console.error('Error:', e.message);
});

categoriesReq.end();
