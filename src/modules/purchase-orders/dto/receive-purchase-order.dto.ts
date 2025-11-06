import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  IsDateString,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ReceivePurchaseOrderItemDto {
  @ApiProperty({ example: 'prod_001', description: 'Product ID' })
  @IsString()
  productId: string;

  @ApiProperty({ example: 50, description: 'Quantity received' })
  @IsNumber()
  @Min(0)
  quantityReceived: number;
}

export class ReceivePurchaseOrderDto {
  @ApiProperty({
    type: [ReceivePurchaseOrderItemDto],
    description: 'Items received',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceivePurchaseOrderItemDto)
  items: ReceivePurchaseOrderItemDto[];

  @ApiPropertyOptional({
    example: '2025-11-10',
    description: 'Actual delivery date',
  })
  @IsDateString()
  @IsOptional()
  actualDelivery?: Date;

  @ApiPropertyOptional({
    example: 'Received in good condition',
    description: 'Receipt notes',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
