import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateProductDto) {
    // Verifica se a categoria existe
    const category = await this.prisma.category.findUnique({
      where: { id: data.categoryId },
    });

    if (!category) {
      throw new BadRequestException('Categoria não encontrada');
    }

    return this.prisma.product.create({
      data: {
        name: data.name,
        categoryId: data.categoryId,
        salePrice: data.salePrice,
        costPrice: data.costPrice ?? null,
        isActive: data.isActive ?? true,
        isStockTracked: data.isStockTracked ?? true,
        stockQuantity: data.stockQuantity ?? 0,
      },
    });
  }

  findAll() {
    return this.prisma.product.findMany({
      include: {
        category: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!product) throw new NotFoundException('Produto não encontrado');

    return product;
  }

  async update(id: number, data: UpdateProductDto) {
    await this.findOne(id); // garante que existe

    return this.prisma.product.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    await this.prisma.product.delete({
      where: { id },
    });

    return { message: 'Produto removido com sucesso' };
  }
}
