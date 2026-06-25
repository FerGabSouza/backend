import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateCategoryStatusDto {
  @ApiProperty({
    example: false,
    description: 'Define se a categoria ficará ativa ou inativa.',
  })
  @IsBoolean({
    message: 'O campo isActive deve ser verdadeiro ou falso.',
  })
  isActive: boolean;
}