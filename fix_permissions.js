const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const roleName = 'thukho';
  const permissionCode = 'sales_orders.read';
  
  const roles = await prisma.role.findMany({ where: { name: roleName } });
  if (!roles.length) {
    console.log(`Role ${roleName} not found.`);
    return;
  }
  
  let permission = await prisma.permission.findUnique({ where: { code: permissionCode } });
  if (!permission) {
    permission = await prisma.permission.create({
      data: {
        code: permissionCode,
        name: 'Xem đơn hàng',
        description: 'Cho phép xem chi tiết đơn hàng',
        module: 'Sales',
      }
    });
    console.log(`Created permission ${permissionCode}`);
  }

  for (const role of roles) {
    const rp = await prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId: role.id,
          permissionId: permission.id
        }
      }
    });
    
    if (!rp) {
      await prisma.rolePermission.create({
        data: {
          roleId: role.id,
          permissionId: permission.id
        }
      });
      console.log(`Added permission ${permissionCode} to role ${roleName} for company ${role.companyId}`);
    } else {
      console.log(`Role ${roleName} already has permission ${permissionCode}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
