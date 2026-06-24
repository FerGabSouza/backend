// backend/test/app.e2e-spec.ts
import request from 'supertest';
import { initTestApp, getApp, closeTestApp } from './utils/test-app';

describe('App E2E', () => {
  beforeAll(async () => {
    await initTestApp();
  });

  afterAll(async () => {
    await closeTestApp();
  });

  it('GET / deve responder Hello World', async () => {
    const app = getApp();
    const server = app.getHttpServer();

    const res = await request(server).get('/').expect(200);

    expect(res.text).toBe('Hello World!');
  });
});
