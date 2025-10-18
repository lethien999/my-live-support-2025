// test-register.js
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

async function testRegister() {
  console.log('🧪 Testing registration endpoint...');
  
  const testRegistration = {
    name: 'Thiện',
    email: 'leanhthien9876@gmail.com',
    password: '123456',
    role: 'customer'
  };
  
  try {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/api/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    const result = await makeRequest(options, testRegistration);
    
    if (result.status === 200) {
      console.log('✅ Registration successful!');
      console.log('   User:', result.data.user);
      console.log('   Message:', result.data.message);
    } else {
      console.log('❌ Registration failed:', result.data.error || 'Unknown error');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  console.log('\n🔍 Testing login with new credentials...');
  
  try {
    const loginOptions = {
      hostname: 'localhost',
      port: 4000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    const loginResult = await makeRequest(loginOptions, {
      email: 'leanhthien9876@gmail.com',
      password: '123456'
    });
    
    if (loginResult.status === 200) {
      console.log('✅ Login successful!');
      console.log('   User:', loginResult.data.user);
    } else {
      console.log('❌ Login failed:', loginResult.data.error || 'Unknown error');
    }
  } catch (error) {
    console.log('❌ Login error:', error.message);
  }
}

testRegister().catch(console.error);
