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

async function setupDatabase() {
  let pool: sql.ConnectionPool | null = null;
  
  try {
    console.log('🚀 Setting up Live Support Database (3NF)...');
    
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
    
    // Create tables one by one
    console.log('🏗️  Creating tables...');
    
    // Users table
    await pool.request().query(`
      CREATE TABLE Users (
        UserID INT IDENTITY(1,1) PRIMARY KEY,
        Email NVARCHAR(255) UNIQUE NOT NULL,
        PasswordHash NVARCHAR(255) NOT NULL,
        FullName NVARCHAR(255) NOT NULL,
        Phone NVARCHAR(20),
        Address NVARCHAR(500),
        Status NVARCHAR(20) DEFAULT 'Active',
        CreatedAt DATETIME2 DEFAULT GETDATE(),
        UpdatedAt DATETIME2 DEFAULT GETDATE()
      );
    `);
    console.log('✅ Users table created');

    // Roles table
    await pool.request().query(`
      CREATE TABLE Roles (
        RoleID INT IDENTITY(1,1) PRIMARY KEY,
        RoleName NVARCHAR(50) UNIQUE NOT NULL,
        Description NVARCHAR(255),
        IsActive BIT DEFAULT 1,
        CreatedAt DATETIME2 DEFAULT GETDATE()
      );
    `);
    console.log('✅ Roles table created');

    // UserRoles table
    await pool.request().query(`
      CREATE TABLE UserRoles (
        UserRoleID INT IDENTITY(1,1) PRIMARY KEY,
        UserID INT NOT NULL,
        RoleID INT NOT NULL,
        AssignedAt DATETIME2 DEFAULT GETDATE(),
        AssignedBy INT,
        FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
        FOREIGN KEY (RoleID) REFERENCES Roles(RoleID) ON DELETE CASCADE,
        FOREIGN KEY (AssignedBy) REFERENCES Users(UserID),
        UNIQUE(UserID, RoleID)
      );
    `);
    console.log('✅ UserRoles table created');

    // Permissions table
    await pool.request().query(`
      CREATE TABLE Permissions (
        PermissionID INT IDENTITY(1,1) PRIMARY KEY,
        PermissionName NVARCHAR(100) UNIQUE NOT NULL,
        Resource NVARCHAR(50) NOT NULL,
        Action NVARCHAR(50) NOT NULL,
        Description NVARCHAR(255),
        IsActive BIT DEFAULT 1,
        CreatedAt DATETIME2 DEFAULT GETDATE()
      );
    `);
    console.log('✅ Permissions table created');

    // RolePermissions table
    await pool.request().query(`
      CREATE TABLE RolePermissions (
        RolePermissionID INT IDENTITY(1,1) PRIMARY KEY,
        RoleID INT NOT NULL,
        PermissionID INT NOT NULL,
        GrantedAt DATETIME2 DEFAULT GETDATE(),
        GrantedBy INT,
        FOREIGN KEY (RoleID) REFERENCES Roles(RoleID) ON DELETE CASCADE,
        FOREIGN KEY (PermissionID) REFERENCES Permissions(PermissionID) ON DELETE CASCADE,
        FOREIGN KEY (GrantedBy) REFERENCES Users(UserID),
        UNIQUE(RoleID, PermissionID)
      );
    `);
    console.log('✅ RolePermissions table created');

    // Departments table
    await pool.request().query(`
      CREATE TABLE Departments (
        DepartmentID INT IDENTITY(1,1) PRIMARY KEY,
        DepartmentName NVARCHAR(100) UNIQUE NOT NULL,
        Description NVARCHAR(255),
        ManagerID INT,
        IsActive BIT DEFAULT 1,
        CreatedAt DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (ManagerID) REFERENCES Users(UserID)
      );
    `);
    console.log('✅ Departments table created');

    // Categories table
    await pool.request().query(`
      CREATE TABLE Categories (
        CategoryID INT IDENTITY(1,1) PRIMARY KEY,
        CategoryName NVARCHAR(100) UNIQUE NOT NULL,
        ParentCategoryID INT,
        Description NVARCHAR(255),
        IconPath NVARCHAR(255),
        SortOrder INT DEFAULT 0,
        IsActive BIT DEFAULT 1,
        CreatedAt DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (ParentCategoryID) REFERENCES Categories(CategoryID)
      );
    `);
    console.log('✅ Categories table created');

    // Products table
    await pool.request().query(`
      CREATE TABLE Products (
        ProductID INT IDENTITY(1,1) PRIMARY KEY,
        ProductName NVARCHAR(255) NOT NULL,
        Description NVARCHAR(MAX),
        LongDescription NVARCHAR(MAX),
        CategoryID INT NOT NULL,
        Price DECIMAL(10,2) NOT NULL,
        OriginalPrice DECIMAL(10,2),
        ImagePath NVARCHAR(500),
        StockQuantity INT DEFAULT 0,
        IsInStock BIT DEFAULT 1,
        AverageRating DECIMAL(3,2) DEFAULT 0,
        ReviewCount INT DEFAULT 0,
        CreatedAt DATETIME2 DEFAULT GETDATE(),
        UpdatedAt DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (CategoryID) REFERENCES Categories(CategoryID)
      );
    `);
    console.log('✅ Products table created');

    // Tickets table
    await pool.request().query(`
      CREATE TABLE Tickets (
        TicketID INT IDENTITY(1,1) PRIMARY KEY,
        TicketNumber NVARCHAR(20) UNIQUE NOT NULL,
        Subject NVARCHAR(255) NOT NULL,
        Description NVARCHAR(MAX) NOT NULL,
        Status NVARCHAR(20) DEFAULT 'Open',
        Priority NVARCHAR(20) DEFAULT 'Medium',
        CustomerID INT NOT NULL,
        AssignedTo INT,
        DepartmentID INT,
        CreatedAt DATETIME2 DEFAULT GETDATE(),
        UpdatedAt DATETIME2 DEFAULT GETDATE(),
        ClosedAt DATETIME2,
        FOREIGN KEY (CustomerID) REFERENCES Users(UserID),
        FOREIGN KEY (AssignedTo) REFERENCES Users(UserID),
        FOREIGN KEY (DepartmentID) REFERENCES Departments(DepartmentID)
      );
    `);
    console.log('✅ Tickets table created');

    // ChatRooms table
    await pool.request().query(`
      CREATE TABLE ChatRooms (
        RoomID INT IDENTITY(1,1) PRIMARY KEY,
        TicketID INT UNIQUE NOT NULL,
        RoomName NVARCHAR(255),
        IsActive BIT DEFAULT 1,
        CreatedAt DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (TicketID) REFERENCES Tickets(TicketID) ON DELETE CASCADE
      );
    `);
    console.log('✅ ChatRooms table created');

    // Messages table
    await pool.request().query(`
      CREATE TABLE Messages (
        MessageID INT IDENTITY(1,1) PRIMARY KEY,
        RoomID INT NOT NULL,
        SenderID INT NOT NULL,
        MessageType NVARCHAR(20) DEFAULT 'Text',
        Content NVARCHAR(MAX) NOT NULL,
        FilePath NVARCHAR(500),
        FileName NVARCHAR(255),
        FileSize INT,
        IsRead BIT DEFAULT 0,
        CreatedAt DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (RoomID) REFERENCES ChatRooms(RoomID) ON DELETE CASCADE,
        FOREIGN KEY (SenderID) REFERENCES Users(UserID)
      );
    `);
    console.log('✅ Messages table created');

    // Reviews table
    await pool.request().query(`
      CREATE TABLE Reviews (
        ReviewID INT IDENTITY(1,1) PRIMARY KEY,
        ProductID INT NOT NULL,
        CustomerID INT NOT NULL,
        Rating INT NOT NULL CHECK (Rating >= 1 AND Rating <= 5),
        Comment NVARCHAR(MAX),
        IsVerified BIT DEFAULT 0,
        CreatedAt DATETIME2 DEFAULT GETDATE(),
        UpdatedAt DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (ProductID) REFERENCES Products(ProductID) ON DELETE CASCADE,
        FOREIGN KEY (CustomerID) REFERENCES Users(UserID),
        UNIQUE(ProductID, CustomerID)
      );
    `);
    console.log('✅ Reviews table created');

    // AuditLogs table
    await pool.request().query(`
      CREATE TABLE AuditLogs (
        LogID INT IDENTITY(1,1) PRIMARY KEY,
        UserID INT NOT NULL,
        Action NVARCHAR(100) NOT NULL,
        TableName NVARCHAR(50),
        RecordID INT,
        OldValues NVARCHAR(MAX),
        NewValues NVARCHAR(MAX),
        IPAddress NVARCHAR(45),
        UserAgent NVARCHAR(500),
        CreatedAt DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (UserID) REFERENCES Users(UserID)
      );
    `);
    console.log('✅ AuditLogs table created');
    
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
    console.log('📋 Tables: 12 tables created with 3NF normalization');
    
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

setupDatabase();
