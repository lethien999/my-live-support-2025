const http = require('http');

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

async function testAdminApis() {
  console.log('🔍 Testing Admin APIs...');
  
  try {
    // 1. Test health endpoint
    console.log('\n1. Testing Health Endpoint:');
    const healthOptions = {
      hostname: 'localhost',
      port: 4000,
      path: '/health',
      method: 'GET'
    };
    const healthResult = await makeRequest(healthOptions);
    console.log('Status:', healthResult.status);
    console.log('Response:', JSON.stringify(healthResult.data, null, 2));
    
    // 2. Login as admin
    console.log('\n2. Testing Admin Login:');
    const loginOptions = {
      hostname: 'localhost',
      port: 4000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    };
    const loginData = JSON.stringify({ email: 'admin@muji.com', password: '111111' });
    const loginResult = await makeRequest(loginOptions, loginData);
    console.log('Login Status:', loginResult.status);
    console.log('Login Success:', loginResult.data.success);
    
    if (loginResult.data.success) {
      const token = loginResult.data.tokens.accessToken;
      console.log('Token:', token.substring(0, 20) + '...');
      
      // 3. Test Admin Users API
      console.log('\n3. Testing Admin Users API:');
      const usersOptions = {
        hostname: 'localhost',
        port: 4000,
        path: '/api/admin/users',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      };
      const usersResult = await makeRequest(usersOptions);
      console.log('Users Status:', usersResult.status);
      console.log('Users Success:', usersResult.data.success);
      if (usersResult.data.success) {
        console.log('Users Count:', usersResult.data.users.length);
      }
      
      // 4. Test Admin Products API
      console.log('\n4. Testing Admin Products API:');
      const productsOptions = {
        hostname: 'localhost',
        port: 4000,
        path: '/api/admin/products',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      };
      const productsResult = await makeRequest(productsOptions);
      console.log('Products Status:', productsResult.status);
      console.log('Products Success:', productsResult.data.success);
      if (productsResult.data.success) {
        console.log('Products Count:', productsResult.data.products.length);
      }
      
      // 5. Test Admin Categories API
      console.log('\n5. Testing Admin Categories API:');
      const categoriesOptions = {
        hostname: 'localhost',
        port: 4000,
        path: '/api/admin/categories',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      };
      const categoriesResult = await makeRequest(categoriesOptions);
      console.log('Categories Status:', categoriesResult.status);
      console.log('Categories Success:', categoriesResult.data.success);
      if (categoriesResult.data.success) {
        console.log('Categories Count:', categoriesResult.data.categories.length);
      }
      
    } else {
      console.log('❌ Login failed:', loginResult.data.error);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAdminApis();