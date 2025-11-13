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
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  ModifierGroupType,
  ModifierSelectionType,
} from '../entities/modifier-group.entity';

class TimeRangeDto {
  @ApiProperty({ example: '09:00' })
  @IsString()
  startTime: string;

  @ApiProperty({ example: '22:00' })
  @IsString()
  endTime: string;
}

class DateRangeDto {
  @ApiProperty({ example: '2025-01-01' })
  @IsString()
  startDate: string;

  @ApiProperty({ example: '2025-12-31' })
  @IsString()
  endDate: string;
}

class AvailabilityDto {
  @ApiPropertyOptional({ example: ['monday', 'tuesday'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  days?: string[];

  @ApiPropertyOptional({ type: [TimeRangeDto] })
  @ValidateNested({ each: true })
  @Type(() => TimeRangeDto)
  @IsArray()
  @IsOptional()
  timeRanges?: TimeRangeDto[];

  @ApiPropertyOptional({ type: [DateRangeDto] })
  @ValidateNested({ each: true })
  @Type(() => DateRangeDto)
  @IsArray()
  @IsOptional()
  dateRanges?: DateRangeDto[];
}

class ConditionalRulesDto {
  @ApiPropertyOptional({ example: ['appetizer', 'main_course'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  showWhenProductCategories?: string[];

  @ApiPropertyOptional({ example: ['spicy', 'vegan'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  showWhenProductTags?: string[];

  @ApiPropertyOptional({ example: ['modifier-id-1', 'modifier-id-2'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  hideWhenModifiersSelected?: string[];

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  customRules?: Array<{
    field: string;
    operator: 'equals' | 'not_equals' | 'in' | 'not_in';
    value: any;
  }>;
}

class UIConfigDto {
  @ApiPropertyOptional({ example: 'grid', enum: ['grid', 'list', 'dropdown'] })
  @IsString()
  @IsOptional()
  layout?: 'grid' | 'list' | 'dropdown';

  @ApiPropertyOptional({ example: 3 })
  @IsNumber()
  @IsOptional()
  columns?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  showImages?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  showPrices?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  showDescriptions?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  customCss?: string;
}

export class CreateModifierGroupDto {
  @ApiProperty({ example: 'Toppings', description: 'Modifier group name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: 'Choose your favorite toppings',
    description: 'Modifier group description',
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
    enum: ModifierGroupType,
    default: ModifierGroupType.OPTIONAL,
    description: 'Whether this modifier group is required or optional',
  })
  @IsEnum(ModifierGroupType)
  @IsOptional()
  type?: ModifierGroupType;

  @ApiPropertyOptional({
    enum: ModifierSelectionType,
    default: ModifierSelectionType.MULTIPLE,
    description: 'Whether customer can select single or multiple modifiers',
  })
  @IsEnum(ModifierSelectionType)
  @IsOptional()
  selectionType?: ModifierSelectionType;

  @ApiPropertyOptional({
    example: 0,
    description: 'Minimum number of selections required',
    default: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minSelections?: number;

  @ApiPropertyOptional({
    example: 3,
    description: 'Maximum number of selections allowed (null = unlimited)',
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  maxSelections?: number;

  @ApiPropertyOptional({
    example: 'Choose Your Toppings',
    description: 'Display name for customer-facing UI',
  })
  @IsString()
  @IsOptional()
  displayName?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Sort order for display',
    default: 0,
  })
  @IsNumber()
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether this modifier group is active',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Show this group in POS',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  showInPos?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Show this group in online menu',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  showInOnlineMenu?: boolean;

  @ApiPropertyOptional({
    example: 'toppings',
    description: 'Category for grouping (e.g., size, toppings, cooking-preference)',
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({
    example: 2,
    description: 'Number of free modifiers (first N are free)',
    default: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  freeModifierCount?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Charge for modifiers beyond free count',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  chargeAboveFree?: boolean;

  @ApiPropertyOptional({
    type: AvailabilityDto,
    description: 'Time-based availability rules',
  })
  @ValidateNested()
  @Type(() => AvailabilityDto)
  @IsOptional()
  availability?: AvailabilityDto;

  @ApiPropertyOptional({
    type: ConditionalRulesDto,
    description: 'Conditional display rules',
  })
  @ValidateNested()
  @Type(() => ConditionalRulesDto)
  @IsOptional()
  conditionalRules?: ConditionalRulesDto;

  @ApiPropertyOptional({
    type: UIConfigDto,
    description: 'UI configuration',
  })
  @ValidateNested()
  @Type(() => UIConfigDto)
  @IsOptional()
  uiConfig?: UIConfigDto;

  @ApiPropertyOptional({
    example: { internalNotes: 'Popular during lunch hours' },
    description: 'Additional metadata',
  })
  @IsObject()
  @IsOptional()
  metadata?: any;
}
