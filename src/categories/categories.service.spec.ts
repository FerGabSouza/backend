import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

const prismaMock = {
  category: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
} as unknown as PrismaService;

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('deve criar categoria', async () => {
    (prisma.category.create as any).mockResolvedValue({
      id: 1,
      name: 'Drinks',
    });

    const result = await service.create({ name: 'Drinks' } as any);

    expect(prisma.category.create).toHaveBeenCalledWith({
      data: { name: 'Drinks' },
    });
    expect(result.id).toBe(1);
  });

  it('deve listar categorias', async () => {
    (prisma.category.findMany as any).mockResolvedValue([
      { id: 1, name: 'Drinks', products: [] },
    ]);

    const result = await service.findAll();

    expect(prisma.category.findMany).toHaveBeenCalledWith({
      include: { products: true },
    });
    expect(result).toHaveLength(1);
  });

  it('deve retornar uma categoria por id', async () => {
    (prisma.category.findUnique as any).mockResolvedValue({
      id: 1,
      name: 'Drinks',
      products: [],
    });

    const result = await service.findOne(1);

    expect(prisma.category.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      include: { products: true },
    });
    expect(result.id).toBe(1);
  });

  it('deve lançar NotFound se categoria não existir', async () => {
    (prisma.category.findUnique as any).mockResolvedValue(null);

    await expect(service.findOne(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('deve atualizar categoria', async () => {
    // findOne() interno precisa encontrar a categoria
    (prisma.category.findUnique as any).mockResolvedValue({
      id: 1,
      name: 'Antiga',
      products: [],
    });

    (prisma.category.update as any).mockResolvedValue({
      id: 1,
      name: 'Cozinha',
    });

    const result = await service.update(1, { name: 'Cozinha' } as any);

    expect(prisma.category.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { name: 'Cozinha' },
    });
    expect(result.name).toBe('Cozinha');
  });

  it('não deve remover categoria que possui produtos', async () => {
    // findOne() retorna categoria COM produtos
    (prisma.category.findUnique as any).mockResolvedValue({
      id: 1,
      name: 'Drinks',
      products: [{ id: 10, name: 'Caipirinha' }],
    });

    await expect(service.remove(1)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('deve remover categoria sem produtos', async () => {
    // findOne() retorna categoria SEM produtos
    (prisma.category.findUnique as any).mockResolvedValue({
      id: 1,
      name: 'Drinks',
      products: [],
    });

    (prisma.category.delete as any).mockResolvedValue({
      id: 1,
      name: 'Drinks',
    });

    const result = await service.remove(1);

    expect(prisma.category.delete).toHaveBeenCalledWith({
      where: { id: 1 },
    });
    expect(result.message).toContain('Categoria removida com sucesso');
  });
});
