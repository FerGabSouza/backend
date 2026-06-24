// backend/test/sales.e2e-spec.ts
import request from 'supertest';
import { initTestApp, getApp, getPrisma, closeTestApp } from './utils/test-app';
import { resetDatabase } from './utils/reset-database';

describe('Sales E2E', () => {
  beforeAll(async () => {
    const { prisma } = await initTestApp();
    await resetDatabase(prisma);
  });

  beforeEach(async () => {
    await resetDatabase(getPrisma());
  });

  afterAll(async () => {
    await closeTestApp();
  });

  it('deve criar uma venda completa com múltiplos pagamentos', async () => {
    const prisma = getPrisma();

    const cat = await prisma.category.create({
      data: { name: 'Drinks' },
    });

    const prod = await prisma.product.create({
      data: {
        name: 'Caipirinha',
        categoryId: cat.id,
        salePrice: 25,
        costPrice: 8.5,
        isActive: true,
        isStockTracked: true,
        stockQuantity: 100,
      },
    });

    const money = await prisma.paymentMethod.create({
      data: { name: 'DINHEIRO' },
    });
    const credit = await prisma.paymentMethod.create({
      data: { name: 'CREDITO' },
    });
    const pix = await prisma.paymentMethod.create({
      data: { name: 'PIX' },
    });

    const machine = await prisma.machine.create({
      data: { name: 'Infinity Fatinha' },
    });

    await prisma.machineFee.createMany({
      data: [
        {
          machineId: machine.id,
          paymentMethodId: credit.id,
          brand: 'VISA',
          feePercentage: 3.5,
        },
        {
          machineId: machine.id,
          paymentMethodId: pix.id,
          brand: 'OUTROS',
          feePercentage: 0,
        },
      ],
    });

    const server = getApp().getHttpServer();

    const res = await request(server)
      .post('/sales')
      .send({
        notes: 'Mesa E2E',
        items: [{ productId: prod.id, quantity: 4 }], // total 100
        payments: [
          {
            paymentMethodId: money.id,
            amount: 50,
          },
          {
            paymentMethodId: credit.id,
            machineId: machine.id,
            brand: 'VISA',
            amount: 30,
          },
          {
            paymentMethodId: pix.id,
            machineId: machine.id,
            amount: 20,
          },
        ],
      })
      .expect(201);

    expect(res.body.totalValue).toBe(100);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].quantity).toBe(4);
    expect(res.body.payments).toHaveLength(3);
  });
});
