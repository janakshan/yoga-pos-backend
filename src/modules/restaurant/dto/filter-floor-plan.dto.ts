import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsInt,
  IsUUID,
  IsBoolean,
  IsEnum,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class FilterFloorPlanDto {
  @ApiPropertyOptional({ example: 1, description: 'Page number', default: 1 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    example: 20,
    description: 'Items per page',
    default: 20,
  })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({
    example: 'Main Dining',
    description: 'Search by floor plan name',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Filter by branch ID',
  })
  @IsUUID()
  @IsOptional()
  branchId?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Filter by active status',
  })
  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Filter by default status',
  })
  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional({
    example: 'displayOrder',
    description: 'Sort by field',
    enum: ['name', 'displayOrder', 'createdAt', 'updatedAt'],
  })
  @IsString()
  @IsOptional()
  sortBy?: string = 'displayOrder';

  @ApiPropertyOptional({
    example: 'ASC',
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
  })
  @IsEnum(['ASC', 'DESC'])
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC' = 'ASC';
}
