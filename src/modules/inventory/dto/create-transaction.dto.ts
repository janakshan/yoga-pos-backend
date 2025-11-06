import { IsString, IsEnum, IsNumber, IsOptional, IsDate, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { TransactionType } from '../entities/inventory-transaction.entity';

export class CreateTransactionDto {
  @IsString()
  productId: string;

  @IsOptional()
  @IsString()
  productName?: string;

  @IsOptional()
  @IsString()
  productSku?: string;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsNumber()
  quantity: number;

  @IsNumber()
  unitCost: number;

  @IsOptional()
  @IsString()
  locationId?: string;

  @IsOptional()
  @IsString()
  locationName?: string;

  @IsOptional()
  @IsString()
  batchNumber?: string;

  @IsOptional()
  @IsString()
  serialNumber?: string;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @IsOptional()
  @IsString()
  referenceType?: string;

  @IsOptional()
  @IsString()
  referenceId?: string;

  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsDateString()
  transactionDate: string;
}
