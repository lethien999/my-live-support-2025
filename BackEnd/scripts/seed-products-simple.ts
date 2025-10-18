import sql from 'mssql';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../env.local' });
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
};

async function seedProductsData() {
  try {
    console.log('🌱 Starting to seed products data...');
    
    await sql.connect(config);
    console.log('✅ Connected to SQL Server');

    // Get existing Categories and Shops
    const categoriesResult = await sql.query`SELECT CategoryID, CategoryName FROM Categories WHERE IsActive = 1`;
    const shopsResult = await sql.query`SELECT ShopID, ShopName FROM Shops WHERE IsActive = 1`;
    
    const categories = categoriesResult.recordset;
    const shops = shopsResult.recordset;
    
    console.log('📂 Categories loaded:', categories.length);
    console.log('🏪 Shops loaded:', shops.length);

    // Find specific IDs
    const clothingId = categories.find(c => c.CategoryName === 'Clothing')?.CategoryID;
    const beautyId = categories.find(c => c.CategoryName === 'Beauty')?.CategoryID;
    const homeId = categories.find(c => c.CategoryName === 'Home')?.CategoryID;
    const electronicsId = categories.find(c => c.CategoryName === 'Electronics')?.CategoryID;
    const accessoriesId = categories.find(c => c.CategoryName === 'Accessories')?.CategoryID;
    const booksId = categories.find(c => c.CategoryName === 'Books')?.CategoryID;
    const stationeryId = categories.find(c => c.CategoryName === 'Stationery')?.CategoryID;
    const foodId = categories.find(c => c.CategoryName === 'Food')?.CategoryID;
    
    const shopId = shops[0]?.ShopID; // Use first shop

    console.log('🔍 Found IDs:', { clothingId, beautyId, homeId, electronicsId, accessoriesId, booksId, stationeryId, foodId, shopId });

    // Seed Products
    console.log('🛍️ Seeding Products...');
    const products = [
      {
        name: 'Áo thun cotton cơ bản',
        description: 'Áo thun cotton 100% với thiết kế đơn giản, thoải mái và bền bỉ',
        longDescription: 'Áo thun cotton được làm từ chất liệu cotton 100% cao cấp, với thiết kế tối giản và màu sắc trung tính.',
        price: 299000,
        originalPrice: 399000,
        categoryId: clothingId,
        shopId: shopId,
        stockQuantity: 100,
        imagePath: 'https://via.placeholder.com/300x300/ffffff/000000?text=Áo+Thun',
        isActive: 1,
        isFeatured: 1,
        isInStock: 1
      },
      {
        name: 'Quần jeans slim fit',
        description: 'Quần jeans với thiết kế slim fit hiện đại, chất liệu denim cao cấp',
        longDescription: 'Quần jeans được thiết kế với kiểu dáng slim fit hiện đại, chất liệu denim cao cấp.',
        price: 899000,
        originalPrice: 1199000,
        categoryId: clothingId,
        shopId: shopId,
        stockQuantity: 50,
        imagePath: 'https://via.placeholder.com/300x300/ffffff/000000?text=Quần+Jeans',
        isActive: 1,
        isFeatured: 1,
        isInStock: 1
      },
      {
        name: 'Kem dưỡng ẩm tự nhiên',
        description: 'Kem dưỡng ẩm với thành phần tự nhiên, phù hợp cho mọi loại da',
        longDescription: 'Kem dưỡng ẩm được chiết xuất từ các thành phần tự nhiên như chiết xuất từ hoa cúc, vitamin E.',
        price: 450000,
        originalPrice: 550000,
        categoryId: beautyId,
        shopId: shopId,
        stockQuantity: 80,
        imagePath: 'https://via.placeholder.com/300x300/ffffff/000000?text=Kem+Dưỡng',
        isActive: 1,
        isFeatured: 1,
        isInStock: 1
      },
      {
        name: 'Bộ chén đĩa gốm sứ',
        description: 'Bộ chén đĩa gốm sứ với thiết kế tối giản, an toàn cho sức khỏe',
        longDescription: 'Bộ chén đĩa được làm từ gốm sứ cao cấp, thiết kế tối giản với màu trắng tinh khiết.',
        price: 650000,
        originalPrice: 850000,
        categoryId: homeId,
        shopId: shopId,
        stockQuantity: 40,
        imagePath: 'https://via.placeholder.com/300x300/ffffff/000000?text=Chén+Đĩa',
        isActive: 1,
        isFeatured: 1,
        isInStock: 1
      },
      {
        name: 'Tai nghe không dây',
        description: 'Tai nghe không dây với âm thanh chất lượng cao, pin lâu',
        longDescription: 'Tai nghe không dây sử dụng công nghệ Bluetooth 5.0, âm thanh chất lượng cao.',
        price: 1599000,
        originalPrice: 1999000,
        categoryId: electronicsId,
        shopId: shopId,
        stockQuantity: 60,
        imagePath: 'https://via.placeholder.com/300x300/ffffff/000000?text=Tai+Nghe',
        isActive: 1,
        isFeatured: 1,
        isInStock: 1
      },
      {
        name: 'Túi xách canvas',
        description: 'Túi xách canvas với thiết kế đơn giản, bền bỉ và phù hợp mọi hoạt động',
        longDescription: 'Túi xách được làm từ chất liệu canvas cao cấp, thiết kế đơn giản và tối giản.',
        price: 550000,
        originalPrice: 750000,
        categoryId: accessoriesId,
        shopId: shopId,
        stockQuantity: 70,
        imagePath: 'https://via.placeholder.com/300x300/ffffff/000000?text=Túi+Xách',
        isActive: 1,
        isFeatured: 1,
        isInStock: 1
      },
      {
        name: 'Sách thiết kế nội thất',
        description: 'Tuyển tập các mẫu thiết kế nội thất hiện đại và tối giản',
        longDescription: 'Cuốn sách tổng hợp các mẫu thiết kế nội thất hiện đại với phong cách tối giản.',
        price: 180000,
        originalPrice: 250000,
        categoryId: booksId,
        shopId: shopId,
        stockQuantity: 50,
        imagePath: 'https://via.placeholder.com/300x300/ffffff/000000?text=Sách+Thiết+Kế',
        isActive: 1,
        isFeatured: 0,
        isInStock: 1
      },
      {
        name: 'Bút gel đen 0.5mm',
        description: 'Bút gel với ngòi 0.5mm, mực đen đậm và viết mượt mà',
        longDescription: 'Bút gel sử dụng ngòi 0.5mm với mực đen đậm, viết mượt mà không bị tắc.',
        price: 25000,
        originalPrice: 35000,
        categoryId: stationeryId,
        shopId: shopId,
        stockQuantity: 200,
        imagePath: 'https://via.placeholder.com/300x300/ffffff/000000?text=Bút+Gel',
        isActive: 1,
        isFeatured: 0,
        isInStock: 1
      },
      {
        name: 'Trà xanh Nhật Bản',
        description: 'Trà xanh cao cấp nhập khẩu từ Nhật Bản, hương vị tự nhiên',
        longDescription: 'Trà xanh được nhập khẩu trực tiếp từ Nhật Bản, được chế biến theo phương pháp truyền thống.',
        price: 120000,
        originalPrice: 150000,
        categoryId: foodId,
        shopId: shopId,
        stockQuantity: 100,
        imagePath: 'https://via.placeholder.com/300x300/ffffff/000000?text=Trà+Xanh',
        isActive: 1,
        isFeatured: 1,
        isInStock: 1
      }
    ];

    for (const product of products) {
      if (product.categoryId && product.shopId) {
        await sql.query`
          IF NOT EXISTS (SELECT 1 FROM Products WHERE ProductName = ${product.name})
          INSERT INTO Products (
            ProductName, Description, LongDescription, Price, OriginalPrice,
            CategoryID, ShopID, StockQuantity, ImagePath, IsActive, IsFeatured, IsInStock, CreatedAt
          )
          VALUES (
            ${product.name}, ${product.description}, ${product.longDescription},
            ${product.price}, ${product.originalPrice}, ${product.categoryId},
            ${product.shopId}, ${product.stockQuantity}, ${product.imagePath},
            ${product.isActive}, ${product.isFeatured}, ${product.isInStock}, GETDATE()
          )
        `;
        console.log(`✅ Added product: ${product.name}`);
      } else {
        console.log(`❌ Skipped product: ${product.name} (missing categoryId or shopId)`);
      }
    }

    // Seed Reviews
    console.log('⭐ Seeding Reviews...');
    const reviews = [
      { productName: 'Áo thun cotton cơ bản', customerId: 3, rating: 5, comment: 'Áo rất đẹp và chất lượng tốt!' },
      { productName: 'Áo thun cotton cơ bản', customerId: 3, rating: 4, comment: 'Chất liệu cotton mềm mại, thoải mái khi mặc' },
      { productName: 'Quần jeans slim fit', customerId: 3, rating: 5, comment: 'Quần jeans vừa vặn, chất lượng denim tốt' },
      { productName: 'Kem dưỡng ẩm tự nhiên', customerId: 3, rating: 5, comment: 'Kem dưỡng ẩm rất hiệu quả, da mềm mịn' },
      { productName: 'Tai nghe không dây', customerId: 3, rating: 4, comment: 'Tai nghe âm thanh hay, pin lâu' },
      { productName: 'Túi xách canvas', customerId: 3, rating: 5, comment: 'Túi xách đẹp và bền, thiết kế tối giản' }
    ];

    for (const review of reviews) {
      const productResult = await sql.query`SELECT ProductID FROM Products WHERE ProductName = ${review.productName}`;
      if (productResult.recordset.length > 0) {
        const productId = productResult.recordset[0].ProductID;
        await sql.query`
          INSERT INTO Reviews (ProductID, CustomerID, Rating, Comment, CreatedAt)
          VALUES (${productId}, ${review.customerId}, ${review.rating}, ${review.comment}, GETDATE())
        `;
        console.log(`✅ Added review for: ${review.productName}`);
      }
    }

    // Update Product Ratings
    console.log('📊 Updating Product Ratings...');
    await sql.query`
      UPDATE Products 
      SET AverageRating = (
        SELECT AVG(CAST(Rating AS FLOAT))
        FROM Reviews 
        WHERE Reviews.ProductID = Products.ProductID
      ),
      ReviewCount = (
        SELECT COUNT(*)
        FROM Reviews 
        WHERE Reviews.ProductID = Products.ProductID
      )
      WHERE ProductID IN (SELECT DISTINCT ProductID FROM Reviews)
    `;
    console.log('✅ Product ratings updated');

    // Seed Shopping Cart Items
    console.log('🛒 Seeding Shopping Cart Items...');
    const cartItems = [
      { productName: 'Áo thun cotton cơ bản', customerId: 3, quantity: 2 },
      { productName: 'Kem dưỡng ẩm tự nhiên', customerId: 3, quantity: 1 },
      { productName: 'Tai nghe không dây', customerId: 3, quantity: 1 }
    ];

    for (const item of cartItems) {
      const productResult = await sql.query`SELECT ProductID FROM Products WHERE ProductName = ${item.productName}`;
      if (productResult.recordset.length > 0) {
        const productId = productResult.recordset[0].ProductID;
        await sql.query`
          IF NOT EXISTS (SELECT 1 FROM ShoppingCart WHERE CustomerID = ${item.customerId} AND ProductID = ${productId})
          INSERT INTO ShoppingCart (CustomerID, ProductID, Quantity, CreatedAt)
          VALUES (${item.customerId}, ${productId}, ${item.quantity}, GETDATE())
        `;
        console.log(`✅ Added cart item: ${item.productName}`);
      }
    }

    console.log('🎉 All data seeded successfully!');
    console.log('📊 Summary:');
    console.log(`   - Products: ${products.length}`);
    console.log(`   - Reviews: ${reviews.length}`);
    console.log(`   - Cart Items: ${cartItems.length}`);

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    console.log('✅ Database connection closed');
  }
}

// Run the seed function
seedProductsData().catch(console.error);
