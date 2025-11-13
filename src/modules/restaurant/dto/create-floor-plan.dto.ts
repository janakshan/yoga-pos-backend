import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsInt,
  IsBoolean,
  IsObject,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class FloorPlanLayoutDto {
  @ApiProperty({ example: 1200, description: 'Width of floor plan in pixels' })
  @IsNumber()
  width: number;

  @ApiProperty({ example: 800, description: 'Height of floor plan in pixels' })
  @IsNumber()
  height: number;

  @ApiPropertyOptional({
    example: 20,
    description: 'Grid size in pixels for snapping',
  })
  @IsNumber()
  @IsOptional()
  gridSize?: number;

  @ApiPropertyOptional({
    example: 'https://example.com/floor-plan-bg.jpg',
    description: 'Background image URL',
  })
  @IsString()
  @IsOptional()
  backgroundImage?: string;

  @ApiPropertyOptional({
    example: '#f5f5f5',
    description: 'Background color',
  })
  @IsString()
  @IsOptional()
  backgroundColor?: string;
}

class FloorPlanSettingsDto {
  @ApiPropertyOptional({
    example: false,
    description: 'Enable auto layout for tables',
  })
  @IsBoolean()
  @IsOptional()
  enableAutoLayout?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Show grid lines on floor plan',
  })
  @IsBoolean()
  @IsOptional()
  showGridLines?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Snap tables to grid when dragging',
  })
  @IsBoolean()
  @IsOptional()
  snapToGrid?: boolean;

  @ApiPropertyOptional({
    example: { theme: 'modern' },
    description: 'Custom styling options',
  })
  @IsObject()
  @IsOptional()
  customStyles?: Record<string, any>;
}

export class CreateFloorPlanDto {
  @ApiProperty({ example: 'Main Dining Area', description: 'Floor plan name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: 'Main floor with bar and patio access',
    description: 'Floor plan description',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Branch ID',
  })
  @IsUUID()
  branchId: string;

  @ApiPropertyOptional({
    example: 0,
    description: 'Display order for sorting',
    default: 0,
  })
  @IsInt()
  @IsOptional()
  displayOrder?: number;

  @ApiPropertyOptional({
    example: { width: 1200, height: 800, gridSize: 20 },
    description: 'Layout configuration',
  })
  @ValidateNested()
  @Type(() => FloorPlanLayoutDto)
  @IsOptional()
  layout?: FloorPlanLayoutDto;

  @ApiPropertyOptional({
    example: true,
    description: 'Is floor plan active',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Is this the default floor plan',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional({
    example: { snapToGrid: true, showGridLines: true },
    description: 'Floor plan settings',
  })
  @ValidateNested()
  @Type(() => FloorPlanSettingsDto)
  @IsOptional()
  settings?: FloorPlanSettingsDto;
}
