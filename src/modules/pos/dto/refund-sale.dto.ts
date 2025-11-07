import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, Min, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class RefundItemDto {
  @ApiProperty({ example: 'uuid', description: 'Product ID' })
  @IsString()
  productId: string;

  @ApiProperty({ example: 2, description: 'Quantity to refund' })
  @IsNumber()
  @Min(0)
  quantity: number;
}

export class RefundSaleDto {
  @ApiPropertyOptional({ type: [RefundItemDto], description: 'Items to refund (if partial refund)' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RefundItemDto)
  @IsOptional()
  items?: RefundItemDto[];

  @ApiPropertyOptional({ example: 'Customer requested refund', description: 'Refund reason' })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({ example: 'Additional notes', description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}
