import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsInt,
  IsBoolean,
  IsArray,
  IsObject,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'YM-001', description: 'Product SKU (Stock Keeping Unit)' })
  @IsString()
  sku: string;

  @ApiProperty({ example: 'Premium Yoga Mat', description: 'Product name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: 'High-quality eco-friendly yoga mat',
    description: 'Product description',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Category ID',
  })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174001',
    description: 'Subcategory ID',
  })
  @IsUUID()
  @IsOptional()
  subcategoryId?: string;

  @ApiProperty({ example: 49.99, description: 'Base product price' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({
    example: { retail: 49.99, wholesale: 39.99, member: 44.99 },
    description: 'Pricing tiers for different customer types',
  })
  @IsObject()
  @IsOptional()
  pricing?: {
    retail: number;
    wholesale: number;
    member: number;
  };

  @ApiProperty({ example: 30.0, description: 'Product cost/purchase price' })
  @IsNumber()
  @Min(0)
  cost: number;

  @ApiPropertyOptional({ example: 100, description: 'Current stock quantity' })
  @IsInt()
  @IsOptional()
  stockQuantity?: number;

  @ApiPropertyOptional({ example: 10, description: 'Low stock alert threshold' })
  @IsInt()
  @IsOptional()
  lowStockThreshold?: number;

  @ApiPropertyOptional({ example: 'piece', description: 'Unit of measurement' })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiPropertyOptional({ example: '1234567890123', description: 'Product barcode' })
  @IsString()
  @IsOptional()
  barcode?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/images/product.jpg',
    description: 'Main product image URL',
  })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({
    example: ['https://example.com/images/1.jpg', 'https://example.com/images/2.jpg'],
    description: 'Additional product image URLs',
  })
  @IsArray()
  @IsOptional()
  imageUrls?: string[];

  @ApiPropertyOptional({
    example: 'active',
    description: 'Product status',
    enum: ['active', 'inactive', 'discontinued'],
  })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({
    example: ['yoga', 'mat', 'eco-friendly'],
    description: 'Product tags for search',
  })
  @IsArray()
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({
    example: [
      { name: 'Color', value: 'Blue' },
      { name: 'Material', value: 'TPE' },
    ],
    description: 'Product attributes',
  })
  @IsArray()
  @IsOptional()
  attributes?: any[];

  @ApiPropertyOptional({ example: true, description: 'Track inventory for this product' })
  @IsBoolean()
  @IsOptional()
  trackInventory?: boolean;

  @ApiPropertyOptional({ example: false, description: 'Allow backorders when out of stock' })
  @IsBoolean()
  @IsOptional()
  allowBackorder?: boolean;

  @ApiPropertyOptional({ example: 10.0, description: 'Tax rate percentage' })
  @IsNumber()
  @IsOptional()
  taxRate?: number;

  @ApiPropertyOptional({ example: 'Acme Supplies', description: 'Supplier name' })
  @IsString()
  @IsOptional()
  supplier?: string;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174002',
    description: 'Supplier ID',
  })
  @IsUUID()
  @IsOptional()
  supplierId?: string;

  @ApiPropertyOptional({ example: false, description: 'Is this a product bundle' })
  @IsBoolean()
  @IsOptional()
  isBundle?: boolean;

  @ApiPropertyOptional({
    example: { products: [{ id: 'prod-id', quantity: 2 }] },
    description: 'Bundle configuration',
  })
  @IsObject()
  @IsOptional()
  bundle?: any;

  @ApiPropertyOptional({
    example: { warranty: '2 years', origin: 'USA' },
    description: 'Custom product fields',
  })
  @IsObject()
  @IsOptional()
  customFields?: any;
}
