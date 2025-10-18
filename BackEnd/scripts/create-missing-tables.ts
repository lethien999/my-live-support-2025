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

async function createMissingTables() {
  try {
    console.log('🔧 TẠO CÁC TABLE CÒN THIẾU');
    console.log('===========================\n');
    
    await sql.connect(config);
    console.log('✅ Connected to SQL Server\n');

    // Create Shops table
    console.log('🏪 Creating Shops table...');
    await sql.query`
      CREATE TABLE Shops (
        ShopID INT IDENTITY(1,1) PRIMARY KEY,
        ShopName NVARCHAR(255) NOT NULL,
        Description NVARCHAR(500),
        Email NVARCHAR(255),
        Phone NVARCHAR(20),
        Address NVARCHAR(500),
        IsActive BIT DEFAULT 1,
        CreatedAt DATETIME DEFAULT GETDATE(),
        UpdatedAt DATETIME DEFAULT GETDATE()
      )
    `;
    console.log('✅ Shops table created\n');

    // Create Orders table
    console.log('📦 Creating Orders table...');
    await sql.query`
      CREATE TABLE Orders (
        OrderID INT IDENTITY(1,1) PRIMARY KEY,
        OrderNumber NVARCHAR(50) UNIQUE NOT NULL,
        CustomerID INT NOT NULL,
        ShopID INT NOT NULL,
        Status NVARCHAR(50) DEFAULT 'Pending',
        TotalAmount DECIMAL(18,2) NOT NULL,
        ShippingAddress NVARCHAR(500),
        PaymentMethod NVARCHAR(50),
        Notes NVARCHAR(500),
        CreatedAt DATETIME DEFAULT GETDATE(),
        UpdatedAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (CustomerID) REFERENCES Users(UserID),
        FOREIGN KEY (ShopID) REFERENCES Shops(ShopID)
      )
    `;
    console.log('✅ Orders table created\n');

    // Create OrderItems table
    console.log('📋 Creating OrderItems table...');
    await sql.query`
      CREATE TABLE OrderItems (
        OrderItemID INT IDENTITY(1,1) PRIMARY KEY,
        OrderID INT NOT NULL,
        ProductID INT NOT NULL,
        Quantity INT NOT NULL,
        Price DECIMAL(18,2) NOT NULL,
        TotalPrice DECIMAL(18,2) NOT NULL,
        CreatedAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (OrderID) REFERENCES Orders(OrderID),
        FOREIGN KEY (ProductID) REFERENCES Products(ProductID)
      )
    `;
    console.log('✅ OrderItems table created\n');

    // Create ShoppingCart table
    console.log('🛒 Creating ShoppingCart table...');
    await sql.query`
      CREATE TABLE ShoppingCart (
        CartID INT IDENTITY(1,1) PRIMARY KEY,
        CustomerID INT NOT NULL,
        ProductID INT NOT NULL,
        Quantity INT NOT NULL DEFAULT 1,
        CreatedAt DATETIME DEFAULT GETDATE(),
        UpdatedAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (CustomerID) REFERENCES Users(UserID),
        FOREIGN KEY (ProductID) REFERENCES Products(ProductID)
      )
    `;
    console.log('✅ ShoppingCart table created\n');

    console.log('🎉 All missing tables created successfully!');

  } catch (error) {
    console.error('❌ Error creating tables:', error);
  } finally {
    console.log('\n🔌 Table creation completed');
  }
}

createMissingTables().catch(console.error);
