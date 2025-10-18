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

async function seedMissingData() {
  try {
    console.log('🌱 SEED DỮ LIỆU VÀO CÁC TABLE MỚI');
    console.log('=================================\n');
    
    await sql.connect(config);
    console.log('✅ Connected to SQL Server\n');

    // 1. Seed Shops
    console.log('🏪 Seeding Shops...');
    const shops = [
      { name: 'MUJI Fashion Store', email: 'fashion@muji.com', phone: '0901234567', description: 'Cửa hàng thời trang MUJI' },
      { name: 'MUJI Beauty Store', email: 'beauty@muji.com', phone: '0901234568', description: 'Cửa hàng mỹ phẩm MUJI' },
      { name: 'MUJI Home Store', email: 'home@muji.com', phone: '0901234569', description: 'Cửa hàng đồ gia dụng MUJI' },
      { name: 'MUJI Electronics Store', email: 'electronics@muji.com', phone: '0901234570', description: 'Cửa hàng điện tử MUJI' },
      { name: 'MUJI Books Store', email: 'books@muji.com', phone: '0901234571', description: 'Cửa hàng sách MUJI' }
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
    console.log('');

    // 2. Seed Products
    console.log('🛍️ Seeding Products...');
    const products = [
      { name: 'Áo thun cotton cơ bản', description: 'Áo thun 100% cotton, mềm mại, thoáng mát', price: 299000, category: 'Clothing', shop: 'MUJI Fashion Store', isFeatured: true },
      { name: 'Kem dưỡng da ban đêm', description: 'Kem dưỡng ẩm sâu, phục hồi da ban đêm', price: 450000, category: 'Beauty', shop: 'MUJI Beauty Store', isFeatured: true },
      { name: 'Bộ chén đĩa gốm sứ', description: 'Bộ chén đĩa phong cách tối giản, chất liệu gốm sứ cao cấp', price: 850000, category: 'Home', shop: 'MUJI Home Store', isFeatured: false },
      { name: 'Tai nghe không dây', description: 'Tai nghe Bluetooth chất lượng cao, pin trâu', price: 1200000, category: 'Electronics', shop: 'MUJI Electronics Store', isFeatured: true },
      { name: 'Sách thiết kế nội thất', description: 'Tuyển tập các mẫu thiết kế nội thất hiện đại', price: 180000, category: 'Books', shop: 'MUJI Books Store', isFeatured: false }
    ];

    for (const product of products) {
      try {
        const categoryResult = await sql.query`SELECT CategoryID FROM Categories WHERE CategoryName = ${product.category}`;
        const categoryId = categoryResult.recordset[0].CategoryID;

        const shopResult = await sql.query`SELECT ShopID FROM Shops WHERE ShopName = ${product.shop}`;
        const shopId = shopResult.recordset[0].ShopID;

        await sql.query`
          INSERT INTO Products (ProductName, Description, Price, CategoryID, ShopID, IsActive, IsFeatured, CreatedAt)
          VALUES (${product.name}, ${product.description}, ${product.price}, ${categoryId}, ${shopId}, 1, ${product.isFeatured ? 1 : 0}, GETDATE())
        `;
        console.log(`✅ Product created: ${product.name}`);
      } catch (error) {
        console.log(`⚠️ Product ${product.name} might already exist`);
      }
    }
    console.log('');

    // 3. Seed Sample Orders
    console.log('📦 Seeding Sample Orders...');
    const orders = [
      { 
        customerId: 3, 
        shopId: 1, 
        status: 'Pending',
        totalAmount: 299000,
        shippingAddress: '123 Đường ABC, Quận 1, TP.HCM',
        paymentMethod: 'COD',
        notes: 'Giao hàng vào buổi chiều',
        productId: 1
      },
      { 
        customerId: 3, 
        shopId: 2, 
        status: 'Shipped',
        totalAmount: 450000,
        shippingAddress: '456 Đường XYZ, Quận 2, TP.HCM',
        paymentMethod: 'Bank Transfer',
        notes: 'Đã thanh toán',
        productId: 2
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
          VALUES (${orderId}, ${order.productId}, 1, ${order.totalAmount}, ${order.totalAmount}, GETDATE())
        `;
        
        console.log(`✅ Order created: ${orderNumber} - ${order.status}`);
      } catch (error) {
        console.log(`⚠️ Order might already exist`);
      }
    }
    console.log('');

    // 4. Seed Sample Cart Items
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
    console.log('');

    console.log('🎉 Missing data seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding missing data:', error);
  } finally {
    console.log('\n🔌 Missing data seeding completed');
  }
}

seedMissingData().catch(console.error);
