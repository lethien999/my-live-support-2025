// test-login-api.js
const fetch = require('node-fetch');

async function testLogin() {
  try {
    console.log('🧪 Testing login API...');
    
    const response = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@muji.com',
        password: 'admin123'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Login successful!');
      console.log('User:', data.user);
      console.log('Token:', data.tokens.accessToken ? 'Present' : 'Missing');
    } else {
      const error = await response.text();
      console.log('❌ Login failed:', response.status, error);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testLogin();
