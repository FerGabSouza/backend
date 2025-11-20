import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Sales E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    process.env.DATABASE_URL =
      process.env.DATABASE_URL ||
      'postgresql://baruser:barpass@localhost:5432/bar_db_test?schema=public';

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);

    // limpa as tabelas principais
    await prisma.salePayment.deleteMany({});
    await prisma.saleItem.deleteMany({});
    await prisma.sale.deleteMany({});

    await prisma.machineFee.deleteMany({});
    await prisma.machine.deleteMany({});

    await prisma.product.deleteMany({});
    await prisma.category.deleteMany({});

    await prisma.paymentMethod.deleteMany({});
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await prisma.salePayment.deleteMany({});
    await prisma.saleItem.deleteMany({});
    await prisma.sale.deleteMany({});

    await prisma.machineFee.deleteMany({});
    await prisma.machine.deleteMany({});

    await prisma.product.deleteMany({});
    await prisma.category.deleteMany({});

    await prisma.paymentMethod.deleteMany({});
  });


  it('deve criar uma venda completa com múltiplos pagamentos', async () => {
    // cria categoria
    const cat = await prisma.category.create({
      data: { name: 'Drinks' },
    });

    // cria produto
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

    // métodos de pagamento
    const dinheiro = await prisma.paymentMethod.create({
      data: { name: 'DINHEIRO' },
    });
    const credito = await prisma.paymentMethod.create({
      data: { name: 'CREDITO' },
    });
    const pix = await prisma.paymentMethod.create({
      data: { name: 'PIX' },
    });

    // maquininha + fees
    const machine = await prisma.machine.create({
      data: { name: 'Infinity Fatinha' },
    });

    await prisma.machineFee.createMany({
      data: [
        {
          machineId: machine.id,
          paymentMethodId: credito.id,
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

    const server = app.getHttpServer();

    const res = await request(server)
      .post('/sales')
      .send({
        notes: 'Mesa E2E',
        items: [{ productId: prod.id, quantity: 4 }], // total 100
        payments: [
          {
            paymentMethodId: dinheiro.id,
            amount: 50,
          },
          {
            paymentMethodId: credito.id,
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
    expect(res.body.payments).toHaveLength(3);
  });
});
