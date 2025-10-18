import DatabaseService from '../src/services/database.service';

async function setupEcommerceDatabase() {
  try {
    console.log('🏗️ Setting up E-commerce Database...');
    
    const db = DatabaseService.getInstance();
    await db.connect();
    console.log('✅ Connected to SQL Server');
    
    // Read and execute the ecommerce schema
    const fs = require('fs');
    const path = require('path');
    
    const schemaPath = path.join(__dirname, '../database/ecommerce_complete.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split by GO statements
    const batches = schema.split('GO').filter((batch: string) => batch.trim());
    
    console.log(`📋 Executing ${batches.length} SQL batches...`);
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i].trim();
      if (batch) {
        try {
          await db.query(batch);
          console.log(`✅ Batch ${i + 1}/${batches.length} executed`);
        } catch (error) {
          console.log(`⚠️ Batch ${i + 1} warning:`, (error as Error).message);
        }
      }
    }
    
    console.log('✅ Database schema created successfully!');
    
    // Seed initial data
    await seedInitialData();
    
  } catch (error) {
    console.error('❌ Error setting up database:', error);
  }
}

async function seedInitialData() {
  try {
    console.log('\n🌱 Seeding initial data...');
    const db = DatabaseService.getInstance();
    
    // 1. Insert Roles
    console.log('📋 Inserting Roles...');
    await db.query(`
      INSERT INTO Roles (RoleName, Description) VALUES
      ('Admin', 'Quản trị viên hệ thống'),
      ('ShopOwner', 'Chủ cửa hàng'),
      ('Customer', 'Khách hàng')
    `);
    console.log('✅ Roles inserted');
    
    // 2. Insert Categories
    console.log('📂 Inserting Categories...');
    await db.query(`
      INSERT INTO Categories (CategoryName, Description, Icon, IsActive) VALUES
      ('Thời trang', 'Quần áo, giày dép, phụ kiện thời trang', '👕', 1),
      ('Làm đẹp', 'Mỹ phẩm, chăm sóc da, chăm sóc tóc', '💄', 1),
      ('Gia đình', 'Đồ dùng gia đình, nội thất, trang trí', '🏠', 1),
      ('Điện tử', 'Thiết bị điện tử, công nghệ, phụ kiện', '📱', 1),
      ('Thể thao', 'Đồ thể thao, dụng cụ tập luyện', '⚽', 1),
      ('Sách', 'Sách, tạp chí, văn phòng phẩm', '📚', 1)
    `);
    console.log('✅ Categories inserted');
    
    // 3. Insert Sample Users
    console.log('👥 Inserting Sample Users...');
    const bcrypt = require('bcrypt');
    
    const users = [
      {
        email: 'admin@muji.com',
        password: await bcrypt.hash('admin123', 10),
        fullName: 'Quản trị viên hệ thống',
        phone: '0123456789',
        address: '123 Đường ABC, Quận 1, TP.HCM',
        role: 'Admin'
      },
      {
        email: 'shop1@muji.com',
        password: await bcrypt.hash('shop123', 10),
        fullName: 'Chủ cửa hàng Thời trang',
        phone: '0987654321',
        address: '456 Đường XYZ, Quận 2, TP.HCM',
        role: 'ShopOwner'
      },
      {
        email: 'shop2@muji.com',
        password: await bcrypt.hash('shop123', 10),
        fullName: 'Chủ cửa hàng Làm đẹp',
        phone: '0912345678',
        address: '789 Đường DEF, Quận 3, TP.HCM',
        role: 'ShopOwner'
      },
      {
        email: 'customer@muji.com',
        password: await bcrypt.hash('customer123', 10),
        fullName: 'Khách hàng mẫu',
        phone: '0901234567',
        address: '321 Đường GHI, Quận 4, TP.HCM',
        role: 'Customer'
      }
    ];
    
    for (const user of users) {
      await db.query(`
        INSERT INTO Users (Email, PasswordHash, FullName, Phone, Address, Status, EmailVerified)
        VALUES (@email, @password, @fullName, @phone, @address, 'Active', 1)
      `, {
        email: user.email,
        password: user.password,
        fullName: user.fullName,
        phone: user.phone,
        address: user.address
      });
      
      // Assign role
      const userId = await db.query('SELECT TOP 1 UserID FROM Users WHERE Email = @email', { email: user.email });
      const roleId = await db.query('SELECT TOP 1 RoleID FROM Roles WHERE RoleName = @roleName', { roleName: user.role });
      
      if (userId.length > 0 && roleId.length > 0) {
        await db.query(`
          INSERT INTO UserRoles (UserID, RoleID)
          VALUES (@userId, @roleId)
        `, {
          userId: userId[0].UserID,
          roleId: roleId[0].RoleID
        });
      }
    }
    console.log('✅ Users inserted');
    
    // 4. Insert Sample Shops
    console.log('🏪 Inserting Sample Shops...');
    const shops = [
      {
        shopName: 'MUJI Fashion Store',
        ownerEmail: 'shop1@muji.com',
        description: 'Cửa hàng thời trang với thiết kế tối giản và chất lượng cao',
        phone: '0987654321',
        address: '456 Đường XYZ, Quận 2, TP.HCM',
        businessLicense: 'BL001234',
        taxCode: 'TC001234'
      },
      {
        shopName: 'MUJI Beauty Store',
        ownerEmail: 'shop2@muji.com',
        description: 'Cửa hàng mỹ phẩm và chăm sóc da với thành phần tự nhiên',
        phone: '0912345678',
        address: '789 Đường DEF, Quận 3, TP.HCM',
        businessLicense: 'BL005678',
        taxCode: 'TC005678'
      }
    ];
    
    for (const shop of shops) {
      const owner = await db.query('SELECT TOP 1 UserID FROM Users WHERE Email = @email', { email: shop.ownerEmail });
      
      if (owner.length > 0) {
        await db.query(`
          INSERT INTO Shops (ShopName, OwnerID, Description, Phone, Address, BusinessLicense, TaxCode, Status)
          VALUES (@shopName, @ownerId, @description, @phone, @address, @businessLicense, @taxCode, 'Active')
        `, {
          shopName: shop.shopName,
          ownerId: owner[0].UserID,
          description: shop.description,
          phone: shop.phone,
          address: shop.address,
          businessLicense: shop.businessLicense,
          taxCode: shop.taxCode
        });
      }
    }
    console.log('✅ Shops inserted');
    
    // 5. Insert Sample Products
    console.log('📦 Inserting Sample Products...');
    const products = [
      // Fashion Store Products
      {
        productName: 'Áo thun cotton cơ bản',
        description: 'Áo thun cotton 100% với thiết kế đơn giản, thoải mái và bền bỉ. Phù hợp cho mọi hoạt động hàng ngày.',
        shopEmail: 'shop1@muji.com',
        categoryName: 'Thời trang',
        sku: 'MUJI-TSHIRT-001',
        price: 299000,
        stockQuantity: 100,
        specifications: 'Chất liệu: Cotton 100%, Màu sắc: Trắng, Đen, Xám, Size: S, M, L, XL',
        tags: 'áo thun, cotton, cơ bản, đơn giản',
        isFeatured: true
      },
      {
        productName: 'Quần jeans slim fit',
        description: 'Quần jeans với thiết kế slim fit hiện đại, chất liệu denim cao cấp, co giãn tốt.',
        shopEmail: 'shop1@muji.com',
        categoryName: 'Thời trang',
        sku: 'MUJI-JEANS-001',
        price: 899000,
        stockQuantity: 50,
        specifications: 'Chất liệu: Denim 98% Cotton + 2% Elastane, Màu: Xanh đậm, Size: 28-36',
        tags: 'quần jeans, slim fit, denim, cao cấp',
        isFeatured: true
      },
      {
        productName: 'Áo khoác bomber',
        description: 'Áo khoác bomber với thiết kế thể thao, chất liệu nhẹ và chống nước.',
        shopEmail: 'shop1@muji.com',
        categoryName: 'Thời trang',
        sku: 'MUJI-BOMBER-001',
        price: 1299000,
        stockQuantity: 30,
        specifications: 'Chất liệu: Polyester + Nylon, Chống nước, Size: S, M, L, XL',
        tags: 'áo khoác, bomber, thể thao, chống nước',
        isFeatured: false
      },
      
      // Beauty Store Products
      {
        productName: 'Kem dưỡng ẩm tự nhiên',
        description: 'Kem dưỡng ẩm với thành phần tự nhiên, phù hợp cho mọi loại da, không gây kích ứng.',
        shopEmail: 'shop2@muji.com',
        categoryName: 'Làm đẹp',
        sku: 'MUJI-MOISTURIZER-001',
        price: 450000,
        stockQuantity: 80,
        specifications: 'Thành phần: Chiết xuất từ thiên nhiên, Dung tích: 50ml, Loại da: Mọi loại da',
        tags: 'kem dưỡng, tự nhiên, ẩm, skincare',
        isFeatured: true
      },
      {
        productName: 'Sữa rửa mặt dịu nhẹ',
        description: 'Sữa rửa mặt với công thức dịu nhẹ, làm sạch sâu mà không làm khô da.',
        shopEmail: 'shop2@muji.com',
        categoryName: 'Làm đẹp',
        sku: 'MUJI-CLEANSER-001',
        price: 320000,
        stockQuantity: 120,
        specifications: 'Dung tích: 150ml, pH: 5.5, Loại da: Da nhạy cảm',
        tags: 'sữa rửa mặt, dịu nhẹ, làm sạch, nhạy cảm',
        isFeatured: false
      }
    ];
    
    for (const product of products) {
      const shop = await db.query('SELECT TOP 1 s.ShopID FROM Shops s INNER JOIN Users u ON s.OwnerID = u.UserID WHERE u.Email = @email', { email: product.shopEmail });
      const category = await db.query('SELECT TOP 1 CategoryID FROM Categories WHERE CategoryName = @categoryName', { categoryName: product.categoryName });
      
      if (shop.length > 0 && category.length > 0) {
        await db.query(`
          INSERT INTO Products (ProductName, Description, ShopID, CategoryID, SKU, Price, StockQuantity, Specifications, Tags, IsFeatured, IsActive)
          VALUES (@productName, @description, @shopId, @categoryId, @sku, @price, @stockQuantity, @specifications, @tags, @isFeatured, 1)
        `, {
          productName: product.productName,
          description: product.description,
          shopId: shop[0].ShopID,
          categoryId: category[0].CategoryID,
          sku: product.sku,
          price: product.price,
          stockQuantity: product.stockQuantity,
          specifications: product.specifications,
          tags: product.tags,
          isFeatured: product.isFeatured
        });
      }
    }
    console.log('✅ Products inserted');
    
    // 6. Insert Sample Reviews
    console.log('⭐ Inserting Sample Reviews...');
    const reviews = [
      {
        productSku: 'MUJI-TSHIRT-001',
        userEmail: 'customer@muji.com',
        rating: 5,
        comment: 'Áo thun rất mềm mại và thoải mái. Chất lượng tốt, giá hợp lý.',
        isVerified: true
      },
      {
        productSku: 'MUJI-TSHIRT-001',
        userEmail: 'customer@muji.com',
        rating: 4,
        comment: 'Thiết kế đơn giản nhưng đẹp. Chất liệu cotton tốt.',
        isVerified: true
      },
      {
        productSku: 'MUJI-MOISTURIZER-001',
        userEmail: 'customer@muji.com',
        rating: 5,
        comment: 'Kem dưỡng ẩm rất tốt, da mình không bị kích ứng.',
        isVerified: true
      }
    ];
    
    for (const review of reviews) {
      const product = await db.query('SELECT TOP 1 ProductID FROM Products WHERE SKU = @sku', { sku: review.productSku });
      const user = await db.query('SELECT TOP 1 UserID FROM Users WHERE Email = @email', { email: review.userEmail });
      
      if (product.length > 0 && user.length > 0) {
        await db.query(`
          INSERT INTO Reviews (ProductID, UserID, Rating, Comment, IsVerified, IsPublished)
          VALUES (@productId, @userId, @rating, @comment, @isVerified, 1)
        `, {
          productId: product[0].ProductID,
          userId: user[0].UserID,
          rating: review.rating,
          comment: review.comment,
          isVerified: review.isVerified
        });
      }
    }
    console.log('✅ Reviews inserted');
    
    // Update product ratings
    console.log('📊 Updating product ratings...');
    await db.query('EXEC SP_UpdateProductRating @ProductID = 1');
    await db.query('EXEC SP_UpdateProductRating @ProductID = 2');
    await db.query('EXEC SP_UpdateProductRating @ProductID = 3');
    await db.query('EXEC SP_UpdateProductRating @ProductID = 4');
    await db.query('EXEC SP_UpdateProductRating @ProductID = 5');
    console.log('✅ Product ratings updated');
    
    // Update shop stats
    console.log('📈 Updating shop stats...');
    await db.query('EXEC SP_UpdateShopStats @ShopID = 1');
    await db.query('EXEC SP_UpdateShopStats @ShopID = 2');
    console.log('✅ Shop stats updated');
    
    // Verify data
    console.log('\n📊 Verifying data...');
    const userCount = await db.query('SELECT COUNT(*) as count FROM Users');
    const shopCount = await db.query('SELECT COUNT(*) as count FROM Shops');
    const productCount = await db.query('SELECT COUNT(*) as count FROM Products');
    const categoryCount = await db.query('SELECT COUNT(*) as count FROM Categories');
    const reviewCount = await db.query('SELECT COUNT(*) as count FROM Reviews');
    
    console.log(`✅ Users: ${userCount[0].count}`);
    console.log(`✅ Shops: ${shopCount[0].count}`);
    console.log(`✅ Products: ${productCount[0].count}`);
    console.log(`✅ Categories: ${categoryCount[0].count}`);
    console.log(`✅ Reviews: ${reviewCount[0].count}`);
    
    console.log('\n🎉 E-commerce database setup completed successfully!');
    console.log('\n📋 Test Accounts:');
    console.log('  👨‍💼 Admin: admin@muji.com / admin123');
    console.log('  🏪 Shop Owner 1: shop1@muji.com / shop123');
    console.log('  🏪 Shop Owner 2: shop2@muji.com / shop123');
    console.log('  👤 Customer: customer@muji.com / customer123');
    
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  }
}

setupEcommerceDatabase();
