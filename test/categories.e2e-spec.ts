// backend/test/categories.e2e-spec.ts
import request from 'supertest';
import { initTestApp, getApp, getPrisma, closeTestApp } from './utils/test-app';
import { resetDatabase } from './utils/reset-database';

describe('Categories E2E', () => {
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

  it('POST /categories deve criar categoria', async () => {
    const server = getApp().getHttpServer();

    const res = await request(server)
      .post('/categories')
      .send({ name: 'Drinks' })
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.name).toBe('Drinks');
  });

  it('GET /categories deve listar categorias', async () => {
    const prisma = getPrisma();
    await prisma.category.create({ data: { name: 'Cozinha' } });

    const server = getApp().getHttpServer();

    const res = await request(server).get('/categories').expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].name).toBe('Cozinha');
  });

  it('GET /categories/:id deve retornar uma categoria', async () => {
    const prisma = getPrisma();
    const cat = await prisma.category.create({ data: { name: 'Snacks' } });

    const server = getApp().getHttpServer();

    const res = await request(server).get(`/categories/${cat.id}`).expect(200);

    expect(res.body.id).toBe(cat.id);
    expect(res.body.name).toBe('Snacks');
  });

  it('PATCH /categories/:id deve atualizar categoria', async () => {
    const prisma = getPrisma();
    const cat = await prisma.category.create({ data: { name: 'Antiga' } });

    const server = getApp().getHttpServer();

    const res = await request(server)
      .patch(`/categories/${cat.id}`)
      .send({ name: 'Atualizada' })
      .expect(200);

    expect(res.body.name).toBe('Atualizada');
  });

  it('DELETE /categories/:id deve remover categoria', async () => {
    const prisma = getPrisma();
    const cat = await prisma.category.create({
      data: { name: 'Para deletar' },
    });

    const server = getApp().getHttpServer();

    await request(server).delete(`/categories/${cat.id}`).expect(200);

    const deleted = await prisma.category.findUnique({ where: { id: cat.id } });
    expect(deleted).toBeNull();
  });
});
