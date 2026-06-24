// backend/test/payment.e2e-spec.ts
import request from 'supertest';
import { initTestApp, getApp, getPrisma, closeTestApp } from './utils/test-app';
import { resetDatabase } from './utils/reset-database';

describe('PaymentMethods E2E', () => {
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

  it('POST /payment-methods e GET /payment-methods', async () => {
    const server = getApp().getHttpServer();

    await request(server)
      .post('/payment-methods')
      .send({ name: 'DINHEIRO' })
      .expect(201);

    await request(server)
      .post('/payment-methods')
      .send({ name: 'PIX' })
      .expect(201);

    const res = await request(server).get('/payment-methods').expect(200);

    expect(res.body.length).toBe(2);
    expect(res.body.map((m: any) => m.name).sort()).toEqual([
      'DINHEIRO',
      'PIX',
    ]);
  });

  it('DELETE /payment-methods/:id não deve deletar método em uso', async () => {
    const prisma = getPrisma();
    const method = await prisma.paymentMethod.create({
      data: { name: 'CREDITO' },
    });

    // cria uma venda usando esse metodo para bloquear delete
    const sale = await prisma.sale.create({
      data: { totalValue: 10 },
    });

    await prisma.salePayment.create({
      data: {
        saleId: sale.id,
        paymentMethodId: method.id,
        amount: 10,
        netAmount: 10,
      },
    });

    const server = getApp().getHttpServer();

    const res = await request(server)
      .delete(`/payment-methods/${method.id}`)
      .expect(400);

    expect(res.body.message).toContain(
      'Não é possível excluir: já existe venda usando essa forma de pagamento.',
    );
  });
});
