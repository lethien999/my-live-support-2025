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

async function checkMessagesTable() {
  try {
    console.log('🔍 KIỂM TRA CẤU TRÚC MESSAGES TABLE');
    console.log('===================================\n');
    
    await sql.connect(config);
    console.log('✅ Connected to SQL Server\n');

    // Get Messages table structure
    const columnsResult = await sql.query`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Messages'
      ORDER BY ORDINAL_POSITION
    `;
    
    console.log('📋 MESSAGES TABLE STRUCTURE:');
    console.log('============================');
    columnsResult.recordset.forEach(col => {
      console.log(`✅ ${col.COLUMN_NAME} (${col.DATA_TYPE}) - Nullable: ${col.IS_NULLABLE}`);
    });
    console.log('');

    // Check Messages data
    const messagesResult = await sql.query`SELECT * FROM Messages`;
    console.log(`📊 Messages count: ${messagesResult.recordset.length}`);
    
    if (messagesResult.recordset.length > 0) {
      console.log('📋 Sample Messages:');
      messagesResult.recordset.forEach(message => {
        console.log(`   - MessageID: ${message.MessageID} - RoomID: ${message.RoomID}`);
      });
    }

  } catch (error) {
    console.error('❌ Error checking Messages table:', error);
  } finally {
    console.log('\n🔌 Messages table check completed');
  }
}

checkMessagesTable().catch(console.error);
