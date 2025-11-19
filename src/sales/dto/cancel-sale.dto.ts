import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CancelSaleDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  reason?: string;
}
