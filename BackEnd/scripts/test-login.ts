// scripts/test-login.ts
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

// Load environment variables
dotenv.config({ path: 'env-clean.local' });
dotenv.config();

const dbConfig = {
  user: process.env.DB_USER || 'thien',
  password: process.env.DB_PASSWORD || '1909',
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_DATABASE || 'live_support',
  port: parseInt(process.env.DB_PORT || '1433', 10),
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
  },
};

async function testLogin(email: string, password: string) {
  console.log(`🧪 Testing login for: ${email}`);
  
  try {
    const sql = require('mssql');
    await sql.connect(dbConfig);
    
    // Find user by email
    const result = await sql.query`
      SELECT UserID, Email, FullName, PasswordHash, Status
      FROM Users 
      WHERE Email = ${email} AND Status = 'Active'
    `;

    if (result.recordset.length === 0) {
      console.log('❌ User not found or inactive');
      return false;
    }

    const user = result.recordset[0];
    console.log(`✅ User found: ${user.FullName}`);
    console.log(`   PasswordHash: ${user.PasswordHash ? '***' + user.PasswordHash.slice(-4) : 'NULL'}`);
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.PasswordHash);
    console.log(`   Password valid: ${isValidPassword ? '✅ YES' : '❌ NO'}`);
    
    if (!isValidPassword) {
      console.log('❌ Invalid password');
      return false;
    }

    // Get user role
    const roleResult = await sql.query`
      SELECT r.RoleName
      FROM UserRoles ur
      JOIN Roles r ON ur.RoleID = r.RoleID
      WHERE ur.UserID = ${user.UserID}
    `;

    const role = roleResult.recordset.length > 0 ? roleResult.recordset[0].RoleName : 'Customer';
    console.log(`   Role: ${role}`);
    
    console.log('✅ Login successful!');
    return true;
    
  } catch (error) {
    console.error('❌ Login error:', error);
    return false;
  }
}

// Test with sample credentials
async function runTests() {
  console.log('🚀 Testing login functionality...\n');
  
  // Test cases
  const testCases = [
    { email: 'admin@muji.com', password: 'admin123' },
    { email: 'agent@muji.com', password: 'agent123' },
    { email: 'customer@muji.com', password: 'customer123' },
    { email: 'lethien19092001@gmail.com', password: '123456' },
    { email: 'lethien1909@gmail.com', password: '123456' },
  ];
  
  for (const testCase of testCases) {
    console.log(`\n--- Testing ${testCase.email} ---`);
    await testLogin(testCase.email, testCase.password);
  }
  
  console.log('\n📋 Available test accounts:');
  console.log('   admin@muji.com - Admin role');
  console.log('   agent@muji.com - Agent role');
  console.log('   customer@muji.com - Customer role');
  console.log('   lethien19092001@gmail.com - Customer role');
  console.log('   lethien1909@gmail.com - Customer role');
}

runTests().catch(console.error);
