const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const PAYMENT_METHODS = [
  { method_code: 'CASH', method_name: 'Tiền mặt',        is_active: true, description: 'Thanh toán bằng tiền mặt tại quầy' },
  { method_code: 'MOMO', method_name: 'Ví MoMo',         is_active: true, description: 'Thanh toán qua ví điện tử MoMo' },
  { method_code: 'QR',   method_name: 'Chuyển khoản QR', is_active: true, description: 'Thanh toán qua mã QR ngân hàng (VietQR)' },
];

async function main() {
  console.log('🌱 Seeding payment methods...');

  for (const pm of PAYMENT_METHODS) {
    const upserted = await prisma.paymentMethod.upsert({
      where: { method_code: pm.method_code },
      update: { method_name: pm.method_name, is_active: pm.is_active, description: pm.description },
      create: pm,
    });
    console.log(`  ✅ ${upserted.method_code} — ${upserted.method_name}`);
  }

  console.log('🎉 Payment seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
