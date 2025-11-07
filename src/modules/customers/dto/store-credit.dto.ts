import { IsNumber, IsString, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddStoreCreditDto {
  @ApiProperty({ description: 'Amount to add to store credit', example: 25.00 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ description: 'Description/reason for adding credit' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Reference number' })
  @IsString()
  @IsOptional()
  referenceNumber?: string;

  @ApiPropertyOptional({ description: 'User who processed the transaction' })
  @IsString()
  @IsOptional()
  processedBy?: string;

  @ApiPropertyOptional({ description: 'Expiration date for store credit' })
  @IsString()
  @IsOptional()
  expiresAt?: string;
}

export class DeductStoreCreditDto {
  @ApiProperty({ description: 'Amount to deduct from store credit', example: 10.00 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ description: 'Description/reason for deducting credit' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Reference number' })
  @IsString()
  @IsOptional()
  referenceNumber?: string;

  @ApiPropertyOptional({ description: 'User who processed the transaction' })
  @IsString()
  @IsOptional()
  processedBy?: string;
}

export class RedeemLoyaltyDto {
  @ApiProperty({ description: 'Loyalty points to redeem', example: 100 })
  @IsInt()
  @Min(1)
  points: number;

  @ApiProperty({ description: 'Store credit amount to receive', example: 10.00 })
  @IsNumber()
  @Min(0.01)
  creditAmount: number;

  @ApiPropertyOptional({ description: 'Description of redemption' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'User who processed the transaction' })
  @IsString()
  @IsOptional()
  processedBy?: string;
}
