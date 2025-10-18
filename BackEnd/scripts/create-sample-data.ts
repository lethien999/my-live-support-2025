import DatabaseService from '../src/services/database.service';

async function createSampleData() {
  try {
    console.log('🌱 Creating Sample Data...');
    
    const db = DatabaseService.getInstance();
    await db.connect();
    
    // Create sample tickets
    console.log('\n🎫 Creating sample tickets...');
    
    // Ticket 1: Customer 3 -> Agent 2
    const ticket1 = await db.query(`
      INSERT INTO Tickets (TicketNumber, Subject, Description, Priority, CustomerID, AssignedTo, Status, CreatedAt, UpdatedAt)
      OUTPUT INSERTED.TicketID, INSERTED.TicketNumber
      VALUES (@ticketNumber, @subject, @description, @priority, @customerId, @assignedTo, @status, @createdAt, @updatedAt)
    `, {
      ticketNumber: 'TKT-001',
      subject: 'Hỏi về sản phẩm',
      description: 'Tôi muốn hỏi về sản phẩm áo thun',
      priority: 'Medium',
      customerId: 3, // customer@muji.com
      assignedTo: 2,  // agent@muji.com
      status: 'Open',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log('✅ Ticket 1 created:', ticket1[0]);
    
    // Ticket 2: Customer 3 -> Agent 2
    const ticket2 = await db.query(`
      INSERT INTO Tickets (TicketNumber, Subject, Description, Priority, CustomerID, AssignedTo, Status, CreatedAt, UpdatedAt)
      OUTPUT INSERTED.TicketID, INSERTED.TicketNumber
      VALUES (@ticketNumber, @subject, @description, @priority, @customerId, @assignedTo, @status, @createdAt, @updatedAt)
    `, {
      ticketNumber: 'TKT-002',
      subject: 'Hỗ trợ đổi hàng',
      description: 'Tôi muốn đổi size áo',
      priority: 'High',
      customerId: 3, // customer@muji.com
      assignedTo: 2,  // agent@muji.com
      status: 'Open',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log('✅ Ticket 2 created:', ticket2[0]);
    
    // Create chat rooms
    console.log('\n💬 Creating chat rooms...');
    
    const room1 = await db.query(`
      INSERT INTO ChatRooms (TicketID, RoomName, IsActive, CreatedAt)
      OUTPUT INSERTED.RoomID
      VALUES (@ticketId, @roomName, @isActive, @createdAt)
    `, {
      ticketId: ticket1[0].TicketID,
      roomName: 'Chat về sản phẩm áo thun',
      isActive: true,
      createdAt: new Date()
    });
    
    console.log('✅ Room 1 created:', room1[0]);
    
    const room2 = await db.query(`
      INSERT INTO ChatRooms (TicketID, RoomName, IsActive, CreatedAt)
      OUTPUT INSERTED.RoomID
      VALUES (@ticketId, @roomName, @isActive, @createdAt)
    `, {
      ticketId: ticket2[0].TicketID,
      roomName: 'Chat về đổi hàng',
      isActive: true,
      createdAt: new Date()
    });
    
    console.log('✅ Room 2 created:', room2[0]);
    
    // Create sample messages
    console.log('\n💬 Creating sample messages...');
    
    // Messages for room 1
    await db.query(`
      INSERT INTO Messages (RoomID, SenderID, MessageType, Content, IsRead, CreatedAt)
      VALUES (@roomId, @senderId, @messageType, @content, @isRead, @createdAt)
    `, {
      roomId: room1[0].RoomID,
      senderId: 3, // customer
      messageType: 'text',
      content: 'Xin chào, tôi muốn hỏi về sản phẩm áo thun',
      isRead: false,
      createdAt: new Date()
    });
    
    await db.query(`
      INSERT INTO Messages (RoomID, SenderID, MessageType, Content, IsRead, CreatedAt)
      VALUES (@roomId, @senderId, @messageType, @content, @isRead, @createdAt)
    `, {
      roomId: room1[0].RoomID,
      senderId: 2, // agent
      messageType: 'text',
      content: 'Chào bạn! Tôi có thể giúp gì cho bạn về sản phẩm áo thun?',
      isRead: true,
      createdAt: new Date()
    });
    
    // Messages for room 2
    await db.query(`
      INSERT INTO Messages (RoomID, SenderID, MessageType, Content, IsRead, CreatedAt)
      VALUES (@roomId, @senderId, @messageType, @content, @isRead, @createdAt)
    `, {
      roomId: room2[0].RoomID,
      senderId: 3, // customer
      messageType: 'text',
      content: 'Tôi muốn đổi size áo từ M sang L',
      isRead: false,
      createdAt: new Date()
    });
    
    console.log('✅ Sample messages created');
    
    console.log('\n🎉 Sample data creation completed!');
    
    // Test the complex query again
    console.log('\n🔗 Testing complex query with sample data...');
    const conversations = await db.query(`
      SELECT 
        c.RoomID as id,
        u.FullName as shopName,
        u.UserID as shopId,
        'Chưa có tin nhắn' as lastMessage,
        c.CreatedAt as lastMessageTime,
        0 as unreadCount,
        '🏪' as avatar,
        CASE WHEN u.Status = 'Active' THEN 1 ELSE 0 END as isOnline,
        0 as isActive
      FROM ChatRooms c
      LEFT JOIN Tickets t ON c.TicketID = t.TicketID
      LEFT JOIN Users u ON t.AssignedTo = u.UserID
      WHERE t.CustomerID = @customerId
      ORDER BY c.CreatedAt DESC
    `, { customerId: 3 });
    
    console.log('✅ Complex query with sample data:', conversations);
    
  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  }
}

createSampleData();
