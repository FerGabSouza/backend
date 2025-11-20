import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

const prismaMock = {
  product: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  category: {
    findUnique: jest.fn(),
  },
} as unknown as PrismaService;

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('deve falhar ao criar se categoria não existir', async () => {
    (prisma.category.findUnique as any).mockResolvedValue(null);

    await expect(
      service.create({
        name: 'Caipirinha',
        categoryId: 999,
      } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('deve criar produto', async () => {
    (prisma.category.findUnique as any).mockResolvedValue({
      id: 1,
      name: 'Drinks',
    });

    (prisma.product.create as any).mockResolvedValue({
      id: 10,
      name: 'Caipirinha',
    });

    const result = await service.create({
      name: 'Caipirinha',
      categoryId: 1,
      salePrice: 25,
      costPrice: 8.5,
      isActive: true,
      isStockTracked: true,
      stockQuantity: 50,
    } as any);

    expect(prisma.product.create).toHaveBeenCalled();
    expect(result.id).toBe(10);
  });

  it('deve listar produtos', async () => {
    (prisma.product.findMany as any).mockResolvedValue([
      { id: 1, name: 'Caipirinha' },
    ]);

    const result = await service.findAll();

    expect(prisma.product.findMany).toHaveBeenCalled();
    expect(result.length).toBeGreaterThan(0);
  });

  it('deve buscar produto por id', async () => {
    (prisma.product.findUnique as any).mockResolvedValue({
      id: 1,
      name: 'Caipirinha',
    });

    const result = await service.findOne(1);

    expect(prisma.product.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      include: { category: true },
    });
    expect(result.id).toBe(1);
  });

  it('deve lançar NotFound ao buscar produto inexistente', async () => {
    (prisma.product.findUnique as any).mockResolvedValue(null);

    await expect(service.findOne(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('deve atualizar produto', async () => {
    // findOne() interno precisa encontrar o produto
    (prisma.product.findUnique as any).mockResolvedValue({
      id: 1,
      name: 'Velho',
    });

    (prisma.product.update as any).mockResolvedValue({
      id: 1,
      name: 'Novo Nome',
    });

    const result = await service.update(1, {
      name: 'Novo Nome',
    } as any);

    expect(prisma.product.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { name: 'Novo Nome' },
    });
    expect(result.name).toBe('Novo Nome');
  });

  it('deve remover produto', async () => {
    // findOne() precisa encontrar antes de deletar
    (prisma.product.findUnique as any).mockResolvedValue({
      id: 1,
      name: 'Pra deletar',
    });

    (prisma.product.delete as any).mockResolvedValue({
      id: 1,
      name: 'Pra deletar',
    });

    const result = await service.remove(1);

    expect(prisma.product.delete).toHaveBeenCalledWith({
      where: { id: 1 },
    });
    expect(result.message).toContain('Produto removido com sucesso');
  });
});
