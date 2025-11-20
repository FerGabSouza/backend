import { Test, TestingModule } from '@nestjs/testing';
import { PaymentMethodsService } from './payment-methods.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

const prismaMock = {
  paymentMethod: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  salePayment: {
    findFirst: jest.fn(),
  },
  expense: {
    findFirst: jest.fn(), // 👈 NOVO
  },
} as unknown as PrismaService;

describe('PaymentMethodsService', () => {
  let service: PaymentMethodsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentMethodsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<PaymentMethodsService>(PaymentMethodsService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('deve criar método de pagamento', async () => {
    (prisma.paymentMethod.create as any).mockResolvedValue({
      id: 1,
      name: 'DINHEIRO',
    });

    const result = await service.create({ name: 'DINHEIRO' } as any);

    expect(prisma.paymentMethod.create).toHaveBeenCalledWith({
      data: { name: 'DINHEIRO' },
    });
    expect(result.name).toBe('DINHEIRO');
  });

  it('deve listar métodos de pagamento', async () => {
    (prisma.paymentMethod.findMany as any).mockResolvedValue([
      { id: 1, name: 'DINHEIRO' },
    ]);

    const result = await service.findAll();

    expect(prisma.paymentMethod.findMany).toHaveBeenCalled();
    expect(result.length).toBeGreaterThan(0);
  });

  it('deve lançar NotFound se método não existir no findOne', async () => {
    (prisma.paymentMethod.findUnique as any).mockResolvedValue(null);

    await expect(service.findOne(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('não deve deletar método em uso', async () => {
    // findOne() precisa achar o método
    (prisma.paymentMethod.findUnique as any).mockResolvedValue({
      id: 1,
      name: 'CARTÃO',
    });

    // e salePayment.findFirst indica que ele está em uso
    (prisma.salePayment.findFirst as any).mockResolvedValue({
      id: 100,
      saleId: 20,
      paymentMethodId: 1,
    });

    await expect(service.remove(1)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('deve deletar método se não estiver em uso', async () => {
    // findOne() encontra o método
    (prisma.paymentMethod.findUnique as any).mockResolvedValue({
      id: 2,
      name: 'PIX',
    });

    // não há nenhum salePayment usando esse método
    (prisma.salePayment.findFirst as any).mockResolvedValue(null);

    (prisma.paymentMethod.delete as any).mockResolvedValue({
      id: 2,
      name: 'PIX',
    });

    const result = await service.remove(2);

    expect(prisma.paymentMethod.delete).toHaveBeenCalledWith({
      where: { id: 2 },
    });
    expect(result.message).toContain('Forma de pagamento removida com sucesso');
  });
});
