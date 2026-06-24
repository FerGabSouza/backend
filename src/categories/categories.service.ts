import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { UpdateCategoryStatusDto } from './dto/update-category-status.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateCategoryDto) {
    try {
      return await this.prisma.category.create({
        data,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            `Já existe uma categoria com o nome '${data.name}'`,
          );
        }
      }
      throw error;
    }
  }

  findAll() {
    return this.prisma.category.findMany({
      include: {
        products: true,
      },
    });
  }

  async findOne(id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { products: true },
    });

    if (!category) {
      throw new NotFoundException('Categoria não encontrada');
    }

    return category;
  }

  async update(id: number, data: UpdateCategoryDto) {
    await this.findOne(id);

    try {
      return await this.prisma.category.update({
        where: { id },
        data,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
              `Já existe uma categoria com o nome '${data.name}'`,
          );
        }
      }

      throw error;
    }
  }

  async updateStatus(id: number, data: UpdateCategoryStatusDto) {
    await this.findOne(id);

    const [category] = await this.prisma.$transaction([
      this.prisma.category.update({
        where: { id },
        data: {
          isActive: data.isActive,
        },
      }),

      this.prisma.product.updateMany({
        where: {
          categoryId: id,
        },
        data: {
          isActive: data.isActive,
        },
      }),
    ]);

    return {
      message: data.isActive
          ? 'Categoria ativada com sucesso'
          : 'Categoria pausada com sucesso',
      category,
    };
  }

  async remove(id: number) {
    const category = await this.findOne(id);

    if (category.products.length > 0) {
      throw new BadRequestException(
        'Não é possível excluir uma categoria que possui produtos.',
      );
    }

    await this.prisma.category.delete({ where: { id } });

    return { message: 'Categoria removida com sucesso' };
  }
}
