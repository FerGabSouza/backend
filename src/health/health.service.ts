import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;

      return {
        status: 'ok',
        version: process.env.npm_package_version ?? '1.0.0',
        environment: process.env.NODE_ENV ?? 'development',
        uptime: process.uptime(),
        database: {
          status: 'connected',
        },
        timestamp: new Date().toISOString(),
      };
    } catch {
      throw new ServiceUnavailableException('Banco de dados indisponível');
    }
  }
}
