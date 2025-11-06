import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateInvoiceItemDto {
  @ApiPropertyOptional({ example: 'uuid', description: 'Product ID (optional)' })
  @IsUUID()
  @IsOptional()
  productId?: string;

  @ApiProperty({ example: 'Yoga Mat Premium', description: 'Item description' })
  @IsString()
  description: string;

  @ApiProperty({ example: 2, description: 'Quantity' })
  @IsNumber()
  @Min(0.001)
  quantity: number;

  @ApiProperty({ example: 100.00, description: 'Unit price' })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional({ example: 10.00, description: 'Discount amount' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  discount?: number;

  @ApiPropertyOptional({ example: 5.00, description: 'Tax amount' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  tax?: number;
}
