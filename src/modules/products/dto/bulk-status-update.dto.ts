import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsIn } from 'class-validator';

export class BulkStatusUpdateDto {
  @ApiProperty({
    example: ['123e4567-e89b-12d3-a456-426614174000', '123e4567-e89b-12d3-a456-426614174001'],
    description: 'Array of product IDs to update',
  })
  @IsArray()
  productIds: string[];

  @ApiProperty({
    example: 'active',
    description: 'New status for products',
    enum: ['active', 'inactive', 'discontinued'],
  })
  @IsString()
  @IsIn(['active', 'inactive', 'discontinued'])
  status: string;
}
