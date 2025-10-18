// scripts/check-users.ts
import dotenv from 'dotenv';
import sql from 'mssql';

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

async function checkUsers() {
  console.log('🔍 Checking users in database...');
  
  try {
    const pool = await sql.connect(dbConfig);
    
    // Check if Users table exists
    const tableCheck = await sql.query`
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'Users'
    `;
    
    if (tableCheck.recordset[0].count === 0) {
      console.log('❌ Users table does not exist!');
      return;
    }
    
    // First, check the actual table structure
    const tableStructure = await sql.query`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'Users'
      ORDER BY ORDINAL_POSITION
    `;
    
    console.log('📋 Users table structure:');
    tableStructure.recordset.forEach(col => {
      console.log(`   ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // Get all users with correct column names
    const users = await sql.query`
      SELECT *
      FROM Users
    `;
    
    console.log(`📊 Found ${users.recordset.length} users:`);
    console.log('=====================================');
    
    users.recordset.forEach((user, index) => {
      console.log(`${index + 1}. User data:`);
      Object.keys(user).forEach(key => {
        if (key.toLowerCase().includes('password')) {
          console.log(`   ${key}: ${user[key] ? '***' + user[key].toString().slice(-4) : 'NULL'}`);
        } else {
          console.log(`   ${key}: ${user[key]}`);
        }
      });
      console.log('   ---');
    });
    
    // Test login with first user
    if (users.recordset.length > 0) {
      const testUser = users.recordset[0];
      console.log(`\n🧪 Testing login with first user:`);
      
      // Find password field
      const passwordField = Object.keys(testUser).find(key => key.toLowerCase().includes('password'));
      const emailField = Object.keys(testUser).find(key => key.toLowerCase().includes('email'));
      const usernameField = Object.keys(testUser).find(key => key.toLowerCase().includes('username') || key.toLowerCase().includes('name'));
      
      if (passwordField) {
        console.log(`   Password field: ${passwordField}`);
        console.log(`   Password value: ${testUser[passwordField] ? '***' + testUser[passwordField].toString().slice(-4) : 'NULL'}`);
        
        // Check if password is hashed
        if (testUser[passwordField] && testUser[passwordField].toString().length > 20) {
          console.log('   ✅ Password appears to be hashed (bcrypt)');
        } else {
          console.log('   ⚠️ Password might not be hashed properly');
        }
      }
      
      if (emailField) {
        console.log(`   Email: ${testUser[emailField]}`);
      }
      
      if (usernameField) {
        console.log(`   Username: ${testUser[usernameField]}`);
      }
    }
    
    await pool.close();
    
  } catch (error) {
    console.error('❌ Error checking users:', error);
  }
}

checkUsers().catch(console.error);