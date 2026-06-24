// backend/test/utils/reset-database.ts
import { PrismaClient } from '@prisma/client';

export async function resetDatabase(prisma: PrismaClient) {
  await prisma.$transaction([
    prisma.salePayment.deleteMany(),
    prisma.saleItem.deleteMany(),
    prisma.sale.deleteMany(),

    prisma.machineFee.deleteMany(),
    prisma.machine.deleteMany(),

    prisma.expense.deleteMany(),

    prisma.product.deleteMany(),
    prisma.category.deleteMany(),
    prisma.paymentMethod.deleteMany(),
  ]);
}
