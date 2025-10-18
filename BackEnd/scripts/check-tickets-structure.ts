import DatabaseService from '../src/services/database.service';

async function checkTicketsStructure() {
  try {
    console.log('🔍 Checking Tickets table structure...');
    
    const db = DatabaseService.getInstance();
    await db.connect();
    
    // Check table structure
    const columns = await db.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Tickets'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('📋 Tickets columns:');
    columns.forEach((col: any) => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // Check if we have the right columns
    const expectedColumns = ['TicketID', 'CustomerID', 'AssigneeID', 'Subject', 'Description', 'Priority', 'Status'];
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
    console.error('❌ Error checking Tickets structure:', error);
  }
}

checkTicketsStructure();
