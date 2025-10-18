import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPermissions() {
  try {
    console.log('🔍 Kiểm tra phân quyền hệ thống...\n');

    // 1. Lấy tất cả users
    const users = await prisma.user.findMany({
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    });

    console.log('👥 DANH SÁCH NGƯỜI DÙNG:');
    for (const user of users) {
      console.log(`\n📧 ${user.email} (${user.name})`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.status}`);
      
      if (user.userRoles.length > 0) {
        console.log('   📋 RBAC Roles:');
        for (const userRole of user.userRoles) {
          console.log(`     - ${userRole.role.name}: ${userRole.role.description}`);
          console.log('       Permissions:');
          for (const rolePerm of userRole.role.permissions) {
            console.log(`         • ${rolePerm.permission.resource}.${rolePerm.permission.action} - ${rolePerm.permission.name}`);
          }
        }
      }
    }

    // 2. Kiểm tra permissions theo role
    console.log('\n🔐 PHÂN QUYỀN THEO ROLE:');
    
    const roles = await prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });

    for (const role of roles) {
      console.log(`\n🎭 ${role.name}:`);
      console.log(`   Description: ${role.description}`);
      console.log(`   Active: ${role.isActive}`);
      console.log('   Permissions:');
      
      const permissionsByResource: { [key: string]: string[] } = {};
      for (const rolePerm of role.permissions) {
        const resource = rolePerm.permission.resource;
        const action = rolePerm.permission.action;
        if (!permissionsByResource[resource]) {
          permissionsByResource[resource] = [];
        }
        permissionsByResource[resource].push(action);
      }
      
      for (const [resource, actions] of Object.entries(permissionsByResource)) {
        console.log(`     📁 ${resource}: ${actions.join(', ')}`);
      }
    }

    // 3. Thống kê
    console.log('\n📊 THỐNG KÊ:');
    console.log(`   Total Users: ${users.length}`);
    console.log(`   Total Roles: ${roles.length}`);
    
    const totalPermissions = await prisma.permission.count();
    console.log(`   Total Permissions: ${totalPermissions}`);
    
    const totalRolePermissions = await prisma.rolePermission.count();
    console.log(`   Total Role-Permission Mappings: ${totalRolePermissions}`);
    
    const totalUserRoles = await prisma.userRoleMapping.count();
    console.log(`   Total User-Role Mappings: ${totalUserRoles}`);

  } catch (error) {
    console.error('❌ Lỗi khi kiểm tra phân quyền:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPermissions();
