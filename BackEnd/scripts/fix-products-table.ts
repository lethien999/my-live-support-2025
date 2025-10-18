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

async function fixProductsTable() {
  try {
    console.log('🔧 SỬA PRODUCTS TABLE');
    console.log('=====================\n');
    
    await sql.connect(config);
    console.log('✅ Connected to SQL Server\n');

    // Add ShopID column to Products table
    console.log('🏪 Adding ShopID column to Products table...');
    await sql.query`
      ALTER TABLE Products 
      ADD ShopID INT NULL,
          IsActive BIT DEFAULT 1,
          IsFeatured BIT DEFAULT 0
    `;
    console.log('✅ ShopID column added\n');

    // Add foreign key constraint
    console.log('🔗 Adding foreign key constraint...');
    await sql.query`
      ALTER TABLE Products 
      ADD CONSTRAINT FK_Products_Shops 
      FOREIGN KEY (ShopID) REFERENCES Shops(ShopID)
    `;
    console.log('✅ Foreign key constraint added\n');

    // Now seed products with ShopID
    console.log('🛍️ Seeding Products with ShopID...');
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

    console.log('🎉 Products table fixed and seeded successfully!');

  } catch (error) {
    console.error('❌ Error fixing Products table:', error);
  } finally {
    console.log('\n🔌 Products table fix completed');
  }
}

fixProductsTable().catch(console.error);
