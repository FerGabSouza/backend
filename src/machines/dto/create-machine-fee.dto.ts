import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  Min,
} from 'class-validator';
import { CardBrand } from '@prisma/client';

export class CreateMachineFeeDto {
  @IsInt()
  @IsPositive()
  paymentMethodId: number;

  // Bandeira opcional (pra PIX, DINHEIRO, etc.)
  @IsOptional()
  @IsEnum(CardBrand)
  brand?: CardBrand;

  // Permite 0, mas não permite negativo
  @IsNumber()
  @Min(0)
  feePercentage: number;
}
