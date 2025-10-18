// scripts/reset-password.ts
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

async function resetPassword(email: string, newPassword: string) {
  console.log(`🔧 Resetting password for: ${email}`);
  
  try {
    const sql = require('mssql');
    await sql.connect(dbConfig);
    
    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);
    
    // Update password
    const result = await sql.query`
      UPDATE Users 
      SET PasswordHash = ${passwordHash}, UpdatedAt = GETDATE()
      WHERE Email = ${email}
    `;
    
    if (result.rowsAffected[0] > 0) {
      console.log(`✅ Password updated successfully for ${email}`);
      console.log(`   New password: ${newPassword}`);
      return true;
    } else {
      console.log(`❌ User not found: ${email}`);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Reset password error:', error);
    return false;
  }
}

// Reset passwords for test accounts
async function resetTestPasswords() {
  console.log('🚀 Resetting test account passwords...\n');
  
  const accounts = [
    { email: 'customer@muji.com', password: 'customer123' },
    { email: 'lethien19092001@gmail.com', password: '123456' },
    { email: 'lethien1909@gmail.com', password: '123456' },
  ];
  
  for (const account of accounts) {
    await resetPassword(account.email, account.password);
    console.log('');
  }
  
  console.log('📋 Updated test accounts:');
  console.log('   customer@muji.com / customer123');
  console.log('   lethien19092001@gmail.com / 123456');
  console.log('   lethien1909@gmail.com / 123456');
}

resetTestPasswords().catch(console.error);