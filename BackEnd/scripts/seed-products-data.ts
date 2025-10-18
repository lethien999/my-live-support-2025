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

    // 1. Get existing Categories
    console.log('📂 Getting existing Categories...');
    const categoriesResult = await sql.query`SELECT CategoryID, CategoryName FROM Categories WHERE IsActive = 1`;
    const categories = categoriesResult.recordset;
    console.log('✅ Categories loaded:', categories.length);

    // 2. Seed Shops
    console.log('🏪 Seeding Shops...');
    const shops = [
      { name: 'MUJI Store Hà Nội', description: 'Cửa hàng MUJI tại Hà Nội', address: '123 Phố Huế, Hà Nội', phone: '024-1234-5678', email: 'hanoi@muji.com' },
      { name: 'MUJI Store TP.HCM', description: 'Cửa hàng MUJI tại TP.HCM', address: '456 Nguyễn Huệ, Q1, TP.HCM', phone: '028-8765-4321', email: 'hcm@muji.com' },
      { name: 'MUJI Store Đà Nẵng', description: 'Cửa hàng MUJI tại Đà Nẵng', address: '789 Lê Duẩn, Đà Nẵng', phone: '0236-1111-2222', email: 'danang@muji.com' }
    ];

    for (const shop of shops) {
      await sql.query`
        IF NOT EXISTS (SELECT 1 FROM Shops WHERE ShopName = ${shop.name})
        INSERT INTO Shops (ShopName, Description, Address, Phone, Email, IsActive, CreatedAt)
        VALUES (${shop.name}, ${shop.description}, ${shop.address}, ${shop.phone}, ${shop.email}, 1, GETDATE())
      `;
    }
    console.log('✅ Shops seeded');

    // 3. Get existing Shops
    console.log('🏪 Getting existing Shops...');
    const shopsResult = await sql.query`SELECT ShopID, ShopName FROM Shops WHERE IsActive = 1`;
    const shops = shopsResult.recordset;
    console.log('✅ Shops loaded:', shops.length);

    // 4. Seed Products
    console.log('🛍️ Seeding Products...');
    const products = [
      // Clothing
      {
        name: 'Áo thun cotton cơ bản',
        description: 'Áo thun cotton 100% với thiết kế đơn giản, thoải mái và bền bỉ',
        longDescription: 'Áo thun cotton được làm từ chất liệu cotton 100% cao cấp, với thiết kế tối giản và màu sắc trung tính. Sản phẩm phù hợp cho mọi hoạt động hàng ngày, từ đi làm đến tập thể thao.',
        price: 299000,
        originalPrice: 399000,
        categoryName: 'Clothing',
        shopName: 'MUJI Store Hà Nội',
        stockQuantity: 100,
        imagePath: 'https://via.placeholder.com/300x300/ffffff/000000?text=Áo+Thun',
        isActive: 1,
        isFeatured: 1,
        isInStock: 1
      },
      {
        name: 'Quần jeans slim fit',
        description: 'Quần jeans với thiết kế slim fit hiện đại, chất liệu denim cao cấp',
        longDescription: 'Quần jeans được thiết kế với kiểu dáng slim fit hiện đại, chất liệu denim cao cấp với tỷ lệ cotton 98% và elastane 2% để tạo độ co giãn thoải mái.',
        price: 899000,
        originalPrice: 1199000,
        categoryId: 1,
        shopId: 1,
        stockQuantity: 50,
        imagePath: 'https://via.placeholder.com/300x300/ffffff/000000?text=Quần+Jeans',
        specifications: 'Chất liệu: Denim 98% Cotton + 2% Elastane, Màu: Xanh đậm, Size: 28-36',
        tags: 'quần jeans, slim fit, denim, cao cấp',
        isActive: 1,
        isFeatured: 1,
        isInStock: 1
      },
      {
        name: 'Áo khoác bomber',
        description: 'Áo khoác bomber với thiết kế thể thao, chất liệu nhẹ và chống nước',
        longDescription: 'Áo khoác bomber được thiết kế với phong cách thể thao hiện đại, chất liệu polyester và nylon nhẹ, có khả năng chống nước nhẹ.',
        price: 1299000,
        originalPrice: 1599000,
        categoryId: 1,
        shopId: 1,
        stockQuantity: 30,
        imagePath: 'https://via.placeholder.com/300x300/ffffff/000000?text=Áo+Khoác',
        specifications: 'Chất liệu: Polyester + Nylon, Chống nước, Size: S, M, L, XL',
        tags: 'áo khoác, bomber, thể thao, chống nước',
        isActive: 1,
        isFeatured: 0,
        isInStock: 1
      },

      // Beauty
      {
        name: 'Kem dưỡng ẩm tự nhiên',
        description: 'Kem dưỡng ẩm với thành phần tự nhiên, phù hợp cho mọi loại da',
        longDescription: 'Kem dưỡng ẩm được chiết xuất từ các thành phần tự nhiên như chiết xuất từ hoa cúc, vitamin E và hyaluronic acid. Sản phẩm không gây kích ứng và phù hợp cho mọi loại da.',
        price: 450000,
        originalPrice: 550000,
        categoryId: 2,
        shopId: 1,
        stockQuantity: 80,
        imagePath: 'https://via.placeholder.com/300x300/ffffff/000000?text=Kem+Dưỡng',
        specifications: 'Thành phần: Chiết xuất từ thiên nhiên, Dung tích: 50ml, Loại da: Mọi loại da',
        tags: 'kem dưỡng, tự nhiên, ẩm, skincare',
        isActive: 1,
        isFeatured: 1,
        isInStock: 1
      },
      {
        name: 'Sữa rửa mặt dịu nhẹ',
        description: 'Sữa rửa mặt với công thức dịu nhẹ, làm sạch sâu mà không làm khô da',
        longDescription: 'Sữa rửa mặt được phát triển với công thức dịu nhẹ, có độ pH 5.5 cân bằng với da tự nhiên. Sản phẩm làm sạch sâu lỗ chân lông mà không làm khô da.',
        price: 320000,
        originalPrice: 420000,
        categoryId: 2,
        shopId: 1,
        stockQuantity: 120,
        imagePath: 'https://via.placeholder.com/300x300/ffffff/000000?text=Sữa+Rửa+Mặt',
        specifications: 'Dung tích: 150ml, pH: 5.5, Loại da: Da nhạy cảm',
        tags: 'sữa rửa mặt, dịu nhẹ, làm sạch, nhạy cảm',
        isActive: 1,
        isFeatured: 0,
        isInStock: 1
      },

      // Home
      {
        name: 'Bộ chén đĩa gốm sứ',
        description: 'Bộ chén đĩa gốm sứ với thiết kế tối giản, an toàn cho sức khỏe',
        longDescription: 'Bộ chén đĩa được làm từ gốm sứ cao cấp, thiết kế tối giản với màu trắng tinh khiết. Sản phẩm an toàn cho sức khỏe, dễ vệ sinh và bền bỉ.',
        price: 650000,
        originalPrice: 850000,
        categoryId: 3,
        shopId: 1,
        stockQuantity: 40,
        imagePath: 'https://via.placeholder.com/300x300/ffffff/000000?text=Chén+Đĩa',
        specifications: 'Chất liệu: Gốm sứ cao cấp, Bộ: 6 chén + 6 đĩa, Màu: Trắng',
        tags: 'chén đĩa, gốm sứ, tối giản, gia đình',
        isActive: 1,
        isFeatured: 1,
        isInStock: 1
      },
      {
        name: 'Đèn bàn LED tiết kiệm điện',
        description: 'Đèn bàn LED với ánh sáng dịu nhẹ, tiết kiệm điện và điều chỉnh độ sáng',
        longDescription: 'Đèn bàn LED sử dụng công nghệ LED tiên tiến, tiết kiệm điện năng lên đến 80% so với đèn truyền thống. Có thể điều chỉnh độ sáng và màu ánh sáng.',
        price: 850000,
        originalPrice: 1050000,
        categoryId: 3,
        shopId: 1,
        stockQuantity: 25,
        imagePath: 'https://via.placeholder.com/300x300/ffffff/000000?text=Đèn+Bàn',
        specifications: 'Công suất: 12W LED, Điều chỉnh độ sáng, Màu ánh sáng: Trắng ấm',
        tags: 'đèn bàn, LED, tiết kiệm điện, điều chỉnh',
        isActive: 1,
        isFeatured: 0,
        isInStock: 1
      },

      // Electronics
      {
        name: 'Tai nghe không dây',
        description: 'Tai nghe không dây với âm thanh chất lượng cao, pin lâu',
        longDescription: 'Tai nghe không dây sử dụng công nghệ Bluetooth 5.0, âm thanh chất lượng cao với driver 10mm. Pin có thể sử dụng liên tục 8 giờ, sạc nhanh và chống nước IPX4.',
        price: 1599000,
        originalPrice: 1999000,
        categoryId: 4,
        shopId: 1,
        stockQuantity: 60,
        imagePath: 'https://via.placeholder.com/300x300/ffffff/000000?text=Tai+Nghe',
        specifications: 'Bluetooth 5.0, Pin: 8 giờ, Sạc nhanh, Chống nước IPX4',
        tags: 'tai nghe, không dây, Bluetooth, âm thanh',
        isActive: 1,
        isFeatured: 1,
        isInStock: 1
      },
      {
        name: 'Sạc dự phòng 10000mAh',
        description: 'Sạc dự phòng với dung lượng lớn, sạc nhanh và thiết kế nhỏ gọn',
        longDescription: 'Sạc dự phòng có dung lượng 10000mAh, hỗ trợ sạc nhanh QC 3.0 với 2 cổng USB. Thiết kế nhỏ gọn, dễ mang theo và có LED hiển thị dung lượng pin.',
        price: 750000,
        originalPrice: 950000,
        categoryId: 4,
        shopId: 1,
        stockQuantity: 45,
        imagePath: 'https://via.placeholder.com/300x300/ffffff/000000?text=Sạc+Dự+Phòng',
        specifications: 'Dung lượng: 10000mAh, Sạc nhanh QC 3.0, 2 cổng USB',
        tags: 'sạc dự phòng, pin, sạc nhanh, di động',
        isActive: 1,
        isFeatured: 0,
        isInStock: 1
      },

      // Accessories
      {
        name: 'Túi xách canvas',
        description: 'Túi xách canvas với thiết kế đơn giản, bền bỉ và phù hợp mọi hoạt động',
        longDescription: 'Túi xách được làm từ chất liệu canvas cao cấp, thiết kế đơn giản và tối giản. Có nhiều ngăn tiện lợi, phù hợp cho đi làm, đi học hoặc du lịch.',
        price: 550000,
        originalPrice: 750000,
        categoryId: 5,
        shopId: 1,
        stockQuantity: 70,
        imagePath: 'https://via.placeholder.com/300x300/ffffff/000000?text=Túi+Xách',
        specifications: 'Chất liệu: Canvas cao cấp, Kích thước: 35x40x15cm, Màu: Be, Đen',
        tags: 'túi xách, canvas, đơn giản, bền bỉ',
        isActive: 1,
        isFeatured: 1,
        isInStock: 1
      },
      {
        name: 'Đồng hồ đeo tay minimal',
        description: 'Đồng hồ đeo tay với thiết kế tối giản, mặt số lớn và dây da thật',
        longDescription: 'Đồng hồ đeo tay có thiết kế tối giản với mặt số lớn 40mm, dây da thật cao cấp. Pin có thể sử dụng 2 năm, chống nước 3ATM và có đèn LED.',
        price: 1299000,
        originalPrice: 1599000,
        categoryId: 5,
        shopId: 1,
        stockQuantity: 35,
        imagePath: 'https://via.placeholder.com/300x300/ffffff/000000?text=Đồng+Hồ',
        specifications: 'Mặt số: 40mm, Dây: Da thật, Pin: 2 năm, Chống nước: 3ATM',
        tags: 'đồng hồ, minimal, da thật, tối giản',
        isActive: 1,
        isFeatured: 0,
        isInStock: 1
      },

      // Books
      {
        name: 'Sách thiết kế nội thất',
        description: 'Tuyển tập các mẫu thiết kế nội thất hiện đại và tối giản',
        longDescription: 'Cuốn sách tổng hợp các mẫu thiết kế nội thất hiện đại với phong cách tối giản. Bao gồm các nguyên tắc thiết kế, cách sử dụng màu sắc và không gian.',
        price: 180000,
        originalPrice: 250000,
        categoryId: 6,
        shopId: 1,
        stockQuantity: 50,
        imagePath: 'https://via.placeholder.com/300x300/ffffff/000000?text=Sách+Thiết+Kế',
        specifications: 'Số trang: 200 trang, Ngôn ngữ: Tiếng Việt, Khổ: 20x25cm',
        tags: 'sách, thiết kế, nội thất, tối giản',
        isActive: 1,
        isFeatured: 0,
        isInStock: 1
      },

      // Stationery
      {
        name: 'Bút gel đen 0.5mm',
        description: 'Bút gel với ngòi 0.5mm, mực đen đậm và viết mượt mà',
        longDescription: 'Bút gel sử dụng ngòi 0.5mm với mực đen đậm, viết mượt mà không bị tắc. Thiết kế ergonomic, dễ cầm và có thể thay ngòi.',
        price: 25000,
        originalPrice: 35000,
        categoryId: 7,
        shopId: 1,
        stockQuantity: 200,
        imagePath: 'https://via.placeholder.com/300x300/ffffff/000000?text=Bút+Gel',
        specifications: 'Ngòi: 0.5mm, Màu mực: Đen, Thiết kế: Ergonomic',
        tags: 'bút gel, ngòi 0.5mm, mực đen, ergonomic',
        isActive: 1,
        isFeatured: 0,
        isInStock: 1
      },

      // Food
      {
        name: 'Trà xanh Nhật Bản',
        description: 'Trà xanh cao cấp nhập khẩu từ Nhật Bản, hương vị tự nhiên',
        longDescription: 'Trà xanh được nhập khẩu trực tiếp từ Nhật Bản, được chế biến theo phương pháp truyền thống. Có hương vị tự nhiên, không chứa chất bảo quản.',
        price: 120000,
        originalPrice: 150000,
        categoryId: 8,
        shopId: 1,
        stockQuantity: 100,
        imagePath: 'https://via.placeholder.com/300x300/ffffff/000000?text=Trà+Xanh',
        specifications: 'Xuất xứ: Nhật Bản, Trọng lượng: 100g, Đóng gói: Hộp thiếc',
        tags: 'trà xanh, Nhật Bản, tự nhiên, cao cấp',
        isActive: 1,
        isFeatured: 1,
        isInStock: 1
      }
    ];

    for (const product of products) {
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
    }
    console.log('✅ Products seeded');

    // 4. Seed Reviews
    console.log('⭐ Seeding Reviews...');
    const reviews = [
      { productId: 1, customerId: 3, rating: 5, comment: 'Áo rất đẹp và chất lượng tốt!' },
      { productId: 1, customerId: 3, rating: 4, comment: 'Chất liệu cotton mềm mại, thoải mái khi mặc' },
      { productId: 2, customerId: 3, rating: 5, comment: 'Quần jeans vừa vặn, chất lượng denim tốt' },
      { productId: 4, customerId: 3, rating: 5, comment: 'Kem dưỡng ẩm rất hiệu quả, da mềm mịn' },
      { productId: 8, customerId: 3, rating: 4, comment: 'Tai nghe âm thanh hay, pin lâu' },
      { productId: 10, customerId: 3, rating: 5, comment: 'Túi xách đẹp và bền, thiết kế tối giản' }
    ];

    for (const review of reviews) {
      await sql.query`
        INSERT INTO Reviews (ProductID, CustomerID, Rating, Comment, CreatedAt)
        VALUES (${review.productId}, ${review.customerId}, ${review.rating}, ${review.comment}, GETDATE())
      `;
    }
    console.log('✅ Reviews seeded');

    // 5. Update Product Ratings
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

    // 6. Seed Shopping Cart Items
    console.log('🛒 Seeding Shopping Cart Items...');
    const cartItems = [
      { customerId: 3, productId: 1, quantity: 2 },
      { customerId: 3, productId: 4, quantity: 1 },
      { customerId: 3, productId: 8, quantity: 1 }
    ];

    for (const item of cartItems) {
      await sql.query`
        IF NOT EXISTS (SELECT 1 FROM ShoppingCart WHERE CustomerID = ${item.customerId} AND ProductID = ${item.productId})
        INSERT INTO ShoppingCart (CustomerID, ProductID, Quantity, CreatedAt)
        VALUES (${item.customerId}, ${item.productId}, ${item.quantity}, GETDATE())
      `;
    }
    console.log('✅ Shopping cart items seeded');

    // 7. Seed Orders
    console.log('📦 Seeding Orders...');
    const orders = [
      {
        customerId: 3,
        orderNumber: 'ORD-2025-001',
        status: 'Delivered',
        totalAmount: 748000,
        shippingAddress: '123 Đường ABC, Quận 1, TP.HCM',
        paymentMethod: 'Credit Card',
        paymentStatus: 'Paid',
        shippingStatus: 'Delivered'
      },
      {
        customerId: 3,
        orderNumber: 'ORD-2025-002',
        status: 'Processing',
        totalAmount: 1299000,
        shippingAddress: '456 Đường XYZ, Quận 2, TP.HCM',
        paymentMethod: 'Bank Transfer',
        paymentStatus: 'Pending',
        shippingStatus: 'Preparing'
      }
    ];

    for (const order of orders) {
      const orderResult = await sql.query`
        INSERT INTO Orders (
          CustomerID, OrderNumber, Status, TotalAmount, ShippingAddress,
          PaymentMethod, PaymentStatus, ShippingStatus, CreatedAt
        )
        OUTPUT INSERTED.OrderID
        VALUES (
          ${order.customerId}, ${order.orderNumber}, ${order.status},
          ${order.totalAmount}, ${order.shippingAddress}, ${order.paymentMethod},
          ${order.paymentStatus}, ${order.shippingStatus}, GETDATE()
        )
      `;
      
      const orderId = orderResult.recordset[0].OrderID;
      
      // Add order items
      if (order.orderNumber === 'ORD-2025-001') {
        await sql.query`
          INSERT INTO OrderItems (OrderID, ProductID, Quantity, Price, CreatedAt)
          VALUES 
            (${orderId}, 1, 2, 299000, GETDATE()),
            (${orderId}, 4, 1, 450000, GETDATE())
        `;
      } else if (order.orderNumber === 'ORD-2025-002') {
        await sql.query`
          INSERT INTO OrderItems (OrderID, ProductID, Quantity, Price, CreatedAt)
          VALUES (${orderId}, 8, 1, 1299000, GETDATE())
        `;
      }
    }
    console.log('✅ Orders seeded');

    console.log('🎉 All data seeded successfully!');
    console.log('📊 Summary:');
    console.log(`   - Categories: ${categories.length}`);
    console.log(`   - Shops: ${shops.length}`);
    console.log(`   - Products: ${products.length}`);
    console.log(`   - Reviews: ${reviews.length}`);
    console.log(`   - Cart Items: ${cartItems.length}`);
    console.log(`   - Orders: ${orders.length}`);

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    console.log('✅ Database connection closed');
  }
}

// Run the seed function
seedProductsData().catch(console.error);
