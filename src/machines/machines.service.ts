import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMachineDto } from './dto/create-machine.dto';
import { UpdateMachineDto } from './dto/update-machine.dto';

@Injectable()
export class MachinesService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateMachineDto) {
    const machine = await this.prisma.machine.create({
      data: {
        name: data.name,
      },
    });

    if (data.fees && data.fees.length > 0) {
      await this.prisma.machineFee.createMany({
        data: data.fees.map((fee) => ({
          machineId: machine.id,
          paymentMethodId: fee.paymentMethodId,
          brand: fee.brand,
          feePercentage: fee.feePercentage,
        })),
      });
    }

    return this.findOne(machine.id);
  }

  findAll() {
    return this.prisma.machine.findMany({
      orderBy: { name: 'asc' },
      include: {
        fees: {
          include: {
            paymentMethod: true,
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const machine = await this.prisma.machine.findUnique({
      where: { id },
      include: {
        fees: {
          include: {
            paymentMethod: true,
          },
        },
      },
    });

    if (!machine) {
      throw new NotFoundException('Maquininha não encontrada');
    }

    return machine;
  }

  async update(id: number, data: UpdateMachineDto) {
    await this.findOne(id);

    const machine = await this.prisma.machine.update({
      where: { id },
      data: {
        name: data.name,
      },
    });

    // se quiser, depois a gente cria uma rota própria pra atualizar fees

    return this.findOne(machine.id);
  }

  async remove(id: number) {
    await this.findOne(id);

    const hasPayments = await this.prisma.salePayment.findFirst({
      where: { machineId: id },
    });

    if (hasPayments) {
      throw new BadRequestException(
        'Não é possível excluir: já existe pagamento vinculado a essa maquininha.',
      );
    }

    await this.prisma.machineFee.deleteMany({
      where: { machineId: id },
    });

    await this.prisma.machine.delete({
      where: { id },
    });

    return { message: 'Maquininha removida com sucesso.' };
  }
}
