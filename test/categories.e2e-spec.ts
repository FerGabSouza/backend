import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Categories E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);

    await prisma.product.deleteMany({});
    await prisma.category.deleteMany({});
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /categories deve criar categoria', async () => {
    const server = app.getHttpServer();

    const res = await request(server)
      .post('/categories')
      .send({ name: 'Drinks' })
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.name).toBe('Drinks');
  });

  it('GET /categories deve listar categorias', async () => {
    const server = app.getHttpServer();

    const res = await request(server).get('/categories').expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /categories/:id deve retornar uma categoria', async () => {
    const cat = await prisma.category.findFirst();
    const server = app.getHttpServer();

    const res = await request(server)
      .get(`/categories/${cat.id}`)
      .expect(200);

    expect(res.body.id).toBe(cat.id);
  });

  it('PATCH /categories/:id deve atualizar categoria', async () => {
    const cat = await prisma.category.create({
      data: { name: 'Antiga' },
    });
    const server = app.getHttpServer();

    const res = await request(server)
      .patch(`/categories/${cat.id}`)
      .send({ name: 'Atualizada' })
      .expect(200);

    expect(res.body.name).toBe('Atualizada');
  });

  it('DELETE /categories/:id deve remover categoria', async () => {
    const cat = await prisma.category.create({
      data: { name: 'Para deletar' },
    });
    const server = app.getHttpServer();

    await request(server).delete(`/categories/${cat.id}`).expect(200);

    const deleted = await prisma.category.findUnique({
      where: { id: cat.id },
    });

    expect(deleted).toBeNull();
  });
});
