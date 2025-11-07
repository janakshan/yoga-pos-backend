import { IsArray, IsString, IsUUID, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BulkStatusUpdateDto {
  @ApiProperty({ description: 'Array of customer IDs to update' })
  @IsArray()
  @IsUUID('4', { each: true })
  customerIds: string[];

  @ApiProperty({ description: 'New status value', example: 'active' })
  @IsString()
  status: string;
}

export class UpdatePurchaseStatsDto {
  @ApiProperty({ description: 'Purchase amount to add', example: 150.50 })
  @IsNumber()
  purchaseAmount: number;

  @ApiPropertyOptional({ description: 'Order/transaction reference' })
  @IsString()
  @IsOptional()
  referenceNumber?: string;
}
