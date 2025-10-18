import sql from 'mssql';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: 'env.local' });
dotenv.config();

const config = {
  user: 'thien',
  password: '1909',
  server: 'localhost',
  database: 'live_support',
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to database
    await sql.connect(config);
    console.log('✅ Connected to SQL Server');

    // 1. Seed Departments
    console.log('📋 Seeding Departments...');
    const departments = [
      { name: 'Payment', description: 'Thanh toán và hoàn tiền', priority: 'Urgent' },
      { name: 'Order & Shipping', description: 'Đơn hàng và vận chuyển', priority: 'High' },
      { name: 'Product & Return', description: 'Sản phẩm và đổi trả', priority: 'Medium' },
      { name: 'Technical Support', description: 'Hỗ trợ kỹ thuật', priority: 'Low' },
      { name: 'General Inquiry', description: 'Câu hỏi chung', priority: 'Medium' }
    ];

    for (const dept of departments) {
      try {
        await sql.query`
          INSERT INTO Departments (DepartmentName, Description, Priority, IsActive, CreatedAt)
          VALUES (${dept.name}, ${dept.description}, ${dept.priority}, 1, GETDATE())
        `;
        console.log(`✅ Department created: ${dept.name}`);
      } catch (error) {
        console.log(`⚠️ Department ${dept.name} might already exist`);
      }
    }

    // 2. Seed Categories
    console.log('📦 Seeding Categories...');
    const categories = [
      { name: 'Clothing', description: 'Quần áo và phụ kiện', isActive: 1 },
      { name: 'Beauty', description: 'Mỹ phẩm và chăm sóc da', isActive: 1 },
      { name: 'Home', description: 'Đồ gia dụng và trang trí', isActive: 1 },
      { name: 'Electronics', description: 'Điện tử và công nghệ', isActive: 1 },
      { name: 'Books', description: 'Sách và tài liệu', isActive: 1 }
    ];

    for (const cat of categories) {
      try {
        await sql.query`
          INSERT INTO Categories (CategoryName, Description, IsActive, CreatedAt)
          VALUES (${cat.name}, ${cat.description}, ${cat.isActive}, GETDATE())
        `;
        console.log(`✅ Category created: ${cat.name}`);
      } catch (error) {
        console.log(`⚠️ Category ${cat.name} might already exist`);
      }
    }

    // 3. Seed Shops
    console.log('🏪 Seeding Shops...');
    const shops = [
      { name: 'MUJI Fashion Store', description: 'Cửa hàng thời trang MUJI', email: 'fashion@muji.com', phone: '1900-123-456' },
      { name: 'MUJI Beauty Store', description: 'Cửa hàng mỹ phẩm MUJI', email: 'beauty@muji.com', phone: '1900-123-457' },
      { name: 'MUJI Home Store', description: 'Cửa hàng đồ gia dụng MUJI', email: 'home@muji.com', phone: '1900-123-458' },
      { name: 'MUJI Electronics Store', description: 'Cửa hàng điện tử MUJI', email: 'electronics@muji.com', phone: '1900-123-459' },
      { name: 'MUJI Books Store', description: 'Cửa hàng sách MUJI', email: 'books@muji.com', phone: '1900-123-460' }
    ];

    for (const shop of shops) {
      try {
        await sql.query`
          INSERT INTO Shops (ShopName, Description, Email, Phone, IsActive, CreatedAt)
          VALUES (${shop.name}, ${shop.description}, ${shop.email}, ${shop.phone}, 1, GETDATE())
        `;
        console.log(`✅ Shop created: ${shop.name}`);
      } catch (error) {
        console.log(`⚠️ Shop ${shop.name} might already exist`);
      }
    }

    // 4. Seed Products
    console.log('🛍️ Seeding Products...');
    const products = [
      { name: 'Áo thun cotton cơ bản', description: 'Áo thun cotton 100% chất lượng cao', price: 299000, categoryId: 1, shopId: 1 },
      { name: 'Kem dưỡng da ban đêm', description: 'Kem dưỡng da ban đêm cho da khô', price: 450000, categoryId: 2, shopId: 2 },
      { name: 'Bộ chén đĩa gốm sứ', description: 'Bộ chén đĩa gốm sứ handmade', price: 850000, categoryId: 3, shopId: 3 },
      { name: 'Tai nghe không dây', description: 'Tai nghe không dây chống ồn', price: 1200000, categoryId: 4, shopId: 4 },
      { name: 'Sách thiết kế nội thất', description: 'Sách hướng dẫn thiết kế nội thất', price: 180000, categoryId: 5, shopId: 5 }
    ];

    for (const product of products) {
      try {
        await sql.query`
          INSERT INTO Products (ProductName, Description, Price, CategoryID, ShopID, IsActive, CreatedAt)
          VALUES (${product.name}, ${product.description}, ${product.price}, ${product.categoryId}, ${product.shopId}, 1, GETDATE())
        `;
        console.log(`✅ Product created: ${product.name}`);
      } catch (error) {
        console.log(`⚠️ Product ${product.name} might already exist`);
      }
    }

    // 5. Seed Sample Tickets
    console.log('🎫 Seeding Sample Tickets...');
    const tickets = [
      { 
        subject: 'Hàng bị lỗi', 
        description: 'Sản phẩm nhận được bị hỏng, cần đổi trả', 
        customerId: 3, 
        departmentId: 3, 
        priority: 'High',
        status: 'Open'
      },
      { 
        subject: 'Thanh toán không thành công', 
        description: 'Không thể thanh toán bằng thẻ tín dụng', 
        customerId: 3, 
        departmentId: 1, 
        priority: 'Urgent',
        status: 'Pending'
      },
      { 
        subject: 'Đơn hàng chưa nhận được', 
        description: 'Đặt hàng 3 ngày rồi chưa thấy ship', 
        customerId: 3, 
        departmentId: 2, 
        priority: 'High',
        status: 'Open'
      }
    ];

    for (const ticket of tickets) {
      try {
        // Generate ticket number
        const ticketNumber = `TKT${Date.now().toString().slice(-6)}`;
        
        await sql.query`
          INSERT INTO Tickets (TicketNumber, Subject, Description, Status, Priority, CustomerID, DepartmentID, CreatedAt)
          VALUES (${ticketNumber}, ${ticket.subject}, ${ticket.description}, ${ticket.status}, ${ticket.priority}, ${ticket.customerId}, ${ticket.departmentId}, GETDATE())
        `;
        console.log(`✅ Ticket created: ${ticketNumber} - ${ticket.subject}`);
      } catch (error) {
        console.log(`⚠️ Ticket ${ticket.subject} might already exist`);
      }
    }

    // 6. Seed Chat Rooms
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

    // 7. Seed Sample Messages
    console.log('📝 Seeding Sample Messages...');
    const messages = [
      { roomId: 1, senderId: 3, senderType: 'Customer', messageText: 'Xin chào! Tôi có vấn đề với đơn hàng áo thun cotton' },
      { roomId: 1, senderId: 2, senderType: 'Agent', messageText: 'Xin chào! Tôi sẽ hỗ trợ bạn về vấn đề này. Bạn có thể cho tôi biết chi tiết không?' },
      { roomId: 1, senderId: 3, senderType: 'Customer', messageText: 'Áo bị lỗi đường may, tôi muốn đổi size khác' },
      { roomId: 1, senderId: 2, senderType: 'Agent', messageText: 'Tôi hiểu rồi. Chúng tôi sẽ hỗ trợ bạn đổi size. Bạn có thể gửi ảnh sản phẩm không?' },
      { roomId: 2, senderId: 3, senderType: 'Customer', messageText: 'Kem dưỡng da có phù hợp với da nhạy cảm không?' },
      { roomId: 2, senderId: 2, senderType: 'Agent', messageText: 'Kem này rất phù hợp với da nhạy cảm. Bạn có thể thử sample trước khi mua' }
    ];

    for (const message of messages) {
      try {
        await sql.query`
          INSERT INTO Messages (RoomID, SenderID, SenderType, MessageText, IsRead, CreatedAt)
          VALUES (${message.roomId}, ${message.senderId}, ${message.senderType}, ${message.messageText}, 0, GETDATE())
        `;
        console.log(`✅ Message created: ${message.messageText.substring(0, 30)}...`);
      } catch (error) {
        console.log(`⚠️ Message might already exist`);
      }
    }

    // 8. Seed Sample Orders
    console.log('📦 Seeding Sample Orders...');
    const orders = [
      { 
        customerId: 3, 
        shopId: 1, 
        status: 'Pending',
        totalAmount: 299000,
        shippingAddress: '123 Đường ABC, Quận 1, TP.HCM',
        paymentMethod: 'COD',
        notes: 'Giao hàng vào buổi chiều'
      },
      { 
        customerId: 3, 
        shopId: 2, 
        status: 'Shipped',
        totalAmount: 450000,
        shippingAddress: '456 Đường XYZ, Quận 2, TP.HCM',
        paymentMethod: 'Bank Transfer',
        notes: 'Đã thanh toán'
      }
    ];

    for (const order of orders) {
      try {
        const orderNumber = `ORD${Date.now().toString().slice(-8)}`;
        
        const orderResult = await sql.query`
          INSERT INTO Orders (OrderNumber, CustomerID, ShopID, Status, TotalAmount, ShippingAddress, PaymentMethod, Notes, CreatedAt)
          VALUES (${orderNumber}, ${order.customerId}, ${order.shopId}, ${order.status}, ${order.totalAmount}, ${order.shippingAddress}, ${order.paymentMethod}, ${order.notes}, GETDATE())
          SELECT SCOPE_IDENTITY() as OrderID
        `;
        
        const orderId = orderResult.recordset[0].OrderID;
        
        // Add order items
        await sql.query`
          INSERT INTO OrderItems (OrderID, ProductID, Quantity, Price, TotalPrice, CreatedAt)
          VALUES (${orderId}, ${order.shopId}, 1, ${order.totalAmount}, ${order.totalAmount}, GETDATE())
        `;
        
        console.log(`✅ Order created: ${orderNumber} - ${order.status}`);
      } catch (error) {
        console.log(`⚠️ Order might already exist`);
      }
    }

    // 9. Seed Sample Cart Items
    console.log('🛒 Seeding Sample Cart Items...');
    const cartItems = [
      { customerId: 3, productId: 1, quantity: 2 },
      { customerId: 3, productId: 3, quantity: 1 },
      { customerId: 3, productId: 5, quantity: 3 }
    ];

    for (const item of cartItems) {
      try {
        await sql.query`
          INSERT INTO ShoppingCart (CustomerID, ProductID, Quantity, CreatedAt)
          VALUES (${item.customerId}, ${item.productId}, ${item.quantity}, GETDATE())
        `;
        console.log(`✅ Cart item created: Product ${item.productId} x${item.quantity}`);
      } catch (error) {
        console.log(`⚠️ Cart item might already exist`);
      }
    }

    console.log('🎉 Database seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    // Close connection pool
    console.log('🔌 Database connection closed');
  }
}

// Run seeding
seedDatabase().catch(console.error);
