import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { TransactionType, TransactionStatus } from '../entities/inventory-transaction.entity';

export class QueryTransactionDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @IsOptional()
  @IsString()
  locationId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  batchNumber?: string;

  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC';
}
