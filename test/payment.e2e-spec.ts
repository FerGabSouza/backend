import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('PaymentMethods E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);

    await prisma.salePayment.deleteMany({});
    await prisma.paymentMethod.deleteMany({});
  });

  afterAll(async () => {
    await app.close();
  });

  it('deve criar e listar métodos de pagamento', async () => {
    const server = app.getHttpServer();

    await request(server)
      .post('/payment-methods')
      .send({ name: 'DINHEIRO' })
      .expect(201);

    const res = await request(server)
      .get('/payment-methods')
      .expect(200);

    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it('deve atualizar método de pagamento', async () => {
    const pm = await prisma.paymentMethod.create({
      data: { name: 'CARTÃO VELHO' },
    });

    const server = app.getHttpServer();

    const res = await request(server)
      .patch(`/payment-methods/${pm.id}`)
      .send({ name: 'CARTÃO NOVO' })
      .expect(200);

    expect(res.body.name).toBe('CARTÃO NOVO');
  });

  it('deve deletar método de pagamento não utilizado', async () => {
    const pm = await prisma.paymentMethod.create({
      data: { name: 'APAGAR' },
    });

    const server = app.getHttpServer();

    await request(server)
      .delete(`/payment-methods/${pm.id}`)
      .expect(200);

    const deleted = await prisma.paymentMethod.findUnique({
      where: { id: pm.id },
    });

    expect(deleted).toBeNull();
  });
});
