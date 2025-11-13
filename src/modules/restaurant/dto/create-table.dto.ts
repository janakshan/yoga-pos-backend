import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsInt,
  IsBoolean,
  IsObject,
  IsUUID,
  IsEnum,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TableStatus } from '../common/restaurant.constants';

class PositionDto {
  @ApiProperty({ example: 100, description: 'X coordinate on floor plan' })
  @IsNumber()
  x: number;

  @ApiProperty({ example: 200, description: 'Y coordinate on floor plan' })
  @IsNumber()
  y: number;
}

class ShapeDto {
  @ApiProperty({
    example: 'rectangle',
    enum: ['rectangle', 'circle', 'custom'],
    description: 'Shape type of the table',
  })
  @IsEnum(['rectangle', 'circle', 'custom'])
  type: 'rectangle' | 'circle' | 'custom';

  @ApiPropertyOptional({ example: 80, description: 'Width in pixels' })
  @IsNumber()
  @IsOptional()
  width?: number;

  @ApiPropertyOptional({ example: 80, description: 'Height in pixels' })
  @IsNumber()
  @IsOptional()
  height?: number;

  @ApiPropertyOptional({ example: 40, description: 'Radius in pixels for circle' })
  @IsNumber()
  @IsOptional()
  radius?: number;
}

class TableMetadataDto {
  @ApiPropertyOptional({ example: true, description: 'Has high chair available' })
  @IsBoolean()
  @IsOptional()
  hasHighChair?: boolean;

  @ApiPropertyOptional({ example: false, description: 'Wheelchair accessible' })
  @IsBoolean()
  @IsOptional()
  isWheelchairAccessible?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Window seat' })
  @IsBoolean()
  @IsOptional()
  isWindowSeat?: boolean;

  @ApiPropertyOptional({ example: false, description: 'Outdoor seating' })
  @IsBoolean()
  @IsOptional()
  isOutdoor?: boolean;

  @ApiPropertyOptional({
    example: { premium: true },
    description: 'Custom attributes',
  })
  @IsObject()
  @IsOptional()
  customAttributes?: Record<string, any>;
}

export class CreateTableDto {
  @ApiProperty({ example: 'T-1', description: 'Table number or identifier' })
  @IsString()
  tableNumber: string;

  @ApiProperty({ example: 4, description: 'Maximum seating capacity' })
  @IsInt()
  @Min(1)
  capacity: number;

  @ApiPropertyOptional({
    example: 2,
    description: 'Minimum seating capacity',
    default: 1,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  minCapacity?: number;

  @ApiPropertyOptional({
    example: TableStatus.AVAILABLE,
    enum: TableStatus,
    description: 'Initial table status',
    default: TableStatus.AVAILABLE,
  })
  @IsEnum(TableStatus)
  @IsOptional()
  status?: TableStatus;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Branch ID',
  })
  @IsUUID()
  branchId: string;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174001',
    description: 'Floor plan ID',
  })
  @IsUUID()
  @IsOptional()
  floorPlanId?: string;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174002',
    description: 'Section ID',
  })
  @IsUUID()
  @IsOptional()
  sectionId?: string;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174003',
    description: 'Assigned server/waiter ID',
  })
  @IsUUID()
  @IsOptional()
  assignedServerId?: string;

  @ApiPropertyOptional({
    example: { x: 100, y: 200 },
    description: 'Position on floor plan',
  })
  @ValidateNested()
  @Type(() => PositionDto)
  @IsOptional()
  position?: PositionDto;

  @ApiPropertyOptional({
    example: { type: 'rectangle', width: 80, height: 80 },
    description: 'Visual shape configuration',
  })
  @ValidateNested()
  @Type(() => ShapeDto)
  @IsOptional()
  shape?: ShapeDto;

  @ApiPropertyOptional({
    example: 'Notes about this table',
    description: 'Additional notes',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    example: { hasHighChair: true, isWindowSeat: true },
    description: 'Table metadata and features',
  })
  @ValidateNested()
  @Type(() => TableMetadataDto)
  @IsOptional()
  metadata?: TableMetadataDto;

  @ApiPropertyOptional({
    example: true,
    description: 'Is table active',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
