require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const ROLES = [
  {
    role_name: 'ADMIN',
    description: 'Quản trị viên hệ thống - toàn quyền truy cập',
  },
  {
    role_name: 'MANAGER',
    description: 'Quản lý cửa hàng - quản lý nhân viên, sản phẩm, khuyến mãi',
  },
  {
    role_name: 'EMPLOYEE',
    description: 'Nhân viên - tạo đơn hàng, xử lý thanh toán, phục vụ khách',
  },
  {
    role_name: 'CUSTOMER',
    description: 'Khách hàng - đặt hàng và thanh toán',
  },
];

async function main() {
  console.log('🌱 Seeding roles into auth_db...');

  for (const role of ROLES) {
    const upserted = await prisma.role.upsert({
      where: { role_name: role.role_name },
      update: { description: role.description },
      create: {
        role_name: role.role_name,
        description: role.description,
      },
    });
    console.log(`  ✅ Role "${upserted.role_name}" - ID: ${upserted.role_id}`);
  }

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
