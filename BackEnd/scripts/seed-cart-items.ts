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

async function seedCartItems() {
  try {
    console.log('🛒 SEED CART ITEMS');
    console.log('==================\n');
    
    await sql.connect(config);
    console.log('✅ Connected to SQL Server\n');

    // Clear existing cart items first
    console.log('🧹 Clearing existing cart items...');
    await sql.query`DELETE FROM ShoppingCart`;
    console.log('✅ Existing cart items cleared\n');

    // Seed new cart items
    console.log('🛍️ Seeding Cart Items...');
    const cartItems = [
      { customerId: 3, productId: 5, quantity: 2 }, // Áo thun cotton x2
      { customerId: 3, productId: 6, quantity: 1 }, // Kem dưỡng da x1
      { customerId: 3, productId: 7, quantity: 1 }, // Bộ chén đĩa x1
      { customerId: 3, productId: 8, quantity: 1 }, // Tai nghe x1
      { customerId: 3, productId: 9, quantity: 3 }, // Sách thiết kế x3
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

    // Verify cart items
    console.log('🔍 Verifying cart items...');
    const verifyResult = await sql.query`
      SELECT sc.CartID, u.FullName as CustomerName, p.ProductName, sc.Quantity, p.Price
      FROM ShoppingCart sc
      LEFT JOIN Users u ON sc.CustomerID = u.UserID
      LEFT JOIN Products p ON sc.ProductID = p.ProductID
      ORDER BY sc.CreatedAt DESC
    `;
    
    console.log(`📊 Total cart items: ${verifyResult.recordset.length}`);
    verifyResult.recordset.forEach(item => {
      const totalPrice = item.Price * item.Quantity;
      console.log(`   - ${item.CustomerName}: ${item.ProductName} x${item.Quantity} = ${totalPrice.toLocaleString()} VND`);
    });
    console.log('');

    console.log('🎉 Cart items seeded successfully!');

  } catch (error) {
    console.error('❌ Error seeding cart items:', error);
  } finally {
    console.log('\n🔌 Cart items seeding completed');
  }
}

seedCartItems().catch(console.error);
