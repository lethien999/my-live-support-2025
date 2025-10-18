// test-login-real.js
const fetch = require('node-fetch');

async function testLogin() {
  console.log('🧪 Testing login with real database...');
  
  const testAccounts = [
    { email: 'admin@muji.com', password: '123456', expectedRole: 'Admin' },
    { email: 'agent@muji.com', password: '123456', expectedRole: 'Agent' },
    { email: 'customer@muji.com', password: '123456', expectedRole: 'Customer' },
    { email: 'lethien19092001@gmail.com', password: '123456', expectedRole: 'Customer' },
    { email: 'lethien1909@gmail.com', password: '123456', expectedRole: 'Customer' }
  ];
  
  for (const account of testAccounts) {
    console.log(`\n--- Testing ${account.email} ---`);
    
    try {
      const response = await fetch('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: account.email,
          password: account.password,
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Login successful!`);
        console.log(`   User: ${result.user.name}`);
        console.log(`   Role: ${result.user.role} (expected: ${account.expectedRole})`);
        console.log(`   Token: ${result.tokens.accessToken.substring(0, 20)}...`);
      } else {
        const error = await response.json();
        console.log(`❌ Login failed: ${error.error}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n🔍 Testing categories endpoint...');
  try {
    const response = await fetch('http://localhost:4000/api/categories');
    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Categories loaded: ${result.categories.length} categories`);
      result.categories.forEach(cat => {
        console.log(`   - ${cat.name}: ${cat.description}`);
      });
    } else {
      console.log(`❌ Categories failed: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Categories error: ${error.message}`);
  }
  
  console.log('\n🔍 Testing products endpoint...');
  try {
    const response = await fetch('http://localhost:4000/api/products');
    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Products loaded: ${result.data.length} products`);
      result.data.forEach(product => {
        console.log(`   - ${product.name}: $${product.price}`);
      });
    } else {
      console.log(`❌ Products failed: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Products error: ${error.message}`);
  }
}

testLogin().catch(console.error);
