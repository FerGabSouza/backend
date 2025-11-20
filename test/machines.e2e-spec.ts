import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Machines E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);

    await prisma.machineFee.deleteMany({});
    await prisma.machine.deleteMany({});
    await prisma.paymentMethod.deleteMany({});
  });

  afterAll(async () => {
    await app.close();
  });

  it('deve cadastrar maquininha com fees', async () => {
    const credito = await prisma.paymentMethod.create({
      data: { name: 'CREDITO' },
    });

    const server = app.getHttpServer();

    const res = await request(server)
      .post('/machines')
      .send({
        name: 'Infinity Fatinha',
        fees: [
          {
            paymentMethodId: credito.id,
            brand: 'VISA',
            feePercentage: 3.5,
          },
        ],
      })
      .expect(201);

    expect(res.body.id).toBeDefined();
  });
});
