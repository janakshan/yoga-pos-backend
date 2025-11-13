import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  IsBoolean,
  IsNumber,
  Min,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  ModifierGroupType,
  ModifierSelectionType,
} from '../entities/modifier-group.entity';

export class FilterModifierGroupDto {
  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Filter by branch ID',
  })
  @IsUUID()
  @IsOptional()
  branchId?: string;

  @ApiPropertyOptional({
    example: 'toppings',
    description: 'Search by name',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    example: 'toppings',
    description: 'Filter by category',
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({
    enum: ModifierGroupType,
    description: 'Filter by type (required/optional)',
  })
  @IsEnum(ModifierGroupType)
  @IsOptional()
  type?: ModifierGroupType;

  @ApiPropertyOptional({
    enum: ModifierSelectionType,
    description: 'Filter by selection type (single/multiple)',
  })
  @IsEnum(ModifierSelectionType)
  @IsOptional()
  selectionType?: ModifierSelectionType;

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
    description: 'Show in POS',
  })
  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  showInPos?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Show in online menu',
  })
  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  showInOnlineMenu?: boolean;

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
