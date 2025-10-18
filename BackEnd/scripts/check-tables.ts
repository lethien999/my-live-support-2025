import sql from 'mssql';

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

async function checkTables() {
  try {
    console.log('🔍 KIỂM TRA CÁC TABLE TRONG DATABASE');
    console.log('=====================================\n');
    
    await sql.connect(config);
    console.log('✅ Connected to SQL Server\n');

    // Get all table names
    const tablesResult = await sql.query`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `;
    
    console.log('📋 CÁC TABLE HIỆN CÓ:');
    console.log('=====================');
    tablesResult.recordset.forEach(table => {
      console.log(`✅ ${table.TABLE_NAME}`);
    });
    console.log('');

    // Check each table for data
    for (const table of tablesResult.recordset) {
      const tableName = table.TABLE_NAME;
      try {
        const countResult = await sql.query(`SELECT COUNT(*) as count FROM [${tableName}]`);
        const count = countResult.recordset[0].count;
        console.log(`📊 ${tableName}: ${count} records`);
      } catch (error: any) {
        console.log(`❌ ${tableName}: Error - ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Error checking tables:', error);
  } finally {
    console.log('\n🔌 Table check completed');
  }
}

checkTables().catch(console.error);
