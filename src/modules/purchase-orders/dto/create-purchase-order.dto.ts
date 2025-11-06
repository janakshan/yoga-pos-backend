import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  IsDateString,
  ValidateNested,
  IsObject,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePurchaseOrderItemDto {
  @ApiProperty({ example: 'prod_001', description: 'Product ID' })
  @IsString()
  productId: string;

  @ApiProperty({ example: 'Yoga Mat Premium', description: 'Product name' })
  @IsString()
  productName: string;

  @ApiPropertyOptional({ example: 'YM-001', description: 'Product SKU' })
  @IsString()
  @IsOptional()
  productSku?: string;

  @ApiProperty({ example: 50, description: 'Quantity ordered' })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 25.0, description: 'Unit price' })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional({ example: 0, description: 'Discount amount' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  discount?: number;

  @ApiPropertyOptional({ example: 0, description: 'Tax amount' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  tax?: number;

  @ApiPropertyOptional({
    example: 'Special handling required',
    description: 'Item notes',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreatePurchaseOrderDto {
  @ApiProperty({ example: 'sup_001', description: 'Supplier ID' })
  @IsString()
  supplierId: string;

  @ApiProperty({
    type: [CreatePurchaseOrderItemDto],
    description: 'Purchase order items',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseOrderItemDto)
  items: CreatePurchaseOrderItemDto[];

  @ApiPropertyOptional({
    example: '2025-11-15',
    description: 'Expected delivery date',
  })
  @IsDateString()
  @IsOptional()
  expectedDelivery?: Date;

  @ApiPropertyOptional({
    example: 'branch_001',
    description: 'Branch ID',
  })
  @IsString()
  @IsOptional()
  branchId?: string;

  @ApiPropertyOptional({
    example: 'loc_001',
    description: 'Location/warehouse ID',
  })
  @IsString()
  @IsOptional()
  locationId?: string;

  @ApiPropertyOptional({
    example: 'Main Warehouse',
    description: 'Location name',
  })
  @IsString()
  @IsOptional()
  locationName?: string;

  @ApiPropertyOptional({
    example: 100.0,
    description: 'Shipping cost',
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  shippingCost?: number;

  @ApiPropertyOptional({
    example: 50.0,
    description: 'Discount amount',
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  discountAmount?: number;

  @ApiPropertyOptional({
    example: 'Bulk order discount applied',
    description: 'Notes',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    example: 'Payment due within 30 days',
    description: 'Terms and conditions',
  })
  @IsString()
  @IsOptional()
  terms?: string;

  @ApiPropertyOptional({
    example: {},
    description: 'Custom fields',
  })
  @IsObject()
  @IsOptional()
  customFields?: any;
}
