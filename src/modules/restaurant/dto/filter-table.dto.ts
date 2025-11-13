import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsInt,
  IsUUID,
  IsEnum,
  IsBoolean,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TableStatus } from '../common/restaurant.constants';

export class FilterTableDto {
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
    example: 'T-1',
    description: 'Search by table number',
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
    example: '123e4567-e89b-12d3-a456-426614174001',
    description: 'Filter by floor plan ID',
  })
  @IsUUID()
  @IsOptional()
  floorPlanId?: string;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174002',
    description: 'Filter by section ID',
  })
  @IsUUID()
  @IsOptional()
  sectionId?: string;

  @ApiPropertyOptional({
    example: TableStatus.AVAILABLE,
    enum: TableStatus,
    description: 'Filter by table status',
  })
  @IsEnum(TableStatus)
  @IsOptional()
  status?: TableStatus;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174003',
    description: 'Filter by assigned server ID',
  })
  @IsUUID()
  @IsOptional()
  assignedServerId?: string;

  @ApiPropertyOptional({
    example: 4,
    description: 'Minimum capacity required',
  })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  minCapacity?: number;

  @ApiPropertyOptional({
    example: 8,
    description: 'Maximum capacity required',
  })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  maxCapacity?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Filter by active status',
  })
  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: 'tableNumber',
    description: 'Sort by field',
    enum: ['tableNumber', 'capacity', 'status', 'createdAt', 'updatedAt'],
  })
  @IsString()
  @IsOptional()
  sortBy?: string = 'tableNumber';

  @ApiPropertyOptional({
    example: 'ASC',
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
  })
  @IsEnum(['ASC', 'DESC'])
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC' = 'ASC';
}
