import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create sample discount codes
  await prisma.discountCode.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      code: 'WELCOME10',
      discountType: 'percentage',
      discountValue: 10,
      minOrderAmount: 20,
      isActive: true,
    },
  });

  await prisma.discountCode.upsert({
    where: { code: 'SAVE5' },
    update: {},
    create: {
      code: 'SAVE5',
      discountType: 'fixed',
      discountValue: 5,
      minOrderAmount: 30,
      isActive: true,
    },
  });

  await prisma.discountCode.upsert({
    where: { code: 'FIRST20' },
    update: {},
    create: {
      code: 'FIRST20',
      discountType: 'percentage',
      discountValue: 20,
      minOrderAmount: 50,
      maxUses: 100,
      isActive: true,
    },
  });

  console.log('Seed data created successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
