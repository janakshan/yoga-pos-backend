import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn } from 'class-validator';

export class GenerateBarcodeDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Product ID to generate barcode for',
  })
  @IsString()
  productId: string;

  @ApiPropertyOptional({
    example: 'EAN13',
    description: 'Barcode format',
    enum: ['EAN13', 'CODE128', 'UPC'],
  })
  @IsString()
  @IsOptional()
  @IsIn(['EAN13', 'CODE128', 'UPC'])
  format?: string;
}
