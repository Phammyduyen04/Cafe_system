require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

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

const ACCOUNTS = [
  {
    username: 'admin01',
    password: 'Admin@123',
    full_name: 'Admin Hệ Thống',
    email: 'admin@coffea.vn',
    user_type: 'ADMIN',
    role_name: 'ADMIN',
  },
  {
    username: 'admin',
    password: 'Admin@2024',
    full_name: 'Admin Coffea',
    email: 'admin2@coffea.vn',
    user_type: 'ADMIN',
    role_name: 'ADMIN',
  },
  {
    username: 'manager01',
    password: 'Man@123',
    full_name: 'Nguyễn Văn Quản Lý',
    email: 'manager01@coffea.vn',
    user_type: 'MANAGER',
    role_name: 'MANAGER',
  },
  {
    username: 'employee01',
    password: 'Emp@123',
    full_name: 'Trần Thị Nhân Viên',
    email: 'employee01@coffea.vn',
    user_type: 'EMPLOYEE',
    role_name: 'EMPLOYEE',
  },
];

async function main() {
  console.log('🌱 Seeding roles into auth_db...');

  const roleMap = {};
  for (const role of ROLES) {
    const upserted = await prisma.role.upsert({
      where: { role_name: role.role_name },
      update: { description: role.description },
      create: {
        role_name: role.role_name,
        description: role.description,
      },
    });
    roleMap[upserted.role_name] = upserted.role_id;
    console.log(`  ✅ Role "${upserted.role_name}" - ID: ${upserted.role_id}`);
  }

  console.log('🌱 Seeding accounts into auth_db...');

  for (const acc of ACCOUNTS) {
    const existing = await prisma.account.findUnique({ where: { username: acc.username } });
    if (existing) {
      console.log(`  ⏭️  Account "${acc.username}" already exists — skipping`);
      continue;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(acc.password, salt);

    const created = await prisma.account.create({
      data: {
        username: acc.username,
        password_hash: passwordHash,
        full_name: acc.full_name,
        email: acc.email,
        user_type: acc.user_type,
        account_status: 'ACTIVE',
      },
    });

    // Assign role
    const roleId = roleMap[acc.role_name];
    if (roleId) {
      await prisma.accountRole.create({
        data: {
          account_id: created.account_id,
          role_id: roleId,
        },
      });
    }

    console.log(`  ✅ Account "${acc.username}" (${acc.user_type}) created`);
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
