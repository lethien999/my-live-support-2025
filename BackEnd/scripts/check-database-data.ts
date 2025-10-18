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

async function checkDatabaseData() {
  try {
    console.log('🔍 KIỂM TRA DỮ LIỆU SQL SERVER');
    console.log('=====================================\n');
    
    await sql.connect(config);
    console.log('✅ Connected to SQL Server\n');

    // 1. Check Users table
    console.log('👥 USERS TABLE:');
    console.log('----------------');
    const usersResult = await sql.query`
      SELECT u.UserID, u.Email, u.FullName, u.Status, r.RoleName
      FROM Users u
      LEFT JOIN UserRoles ur ON u.UserID = ur.UserID
      LEFT JOIN Roles r ON ur.RoleID = r.RoleID
      ORDER BY u.UserID
    `;
    
    if (usersResult.recordset.length === 0) {
      console.log('❌ NO USERS FOUND!');
    } else {
      console.log(`✅ Found ${usersResult.recordset.length} users:`);
      usersResult.recordset.forEach(user => {
        console.log(`   - ${user.Email} (${user.FullName}) - Role: ${user.RoleName || 'No Role'} - Status: ${user.Status}`);
      });
    }
    console.log('');

    // 2. Check Roles table
    console.log('🎭 ROLES TABLE:');
    console.log('---------------');
    const rolesResult = await sql.query`SELECT RoleID, RoleName FROM Roles ORDER BY RoleID`;
    
    if (rolesResult.recordset.length === 0) {
      console.log('❌ NO ROLES FOUND!');
    } else {
      console.log(`✅ Found ${rolesResult.recordset.length} roles:`);
      rolesResult.recordset.forEach(role => {
        console.log(`   - ${role.RoleName} (ID: ${role.RoleID})`);
      });
    }
    console.log('');

    // 3. Check Categories table
    console.log('📦 CATEGORIES TABLE:');
    console.log('--------------------');
    const categoriesResult = await sql.query`SELECT CategoryID, CategoryName, Description FROM Categories ORDER BY CategoryID`;
    
    if (categoriesResult.recordset.length === 0) {
      console.log('❌ NO CATEGORIES FOUND!');
    } else {
      console.log(`✅ Found ${categoriesResult.recordset.length} categories:`);
      categoriesResult.recordset.forEach(category => {
        console.log(`   - ${category.CategoryName} (ID: ${category.CategoryID})`);
      });
    }
    console.log('');

    // 4. Check Shops table
    console.log('🏪 SHOPS TABLE:');
    console.log('---------------');
    const shopsResult = await sql.query`SELECT ShopID, ShopName, Email, Phone FROM Shops ORDER BY ShopID`;
    
    if (shopsResult.recordset.length === 0) {
      console.log('❌ NO SHOPS FOUND!');
    } else {
      console.log(`✅ Found ${shopsResult.recordset.length} shops:`);
      shopsResult.recordset.forEach(shop => {
        console.log(`   - ${shop.ShopName} (ID: ${shop.ShopID}) - ${shop.Email}`);
      });
    }
    console.log('');

    // 5. Check Products table
    console.log('🛍️ PRODUCTS TABLE:');
    console.log('------------------');
    const productsResult = await sql.query`
      SELECT p.ProductID, p.ProductName, p.Price, c.CategoryName, s.ShopName
      FROM Products p
      LEFT JOIN Categories c ON p.CategoryID = c.CategoryID
      LEFT JOIN Shops s ON p.ShopID = s.ShopID
      ORDER BY p.ProductID
    `;
    
    if (productsResult.recordset.length === 0) {
      console.log('❌ NO PRODUCTS FOUND!');
    } else {
      console.log(`✅ Found ${productsResult.recordset.length} products:`);
      productsResult.recordset.forEach(product => {
        console.log(`   - ${product.ProductName} (ID: ${product.ProductID}) - ${product.Price} VND - ${product.CategoryName} - ${product.ShopName}`);
      });
    }
    console.log('');

    // 6. Check ChatRooms table
    console.log('💬 CHAT ROOMS TABLE:');
    console.log('--------------------');
    const chatRoomsResult = await sql.query`
      SELECT c.RoomID, c.RoomName, u.FullName as CustomerName, s.ShopName
      FROM ChatRooms c
      LEFT JOIN Users u ON c.CustomerID = u.UserID
      LEFT JOIN Shops s ON c.ShopID = s.ShopID
      ORDER BY c.RoomID
    `;
    
    if (chatRoomsResult.recordset.length === 0) {
      console.log('❌ NO CHAT ROOMS FOUND!');
    } else {
      console.log(`✅ Found ${chatRoomsResult.recordset.length} chat rooms:`);
      chatRoomsResult.recordset.forEach(room => {
        console.log(`   - ${room.RoomName} (ID: ${room.RoomID}) - Customer: ${room.CustomerName} - Shop: ${room.ShopName}`);
      });
    }
    console.log('');

    // 7. Check Messages table
    console.log('📝 MESSAGES TABLE:');
    console.log('------------------');
    const messagesResult = await sql.query`
      SELECT TOP 10 m.MessageID, m.Content as MessageText, m.MessageType as SenderType, u.FullName as SenderName, c.RoomName
      FROM Messages m
      LEFT JOIN Users u ON m.SenderID = u.UserID
      LEFT JOIN ChatRooms c ON m.RoomID = c.RoomID
      ORDER BY m.CreatedAt DESC
    `;
    
    if (messagesResult.recordset.length === 0) {
      console.log('❌ NO MESSAGES FOUND!');
    } else {
      console.log(`✅ Found ${messagesResult.recordset.length} recent messages:`);
      messagesResult.recordset.forEach(message => {
        console.log(`   - ${message.SenderName} (${message.SenderType}): "${message.MessageText.substring(0, 50)}..."`);
      });
    }
    console.log('');

    // 8. Check Orders table
    console.log('📦 ORDERS TABLE:');
    console.log('---------------');
    const ordersResult = await sql.query`
      SELECT o.OrderID, o.OrderNumber, o.Status, o.TotalAmount, u.FullName as CustomerName, s.ShopName
      FROM Orders o
      LEFT JOIN Users u ON o.CustomerID = u.UserID
      LEFT JOIN Shops s ON o.ShopID = s.ShopID
      ORDER BY o.CreatedAt DESC
    `;
    
    if (ordersResult.recordset.length === 0) {
      console.log('❌ NO ORDERS FOUND!');
    } else {
      console.log(`✅ Found ${ordersResult.recordset.length} orders:`);
      ordersResult.recordset.forEach(order => {
        console.log(`   - ${order.OrderNumber} (ID: ${order.OrderID}) - ${order.Status} - ${order.TotalAmount} VND - Customer: ${order.CustomerName} - Shop: ${order.ShopName}`);
      });
    }
    console.log('');

    // 9. Check ShoppingCart table
    console.log('🛒 SHOPPING CART TABLE:');
    console.log('----------------------');
    const cartResult = await sql.query`
      SELECT sc.CartID, u.FullName as CustomerName, p.ProductName, sc.Quantity
      FROM ShoppingCart sc
      LEFT JOIN Users u ON sc.CustomerID = u.UserID
      LEFT JOIN Products p ON sc.ProductID = p.ProductID
      ORDER BY sc.CreatedAt DESC
    `;
    
    if (cartResult.recordset.length === 0) {
      console.log('❌ NO CART ITEMS FOUND!');
    } else {
      console.log(`✅ Found ${cartResult.recordset.length} cart items:`);
      cartResult.recordset.forEach(item => {
        console.log(`   - ${item.CustomerName}: ${item.ProductName} x${item.Quantity}`);
      });
    }
    console.log('');

    // 10. Check Departments table
    console.log('🏢 DEPARTMENTS TABLE:');
    console.log('--------------------');
    const departmentsResult = await sql.query`SELECT DepartmentID, DepartmentName, Priority FROM Departments ORDER BY DepartmentID`;
    
    if (departmentsResult.recordset.length === 0) {
      console.log('❌ NO DEPARTMENTS FOUND!');
    } else {
      console.log(`✅ Found ${departmentsResult.recordset.length} departments:`);
      departmentsResult.recordset.forEach(dept => {
        console.log(`   - ${dept.DepartmentName} (ID: ${dept.DepartmentID}) - Priority: ${dept.Priority}`);
      });
    }
    console.log('');

    // 11. Check Tickets table
    console.log('🎫 TICKETS TABLE:');
    console.log('----------------');
    const ticketsResult = await sql.query`
      SELECT t.TicketID, t.TicketNumber, t.Subject, t.Status, u.FullName as CustomerName, d.DepartmentName
      FROM Tickets t
      LEFT JOIN Users u ON t.CustomerID = u.UserID
      LEFT JOIN Departments d ON t.DepartmentID = d.DepartmentID
      ORDER BY t.CreatedAt DESC
    `;
    
    if (ticketsResult.recordset.length === 0) {
      console.log('❌ NO TICKETS FOUND!');
    } else {
      console.log(`✅ Found ${ticketsResult.recordset.length} tickets:`);
      ticketsResult.recordset.forEach(ticket => {
        console.log(`   - ${ticket.TicketNumber} (ID: ${ticket.TicketID}) - ${ticket.Subject} - ${ticket.Status} - Customer: ${ticket.CustomerName} - Dept: ${ticket.DepartmentName}`);
      });
    }
    console.log('');

    console.log('🎯 SUMMARY:');
    console.log('===========');
    console.log(`✅ Users: ${usersResult.recordset.length}`);
    console.log(`✅ Roles: ${rolesResult.recordset.length}`);
    console.log(`✅ Categories: ${categoriesResult.recordset.length}`);
    console.log(`✅ Shops: ${shopsResult.recordset.length}`);
    console.log(`✅ Products: ${productsResult.recordset.length}`);
    console.log(`✅ Chat Rooms: ${chatRoomsResult.recordset.length}`);
    console.log(`✅ Messages: ${messagesResult.recordset.length}`);
    console.log(`✅ Orders: ${ordersResult.recordset.length}`);
    console.log(`✅ Cart Items: ${cartResult.recordset.length}`);
    console.log(`✅ Departments: ${departmentsResult.recordset.length}`);
    console.log(`✅ Tickets: ${ticketsResult.recordset.length}`);
    console.log('');

    // Check if we have minimum required data
    const hasUsers = usersResult.recordset.length > 0;
    const hasRoles = rolesResult.recordset.length > 0;
    const hasProducts = productsResult.recordset.length > 0;
    const hasShops = shopsResult.recordset.length > 0;
    const hasChatRooms = chatRoomsResult.recordset.length > 0;

    console.log('🚨 MISSING DATA CHECK:');
    console.log('======================');
    if (!hasUsers) console.log('❌ MISSING: Users (needed for login)');
    if (!hasRoles) console.log('❌ MISSING: Roles (needed for authentication)');
    if (!hasProducts) console.log('❌ MISSING: Products (needed for homepage)');
    if (!hasShops) console.log('❌ MISSING: Shops (needed for chat)');
    if (!hasChatRooms) console.log('❌ MISSING: Chat Rooms (needed for chat)');

    if (hasUsers && hasRoles && hasProducts && hasShops && hasChatRooms) {
      console.log('✅ ALL REQUIRED DATA PRESENT!');
      console.log('✅ Project should work with SQL Server!');
    } else {
      console.log('⚠️ SOME REQUIRED DATA MISSING!');
      console.log('⚠️ Need to run seed-database.ts');
    }

  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    console.log('\n🔌 Database check completed');
  }
}

// Run the check
checkDatabaseData().catch(console.error);
