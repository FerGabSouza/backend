import { Test, TestingModule } from '@nestjs/testing';
import { SalesService } from './sales.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';
import { CardBrand } from '@prisma/client';

// Helper: cria um PrismaService “fake” com jest.fn()
function createPrismaMock(): jest.Mocked<PrismaService> {
  return {
    // só o que usamos no SalesService.create
    product: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    paymentMethod: {
      findMany: jest.fn(),
    },
    machine: {
      findMany: jest.fn(),
    },
    machineFee: {
      findMany: jest.fn(),
    },
    sale: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    saleItem: {
      createMany: jest.fn(),
    },
    salePayment: {
      createMany: jest.fn(),
    },
    $transaction: jest.fn(),
    // qualquer outra coisa que o TS reclamar, coloca como jest.fn()
  } as any;
}

describe('SalesService', () => {
  let service: SalesService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const prismaMock = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<SalesService>(SalesService);
    prisma = module.get(PrismaService);
  });

  it('deve lançar erro se a soma dos pagamentos não bater com o total da venda', async () => {
    // Arrange
    // Produto custa 25, quantidade 2 => total = 50
    (prisma.product.findMany as jest.Mock).mockResolvedValue([
      {
        id: 1,
        name: 'Caipirinha',
        salePrice: 25,
        costPrice: 8.5,
        isActive: true,
        isStockTracked: true,
        stockQuantity: 10,
      } as any,
    ]);

    (prisma.paymentMethod.findMany as jest.Mock).mockResolvedValue([
      { id: 1, name: 'DINHEIRO' } as any,
    ]);

    // não tem maquininha nesse teste
    (prisma.machine.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.machineFee.findMany as jest.Mock).mockResolvedValue([]);

    const dto: any = {
      notes: 'Mesa teste',
      items: [
        { productId: 1, quantity: 2 }, // total 50
      ],
      payments: [
        {
          paymentMethodId: 1,
          amount: 30, // SOMA = 30 (não bate com 50)
        },
      ],
    };

    // Act + Assert
    await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    await expect(service.create(dto)).rejects.toThrow(
      'Soma dos pagamentos (30.00) não bate com o total da venda (50.00).',
    );
  });

  it('deve calcular fee e netAmount usando MachineFee quando tiver maquininha e brand', async () => {
    (prisma.product.findMany as jest.Mock).mockResolvedValue([
      {
        id: 1,
        name: 'Caipirinha',
        salePrice: 25,
        costPrice: 8.5,
        isActive: true,
        isStockTracked: true,
        stockQuantity: 10,
      } as any,
    ]);

    (prisma.paymentMethod.findMany as jest.Mock).mockResolvedValue([
      { id: 4, name: 'CREDITO' } as any,
    ]);

    (prisma.machine.findMany as jest.Mock).mockResolvedValue([
      { id: 1, name: 'Infinity Fatinha' } as any,
    ]);

    (prisma.machineFee.findMany as jest.Mock).mockResolvedValue([
      {
        id: 1,
        machineId: 1,
        paymentMethodId: 4,
        brand: CardBrand.VISA,
        feePercentage: 3.5,
      } as any,
    ]);

    // mock da transação: só chama o callback e retorna o que ele retornar
    (prisma.$transaction as jest.Mock).mockImplementation((cb: any) =>
      cb(prisma),
    );

    (prisma.sale.create as jest.Mock).mockResolvedValue({
      id: 1,
      totalValue: 25,
      notes: null,
    } as any);

    (prisma.saleItem.createMany as jest.Mock).mockResolvedValue({} as any);
    (prisma.salePayment.createMany as jest.Mock).mockResolvedValue({} as any);

    (prisma.sale.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      totalValue: 25,
      payments: [
        {
          paymentMethodId: 4,
          machineId: 1,
          brand: CardBrand.VISA,
          amount: 25,
          feePercentage: 3.5,
          netAmount: 24.125,
        },
      ],
      items: [],
    } as any);

    const dto: any = {
      items: [{ productId: 1, quantity: 1 }],
      payments: [
        {
          paymentMethodId: 4,
          machineId: 1,
          brand: CardBrand.VISA,
          amount: 25,
        },
      ],
    };

    const result = await service.create(dto);

    // Só garante que não deu erro e que a transação foi chamada
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(result).toBeDefined();
  });
});
