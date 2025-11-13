import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsEnum,
  IsOptional,
  Min,
  Max,
  ValidateIf,
} from 'class-validator';

export enum TipMethod {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
  CUSTOM = 'custom',
  NONE = 'none',
}

export class CalculateTipDto {
  @ApiProperty({
    description: 'Subtotal amount (before tax)',
    example: 100.00,
  })
  @IsNumber()
  @Min(0)
  subtotal: number;

  @ApiProperty({
    description: 'Order total (subtotal + tax + other charges)',
    example: 110.00,
  })
  @IsNumber()
  @Min(0)
  orderTotal: number;

  @ApiPropertyOptional({
    description: 'Tax amount',
    example: 10.00,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  tax?: number;

  @ApiProperty({
    description: 'Method of tip calculation',
    enum: TipMethod,
    example: TipMethod.PERCENTAGE,
  })
  @IsEnum(TipMethod)
  tipMethod: TipMethod;

  @ApiPropertyOptional({
    description: 'Tip percentage (0-100) - required if tipMethod is percentage',
    example: 15,
    minimum: 0,
    maximum: 100,
  })
  @ValidateIf((o) => o.tipMethod === TipMethod.PERCENTAGE)
  @IsNumber()
  @Min(0)
  @Max(100)
  tipPercentage?: number;

  @ApiPropertyOptional({
    description: 'Fixed tip amount - required if tipMethod is fixed or custom',
    example: 15.00,
  })
  @ValidateIf((o) => o.tipMethod === TipMethod.FIXED || o.tipMethod === TipMethod.CUSTOM)
  @IsNumber()
  @Min(0)
  tipAmount?: number;
}
