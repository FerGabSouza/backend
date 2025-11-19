import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @IsPositive()
  categoryId: number;

  @IsNumber()
  @IsPositive()
  salePrice: number;

  @IsNumber()
  @IsOptional()
  costPrice?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  isStockTracked?: boolean;

  @IsNumber()
  @IsOptional()
  stockQuantity?: number;
}
