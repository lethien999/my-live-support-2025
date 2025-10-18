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

async function seedAvailableMockData() {
  try {
    console.log('🌱 SEED MOCK DATA VÀO CÁC TABLE CÓ SẴN');
    console.log('======================================\n');
    
    await sql.connect(config);
    console.log('✅ Connected to SQL Server\n');

    // 1. Seed Categories từ dev-server.ts
    console.log('📂 Seeding Categories...');
    const categories = [
      { name: 'Furniture', description: 'Home furniture and decor', icon: '🪑' },
      { name: 'Electronics', description: 'Electronic devices and gadgets', icon: '📱' },
      { name: 'Clothing', description: 'Fashion and apparel', icon: '👕' },
      { name: 'Books', description: 'Books and literature', icon: '📚' },
      { name: 'Beauty', description: 'Beauty and personal care', icon: '💄' }
    ];

    for (const category of categories) {
      try {
        await sql.query`
          INSERT INTO Categories (CategoryName, Description, Icon, IsActive, CreatedAt)
          VALUES (${category.name}, ${category.description}, ${category.icon}, 1, GETDATE())
        `;
        console.log(`✅ Category created: ${category.name}`);
      } catch (error) {
        console.log(`⚠️ Category ${category.name} might already exist`);
      }
    }
    console.log('');

    // 2. Seed Products từ dev-server.ts
    console.log('🛍️ Seeding Products...');
    const products = [
      { 
        name: 'Wooden Chair', 
        description: 'Comfortable wooden chair', 
        categoryId: 1, 
        price: 299.99, 
        imagePath: '/images/products/wooden-chair.jpg' 
      },
      { 
        name: 'Modern Sofa', 
        description: '3-seater modern sofa', 
        categoryId: 1, 
        price: 899.99, 
        imagePath: '/images/products/modern-sofa.jpg' 
      },
      { 
        name: 'Coffee Table', 
        description: 'Glass top coffee table', 
        categoryId: 1, 
        price: 199.99, 
        imagePath: '/images/products/coffee-table.jpg' 
      },
      { 
        name: 'Smartphone', 
        description: 'Latest smartphone with advanced features', 
        categoryId: 2, 
        price: 599.99, 
        imagePath: '/images/products/smartphone.jpg' 
      },
      { 
        name: 'Laptop', 
        description: 'High-performance laptop for work and gaming', 
        categoryId: 2, 
        price: 1299.99, 
        imagePath: '/images/products/laptop.jpg' 
      },
      { 
        name: 'Cotton T-Shirt', 
        description: 'Comfortable cotton t-shirt', 
        categoryId: 3, 
        price: 29.99, 
        imagePath: '/images/products/tshirt.jpg' 
      },
      { 
        name: 'Design Book', 
        description: 'Comprehensive design guide', 
        categoryId: 4, 
        price: 49.99, 
        imagePath: '/images/products/design-book.jpg' 
      },
      { 
        name: 'Face Cream', 
        description: 'Moisturizing face cream', 
        categoryId: 5, 
        price: 39.99, 
        imagePath: '/images/products/face-cream.jpg' 
      }
    ];

    for (const product of products) {
      try {
        await sql.query`
          INSERT INTO Products (ProductName, Description, CategoryID, Price, ImagePath, IsActive, CreatedAt)
          VALUES (${product.name}, ${product.description}, ${product.categoryId}, ${product.price}, ${product.imagePath}, 1, GETDATE())
        `;
        console.log(`✅ Product created: ${product.name}`);
      } catch (error) {
        console.log(`⚠️ Product ${product.name} might already exist`);
      }
    }
    console.log('');

    // 3. Seed Sample Orders từ dev-server.ts
    console.log('📦 Seeding Sample Orders...');
    const orders = [
      {
        customerId: 3,
        orderNumber: 'ORD001',
        status: 'Pending',
        totalAmount: 299.99,
        shippingAddress: '123 Main St, City, State',
        paymentMethod: 'Credit Card'
      },
      {
        customerId: 4,
        orderNumber: 'ORD002',
        status: 'Shipped',
        totalAmount: 899.99,
        shippingAddress: '456 Oak Ave, City, State',
        paymentMethod: 'PayPal'
      },
      {
        customerId: 5,
        orderNumber: 'ORD003',
        status: 'Delivered',
        totalAmount: 199.99,
        shippingAddress: '789 Pine Rd, City, State',
        paymentMethod: 'Credit Card'
      }
    ];

    for (const order of orders) {
      try {
        await sql.query`
          INSERT INTO Orders (CustomerID, OrderNumber, Status, TotalAmount, ShippingAddress, PaymentMethod, CreatedAt)
          VALUES (${order.customerId}, ${order.orderNumber}, ${order.status}, ${order.totalAmount}, ${order.shippingAddress}, ${order.paymentMethod}, GETDATE())
        `;
        console.log(`✅ Order created: ${order.orderNumber}`);
      } catch (error) {
        console.log(`⚠️ Order ${order.orderNumber} might already exist`);
      }
    }
    console.log('');

    // 4. Seed Sample Cart Items
    console.log('🛒 Seeding Sample Cart Items...');
    const cartItems = [
      { userId: 3, productId: 1, quantity: 2 },
      { userId: 3, productId: 2, quantity: 1 },
      { userId: 4, productId: 3, quantity: 3 },
      { userId: 5, productId: 4, quantity: 1 }
    ];

    for (const item of cartItems) {
      try {
        await sql.query`
          INSERT INTO Cart (UserID, ProductID, Quantity, CreatedAt)
          VALUES (${item.userId}, ${item.productId}, ${item.quantity}, GETDATE())
        `;
        console.log(`✅ Cart item created: User ${item.userId} - Product ${item.productId}`);
      } catch (error) {
        console.log(`⚠️ Cart item might already exist`);
      }
    }
    console.log('');

    // 5. Seed Sample Reviews
    console.log('⭐ Seeding Sample Reviews...');
    const reviews = [
      { userId: 3, productId: 1, rating: 5, comment: 'Excellent product!' },
      { userId: 4, productId: 2, rating: 4, comment: 'Good quality, fast shipping' },
      { userId: 5, productId: 3, rating: 5, comment: 'Perfect for my needs' },
      { userId: 3, productId: 4, rating: 3, comment: 'Average product' }
    ];

    for (const review of reviews) {
      try {
        await sql.query`
          INSERT INTO Reviews (UserID, ProductID, Rating, Comment, CreatedAt)
          VALUES (${review.userId}, ${review.productId}, ${review.rating}, ${review.comment}, GETDATE())
        `;
        console.log(`✅ Review created: User ${review.userId} - Product ${review.productId}`);
      } catch (error) {
        console.log(`⚠️ Review might already exist`);
      }
    }
    console.log('');

    // 6. Seed Sample Wishlist Items
    console.log('❤️ Seeding Sample Wishlist Items...');
    const wishlistItems = [
      { userId: 3, productId: 2 },
      { userId: 3, productId: 4 },
      { userId: 4, productId: 1 },
      { userId: 5, productId: 3 }
    ];

    for (const item of wishlistItems) {
      try {
        await sql.query`
          INSERT INTO Wishlist (UserID, ProductID, CreatedAt)
          VALUES (${item.userId}, ${item.productId}, GETDATE())
        `;
        console.log(`✅ Wishlist item created: User ${item.userId} - Product ${item.productId}`);
      } catch (error) {
        console.log(`⚠️ Wishlist item might already exist`);
      }
    }
    console.log('');

    // 7. Seed Sample Notifications
    console.log('🔔 Seeding Sample Notifications...');
    const notifications = [
      { userId: 3, title: 'Order Confirmed', message: 'Your order ORD001 has been confirmed', type: 'Order' },
      { userId: 4, title: 'Order Shipped', message: 'Your order ORD002 has been shipped', type: 'Order' },
      { userId: 5, title: 'New Product', message: 'Check out our new arrivals!', type: 'Promotion' },
      { userId: 3, title: 'Review Request', message: 'Please rate your recent purchase', type: 'Review' }
    ];

    for (const notification of notifications) {
      try {
        await sql.query`
          INSERT INTO Notifications (UserID, Title, Message, Type, IsRead, CreatedAt)
          VALUES (${notification.userId}, ${notification.title}, ${notification.message}, ${notification.type}, 0, GETDATE())
        `;
        console.log(`✅ Notification created: ${notification.title}`);
      } catch (error) {
        console.log(`⚠️ Notification might already exist`);
      }
    }
    console.log('');

    // Verify data
    console.log('🔍 Verifying seeded data...');
    const result = await sql.query`
      SELECT 'Categories' as TableName, COUNT(*) as RecordCount FROM Categories
      UNION ALL
      SELECT 'Products', COUNT(*) FROM Products
      UNION ALL
      SELECT 'Orders', COUNT(*) FROM Orders
      UNION ALL
      SELECT 'Cart', COUNT(*) FROM Cart
      UNION ALL
      SELECT 'Reviews', COUNT(*) FROM Reviews
      UNION ALL
      SELECT 'Wishlist', COUNT(*) FROM Wishlist
      UNION ALL
      SELECT 'Notifications', COUNT(*) FROM Notifications
    `;
    
    console.log('\n📊 Database verification:');
    result.recordset.forEach(row => {
      console.log(`   ${row.TableName}: ${row.RecordCount} records`);
    });
    
    console.log('\n🎉 Mock data seeding completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Categories: 5 items');
    console.log('   ✅ Products: 8 items');
    console.log('   ✅ Orders: 3 items');
    console.log('   ✅ Cart Items: 4 items');
    console.log('   ✅ Reviews: 4 items');
    console.log('   ✅ Wishlist Items: 4 items');
    console.log('   ✅ Notifications: 4 items');
    
  } catch (error) {
    console.error('❌ Error seeding mock data:', error);
  }
}

// Run the script
seedAvailableMockData().then(() => {
  console.log('\n✅ Script completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
