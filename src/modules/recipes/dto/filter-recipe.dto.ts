import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsNumber,
  Min,
  IsArray,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export class FilterRecipeDto {
  @ApiPropertyOptional({ description: 'Search by name, code, or description' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Filter by difficulty level', enum: ['easy', 'medium', 'hard', 'expert'] })
  @IsOptional()
  @IsEnum(['easy', 'medium', 'hard', 'expert'])
  difficultyLevel?: string;

  @ApiPropertyOptional({ description: 'Filter by kitchen station' })
  @IsOptional()
  @IsString()
  kitchenStation?: string;

  @ApiPropertyOptional({ description: 'Filter by product ID' })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Filter by published status' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isPublished?: boolean;

  @ApiPropertyOptional({ description: 'Filter by tags (comma-separated)' })
  @IsOptional()
  @IsString()
  tags?: string;

  @ApiPropertyOptional({ description: 'Filter by allergens (comma-separated)' })
  @IsOptional()
  @IsString()
  allergens?: string;

  @ApiPropertyOptional({ description: 'Filter by dietary restrictions (comma-separated)' })
  @IsOptional()
  @IsString()
  dietaryRestrictions?: string;

  @ApiPropertyOptional({ description: 'Minimum total time in minutes' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  minTotalTime?: number;

  @ApiPropertyOptional({ description: 'Maximum total time in minutes' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  maxTotalTime?: number;

  @ApiPropertyOptional({ description: 'Minimum cost' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  minCost?: number;

  @ApiPropertyOptional({ description: 'Maximum cost' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  maxCost?: number;

  @ApiPropertyOptional({
    description: 'Sort field',
    enum: ['name', 'code', 'totalTime', 'totalCost', 'createdAt', 'updatedAt'],
    default: 'createdAt',
  })
  @IsOptional()
  @IsEnum(['name', 'code', 'totalTime', 'totalCost', 'createdAt', 'updatedAt'])
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort order', enum: ['ASC', 'DESC'], default: 'DESC' })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC';

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  limit?: number;
}
