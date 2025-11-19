import { IsInt, IsPositive } from 'class-validator';

export class CreateSaleItemDto {
  @IsInt()
  @IsPositive()
  productId: number;

  @IsPositive()
  quantity: number;
}
