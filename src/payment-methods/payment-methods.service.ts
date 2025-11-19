import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';

@Injectable()
export class PaymentMethodsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreatePaymentMethodDto) {
    const existing = await this.prisma.paymentMethod.findUnique({
      where: { name: data.name },
    });

    if (existing) {
      throw new BadRequestException('Forma de pagamento já cadastrada');
    }

    return this.prisma.paymentMethod.create({
      data,
    });
  }

  findAll() {
    return this.prisma.paymentMethod.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const method = await this.prisma.paymentMethod.findUnique({
      where: { id },
    });

    if (!method) throw new NotFoundException('Forma de pagamento não encontrada');

    return method;
  }

  async update(id: number, data: UpdatePaymentMethodDto) {
    await this.findOne(id);

    return this.prisma.paymentMethod.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    const hasSales = await this.prisma.salePayment.findFirst({
      where: {
        paymentMethodId: id,
      },
    });

    if (hasSales) {
      throw new BadRequestException(
        'Não é possível excluir: já existe venda usando essa forma de pagamento.',
      );
    }

    const hasExpenses = await this.prisma.expense.findFirst({
      where: { paymentMethodId: id },
    });

    if (hasExpenses) {
      throw new BadRequestException(
        'Não é possível excluir: já existe despesa usando essa forma de pagamento.',
      );
    }

    await this.prisma.paymentMethod.delete({
      where: { id },
    });

    return { message: 'Forma de pagamento removida com sucesso' };
  }
}
