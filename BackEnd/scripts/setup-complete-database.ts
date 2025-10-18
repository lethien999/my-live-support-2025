// scripts/setup-complete-database.ts
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
  database: 'master', // Connect to master first
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

async function setupCompleteDatabase() {
  console.log('🚀 Setting up complete e-commerce database...');
  
  try {
    // Connect to master database
    console.log('🔌 Connecting to SQL Server...');
    const pool = await sql.connect(config);
    console.log('✅ Connected to SQL Server');

    // Read schema script
    const schemaPath = path.join(__dirname, '../database/complete-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📖 Creating database schema...');
    
    // Split script into batches
    const schemaBatches = schema.split('GO').filter(batch => batch.trim());
    
    for (let i = 0; i < schemaBatches.length; i++) {
      const batch = schemaBatches[i].trim();
      if (batch) {
        console.log(`   Schema batch ${i + 1}/${schemaBatches.length}...`);
        try {
          await pool.request().query(batch);
        } catch (error: any) {
          console.warn(`   ⚠️ Schema batch ${i + 1} warning:`, error.message);
        }
      }
    }
    
    console.log('✅ Database schema created!');
    
    // Read seed data script
    const seedPath = path.join(__dirname, '../database/seed-sample-data.sql');
    const seed = fs.readFileSync(seedPath, 'utf8');
    
    console.log('🌱 Inserting sample data...');
    
    // Split script into batches
    const seedBatches = seed.split('GO').filter(batch => batch.trim());
    
    for (let i = 0; i < seedBatches.length; i++) {
      const batch = seedBatches[i].trim();
      if (batch) {
        console.log(`   Seed batch ${i + 1}/${seedBatches.length}...`);
        try {
          await pool.request().query(batch);
        } catch (error: any) {
          console.warn(`   ⚠️ Seed batch ${i + 1} warning:`, error.message);
        }
      }
    }
    
    console.log('✅ Sample data inserted!');
    
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
      SELECT 'Products', COUNT(*) FROM Products
      UNION ALL
      SELECT 'Orders', COUNT(*) FROM Orders
      UNION ALL
      SELECT 'Cart', COUNT(*) FROM Cart
      UNION ALL
      SELECT 'Reviews', COUNT(*) FROM Reviews
      UNION ALL
      SELECT 'Wishlist', COUNT(*) FROM Wishlist
      UNION ALL
      SELECT 'Notifications', COUNT(*) FROM Notifications
      UNION ALL
      SELECT 'Tickets', COUNT(*) FROM Tickets
      UNION ALL
      SELECT 'Messages', COUNT(*) FROM Messages
    `);
    
    console.log('\n📊 Database verification:');
    result.recordset.forEach(row => {
      console.log(`   ${row.TableName}: ${row.RecordCount} records`);
    });
    
    await testPool.close();
    
    console.log('\n🎉 Complete database setup finished successfully!');
    console.log('\n🔐 Test accounts:');
    console.log('   admin@muji.com / 111111 (Admin)');
    console.log('   agent@muji.com / 111111 (Agent)');
    console.log('   customer@muji.com / 111111 (Customer)');
    console.log('   john.doe@email.com / 111111 (Customer)');
    console.log('   jane.smith@email.com / 111111 (Customer)');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

setupCompleteDatabase().catch(console.error);
