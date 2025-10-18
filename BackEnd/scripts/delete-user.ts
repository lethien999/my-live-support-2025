import sql from 'mssql';

const config = {
  server: 'localhost',
  port: 1433,
  user: 'thien',
  password: '1909',
  database: 'live_support',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    requestTimeout: 30000,
    connectionTimeout: 30000
  }
};

async function deleteUser(email: string) {
  let pool: sql.ConnectionPool | null = null;
  
  try {
    console.log(`🗑️  Deleting user: ${email}`);
    
    // Connect to SQL Server
    pool = await sql.connect(config);
    console.log('✅ Connected to SQL Server successfully');
    
    // Check if user exists
    const checkResult = await pool.request()
      .input('email', email)
      .query(`
        SELECT UserID, Email, FullName 
        FROM Users 
        WHERE Email = @email
      `);
    
    if (checkResult.recordset.length === 0) {
      console.log(`❌ User ${email} not found`);
      return;
    }
    
    const user = checkResult.recordset[0];
    console.log(`👤 Found user: ${user.FullName} (ID: ${user.UserID})`);
    
    // Delete user roles first (foreign key constraint)
    await pool.request()
      .input('userId', user.UserID)
      .query('DELETE FROM UserRoles WHERE UserID = @userId');
    console.log('✅ Deleted user roles');
    
    // Delete refresh tokens (if table exists)
    try {
      await pool.request()
        .input('userId', user.UserID)
        .query('DELETE FROM RefreshTokens WHERE UserID = @userId');
      console.log('✅ Deleted refresh tokens');
    } catch (error) {
      console.log('⚠️  RefreshTokens table not found, skipping...');
    }
    
    // Delete audit logs
    await pool.request()
      .input('userId', user.UserID)
      .query('DELETE FROM AuditLogs WHERE UserID = @userId');
    console.log('✅ Deleted audit logs');
    
    // Delete user
    await pool.request()
      .input('userId', user.UserID)
      .query('DELETE FROM Users WHERE UserID = @userId');
    console.log('✅ Deleted user');
    
    console.log(`🎉 User ${email} deleted successfully!`);
    
  } catch (error) {
    console.error('❌ Delete failed:', error);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
      console.log('✅ Connection closed');
    }
  }
}

// Get email from command line argument
const email = process.argv[2];
if (!email) {
  console.log('Usage: npm run delete:user <email>');
  console.log('Example: npm run delete:user lethien19092001@gmail.com');
  process.exit(1);
}

deleteUser(email);
