// backend/test/utils/test-app.ts
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

let app: INestApplication | null = null;
let prisma: PrismaService | null = null;

export async function initTestApp() {
  if (app && prisma) {
    // já inicializado – reutiliza
    return { app, prisma };
  }

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleRef.createNestApplication();
  await app.init();

  prisma = app.get(PrismaService);

  return { app, prisma };
}

export function getApp(): INestApplication {
  if (!app) {
    throw new Error('Test app not initialized. Call initTestApp() first.');
  }
  return app;
}

export function getPrisma(): PrismaService {
  if (!prisma) {
    throw new Error('Prisma not initialized. Call initTestApp() first.');
  }
  return prisma;
}

export async function closeTestApp() {
  if (app) {
    await app.close();
    app = null;
    prisma = null;
  }
}
