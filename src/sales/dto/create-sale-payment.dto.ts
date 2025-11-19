import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
} from 'class-validator';
import { CardBrand } from '@prisma/client';

export class CreateSalePaymentDto {
  @IsInt()
  @IsPositive()
  paymentMethodId: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  machineId?: number;

  @IsOptional()
  @IsEnum(CardBrand)
  brand?: CardBrand;

  @IsNumber()
  @IsPositive()
  amount: number;
}
