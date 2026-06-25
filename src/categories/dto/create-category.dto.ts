import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  MaxLength,
  Matches,
  MinLength,
} from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({
    example: 'Drinks',
    description: 'Nome da categoria.',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty({
    message: 'O nome da categoria é obrigatório',
  })
  @MinLength(2, {
    message: 'O nome da categoria deve ter pelo menos 2 caracteres',
  })
  @MaxLength(50, {
    message: 'O nome da categoria deve ter no máximo 50 caracteres',
  })
  @Matches(/\S/, {
    message: 'O nome da categoria não pode conter apenas espaços',
  })
  name: string;
}
