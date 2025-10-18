import sql from 'mssql';
const bcrypt = require('bcrypt');

const config = {
  user: 'thien',
  password: '1909',
  server: 'localhost',
  database: 'live_support',
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

async function checkPassword() {
  try {
    console.log('🔍 Checking password for customer@muji.com...');
    
    await sql.connect(config);
    
    const result = await sql.query`
      SELECT UserID, Email, FullName, PasswordHash, Status
      FROM Users 
      WHERE Email = 'customer@muji.com'
    `;
    
    if (result.recordset.length === 0) {
      console.log('❌ User not found in database');
      return;
    }
    
    const user = result.recordset[0];
    console.log(`✅ User found: ${user.Email} - ${user.FullName}`);
    console.log(`Status: ${user.Status}`);
    console.log(`Password Hash: ${user.PasswordHash ? 'EXISTS' : 'NULL'}`);
    
    // Test password
    const testPasswords = ['customer123', '123456', 'password', 'admin123'];
    
    for (const testPassword of testPasswords) {
      try {
        const isValid = await bcrypt.compare(testPassword, user.PasswordHash);
        console.log(`Password "${testPassword}": ${isValid ? '✅ VALID' : '❌ INVALID'}`);
      } catch (error: any) {
        console.log(`Password "${testPassword}": ❌ ERROR - ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking password:', error);
  } finally {
    // Close connection
    console.log('🔌 Connection closed');
  }
}

checkPassword();
