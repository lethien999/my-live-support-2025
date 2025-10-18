import DatabaseService from '../src/services/database.service';

async function checkChatRooms() {
  try {
    console.log('🔍 Checking ChatRooms table structure...');
    
    const db = DatabaseService.getInstance();
    
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
    
    // Check if table has data
    const count = await db.query('SELECT COUNT(*) as count FROM ChatRooms');
    console.log(`\n📊 ChatRooms count: ${count[0].count}`);
    
    // Check if we need to create some test data
    if (count[0].count === 0) {
      console.log('\n🔧 Creating test chat room...');
      
      // Get a customer and agent
      const users = await db.query(`
        SELECT u.UserID, u.Email, u.FullName, r.RoleName 
        FROM Users u 
        LEFT JOIN UserRoles ur ON u.UserID = ur.UserID 
        LEFT JOIN Roles r ON ur.RoleID = r.RoleID 
        WHERE r.RoleName IN ('Customer', 'Agent')
        ORDER BY r.RoleName
      `);
      
      const customer = users.find((u: any) => u.RoleName === 'Customer');
      const agent = users.find((u: any) => u.RoleName === 'Agent');
      
      if (customer && agent) {
        console.log(`👤 Customer: ${customer.Email} (${customer.FullName})`);
        console.log(`🏪 Agent: ${agent.Email} (${agent.FullName})`);
        
        // Create a chat room
        await db.query(`
          INSERT INTO ChatRooms (CustomerID, ShopID, RoomName, IsActive, CreatedAt, UpdatedAt)
          VALUES (@customerId, @shopId, @roomName, @isActive, @createdAt, @updatedAt)
        `, {
          customerId: customer.UserID,
          shopId: agent.UserID,
          roomName: `Chat với ${agent.FullName}`,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        console.log('✅ Test chat room created!');
      } else {
        console.log('❌ No customer or agent found');
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking ChatRooms:', error);
  }
}

checkChatRooms();
