// scripts/setup-clean-database.ts
import sql from 'mssql';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: 'env-clean.local' });
dotenv.config();

const config = {
  user: process.env.DB_USER || 'thien',
  password: process.env.DB_PASSWORD || '1909',
  server: process.env.DB_SERVER || 'localhost',
  database: 'master', // Connect to master first to create database
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

async function setupCleanDatabase() {
  console.log('🚀 Setting up clean database...');
  
  try {
    // Connect to master database
    console.log('🔌 Connecting to SQL Server...');
    const pool = await sql.connect(config);
    console.log('✅ Connected to SQL Server');

    // Read the clean setup script
    const scriptPath = path.join(__dirname, '../database/clean-setup.sql');
    const script = fs.readFileSync(scriptPath, 'utf8');
    
    console.log('📖 Reading database setup script...');
    
    // Split script into batches (SQL Server requires GO statements)
    const batches = script.split('GO').filter(batch => batch.trim());
    
    console.log(`📝 Executing ${batches.length} script batches...`);
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i].trim();
      if (batch) {
        console.log(`   Batch ${i + 1}/${batches.length}...`);
        try {
          await pool.request().query(batch);
        } catch (error) {
          console.warn(`   ⚠️ Batch ${i + 1} warning:`, error.message);
        }
      }
    }
    
    console.log('✅ Database setup completed!');
    
    // Test connection to new database
    console.log('🔍 Testing connection to live_support database...');
    await pool.close();
    
    const testConfig = {
      ...config,
      database: 'live_support'
    };
    
    const testPool = await sql.connect(testConfig);
    
    // Verify data
    const result = await testPool.request().query(`
      SELECT 'Users' as TableName, COUNT(*) as RecordCount FROM Users
      UNION ALL
      SELECT 'Roles', COUNT(*) FROM Roles
      UNION ALL
      SELECT 'UserRoles', COUNT(*) FROM UserRoles
      UNION ALL
      SELECT 'Categories', COUNT(*) FROM Categories
      UNION ALL
      SELECT 'Products', COUNT(*) FROM Products
      UNION ALL
      SELECT 'Tickets', COUNT(*) FROM Tickets
      UNION ALL
      SELECT 'ChatRooms', COUNT(*) FROM ChatRooms
      UNION ALL
      SELECT 'Messages', COUNT(*) FROM Messages
    `);
    
    console.log('\n📊 Database verification:');
    result.recordset.forEach(row => {
      console.log(`   ${row.TableName}: ${row.RecordCount} records`);
    });
    
    await testPool.close();
    
    console.log('\n🎉 Clean database setup completed successfully!');
    console.log('\n🔐 Test accounts:');
    console.log('   admin@muji.com / 123456 (Admin)');
    console.log('   agent@muji.com / 123456 (Agent)');
    console.log('   customer@muji.com / 123456 (Customer)');
    console.log('   lethien19092001@gmail.com / 123456 (Customer)');
    console.log('   lethien1909@gmail.com / 123456 (Customer)');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

setupCleanDatabase().catch(console.error);
