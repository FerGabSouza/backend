// backend/test/machines.e2e-spec.ts
import request from 'supertest';
import { initTestApp, getApp, getPrisma, closeTestApp } from './utils/test-app';
import { resetDatabase } from './utils/reset-database';

describe('Machines E2E', () => {
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

  it('POST /machines deve cadastrar maquininha com fees', async () => {
    const prisma = getPrisma();

    const credito = await prisma.paymentMethod.create({
      data: { name: 'CREDITO' },
    });

    const pix = await prisma.paymentMethod.create({
      data: { name: 'PIX' },
    });

    const server = getApp().getHttpServer();

    const res = await request(server)
      .post('/machines')
      .send({
        name: 'Infinity Fatinha',
        fees: [
          { paymentMethodId: credito.id, brand: 'VISA', feePercentage: 3.5 },
          {
            paymentMethodId: credito.id,
            brand: 'MASTERCARD',
            feePercentage: 3.2,
          },
          { paymentMethodId: pix.id, feePercentage: 0 },
        ],
      })
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.name).toBe('Infinity Fatinha');
  });
});
