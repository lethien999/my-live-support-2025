import DatabaseService from '../src/services/database.service';

async function seedProductData() {
  try {
    console.log('🌱 Seeding Product Data...');
    
    const db = DatabaseService.getInstance();
    await db.connect();
    
    // Clear existing data
    console.log('\n🧹 Clearing existing data...');
    await db.query('DELETE FROM Reviews');
    await db.query('DELETE FROM Products');
    await db.query('DELETE FROM Categories');
    console.log('✅ Existing data cleared');
    
    // Insert Categories
    console.log('\n📂 Inserting Categories...');
    const categories = [
      {
        CategoryName: 'Clothing',
        Description: 'Thời trang nam nữ với thiết kế đơn giản và chất lượng cao',
        ParentCategoryID: null,
        IsActive: true
      },
      {
        CategoryName: 'Beauty',
        Description: 'Mỹ phẩm và chăm sóc da với thành phần tự nhiên',
        ParentCategoryID: null,
        IsActive: true
      },
      {
        CategoryName: 'Home',
        Description: 'Đồ dùng gia đình và nội thất với thiết kế tối giản',
        ParentCategoryID: null,
        IsActive: true
      },
      {
        CategoryName: 'Electronics',
        Description: 'Thiết bị điện tử và công nghệ tiện ích',
        ParentCategoryID: null,
        IsActive: true
      },
      {
        CategoryName: 'Accessories',
        Description: 'Phụ kiện thời trang và đồ dùng cá nhân',
        ParentCategoryID: null,
        IsActive: true
      }
    ];
    
    for (const category of categories) {
      await db.query(`
        INSERT INTO Categories (CategoryName, Description, ParentCategoryID, IsActive, CreatedAt, UpdatedAt)
        VALUES (@categoryName, @description, @parentCategoryId, @isActive, @createdAt, @updatedAt)
      `, {
        categoryName: category.CategoryName,
        description: category.Description,
        parentCategoryId: category.ParentCategoryID,
        isActive: category.IsActive,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    console.log('✅ Categories inserted');
    
    // Get category IDs
    const categoryData = await db.query('SELECT CategoryID, CategoryName FROM Categories');
    const categoryMap = categoryData.reduce((acc: any, cat: any) => {
      acc[cat.CategoryName] = cat.CategoryID;
      return acc;
    }, {});
    
    // Insert Products
    console.log('\n📦 Inserting Products...');
    const products = [
      // Clothing
      {
        ProductName: 'Áo thun cotton cơ bản',
        Description: 'Áo thun cotton 100% với thiết kế đơn giản, thoải mái và bền bỉ. Phù hợp cho mọi hoạt động hàng ngày.',
        Price: 299000,
        CategoryID: categoryMap['Clothing'],
        SKU: 'MUJI-TSHIRT-001',
        StockQuantity: 100,
        IsActive: true,
        IsFeatured: true,
        Specifications: 'Chất liệu: Cotton 100%, Màu sắc: Trắng, Đen, Xám, Size: S, M, L, XL',
        Tags: 'áo thun, cotton, cơ bản, đơn giản'
      },
      {
        ProductName: 'Quần jeans slim fit',
        Description: 'Quần jeans với thiết kế slim fit hiện đại, chất liệu denim cao cấp, co giãn tốt.',
        Price: 899000,
        CategoryID: categoryMap['Clothing'],
        SKU: 'MUJI-JEANS-001',
        StockQuantity: 50,
        IsActive: true,
        IsFeatured: true,
        Specifications: 'Chất liệu: Denim 98% Cotton + 2% Elastane, Màu: Xanh đậm, Size: 28-36',
        Tags: 'quần jeans, slim fit, denim, cao cấp'
      },
      {
        ProductName: 'Áo khoác bomber',
        Description: 'Áo khoác bomber với thiết kế thể thao, chất liệu nhẹ và chống nước.',
        Price: 1299000,
        CategoryID: categoryMap['Clothing'],
        SKU: 'MUJI-BOMBER-001',
        StockQuantity: 30,
        IsActive: true,
        IsFeatured: false,
        Specifications: 'Chất liệu: Polyester + Nylon, Chống nước, Size: S, M, L, XL',
        Tags: 'áo khoác, bomber, thể thao, chống nước'
      },
      
      // Beauty
      {
        ProductName: 'Kem dưỡng ẩm tự nhiên',
        Description: 'Kem dưỡng ẩm với thành phần tự nhiên, phù hợp cho mọi loại da, không gây kích ứng.',
        Price: 450000,
        CategoryID: categoryMap['Beauty'],
        SKU: 'MUJI-MOISTURIZER-001',
        StockQuantity: 80,
        IsActive: true,
        IsFeatured: true,
        Specifications: 'Thành phần: Chiết xuất từ thiên nhiên, Dung tích: 50ml, Loại da: Mọi loại da',
        Tags: 'kem dưỡng, tự nhiên, ẩm, skincare'
      },
      {
        ProductName: 'Sữa rửa mặt dịu nhẹ',
        Description: 'Sữa rửa mặt với công thức dịu nhẹ, làm sạch sâu mà không làm khô da.',
        Price: 320000,
        CategoryID: categoryMap['Beauty'],
        SKU: 'MUJI-CLEANSER-001',
        StockQuantity: 120,
        IsActive: true,
        IsFeatured: false,
        Specifications: 'Dung tích: 150ml, pH: 5.5, Loại da: Da nhạy cảm',
        Tags: 'sữa rửa mặt, dịu nhẹ, làm sạch, nhạy cảm'
      },
      
      // Home
      {
        ProductName: 'Bộ chén đĩa gốm sứ',
        Description: 'Bộ chén đĩa gốm sứ với thiết kế tối giản, an toàn cho sức khỏe, dễ vệ sinh.',
        Price: 650000,
        CategoryID: categoryMap['Home'],
        SKU: 'MUJI-CERAMIC-001',
        StockQuantity: 40,
        IsActive: true,
        IsFeatured: true,
        Specifications: 'Chất liệu: Gốm sứ cao cấp, Bộ: 6 chén + 6 đĩa, Màu: Trắng',
        Tags: 'chén đĩa, gốm sứ, tối giản, gia đình'
      },
      {
        ProductName: 'Đèn bàn LED tiết kiệm điện',
        Description: 'Đèn bàn LED với ánh sáng dịu nhẹ, tiết kiệm điện, điều chỉnh độ sáng.',
        Price: 850000,
        CategoryID: categoryMap['Home'],
        SKU: 'MUJI-LED-LAMP-001',
        StockQuantity: 25,
        IsActive: true,
        IsFeatured: false,
        Specifications: 'Công suất: 12W LED, Điều chỉnh độ sáng, Màu ánh sáng: Trắng ấm',
        Tags: 'đèn bàn, LED, tiết kiệm điện, điều chỉnh'
      },
      
      // Electronics
      {
        ProductName: 'Tai nghe không dây',
        Description: 'Tai nghe không dây với âm thanh chất lượng cao, pin lâu, kết nối Bluetooth 5.0.',
        Price: 1599000,
        CategoryID: categoryMap['Electronics'],
        SKU: 'MUJI-EARBUDS-001',
        StockQuantity: 60,
        IsActive: true,
        IsFeatured: true,
        Specifications: 'Bluetooth 5.0, Pin: 8 giờ, Sạc nhanh, Chống nước IPX4',
        Tags: 'tai nghe, không dây, Bluetooth, âm thanh'
      },
      {
        ProductName: 'Sạc dự phòng 10000mAh',
        Description: 'Sạc dự phòng với dung lượng lớn, sạc nhanh, thiết kế nhỏ gọn.',
        Price: 750000,
        CategoryID: categoryMap['Electronics'],
        SKU: 'MUJI-POWERBANK-001',
        StockQuantity: 45,
        IsActive: true,
        IsFeatured: false,
        Specifications: 'Dung lượng: 10000mAh, Sạc nhanh QC 3.0, 2 cổng USB',
        Tags: 'sạc dự phòng, pin, sạc nhanh, di động'
      },
      
      // Accessories
      {
        ProductName: 'Túi xách canvas',
        Description: 'Túi xách canvas với thiết kế đơn giản, bền bỉ, phù hợp cho mọi hoạt động.',
        Price: 550000,
        CategoryID: categoryMap['Accessories'],
        SKU: 'MUJI-CANVAS-BAG-001',
        StockQuantity: 70,
        IsActive: true,
        IsFeatured: true,
        Specifications: 'Chất liệu: Canvas cao cấp, Kích thước: 35x40x15cm, Màu: Be, Đen',
        Tags: 'túi xách, canvas, đơn giản, bền bỉ'
      },
      {
        ProductName: 'Đồng hồ đeo tay minimal',
        Description: 'Đồng hồ đeo tay với thiết kế tối giản, mặt số lớn, dây da thật.',
        Price: 1299000,
        CategoryID: categoryMap['Accessories'],
        SKU: 'MUJI-WATCH-001',
        StockQuantity: 35,
        IsActive: true,
        IsFeatured: false,
        Specifications: 'Mặt số: 40mm, Dây: Da thật, Pin: 2 năm, Chống nước: 3ATM',
        Tags: 'đồng hồ, minimal, da thật, tối giản'
      }
    ];
    
    for (const product of products) {
      await db.query(`
        INSERT INTO Products (
          ProductName, Description, Price, CategoryID, SKU, StockQuantity, 
          IsActive, IsFeatured, Specifications, Tags, CreatedAt, UpdatedAt
        ) VALUES (
          @productName, @description, @price, @categoryId, @sku, @stockQuantity,
          @isActive, @isFeatured, @specifications, @tags, @createdAt, @updatedAt
        )
      `, {
        productName: product.ProductName,
        description: product.Description,
        price: product.Price,
        categoryId: product.CategoryID,
        sku: product.SKU,
        stockQuantity: product.StockQuantity,
        isActive: product.IsActive,
        isFeatured: product.IsFeatured,
        specifications: product.Specifications,
        tags: product.Tags,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    console.log('✅ Products inserted');
    
    // Insert Sample Reviews
    console.log('\n⭐ Inserting Sample Reviews...');
    const reviews = [
      {
        ProductID: 1,
        CustomerID: 3,
        Rating: 5,
        Comment: 'Áo thun rất mềm mại và thoải mái. Chất lượng tốt, giá hợp lý.',
        IsVerified: true
      },
      {
        ProductID: 1,
        CustomerID: 3,
        Rating: 4,
        Comment: 'Thiết kế đơn giản nhưng đẹp. Chất liệu cotton tốt.',
        IsVerified: true
      },
      {
        ProductID: 4,
        CustomerID: 3,
        Rating: 5,
        Comment: 'Kem dưỡng ẩm rất tốt, da mình không bị kích ứng.',
        IsVerified: true
      },
      {
        ProductID: 7,
        CustomerID: 3,
        Rating: 4,
        Comment: 'Bộ chén đĩa đẹp và chất lượng tốt. Thiết kế tối giản.',
        IsVerified: true
      }
    ];
    
    for (const review of reviews) {
      await db.query(`
        INSERT INTO Reviews (ProductID, CustomerID, Rating, Comment, IsVerified, CreatedAt)
        VALUES (@productId, @customerId, @rating, @comment, @isVerified, @createdAt)
      `, {
        productId: review.ProductID,
        customerId: review.CustomerID,
        rating: review.Rating,
        comment: review.Comment,
        isVerified: review.IsVerified,
        createdAt: new Date()
      });
    }
    console.log('✅ Reviews inserted');
    
    // Verify data
    console.log('\n📊 Verifying data...');
    const categoryCount = await db.query('SELECT COUNT(*) as count FROM Categories');
    const productCount = await db.query('SELECT COUNT(*) as count FROM Products');
    const reviewCount = await db.query('SELECT COUNT(*) as count FROM Reviews');
    
    console.log(`✅ Categories: ${categoryCount[0].count}`);
    console.log(`✅ Products: ${productCount[0].count}`);
    console.log(`✅ Reviews: ${reviewCount[0].count}`);
    
    console.log('\n🎉 Product data seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding product data:', error);
  }
}

seedProductData();
