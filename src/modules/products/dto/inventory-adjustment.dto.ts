import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional } from 'class-validator';

export class InventoryAdjustmentDto {
  @ApiProperty({
    example: 10,
    description: 'Quantity to adjust (positive for addition, negative for subtraction)',
  })
  @IsNumber()
  quantity: number;

  @ApiPropertyOptional({
    example: 'Stock count correction',
    description: 'Reason for the adjustment',
  })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({
    example: 'manual',
    description: 'Type of adjustment',
  })
  @IsString()
  @IsOptional()
  type?: string;
}
