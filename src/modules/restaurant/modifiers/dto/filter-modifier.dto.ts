import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  IsBoolean,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class FilterModifierDto {
  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Filter by branch ID',
  })
  @IsUUID()
  @IsOptional()
  branchId?: string;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174001',
    description: 'Filter by modifier group ID',
  })
  @IsUUID()
  @IsOptional()
  modifierGroupId?: string;

  @ApiPropertyOptional({
    example: 'cheese',
    description: 'Search by name',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Filter by active status',
  })
  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Filter by availability',
  })
  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  isAvailable?: boolean;

  @ApiPropertyOptional({
    example: 1,
    description: 'Page number',
    default: 1,
  })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({
    example: 20,
    description: 'Items per page',
    default: 20,
  })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({
    example: 'sortOrder',
    description: 'Sort field',
    default: 'sortOrder',
  })
  @IsString()
  @IsOptional()
  sortBy?: string;

  @ApiPropertyOptional({
    example: 'ASC',
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
    default: 'ASC',
  })
  @IsString()
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC';
}
