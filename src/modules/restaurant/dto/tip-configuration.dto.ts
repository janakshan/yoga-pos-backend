import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsArray,
  IsOptional,
  Min,
  Max,
  ArrayMinSize,
} from 'class-validator';

export class UpdateTipConfigurationDto {
  @ApiPropertyOptional({
    description: 'Whether tipping is enabled',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({
    description: 'Default tip percentage',
    example: 15,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  defaultPercentage?: number;

  @ApiPropertyOptional({
    description: 'Suggested tip percentages',
    example: [10, 15, 18, 20],
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsNumber({}, { each: true })
  suggestions?: number[];

  @ApiPropertyOptional({
    description: 'Minimum tip amount',
    example: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minAmount?: number;

  @ApiPropertyOptional({
    description: 'Maximum tip amount',
    example: 1000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxAmount?: number;

  @ApiPropertyOptional({
    description: 'Whether custom tips are allowed',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  allowCustomTip?: boolean;

  @ApiPropertyOptional({
    description: 'Whether to calculate tip on pre-tax amount',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  tipOnPreTax?: boolean;
}

export class TipConfigurationResponseDto {
  @ApiProperty({
    description: 'Whether tipping is enabled',
    example: true,
  })
  enabled: boolean;

  @ApiPropertyOptional({
    description: 'Default tip percentage',
    example: 15,
  })
  defaultPercentage?: number;

  @ApiProperty({
    description: 'Suggested tip percentages',
    example: [10, 15, 18, 20],
    type: [Number],
  })
  suggestions: number[];

  @ApiPropertyOptional({
    description: 'Minimum tip amount',
    example: 0,
  })
  minAmount?: number;

  @ApiPropertyOptional({
    description: 'Maximum tip amount',
    example: 1000,
  })
  maxAmount?: number;

  @ApiProperty({
    description: 'Whether custom tips are allowed',
    example: true,
  })
  allowCustomTip: boolean;

  @ApiPropertyOptional({
    description: 'Whether to calculate tip on pre-tax amount',
    example: true,
  })
  tipOnPreTax?: boolean;
}
