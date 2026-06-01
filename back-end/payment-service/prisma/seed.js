const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const PAYMENT_METHODS = [
  { method_code: 'CASH',        method_name: 'Tiền mặt',                is_active: true,  description: 'Thanh toán bằng tiền mặt tại quầy' },
  { method_code: 'MOMO',        method_name: 'Ví MoMo',                 is_active: true,  description: 'Thanh toán qua ví điện tử MoMo' },
  { method_code: 'VNPAY',       method_name: 'Thanh toán ngân hàng qua VNPAY', is_active: true, description: 'Thanh toán qua VNPay — ATM, QR ngân hàng, thẻ quốc tế' },
  { method_code: 'BANK_TRANSFER', method_name: 'Chuyển khoản (xác nhận thủ công)', is_active: false, description: 'Nhân viên xác nhận sau khi nhận tiền' },
  { method_code: 'QR',          method_name: 'Chuyển khoản QR (cũ)',    is_active: false, description: 'Đã thay thế bởi VNPay' },
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
