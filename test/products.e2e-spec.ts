import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Products E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);

    await prisma.saleItem.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.category.deleteMany({});
  });

  afterAll(async () => {
    await app.close();
  });

  it('deve criar produto e listar', async () => {
    const category = await prisma.category.create({
      data: { name: 'Drinks' },
    });

    const server = app.getHttpServer();

    const createRes = await request(server)
      .post('/products')
      .send({
        name: 'Caipirinha',
        categoryId: category.id,
        salePrice: 25,
        costPrice: 8.5,
        isActive: true,
        isStockTracked: true,
        stockQuantity: 50,
      })
      .expect(201);

    expect(createRes.body.id).toBeDefined();

    const listRes = await request(server).get('/products').expect(200);
    expect(listRes.body.length).toBeGreaterThanOrEqual(1);
  });

  it('deve atualizar produto', async () => {
    const product = await prisma.product.create({
      data: {
        name: 'Velho',
        categoryId: (await prisma.category.create({ data: { name: 'Cozinha' } }))
          .id,
        salePrice: 10,
        stockQuantity: 10,
      },
    });

    const server = app.getHttpServer();

    const res = await request(server)
      .patch(`/products/${product.id}`)
      .send({ name: 'Novo Nome' })
      .expect(200);

    expect(res.body.name).toBe('Novo Nome');
  });

  it('deve deletar produto', async () => {
    const category = await prisma.category.create({ data: { name: 'Apagar' } });

    const product = await prisma.product.create({
      data: {
        name: 'Pra deletar',
        categoryId: category.id,
        salePrice: 10,
        stockQuantity: 5,
      },
    });

    const server = app.getHttpServer();

    await request(server).delete(`/products/${product.id}`).expect(200);

    const deleted = await prisma.product.findUnique({
      where: { id: product.id },
    });

    expect(deleted).toBeNull();
  });
});
