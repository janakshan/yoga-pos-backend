import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
  IsEnum,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentStatus, SaleType } from '../entities/sale.entity';
import { CreateSaleItemDto } from './create-sale-item.dto';

export class CreateSaleDto {
  @ApiPropertyOptional({ example: 'uuid', description: 'Customer ID' })
  @IsUUID()
  @IsOptional()
  customerId?: string;

  @ApiProperty({ example: 'uuid', description: 'Branch ID' })
  @IsUUID()
  branchId: string;

  @ApiProperty({
    type: [CreateSaleItemDto],
    description: 'Sale items',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDto)
  items: CreateSaleItemDto[];

  @ApiPropertyOptional({ example: 100.00, description: 'Discount amount' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  discount?: number;

  @ApiPropertyOptional({
    enum: PaymentStatus,
    example: PaymentStatus.PENDING,
    description: 'Payment status',
  })
  @IsEnum(PaymentStatus)
  @IsOptional()
  paymentStatus?: PaymentStatus;

  @ApiPropertyOptional({
    enum: SaleType,
    example: SaleType.SALE,
    description: 'Sale type',
  })
  @IsEnum(SaleType)
  @IsOptional()
  saleType?: SaleType;

  @ApiPropertyOptional({ example: 'Customer notes', description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}
