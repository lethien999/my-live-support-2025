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

async function fixDepartmentsTable() {
  try {
    console.log('🏢 SỬA DEPARTMENTS TABLE');
    console.log('========================\n');
    
    await sql.connect(config);
    console.log('✅ Connected to SQL Server\n');

    // Check Departments table structure first
    console.log('🔍 Checking Departments table structure...');
    const columnsResult = await sql.query`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Departments'
      ORDER BY ORDINAL_POSITION
    `;
    
    console.log('📋 Current Departments structure:');
    columnsResult.recordset.forEach(col => {
      console.log(`   - ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
    });
    console.log('');

    // Add Priority column
    console.log('➕ Adding Priority column...');
    try {
      await sql.query`ALTER TABLE Departments ADD Priority NVARCHAR(50) DEFAULT 'Medium'`;
      console.log('✅ Priority column added');
    } catch (error) {
      console.log('⚠️ Priority might already exist');
    }

    // Add Description column
    console.log('➕ Adding Description column...');
    try {
      await sql.query`ALTER TABLE Departments ADD Description NVARCHAR(500) NULL`;
      console.log('✅ Description column added');
    } catch (error) {
      console.log('⚠️ Description might already exist');
    }

    // Add IsActive column
    console.log('➕ Adding IsActive column...');
    try {
      await sql.query`ALTER TABLE Departments ADD IsActive BIT DEFAULT 1`;
      console.log('✅ IsActive column added');
    } catch (error) {
      console.log('⚠️ IsActive might already exist');
    }
    console.log('');

    // Update existing departments with Priority
    console.log('🔄 Updating existing departments with Priority...');
    const departments = [
      { name: 'Payment', priority: 'Urgent', description: 'Hỗ trợ các vấn đề liên quan đến thanh toán' },
      { name: 'Order & Shipping', priority: 'High', description: 'Hỗ trợ các vấn đề về đơn hàng và vận chuyển' },
      { name: 'Product & Return', priority: 'Medium', description: 'Hỗ trợ các vấn đề về sản phẩm và đổi trả' },
      { name: 'Technical Support', priority: 'Low', description: 'Hỗ trợ kỹ thuật' },
      { name: 'General Inquiry', priority: 'Medium', description: 'Các câu hỏi chung' }
    ];

    for (const dept of departments) {
      try {
        await sql.query`
          UPDATE Departments 
          SET Priority = ${dept.priority}, 
              Description = ${dept.description},
              IsActive = 1
          WHERE DepartmentName = ${dept.name}
        `;
        console.log(`✅ Department updated: ${dept.name} - Priority: ${dept.priority}`);
      } catch (error) {
        console.log(`⚠️ Department ${dept.name} update failed`);
      }
    }
    console.log('');

    // Verify departments
    console.log('🔍 Verifying departments...');
    const verifyResult = await sql.query`
      SELECT DepartmentID, DepartmentName, Priority, Description, IsActive
      FROM Departments
      ORDER BY DepartmentID
    `;
    
    console.log(`📊 Total departments: ${verifyResult.recordset.length}`);
    verifyResult.recordset.forEach(dept => {
      console.log(`   - ${dept.DepartmentName} (ID: ${dept.DepartmentID}) - Priority: ${dept.Priority} - Active: ${dept.IsActive}`);
    });
    console.log('');

    console.log('🎉 Departments table fixed successfully!');

  } catch (error) {
    console.error('❌ Error fixing Departments table:', error);
  } finally {
    console.log('\n🔌 Departments table fix completed');
  }
}

fixDepartmentsTable().catch(console.error);
