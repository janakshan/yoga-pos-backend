import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  IsObject,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class SectionSettingsDto {
  @ApiPropertyOptional({
    example: 50,
    description: 'Maximum capacity for the section',
  })
  @IsInt()
  @IsOptional()
  maxCapacity?: number;

  @ApiPropertyOptional({
    example: false,
    description: 'Is this a smoking area',
  })
  @IsBoolean()
  @IsOptional()
  isSmokingArea?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Is this a VIP area',
  })
  @IsBoolean()
  @IsOptional()
  isVipArea?: boolean;

  @ApiPropertyOptional({
    example: { premium: true },
    description: 'Custom attributes for the section',
  })
  @IsObject()
  @IsOptional()
  customAttributes?: Record<string, any>;
}

export class CreateTableSectionDto {
  @ApiProperty({ example: 'VIP Area', description: 'Section name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: 'Premium seating area with privacy',
    description: 'Section description',
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
    example: '123e4567-e89b-12d3-a456-426614174001',
    description: 'Floor plan ID',
  })
  @IsUUID()
  @IsOptional()
  floorPlanId?: string;

  @ApiPropertyOptional({
    example: '#4CAF50',
    description: 'Color code for section visualization',
  })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({
    example: 0,
    description: 'Display order for sorting',
    default: 0,
  })
  @IsInt()
  @IsOptional()
  displayOrder?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Is section active',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: { maxCapacity: 50, isVipArea: true },
    description: 'Section settings and features',
  })
  @ValidateNested()
  @Type(() => SectionSettingsDto)
  @IsOptional()
  settings?: SectionSettingsDto;
}
