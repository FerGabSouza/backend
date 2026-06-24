// test/products.e2e-spec.ts
import request from 'supertest';
import { initTestApp, getApp, getPrisma } from './utils/test-app';
import { resetDatabase } from './utils/reset-database';

describe('Products E2E', () => {
  beforeAll(async () => {
    await initTestApp();
    await resetDatabase(getPrisma());
  });

  beforeEach(async () => {
    await resetDatabase(getPrisma());
  });

  afterAll(async () => {
    await resetDatabase(getPrisma());
  });

  it('POST /products deve criar produto e listar', async () => {
    const prisma = getPrisma();
    const server = getApp().getHttpServer();

    const category = await prisma.category.create({
      data: { name: 'Drinks' },
    });

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

    expect(Array.isArray(listRes.body)).toBe(true);
    expect(listRes.body.length).toBe(1);
  });

  it('PATCH /products/:id deve atualizar produto', async () => {
    const prisma = getPrisma();
    const server = getApp().getHttpServer();

    // tudo que o teste usa é criado DEPOIS do reset
    const category = await prisma.category.create({
      data: { name: 'Cervejas' },
    });

    const product = await prisma.product.create({
      data: {
        name: 'Cerveja Lager',
        categoryId: category.id,
        salePrice: 10,
        costPrice: 4,
        isActive: true,
        isStockTracked: true,
        stockQuantity: 100,
      },
    });

    const res = await request(server)
      .patch(`/products/${product.id}`)
      .send({ name: 'Cerveja Pilsen' })
      .expect(200);

    expect(res.body.id).toBe(product.id);
    expect(res.body.name).toBe('Cerveja Pilsen');
  });

  it('DELETE /products/:id deve remover produto', async () => {
    const prisma = getPrisma();
    const server = getApp().getHttpServer();

    const category = await prisma.category.create({
      data: { name: 'Shots' },
    });

    const product = await prisma.product.create({
      data: {
        name: 'Tequila',
        categoryId: category.id,
        salePrice: 15,
        costPrice: 5,
        isActive: true,
        isStockTracked: true,
        stockQuantity: 30,
      },
    });

    await request(server).delete(`/products/${product.id}`).expect(200);

    const deleted = await prisma.product.findUnique({
      where: { id: product.id },
    });

    expect(deleted).toBeNull();
  });
});
