// scripts/check-user-roles.ts
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

async function checkUserRoles() {
  console.log('🔍 Checking user roles...');
  
  try {
    const pool = await sql.connect(dbConfig);
    
    // Check UserRoles table
    const userRoles = await sql.query`
      SELECT ur.UserID, u.Email, u.FullName, r.RoleName
      FROM UserRoles ur
      JOIN Users u ON ur.UserID = u.UserID
      JOIN Roles r ON ur.RoleID = r.RoleID
      ORDER BY ur.UserID
    `;
    
    console.log(`📊 Found ${userRoles.recordset.length} user-role assignments:`);
    userRoles.recordset.forEach(ur => {
      console.log(`   UserID: ${ur.UserID} | Email: ${ur.Email} | Name: ${ur.FullName} | Role: ${ur.RoleName}`);
    });
    
    // Check if any users don't have roles
    const usersWithoutRoles = await sql.query`
      SELECT u.UserID, u.Email, u.FullName
      FROM Users u
      LEFT JOIN UserRoles ur ON u.UserID = ur.UserID
      WHERE ur.UserID IS NULL AND u.Status = 'Active'
    `;
    
    if (usersWithoutRoles.recordset.length > 0) {
      console.log('\n⚠️ Users without roles:');
      usersWithoutRoles.recordset.forEach(user => {
        console.log(`   UserID: ${user.UserID} | Email: ${user.Email} | Name: ${user.FullName}`);
      });
    }
    
    await pool.close();
    
  } catch (error) {
    console.error('❌ Error checking user roles:', error);
  }
}

checkUserRoles().catch(console.error);
