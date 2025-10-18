import sql from 'mssql';
import bcrypt from 'bcryptjs';

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

async function setupPermissionsAndUsers() {
  let pool: sql.ConnectionPool | null = null;
  
  try {
    console.log('🔐 Setting up permissions and users...');
    
    // Connect to SQL Server
    pool = await sql.connect(config);
    console.log('✅ Connected to SQL Server successfully');
    
    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await pool.request().query('DELETE FROM RolePermissions');
    await pool.request().query('DELETE FROM UserRoles');
    await pool.request().query('DELETE FROM Permissions');
    await pool.request().query('DELETE FROM Roles');
    await pool.request().query('DELETE FROM Users');
    console.log('✅ Existing data cleared');
    
    // Insert comprehensive permissions
    console.log('🔑 Inserting comprehensive permissions...');
    await pool.request().query(`
      INSERT INTO Permissions (PermissionName, Resource, Action, Description) VALUES 
        -- User Management
        ('users.read', 'users', 'read', N'Xem danh sách người dùng'),
        ('users.write', 'users', 'write', N'Tạo/sửa người dùng'),
        ('users.delete', 'users', 'delete', N'Xóa người dùng'),
        ('users.manage', 'users', 'manage', N'Quản lý người dùng'),
        
        -- Ticket Management
        ('tickets.read', 'tickets', 'read', N'Xem danh sách ticket'),
        ('tickets.write', 'tickets', 'write', N'Tạo/sửa ticket'),
        ('tickets.delete', 'tickets', 'delete', N'Xóa ticket'),
        ('tickets.assign', 'tickets', 'assign', N'Phân công ticket'),
        ('tickets.close', 'tickets', 'close', N'Đóng ticket'),
        ('tickets.manage', 'tickets', 'manage', N'Quản lý ticket'),
        
        -- Product Management
        ('products.read', 'products', 'read', N'Xem danh sách sản phẩm'),
        ('products.write', 'products', 'write', N'Tạo/sửa sản phẩm'),
        ('products.delete', 'products', 'delete', N'Xóa sản phẩm'),
        ('products.manage', 'products', 'manage', N'Quản lý sản phẩm'),
        
        -- Category Management
        ('categories.read', 'categories', 'read', N'Xem danh sách danh mục'),
        ('categories.write', 'categories', 'write', N'Tạo/sửa danh mục'),
        ('categories.delete', 'categories', 'delete', N'Xóa danh mục'),
        ('categories.manage', 'categories', 'manage', N'Quản lý danh mục'),
        
        -- Chat Management
        ('chat.read', 'chat', 'read', N'Xem tin nhắn'),
        ('chat.write', 'chat', 'write', N'Gửi tin nhắn'),
        ('chat.manage', 'chat', 'manage', N'Quản lý chat'),
        
        -- Review Management
        ('reviews.read', 'reviews', 'read', N'Xem đánh giá'),
        ('reviews.write', 'reviews', 'write', N'Tạo/sửa đánh giá'),
        ('reviews.delete', 'reviews', 'delete', N'Xóa đánh giá'),
        ('reviews.manage', 'reviews', 'manage', N'Quản lý đánh giá'),
        
        -- Department Management
        ('departments.read', 'departments', 'read', N'Xem danh sách phòng ban'),
        ('departments.write', 'departments', 'write', N'Tạo/sửa phòng ban'),
        ('departments.delete', 'departments', 'delete', N'Xóa phòng ban'),
        ('departments.manage', 'departments', 'manage', N'Quản lý phòng ban'),
        
        -- System Management
        ('system.read', 'system', 'read', N'Xem thông tin hệ thống'),
        ('system.write', 'system', 'write', N'Cấu hình hệ thống'),
        ('system.manage', 'system', 'manage', N'Quản lý hệ thống'),
        
        -- Analytics
        ('analytics.read', 'analytics', 'read', N'Xem báo cáo thống kê'),
        ('analytics.export', 'analytics', 'export', N'Xuất báo cáo'),
        ('analytics.manage', 'analytics', 'manage', N'Quản lý báo cáo');
    `);
    console.log('✅ Permissions inserted');
    
    // Insert roles
    console.log('👥 Inserting roles...');
    await pool.request().query(`
      INSERT INTO Roles (RoleName, Description) VALUES 
        ('Admin', N'Quản trị viên hệ thống - Quyền cao nhất'),
        ('Agent', N'Nhân viên hỗ trợ - Phụ trách bán hàng và phản hồi khách hàng'),
        ('Customer', N'Khách hàng - Sử dụng dịch vụ và mua sản phẩm');
    `);
    console.log('✅ Roles inserted');
    
    // Assign permissions to roles
    console.log('🔗 Assigning permissions to roles...');
    
    // Admin gets ALL permissions
    await pool.request().query(`
      INSERT INTO RolePermissions (RoleID, PermissionID) 
      SELECT r.RoleID, p.PermissionID
      FROM Roles r, Permissions p
      WHERE r.RoleName = 'Admin';
    `);
    console.log('✅ Admin permissions assigned');
    
    // Agent permissions (sales and customer support)
    await pool.request().query(`
      INSERT INTO RolePermissions (RoleID, PermissionID) 
      SELECT r.RoleID, p.PermissionID
      FROM Roles r, Permissions p
      WHERE r.RoleName = 'Agent' 
      AND p.PermissionName IN (
        'tickets.read', 'tickets.write', 'tickets.assign', 'tickets.close',
        'products.read', 'products.write',
        'categories.read', 'categories.write',
        'chat.read', 'chat.write', 'chat.manage',
        'reviews.read', 'reviews.write',
        'departments.read',
        'analytics.read'
      );
    `);
    console.log('✅ Agent permissions assigned');
    
    // Customer permissions (basic user rights)
    await pool.request().query(`
      INSERT INTO RolePermissions (RoleID, PermissionID) 
      SELECT r.RoleID, p.PermissionID
      FROM Roles r, Permissions p
      WHERE r.RoleName = 'Customer' 
      AND p.PermissionName IN (
        'tickets.read', 'tickets.write',
        'products.read',
        'categories.read',
        'chat.read', 'chat.write',
        'reviews.read', 'reviews.write'
      );
    `);
    console.log('✅ Customer permissions assigned');
    
    // Create sample users
    console.log('👤 Creating sample users...');
    
    // Admin user
    const adminPasswordHash = await bcrypt.hash('admin123', 12);
    await pool.request()
      .input('adminPasswordHash', adminPasswordHash)
      .query(`
        INSERT INTO Users (Email, PasswordHash, FullName, Status) VALUES 
          ('admin@muji.com', @adminPasswordHash, N'Quản trị viên hệ thống', 'Active');
      `);
    
    // Get admin user ID and assign role
    const adminResult = await pool.request().query(`
      SELECT UserID FROM Users WHERE Email = 'admin@muji.com'
    `);
    const adminUserId = adminResult.recordset[0].UserID;
    
    await pool.request()
      .input('adminUserId', adminUserId)
      .query(`
        INSERT INTO UserRoles (UserID, RoleID) 
        SELECT @adminUserId, RoleID FROM Roles WHERE RoleName = 'Admin'
      `);
    console.log('✅ Admin user created: admin@muji.com / admin123');
    
    // Agent user
    const agentPasswordHash = await bcrypt.hash('agent123', 12);
    await pool.request()
      .input('agentPasswordHash', agentPasswordHash)
      .query(`
        INSERT INTO Users (Email, PasswordHash, FullName, Status) VALUES 
          ('agent@muji.com', @agentPasswordHash, N'Nhân viên hỗ trợ', 'Active');
      `);
    
    const agentResult = await pool.request().query(`
      SELECT UserID FROM Users WHERE Email = 'agent@muji.com'
    `);
    const agentUserId = agentResult.recordset[0].UserID;
    
    await pool.request()
      .input('agentUserId', agentUserId)
      .query(`
        INSERT INTO UserRoles (UserID, RoleID) 
        SELECT @agentUserId, RoleID FROM Roles WHERE RoleName = 'Agent'
      `);
    console.log('✅ Agent user created: agent@muji.com / agent123');
    
    // Customer user
    const customerPasswordHash = await bcrypt.hash('customer123', 12);
    await pool.request()
      .input('customerPasswordHash', customerPasswordHash)
      .query(`
        INSERT INTO Users (Email, PasswordHash, FullName, Status) VALUES 
          ('customer@muji.com', @customerPasswordHash, N'Khách hàng mẫu', 'Active');
      `);
    
    const customerResult = await pool.request().query(`
      SELECT UserID FROM Users WHERE Email = 'customer@muji.com'
    `);
    const customerUserId = customerResult.recordset[0].UserID;
    
    await pool.request()
      .input('customerUserId', customerUserId)
      .query(`
        INSERT INTO UserRoles (UserID, RoleID) 
        SELECT @customerUserId, RoleID FROM Roles WHERE RoleName = 'Customer'
      `);
    console.log('✅ Customer user created: customer@muji.com / customer123');
    
    // Display summary
    console.log('\n🎉 Setup completed successfully!');
    console.log('📊 Summary:');
    console.log('   👑 Admin: admin@muji.com / admin123 (Full system access)');
    console.log('   👨‍💼 Agent: agent@muji.com / agent123 (Sales & Support)');
    console.log('   👤 Customer: customer@muji.com / customer123 (Basic user)');
    console.log('\n🔑 Permission Summary:');
    console.log('   Admin: ALL permissions (35 permissions)');
    console.log('   Agent: Sales & Support permissions (15 permissions)');
    console.log('   Customer: Basic user permissions (7 permissions)');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
      console.log('✅ Connection closed');
    }
  }
}

setupPermissionsAndUsers();
