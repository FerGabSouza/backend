import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryStatusDto } from './dto/update-category-status.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import {
  CategoryDeleteResponse,
  CategoryListResponse,
  CategoryResponse,
  CategoryStatusResponse,
} from './responses/category.response';
import { SwaggerDescriptions } from '../common/swagger/swagger.constants';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({
    summary: 'Create category',
    description: SwaggerDescriptions.category.create,
  })
  @ApiResponse({
    status: 201,
    description: 'Category created successfully.',
    type: CategoryResponse,
  })
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List categories',
    description: 'Returns all registered categories ordered by name.',
  })
  @ApiResponse({
    status: 200,
    description: 'Categories returned successfully.',
    type: CategoryListResponse,
    isArray: true,
  })
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Find category by ID',
    description: 'Returns a category with its related products.',
  })
  @ApiParam({
    name: 'id',
    example: 1,
    description: 'Category ID.',
  })
  @ApiResponse({
    status: 200,
    description: 'Category found successfully.',
    type: CategoryResponse,
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update category status',
    description:
      'Activates or deactivates a category and applies the same status to all products in that category.',
  })
  @ApiParam({
    name: 'id',
    example: 1,
    description: 'Category ID.',
  })
  @ApiResponse({
    status: 200,
    description: 'Category status updated successfully.',
    type: CategoryStatusResponse,
  })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryStatusDto,
  ) {
    return this.categoriesService.updateStatus(id, dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update category',
    description: 'Updates category information.',
  })
  @ApiParam({
    name: 'id',
    example: 1,
    description: 'Category ID.',
  })
  @ApiResponse({
    status: 200,
    description: 'Category updated successfully.',
    type: CategoryResponse,
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete category',
    description: 'Deletes a category only if it has no linked products.',
  })
  @ApiParam({
    name: 'id',
    example: 1,
    description: 'Category ID.',
  })
  @ApiResponse({
    status: 200,
    description: 'Category deleted successfully.',
    type: CategoryDeleteResponse,
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.remove(id);
  }
}
