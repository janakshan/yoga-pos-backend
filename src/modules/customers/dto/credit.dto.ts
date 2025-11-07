import { IsNumber, IsString, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreditChargeDto {
  @ApiProperty({ description: 'Amount to charge to customer credit', example: 50.00 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ description: 'Description of the charge' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Reference number (invoice/order ID)' })
  @IsString()
  @IsOptional()
  referenceNumber?: string;

  @ApiPropertyOptional({ description: 'User who processed the transaction' })
  @IsString()
  @IsOptional()
  processedBy?: string;
}

export class CreditPaymentDto {
  @ApiProperty({ description: 'Payment amount', example: 50.00 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ description: 'Description of the payment' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Payment reference number' })
  @IsString()
  @IsOptional()
  referenceNumber?: string;

  @ApiPropertyOptional({ description: 'User who processed the transaction' })
  @IsString()
  @IsOptional()
  processedBy?: string;
}

export class UpdateCreditLimitDto {
  @ApiProperty({ description: 'New credit limit', example: 1000.00 })
  @IsNumber()
  @Min(0)
  creditLimit: number;
}
