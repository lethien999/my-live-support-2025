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

async function fixChatRoomsTable() {
  try {
    console.log('🔧 SỬA CHAT ROOMS TABLE');
    console.log('========================\n');
    
    await sql.connect(config);
    console.log('✅ Connected to SQL Server\n');

    // Check ChatRooms table structure first
    console.log('🔍 Checking ChatRooms table structure...');
    const columnsResult = await sql.query`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'ChatRooms'
      ORDER BY ORDINAL_POSITION
    `;
    
    console.log('📋 Current ChatRooms structure:');
    columnsResult.recordset.forEach(col => {
      console.log(`   - ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
    });
    console.log('');

    // Add missing columns
    console.log('➕ Adding missing columns...');
    try {
      await sql.query`ALTER TABLE ChatRooms ADD CustomerID INT NULL`;
      console.log('✅ CustomerID column added');
    } catch (error) {
      console.log('⚠️ CustomerID might already exist');
    }

    try {
      await sql.query`ALTER TABLE ChatRooms ADD ShopID INT NULL`;
      console.log('✅ ShopID column added');
    } catch (error) {
      console.log('⚠️ ShopID might already exist');
    }

    try {
      await sql.query`ALTER TABLE ChatRooms ADD RoomName NVARCHAR(255) NULL`;
      console.log('✅ RoomName column added');
    } catch (error) {
      console.log('⚠️ RoomName might already exist');
    }

    try {
      await sql.query`ALTER TABLE ChatRooms ADD IsActive BIT DEFAULT 1`;
      console.log('✅ IsActive column added');
    } catch (error) {
      console.log('⚠️ IsActive might already exist');
    }
    console.log('');

    // Add foreign key constraints
    console.log('🔗 Adding foreign key constraints...');
    try {
      await sql.query`
        ALTER TABLE ChatRooms 
        ADD CONSTRAINT FK_ChatRooms_Users 
        FOREIGN KEY (CustomerID) REFERENCES Users(UserID)
      `;
      console.log('✅ CustomerID foreign key added');
    } catch (error) {
      console.log('⚠️ CustomerID foreign key might already exist');
    }

    try {
      await sql.query`
        ALTER TABLE ChatRooms 
        ADD CONSTRAINT FK_ChatRooms_Shops 
        FOREIGN KEY (ShopID) REFERENCES Shops(ShopID)
      `;
      console.log('✅ ShopID foreign key added');
    } catch (error) {
      console.log('⚠️ ShopID foreign key might already exist');
    }
    console.log('');

    // Seed chat rooms
    console.log('💬 Seeding Chat Rooms...');
    const chatRooms = [
      { customerId: 3, shopId: 1, roomName: 'MUJI Fashion Store - Customer Support' },
      { customerId: 3, shopId: 2, roomName: 'MUJI Beauty Store - Customer Support' },
      { customerId: 3, shopId: 3, roomName: 'MUJI Home Store - Customer Support' }
    ];

    for (const room of chatRooms) {
      try {
        await sql.query`
          INSERT INTO ChatRooms (CustomerID, ShopID, RoomName, IsActive, CreatedAt)
          VALUES (${room.customerId}, ${room.shopId}, ${room.roomName}, 1, GETDATE())
        `;
        console.log(`✅ Chat room created: ${room.roomName}`);
      } catch (error) {
        console.log(`⚠️ Chat room ${room.roomName} might already exist`);
      }
    }
    console.log('');

    console.log('🎉 ChatRooms table fixed and seeded successfully!');

  } catch (error) {
    console.error('❌ Error fixing ChatRooms table:', error);
  } finally {
    console.log('\n🔌 ChatRooms table fix completed');
  }
}

fixChatRoomsTable().catch(console.error);
