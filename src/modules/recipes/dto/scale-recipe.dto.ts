import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, Min, IsOptional, IsBoolean } from 'class-validator';

export class ScaleRecipeDto {
  @ApiProperty({ description: 'Scale factor (e.g., 2 for double, 0.5 for half)', example: 2 })
  @IsNumber()
  @Min(0.01)
  scaleFactor: number;

  @ApiPropertyOptional({ description: 'Recalculate costs based on current ingredient prices', default: false })
  @IsOptional()
  @IsBoolean()
  recalculateCosts?: boolean;
}

export class ScaleRecipeByYieldDto {
  @ApiProperty({ description: 'Desired yield quantity', example: 10 })
  @IsNumber()
  @Min(0.01)
  desiredYield: number;

  @ApiPropertyOptional({ description: 'Recalculate costs based on current ingredient prices', default: false })
  @IsOptional()
  @IsBoolean()
  recalculateCosts?: boolean;
}
