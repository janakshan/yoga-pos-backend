import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsObject,
  IsArray,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PriceAdjustmentType } from '../entities/modifier.entity';

class NutritionalInfoDto {
  @ApiPropertyOptional({ example: 250 })
  @IsNumber()
  @IsOptional()
  calories?: number;

  @ApiPropertyOptional({ example: 12 })
  @IsNumber()
  @IsOptional()
  protein?: number;

  @ApiPropertyOptional({ example: 30 })
  @IsNumber()
  @IsOptional()
  carbs?: number;

  @ApiPropertyOptional({ example: 8 })
  @IsNumber()
  @IsOptional()
  fat?: number;

  @ApiPropertyOptional({ example: ['nuts', 'dairy'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allergens?: string[];

  @ApiPropertyOptional({ example: ['vegetarian', 'gluten-free'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  dietaryRestrictions?: string[];
}

class TimeRangeDto {
  @ApiProperty({ example: '09:00', description: 'Start time in HH:mm format' })
  @IsString()
  startTime: string;

  @ApiProperty({ example: '22:00', description: 'End time in HH:mm format' })
  @IsString()
  endTime: string;
}

class DateRangeDto {
  @ApiProperty({ example: '2025-01-01', description: 'Start date in YYYY-MM-DD format' })
  @IsString()
  startDate: string;

  @ApiProperty({ example: '2025-12-31', description: 'End date in YYYY-MM-DD format' })
  @IsString()
  endDate: string;
}

class AvailabilityDto {
  @ApiPropertyOptional({
    example: ['monday', 'tuesday', 'wednesday'],
    description: 'Days of the week when this modifier is available',
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  days?: string[];

  @ApiPropertyOptional({
    type: [TimeRangeDto],
    description: 'Time ranges when this modifier is available',
  })
  @ValidateNested({ each: true })
  @Type(() => TimeRangeDto)
  @IsArray()
  @IsOptional()
  timeRanges?: TimeRangeDto[];

  @ApiPropertyOptional({
    type: [DateRangeDto],
    description: 'Date ranges when this modifier is available',
  })
  @ValidateNested({ each: true })
  @Type(() => DateRangeDto)
  @IsArray()
  @IsOptional()
  dateRanges?: DateRangeDto[];
}

export class CreateModifierDto {
  @ApiProperty({ example: 'Extra Cheese', description: 'Modifier name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: 'Add extra cheese to your dish',
    description: 'Modifier description',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Modifier group ID',
  })
  @IsUUID()
  modifierGroupId: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174001',
    description: 'Branch ID',
  })
  @IsUUID()
  branchId: string;

  @ApiPropertyOptional({
    enum: PriceAdjustmentType,
    default: PriceAdjustmentType.FIXED,
    description: 'Type of price adjustment (fixed amount or percentage)',
  })
  @IsEnum(PriceAdjustmentType)
  @IsOptional()
  priceAdjustmentType?: PriceAdjustmentType;

  @ApiPropertyOptional({
    example: 2.5,
    description: 'Price adjustment amount (in currency or percentage)',
    default: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  priceAdjustment?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether this modifier is active',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether this modifier is currently available',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether this is the default selection for the group',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional({
    example: 1,
    description: 'Sort order for display',
    default: 0,
  })
  @IsNumber()
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional({
    example: 'MOD-CHEESE-001',
    description: 'SKU for inventory tracking',
  })
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/images/extra-cheese.jpg',
    description: 'Image URL for the modifier',
  })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({
    type: NutritionalInfoDto,
    description: 'Nutritional information',
  })
  @ValidateNested()
  @Type(() => NutritionalInfoDto)
  @IsOptional()
  nutritionalInfo?: NutritionalInfoDto;

  @ApiPropertyOptional({
    type: AvailabilityDto,
    description: 'Time-based availability rules',
  })
  @ValidateNested()
  @Type(() => AvailabilityDto)
  @IsOptional()
  availability?: AvailabilityDto;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether to track inventory for this modifier',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  trackInventory?: boolean;

  @ApiPropertyOptional({
    example: 100,
    description: 'Stock quantity (if tracking inventory)',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  stockQuantity?: number;

  @ApiPropertyOptional({
    example: 'hide',
    enum: ['hide', 'disable', 'show'],
    description: 'Action to take when out of stock',
  })
  @IsString()
  @IsOptional()
  outOfStockAction?: 'hide' | 'disable' | 'show';

  @ApiPropertyOptional({
    example: 0.5,
    description: 'Cost per unit for reporting',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  cost?: number;

  @ApiPropertyOptional({
    example: {
      preparationTime: 2,
      kitchenInstructions: 'Add extra cheese before cooking',
      displayTags: ['popular'],
    },
    description: 'Additional metadata',
  })
  @IsObject()
  @IsOptional()
  metadata?: any;
}
