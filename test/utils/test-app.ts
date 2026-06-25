// backend/test/utils/test-app.ts

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { HttpExceptionFilter } from '../../src/common/filters/http-exception.filter';

let app: INestApplication | null = null;
let prisma: PrismaService | null = null;

export async function initTestApp() {
  if (app && prisma) {
    // Já inicializado – reutiliza
    return { app, prisma };
  }

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleRef.createNestApplication();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove campos não declarados no DTO
      forbidNonWhitelisted: true, // Bloqueia campos extras
      transform: true, // Converte tipos automaticamente
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

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
