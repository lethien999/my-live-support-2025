import sql from 'mssql';

const config = {
  server: 'localhost',
  port: 1433,
  user: 'thien',
  password: '1909',
  database: 'live_support',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    requestTimeout: 30000,
    connectionTimeout: 30000
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

async function resetAndSetupDatabase() {
  let pool: sql.ConnectionPool | null = null;
  
  try {
    console.log('🔄 Resetting and setting up Live Support Database (3NF)...');
    
    // Connect to SQL Server
    pool = await sql.connect(config);
    console.log('✅ Connected to SQL Server successfully');
    
    // Drop all existing tables
    console.log('🗑️  Dropping existing tables...');
    const dropTables = [
      'IF OBJECT_ID(\'AuditLogs\', \'U\') IS NOT NULL DROP TABLE AuditLogs',
      'IF OBJECT_ID(\'Reviews\', \'U\') IS NOT NULL DROP TABLE Reviews',
      'IF OBJECT_ID(\'ProductImages\', \'U\') IS NOT NULL DROP TABLE ProductImages',
      'IF OBJECT_ID(\'Products\', \'U\') IS NOT NULL DROP TABLE Products',
      'IF OBJECT_ID(\'Categories\', \'U\') IS NOT NULL DROP TABLE Categories',
      'IF OBJECT_ID(\'Messages\', \'U\') IS NOT NULL DROP TABLE Messages',
      'IF OBJECT_ID(\'ChatRooms\', \'U\') IS NOT NULL DROP TABLE ChatRooms',
      'IF OBJECT_ID(\'TicketStatusHistory\', \'U\') IS NOT NULL DROP TABLE TicketStatusHistory',
      'IF OBJECT_ID(\'Tickets\', \'U\') IS NOT NULL DROP TABLE Tickets',
      'IF OBJECT_ID(\'Departments\', \'U\') IS NOT NULL DROP TABLE Departments',
      'IF OBJECT_ID(\'RolePermissions\', \'U\') IS NOT NULL DROP TABLE RolePermissions',
      'IF OBJECT_ID(\'UserRoles\', \'U\') IS NOT NULL DROP TABLE UserRoles',
      'IF OBJECT_ID(\'Permissions\', \'U\') IS NOT NULL DROP TABLE Permissions',
      'IF OBJECT_ID(\'Roles\', \'U\') IS NOT NULL DROP TABLE Roles',
      'IF OBJECT_ID(\'Users\', \'U\') IS NOT NULL DROP TABLE Users'
    ];

    for (const sqlQuery of dropTables) {
      try {
        await pool.request().query(sqlQuery);
      } catch (error) {
        console.warn(`   ⚠️  Error dropping table: ${(error as Error).message}`);
      }
    }
    console.log('✅ All tables dropped');
    
    // Read SQL file
    const fs = require('fs');
    const sqlContent = fs.readFileSync('./database/live_support_3nf.sql', 'utf8');
    
    // Split by GO statements and execute each batch
    const batches = sqlContent.split('GO').filter((batch: string) => batch.trim());
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i].trim();
      if (batch) {
        try {
          await pool.request().query(batch);
          console.log(`✅ Executed batch ${i + 1}/${batches.length}`);
        } catch (error) {
          console.log(`⚠️  Batch ${i + 1} warning:`, (error as Error).message);
        }
      }
    }
    
    // Insert initial data
    console.log('🌱 Inserting initial data...');
    
    // Insert roles
    await pool.request().query(`
      INSERT INTO Roles (RoleName, Description) VALUES 
        ('Admin', N'Quản trị viên hệ thống'),
        ('Agent', N'Nhân viên hỗ trợ khách hàng'),
        ('Customer', N'Khách hàng sử dụng dịch vụ');
    `);
    console.log('✅ Roles inserted');
    
    // Insert permissions
    await pool.request().query(`
      INSERT INTO Permissions (PermissionName, Resource, Action, Description) VALUES 
        ('users.read', 'users', 'read', N'Xem danh sách người dùng'),
        ('users.write', 'users', 'write', N'Tạo/sửa người dùng'),
        ('users.delete', 'users', 'delete', N'Xóa người dùng'),
        ('tickets.read', 'tickets', 'read', N'Xem danh sách ticket'),
        ('tickets.write', 'tickets', 'write', N'Tạo/sửa ticket'),
        ('tickets.delete', 'tickets', 'delete', N'Xóa ticket'),
        ('products.read', 'products', 'read', N'Xem danh sách sản phẩm'),
        ('products.write', 'products', 'write', N'Tạo/sửa sản phẩm'),
        ('chat.read', 'chat', 'read', N'Xem tin nhắn'),
        ('chat.write', 'chat', 'write', N'Gửi tin nhắn');
    `);
    console.log('✅ Permissions inserted');
    
    // Insert role-permission mappings
    await pool.request().query(`
      INSERT INTO RolePermissions (RoleID, PermissionID) 
      SELECT r.RoleID, p.PermissionID
      FROM Roles r, Permissions p
      WHERE r.RoleName = 'Admin'
      
      UNION ALL
      
      SELECT r.RoleID, p.PermissionID
      FROM Roles r, Permissions p
      WHERE r.RoleName = 'Agent' 
      AND p.PermissionName IN ('tickets.read', 'tickets.write', 'products.read', 'chat.read', 'chat.write')
      
      UNION ALL
      
      SELECT r.RoleID, p.PermissionID
      FROM Roles r, Permissions p
      WHERE r.RoleName = 'Customer' 
      AND p.PermissionName IN ('products.read', 'tickets.read', 'tickets.write', 'chat.read', 'chat.write');
    `);
    console.log('✅ Role-Permission mappings inserted');
    
    // Insert departments
    await pool.request().query(`
      INSERT INTO Departments (DepartmentName, Description) VALUES 
        ('Technical Support', N'Hỗ trợ kỹ thuật'),
        ('Sales', N'Tư vấn bán hàng'),
        ('General Support', N'Hỗ trợ chung');
    `);
    console.log('✅ Departments inserted');
    
    // Insert categories
    await pool.request().query(`
      INSERT INTO Categories (CategoryName, Description) VALUES 
        ('Clothing', N'Quần áo nam nữ'),
        ('Beauty', N'Mỹ phẩm và chăm sóc da'),
        ('Household', N'Đồ gia dụng và nội thất'),
        ('Food', N'Thực phẩm và đồ uống');
    `);
    console.log('✅ Categories inserted');
    
    // Insert sample products
    await pool.request().query(`
      INSERT INTO Products (ProductName, Description, CategoryID, Price, OriginalPrice, StockQuantity) VALUES 
        ('Basic T-Shirt', N'Áo thun cotton 100% chất lượng cao', 1, 299000, 399000, 50),
        ('Skin Care Cream', N'Kem dưỡng da tự nhiên, phù hợp mọi loại da', 2, 450000, 550000, 30),
        ('Wooden Chair', N'Ghế gỗ tự nhiên, thiết kế tối giản', 3, 2500000, 3000000, 15),
        ('Green Tea', N'Trà xanh nguyên chất, hương vị tự nhiên', 4, 120000, 150000, 100);
    `);
    console.log('✅ Sample products inserted');
    
    console.log('✅ Database setup completed successfully!');
    console.log('📊 Database: live_support');
    console.log('🔗 Connection: sqlserver://thien:1909@localhost:1433;database=live_support');
    console.log('📋 Tables: 15 tables created with 3NF normalization');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
      console.log('✅ Connection closed');
    }
  }
}

resetAndSetupDatabase();
