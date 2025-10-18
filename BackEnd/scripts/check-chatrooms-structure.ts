import DatabaseService from '../src/services/database.service';

async function checkChatRoomsStructure() {
  try {
    console.log('🔍 Checking ChatRooms table structure...');
    
    const db = DatabaseService.getInstance();
    
    // Check if table exists
    const tables = await db.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'ChatRooms'
    `);
    
    if (tables.length === 0) {
      console.log('❌ ChatRooms table does not exist!');
      return;
    }
    
    console.log('✅ ChatRooms table exists');
    
    // Check table structure
    const columns = await db.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'ChatRooms'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('📋 ChatRooms columns:');
    columns.forEach((col: any) => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // Check if we have the right columns
    const expectedColumns = ['ChatRoomID', 'CustomerID', 'ShopID', 'RoomName', 'IsActive', 'CreatedAt', 'UpdatedAt'];
    const actualColumns = columns.map((col: any) => col.COLUMN_NAME);
    
    console.log('\n🔍 Checking expected columns:');
    expectedColumns.forEach(expected => {
      if (actualColumns.includes(expected)) {
        console.log(`  ✅ ${expected}`);
      } else {
        console.log(`  ❌ ${expected} - MISSING!`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error checking ChatRooms structure:', error);
  }
}

checkChatRoomsStructure();
