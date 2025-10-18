// test-login-simple.js
const http = require('http');

function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve({ status: res.statusCode, data: result });
        } catch (error) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testLogin() {
  console.log('🧪 Testing login with real database...');
  
  const testAccounts = [
    { email: 'admin@muji.com', password: '123456', expectedRole: 'Admin' },
    { email: 'agent@muji.com', password: '123456', expectedRole: 'Agent' },
    { email: 'customer@muji.com', password: '123456', expectedRole: 'Customer' }
  ];
  
  for (const account of testAccounts) {
    console.log(`\n--- Testing ${account.email} ---`);
    
    try {
      const options = {
        hostname: 'localhost',
        port: 4000,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      };
      
      const result = await makeRequest(options, {
        email: account.email,
        password: account.password,
      });
      
      if (result.status === 200) {
        console.log(`✅ Login successful!`);
        console.log(`   User: ${result.data.user.name}`);
        console.log(`   Role: ${result.data.user.role} (expected: ${account.expectedRole})`);
        console.log(`   Token: ${result.data.tokens.accessToken.substring(0, 20)}...`);
      } else {
        console.log(`❌ Login failed: ${result.data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n🔍 Testing categories endpoint...');
  try {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/api/categories',
      method: 'GET'
    };
    
    const result = await makeRequest(options);
    if (result.status === 200) {
      console.log(`✅ Categories loaded: ${result.data.categories.length} categories`);
      result.data.categories.forEach(cat => {
        console.log(`   - ${cat.name}: ${cat.description}`);
      });
    } else {
      console.log(`❌ Categories failed: ${result.status}`);
    }
  } catch (error) {
    console.log(`❌ Categories error: ${error.message}`);
  }
}

testLogin().catch(console.error);
