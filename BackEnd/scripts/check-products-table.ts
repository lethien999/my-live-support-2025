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

async function checkProductsTable() {
  try {
    console.log('🔍 KIỂM TRA CẤU TRÚC PRODUCTS TABLE');
    console.log('===================================\n');
    
    await sql.connect(config);
    console.log('✅ Connected to SQL Server\n');

    // Get Products table structure
    const columnsResult = await sql.query`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Products'
      ORDER BY ORDINAL_POSITION
    `;
    
    console.log('📋 PRODUCTS TABLE STRUCTURE:');
    console.log('============================');
    columnsResult.recordset.forEach(col => {
      console.log(`✅ ${col.COLUMN_NAME} (${col.DATA_TYPE}) - Nullable: ${col.IS_NULLABLE}`);
    });
    console.log('');

    // Check Products data
    const productsResult = await sql.query`SELECT * FROM Products`;
    console.log(`📊 Products count: ${productsResult.recordset.length}`);
    
    if (productsResult.recordset.length > 0) {
      console.log('📋 Sample Products:');
      productsResult.recordset.forEach(product => {
        console.log(`   - ${product.ProductName} (ID: ${product.ProductID}) - Price: ${product.Price}`);
      });
    }

  } catch (error) {
    console.error('❌ Error checking Products table:', error);
  } finally {
    console.log('\n🔌 Products table check completed');
  }
}

checkProductsTable().catch(console.error);
