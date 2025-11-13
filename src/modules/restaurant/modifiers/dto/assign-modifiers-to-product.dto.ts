import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';

export class AssignModifiersToProductDto {
  @ApiProperty({
    example: ['123e4567-e89b-12d3-a456-426614174000', '123e4567-e89b-12d3-a456-426614174001'],
    description: 'Array of modifier group IDs to assign to the product',
  })
  @IsArray()
  @IsUUID('4', { each: true })
  modifierGroupIds: string[];
}
