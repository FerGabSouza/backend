import { Test, TestingModule } from '@nestjs/testing';
import { MachinesService } from './machines.service';
import { PrismaService } from '../prisma/prisma.service';
import { CardBrand } from '@prisma/client';

const prismaMock = {
  machine: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  machineFee: {
    createMany: jest.fn(),
    deleteMany: jest.fn(),
  },
} as unknown as PrismaService;

describe('MachinesService', () => {
  let service: MachinesService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MachinesService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<MachinesService>(MachinesService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('deve criar maquininha com fees, preenchendo brand OUTROS quando não vier', async () => {
    (prisma.machine.create as any).mockResolvedValue({
      id: 1,
      name: 'Infinity Fatinha',
    });

    (prisma.machine.findUnique as any).mockResolvedValue({
      id: 1,
      name: 'Infinity Fatinha',
      fees: [],
    });

    const dto: any = {
      name: 'Infinity Fatinha',
      fees: [
        { paymentMethodId: 2, feePercentage: 0 }, // pix sem brand
        {
          paymentMethodId: 4,
          brand: CardBrand.VISA,
          feePercentage: 3.5,
        },
      ],
    };

    await service.create(dto);

    expect(prisma.machine.create).toHaveBeenCalled();
    expect(prisma.machineFee.createMany).toHaveBeenCalledWith({
      data: [
        {
          machineId: 1,
          paymentMethodId: 2,
          brand: CardBrand.OUTROS,
          feePercentage: 0,
        },
        {
          machineId: 1,
          paymentMethodId: 4,
          brand: CardBrand.VISA,
          feePercentage: 3.5,
        },
      ],
    });
  });

  it('deve listar máquinas com fees', async () => {
    (prisma.machine.findMany as any).mockResolvedValue([
      { id: 1, name: 'Infinity Fatinha' },
    ]);

    const result = await service.findAll();

    expect(prisma.machine.findMany).toHaveBeenCalled();
    expect(result).toHaveLength(1);
  });
});
