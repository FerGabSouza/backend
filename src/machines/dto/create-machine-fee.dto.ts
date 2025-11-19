import { IsEnum, IsInt, IsNumber, IsPositive } from 'class-validator';
import { CardBrand } from '@prisma/client';

export class CreateMachineFeeDto {
  @IsInt()
  @IsPositive()
  paymentMethodId: number; // ex: DÉBITO, CRÉDITO, PIX

  @IsEnum(CardBrand)
  brand: CardBrand;        // VISA, MASTERCARD, OUTROS...

  @IsNumber()
  @IsPositive()
  feePercentage: number;   // ex: 1.99
}
