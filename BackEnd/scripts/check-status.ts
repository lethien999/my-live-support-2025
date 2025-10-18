import { spawn } from 'child_process';
import path from 'path';

// Function to read terminal logs
function readLogs() {
  console.log('📋 Reading backend logs...');
  
  // Check if backend is running
  const backendProcess = spawn('netstat', ['-ano'], { shell: true });
  
  backendProcess.stdout.on('data', (data) => {
    const output = data.toString();
    if (output.includes(':4000')) {
      console.log('✅ Backend server is running on port 4000');
    } else {
      console.log('❌ Backend server is not running on port 4000');
    }
  });
  
  backendProcess.stderr.on('data', (data) => {
    console.log('Error:', data.toString());
  });
  
  backendProcess.on('close', (code) => {
    console.log(`Process exited with code ${code}`);
  });
}

// Function to check database status
async function checkDatabaseStatus() {
  const sql = require('mssql');
  
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

  try {
    console.log('🔍 Checking database status...');
    const pool = await sql.connect(config);
    
    // Check users
    const usersResult = await pool.request().query(`
      SELECT u.Email, u.FullName, r.RoleName, u.Status
      FROM Users u
      LEFT JOIN UserRoles ur ON u.UserID = ur.UserID
      LEFT JOIN Roles r ON ur.RoleID = r.RoleID
      ORDER BY u.CreatedAt
    `);
    
    console.log('👥 Users in database:');
    usersResult.recordset.forEach((user: any) => {
      console.log(`   ${user.Email} - ${user.FullName} (${user.RoleName}) - ${user.Status}`);
    });
    
    // Check roles and permissions
    const rolesResult = await pool.request().query(`
      SELECT r.RoleName, COUNT(rp.PermissionID) as PermissionCount
      FROM Roles r
      LEFT JOIN RolePermissions rp ON r.RoleID = rp.RoleID
      GROUP BY r.RoleID, r.RoleName
      ORDER BY r.RoleName
    `);
    
    console.log('\n🔑 Roles and permissions:');
    rolesResult.recordset.forEach((role: any) => {
      console.log(`   ${role.RoleName}: ${role.PermissionCount} permissions`);
    });
    
    // Check tables
    const tablesResult = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `);
    
    console.log('\n📊 Database tables:');
    tablesResult.recordset.forEach((table: any) => {
      console.log(`   ${table.TABLE_NAME}`);
    });
    
    await pool.close();
    console.log('\n✅ Database check completed');
    
  } catch (error) {
    console.error('❌ Database check failed:', (error as Error).message);
  }
}

// Main function
async function main() {
  console.log('🚀 Live Support System Status Check');
  console.log('=====================================\n');
  
  readLogs();
  
  setTimeout(async () => {
    await checkDatabaseStatus();
  }, 2000);
}

main();
