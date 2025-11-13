import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsArray } from 'class-validator';

export class CalculateCostDto {
  @ApiPropertyOptional({ description: 'Specific recipe IDs to recalculate (if empty, calculates all)' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  recipeIds?: string[];
}

export class CostBreakdownDto {
  @ApiPropertyOptional({ description: 'Include ingredient-level breakdown', default: true })
  @IsOptional()
  includeIngredients?: boolean;

  @ApiPropertyOptional({ description: 'Include cost per serving', default: true })
  @IsOptional()
  includePerServing?: boolean;
}
