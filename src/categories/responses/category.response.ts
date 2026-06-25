import { ApiProperty } from '@nestjs/swagger';

export class CategoryCountResponse {
  @ApiProperty({ example: 3 })
  products: number;
}

export class CategoryResponse {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Drinks' })
  name: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2026-06-24T22:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-06-24T22:00:00.000Z' })
  updatedAt: Date;
}

export class CategoryListResponse {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Drinks' })
  name: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ type: CategoryCountResponse })
  _count: CategoryCountResponse;

  @ApiProperty({ example: '2026-06-24T22:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-06-24T22:00:00.000Z' })
  updatedAt: Date;
}

export class CategoryStatusResponse {
  @ApiProperty({ example: 'Categoria pausada com sucesso' })
  message: string;

  @ApiProperty({ type: CategoryResponse })
  category: CategoryResponse;
}

export class CategoryDeleteResponse {
  @ApiProperty({ example: 'Categoria removida com sucesso' })
  message: string;
}
