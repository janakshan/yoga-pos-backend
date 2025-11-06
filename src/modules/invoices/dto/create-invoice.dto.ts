import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
  IsEnum,
  IsArray,
  ValidateNested,
  IsDateString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InvoiceStatus } from '../entities/invoice.entity';
import { CreateInvoiceItemDto } from './create-invoice-item.dto';

export class CreateInvoiceDto {
  @ApiPropertyOptional({ example: 'uuid', description: 'Sale ID (if created from sale)' })
  @IsUUID()
  @IsOptional()
  saleId?: string;

  @ApiProperty({ example: 'uuid', description: 'Customer ID' })
  @IsUUID()
  customerId: string;

  @ApiProperty({ example: 'uuid', description: 'Branch ID' })
  @IsUUID()
  branchId: string;

  @ApiProperty({
    type: [CreateInvoiceItemDto],
    description: 'Invoice items',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items: CreateInvoiceItemDto[];

  @ApiPropertyOptional({ example: 100.00, description: 'Discount amount' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  discount?: number;

  @ApiPropertyOptional({
    enum: InvoiceStatus,
    example: InvoiceStatus.DRAFT,
    description: 'Invoice status',
  })
  @IsEnum(InvoiceStatus)
  @IsOptional()
  status?: InvoiceStatus;

  @ApiPropertyOptional({ example: '2025-11-06T00:00:00Z', description: 'Due date' })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional({ example: 'Payment terms and conditions', description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ example: 'Net 30 days', description: 'Payment terms' })
  @IsString()
  @IsOptional()
  terms?: string;
}
