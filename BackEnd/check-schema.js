const sql = require('mssql');

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

async function checkSchema() {
  try {
    await sql.connect(config);
    
    console.log('=== PRODUCTS TABLE SCHEMA ===');
    const productsSchema = await sql.query(`
      SELECT COLUMN_NAME, DATA_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Products'
      ORDER BY ORDINAL_POSITION
    `);
    productsSchema.recordset.forEach(col => {
      console.log(col.COLUMN_NAME + ' (' + col.DATA_TYPE + ')');
    });
    
    console.log('\n=== CATEGORIES TABLE SCHEMA ===');
    const categoriesSchema = await sql.query(`
      SELECT COLUMN_NAME, DATA_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Categories'
      ORDER BY ORDINAL_POSITION
    `);
    categoriesSchema.recordset.forEach(col => {
      console.log(col.COLUMN_NAME + ' (' + col.DATA_TYPE + ')');
    });
    
    console.log('\n=== ORDERS TABLE SCHEMA ===');
    const ordersSchema = await sql.query(`
      SELECT COLUMN_NAME, DATA_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Orders'
      ORDER BY ORDINAL_POSITION
    `);
    ordersSchema.recordset.forEach(col => {
      console.log(col.COLUMN_NAME + ' (' + col.DATA_TYPE + ')');
    });
    
    await sql.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkSchema();
