import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { CancelSaleDto } from './dto/cancel-sale.dto';
import {
  CardBrand,
  MachineFee,
  Product,
  Machine,
  PaymentMethod,
} from '@prisma/client';

@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateSaleDto) {
    if (!data.items || data.items.length === 0) {
      throw new BadRequestException('A venda precisa ter pelo menos 1 item.');
    }

    if (!data.payments || data.payments.length === 0) {
      throw new BadRequestException(
        'A venda precisa ter pelo menos 1 forma de pagamento.',
      );
    }

    // 1. Produtos
    const productIds = [...new Set(data.items.map((i) => i.productId))];

    const products: Product[] = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException(
        'Um ou mais produtos informados não foram encontrados.',
      );
    }

    const productMap = new Map<number, Product>(products.map((p) => [p.id, p]));

    // 2. Agrupa itens, valida estoque e calcula total
    const aggregatedItems = new Map<
      number,
      {
        productId: number;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
      }
    >();

    for (const item of data.items) {
      const product = productMap.get(item.productId);

      if (!product) {
        throw new BadRequestException(
          `Produto com ID ${item.productId} não encontrado.`,
        );
      }

      if (item.quantity <= 0) {
        throw new BadRequestException(
          `Quantidade inválida para o produto "${product.name}".`,
        );
      }

      const unitPrice = product.salePrice;
      const already = aggregatedItems.get(item.productId);
      const newQuantity = (already?.quantity ?? 0) + item.quantity;

      if (product.isStockTracked) {
        if (product.stockQuantity < newQuantity) {
          throw new BadRequestException(
            `Estoque insuficiente para o produto "${product.name}". Disponível: ${product.stockQuantity}, solicitado: ${newQuantity}`,
          );
        }
      }

      aggregatedItems.set(item.productId, {
        productId: item.productId,
        quantity: newQuantity,
        unitPrice,
        totalPrice: unitPrice * newQuantity,
      });
    }

    const itemsToCreate = Array.from(aggregatedItems.values());

    const saleTotal = itemsToCreate.reduce(
      (acc, item) => acc + item.totalPrice,
      0,
    );

    if (saleTotal <= 0) {
      throw new BadRequestException('Valor total da venda inválido.');
    }

    // 3. Validar métodos de pagamento, máquinas e buscar fees
    const paymentMethodIds: number[] = [
      ...new Set(data.payments.map((p) => p.paymentMethodId)),
    ];

    const machineIds: number[] = [
      ...new Set(
        data.payments
          .map((p) => p.machineId)
          .filter((id): id is number => !!id),
      ),
    ];

    // Buscar paymentMethods
    const paymentMethods: PaymentMethod[] =
      await this.prisma.paymentMethod.findMany({
        where: { id: { in: paymentMethodIds } },
      });

    if (paymentMethods.length !== paymentMethodIds.length) {
      throw new BadRequestException(
        'Uma ou mais formas de pagamento não foram encontradas.',
      );
    }

    // Buscar máquinas
    const machines: Machine[] = machineIds.length
      ? await this.prisma.machine.findMany({
          where: { id: { in: machineIds } },
        })
      : [];

    if (machines.length !== machineIds.length) {
      throw new BadRequestException(
        'Uma ou mais maquininhas informadas não foram encontradas.',
      );
    }

    const machineMap = new Map<number, Machine>();
    machines.forEach((m) => machineMap.set(m.id, m));

    // Buscar taxas (MachineFee)
    let machineFees: MachineFee[] = [];

    if (machineIds.length) {
      machineFees = await this.prisma.machineFee.findMany({
        where: { machineId: { in: machineIds } },
      });
    }

    // mapa de fees: "machineId-paymentMethodId-brand"
    const feesMap = new Map<
      string,
      {
        machineId: number;
        paymentMethodId: number;
        brand: CardBrand;
        feePercentage: number;
      }
    >();

    machineFees.forEach((fee) => {
      const key = `${fee.machineId}-${fee.paymentMethodId}-${fee.brand}`;
      feesMap.set(key, {
        machineId: fee.machineId,
        paymentMethodId: fee.paymentMethodId,
        brand: fee.brand,
        feePercentage: fee.feePercentage,
      });
    });

    let paymentsTotal = 0;
    const paymentsToCreate: {
      paymentMethodId: number;
      machineId?: number;
      brand?: CardBrand;
      amount: number;
      feePercentage?: number;
      netAmount: number;
    }[] = [];

    for (const pay of data.payments) {
      if (pay.amount <= 0) {
        throw new BadRequestException('Valor de pagamento inválido.');
      }

      let brand: CardBrand | undefined = pay.brand;

      if (pay.machineId) {
        const machine = machineMap.get(pay.machineId);
        if (!machine) {
          throw new BadRequestException(
            `Maquininha com ID ${pay.machineId} não encontrada.`,
          );
        }

        if (!brand) {
          brand = CardBrand.OUTROS;
        }
      }

      let feePercentage = 0;

      if (pay.machineId && brand) {
        const key = `${pay.machineId}-${pay.paymentMethodId}-${brand}`;
        const fee = feesMap.get(key);

        if (fee) {
          feePercentage = fee.feePercentage;
        }
      }

      const netAmount = pay.amount - (pay.amount * feePercentage) / 100;

      paymentsTotal += pay.amount;

      paymentsToCreate.push({
        paymentMethodId: pay.paymentMethodId,
        machineId: pay.machineId,
        brand,
        amount: pay.amount,
        feePercentage,
        netAmount,
      });
    }

    // Modelo A: soma dos pagamentos deve bater com total da venda
    const diff = Math.abs(paymentsTotal - saleTotal);
    if (diff > 0.01) {
      throw new BadRequestException(
        `Soma dos pagamentos (${paymentsTotal.toFixed(
          2,
        )}) não bate com o total da venda (${saleTotal.toFixed(2)}).`,
      );
    }

    // 5. Transação final
    const result = await this.prisma.$transaction(async (tx) => {
      const sale = await tx.sale.create({
        data: {
          totalValue: saleTotal,
          notes: data.notes ?? null,
        },
      });

      await tx.saleItem.createMany({
        data: itemsToCreate.map((item) => ({
          saleId: sale.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        })),
      });

      await tx.salePayment.createMany({
        data: paymentsToCreate.map((p) => ({
          saleId: sale.id,
          paymentMethodId: p.paymentMethodId,
          machineId: p.machineId,
          brand: p.brand ?? null,
          amount: p.amount,
          feePercentage: p.feePercentage ?? null,
          netAmount: p.netAmount,
        })),
      });

      for (const item of itemsToCreate) {
        const product = productMap.get(item.productId)!;

        if (product.isStockTracked) {
          await tx.product.update({
            where: { id: product.id },
            data: {
              stockQuantity: product.stockQuantity - item.quantity,
            },
          });
          product.stockQuantity -= item.quantity;
        }
      }

      return tx.sale.findUnique({
        where: { id: sale.id },
        include: {
          payments: {
            include: {
              paymentMethod: true,
              machine: true,
            },
          },
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    });

    return result;
  }

  findAll() {
    return this.prisma.sale.findMany({
      orderBy: { saleDateTime: 'desc' },
      include: {
        payments: {
          include: {
            paymentMethod: true,
            machine: true,
          },
        },
        items: {
          include: { product: true },
        },
      },
    });
  }

  async findOne(id: number) {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: {
        payments: {
          include: {
            paymentMethod: true,
            machine: true,
          },
        },
        items: {
          include: { product: true },
        },
      },
    });

    if (!sale) {
      throw new NotFoundException('Venda não encontrada');
    }

    return sale;
  }

  async cancel(id: number, data: CancelSaleDto) {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!sale) {
      throw new NotFoundException('Venda não encontrada');
    }

    if (sale.isCanceled) {
      throw new BadRequestException('Venda já está cancelada.');
    }

    await this.prisma.$transaction(async (tx) => {
      // 1. Estorna estoque dos produtos
      for (const item of sale.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (product && product.isStockTracked) {
          await tx.product.update({
            where: { id: product.id },
            data: {
              stockQuantity: product.stockQuantity + item.quantity,
            },
          });
        }
      }

      // 2. Marca a venda como cancelada
      await tx.sale.update({
        where: { id },
        data: {
          isCanceled: true,
          canceledAt: new Date(),
          cancelReason: data.reason ?? null,
        },
      });
    });

    return { message: 'Venda cancelada com sucesso.' };
  }
}
