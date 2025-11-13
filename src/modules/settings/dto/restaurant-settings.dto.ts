import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BusinessType } from '../entities/setting.entity';

// ============================================================================
// Sub-DTOs for nested restaurant settings
// ============================================================================

export class TableManagementSettingsDto {
  @ApiProperty({ description: 'Enable table management features' })
  @IsBoolean()
  enabled: boolean;

  @ApiPropertyOptional({ description: 'Maximum number of tables' })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(500)
  maxTables?: number;

  @ApiPropertyOptional({ description: 'Prefix for table numbers', example: 'T' })
  @IsString()
  @IsOptional()
  tablePrefix?: string;

  @ApiPropertyOptional({ description: 'Enable automatic table assignment' })
  @IsBoolean()
  @IsOptional()
  autoAssignment?: boolean;

  @ApiPropertyOptional({ description: 'Enable QR code menu' })
  @IsBoolean()
  @IsOptional()
  qrMenuEnabled?: boolean;
}

export class KitchenDisplaySettingsDto {
  @ApiProperty({ description: 'Enable kitchen display system' })
  @IsBoolean()
  enabled: boolean;

  @ApiPropertyOptional({ description: 'Enable order ticket printing' })
  @IsBoolean()
  @IsOptional()
  orderTicketPrinting?: boolean;

  @ApiPropertyOptional({ description: 'Auto-refresh interval in seconds' })
  @IsNumber()
  @IsOptional()
  @Min(5)
  @Max(300)
  autoRefreshInterval?: number;

  @ApiPropertyOptional({ description: 'Enable sound alerts' })
  @IsBoolean()
  @IsOptional()
  soundAlerts?: boolean;

  @ApiPropertyOptional({ description: 'Enable priority ordering' })
  @IsBoolean()
  @IsOptional()
  priorityOrdering?: boolean;
}

export class MenuManagementSettingsDto {
  @ApiProperty({ description: 'Enable menu categories' })
  @IsBoolean()
  categoriesEnabled: boolean;

  @ApiProperty({ description: 'Enable menu item modifiers' })
  @IsBoolean()
  modifiersEnabled: boolean;

  @ApiProperty({ description: 'Enable combo meals' })
  @IsBoolean()
  comboMealsEnabled: boolean;

  @ApiPropertyOptional({ description: 'Enable seasonal menus' })
  @IsBoolean()
  @IsOptional()
  seasonalMenus?: boolean;

  @ApiPropertyOptional({ description: 'Show nutritional information' })
  @IsBoolean()
  @IsOptional()
  nutritionalInfo?: boolean;

  @ApiPropertyOptional({ description: 'Show allergen information' })
  @IsBoolean()
  @IsOptional()
  allergenInfo?: boolean;
}

export class OrderingFlowSettingsDto {
  @ApiProperty({ description: 'Require table number for dine-in orders' })
  @IsBoolean()
  requireTableNumber: boolean;

  @ApiProperty({ description: 'Allow bill splitting' })
  @IsBoolean()
  allowSplitBills: boolean;

  @ApiProperty({ description: 'Allow course timing' })
  @IsBoolean()
  allowCourseTiming: boolean;

  @ApiPropertyOptional({ description: 'Tip percentage suggestions', example: [10, 15, 20] })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  tipSuggestions?: number[];

  @ApiPropertyOptional({ description: 'Minimum order amount' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  minOrderAmount?: number;

  @ApiPropertyOptional({ description: 'Enable order notes' })
  @IsBoolean()
  @IsOptional()
  orderNotesEnabled?: boolean;
}

export class DeliverySettingsDto {
  @ApiProperty({ description: 'Enable delivery service' })
  @IsBoolean()
  enabled: boolean;

  @ApiPropertyOptional({ description: 'Delivery radius in kilometers' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  deliveryRadius?: number;

  @ApiPropertyOptional({ description: 'Minimum order amount for delivery' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  minimumOrderAmount?: number;

  @ApiPropertyOptional({ description: 'Delivery fee' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  deliveryFee?: number;

  @ApiPropertyOptional({ description: 'Estimated delivery time in minutes' })
  @IsNumber()
  @IsOptional()
  @Min(1)
  estimatedDeliveryTime?: number;

  @ApiPropertyOptional({ description: 'Enable delivery tracking' })
  @IsBoolean()
  @IsOptional()
  trackingEnabled?: boolean;
}

export class ReservationSettingsDto {
  @ApiProperty({ description: 'Enable reservations' })
  @IsBoolean()
  enabled: boolean;

  @ApiPropertyOptional({ description: 'Maximum party size' })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  maxPartySize?: number;

  @ApiPropertyOptional({ description: 'How many days in advance can bookings be made' })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(365)
  advanceBookingDays?: number;

  @ApiPropertyOptional({ description: 'Time slot duration in minutes' })
  @IsNumber()
  @IsOptional()
  @Min(15)
  @Max(120)
  timeSlotDuration?: number;

  @ApiPropertyOptional({ description: 'Require deposit for reservations' })
  @IsBoolean()
  @IsOptional()
  requireDeposit?: boolean;

  @ApiPropertyOptional({ description: 'Deposit amount' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  depositAmount?: number;
}

// ============================================================================
// Main Restaurant Settings DTO
// ============================================================================

export class RestaurantSettingsDto {
  @ApiPropertyOptional({ description: 'Enable dine-in service' })
  @IsBoolean()
  @IsOptional()
  diningEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Enable takeaway service' })
  @IsBoolean()
  @IsOptional()
  takeawayEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Enable delivery service' })
  @IsBoolean()
  @IsOptional()
  deliveryEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Table management configuration' })
  @ValidateNested()
  @Type(() => TableManagementSettingsDto)
  @IsOptional()
  tableManagement?: TableManagementSettingsDto;

  @ApiPropertyOptional({ description: 'Kitchen display configuration' })
  @ValidateNested()
  @Type(() => KitchenDisplaySettingsDto)
  @IsOptional()
  kitchenDisplay?: KitchenDisplaySettingsDto;

  @ApiPropertyOptional({ description: 'Menu management configuration' })
  @ValidateNested()
  @Type(() => MenuManagementSettingsDto)
  @IsOptional()
  menuManagement?: MenuManagementSettingsDto;

  @ApiPropertyOptional({ description: 'Ordering flow configuration' })
  @ValidateNested()
  @Type(() => OrderingFlowSettingsDto)
  @IsOptional()
  orderingFlow?: OrderingFlowSettingsDto;

  @ApiPropertyOptional({ description: 'Delivery configuration' })
  @ValidateNested()
  @Type(() => DeliverySettingsDto)
  @IsOptional()
  delivery?: DeliverySettingsDto;

  @ApiPropertyOptional({ description: 'Reservation configuration' })
  @ValidateNested()
  @Type(() => ReservationSettingsDto)
  @IsOptional()
  reservations?: ReservationSettingsDto;
}

// ============================================================================
// Update Business Type DTO
// ============================================================================

export class UpdateBusinessTypeDto {
  @ApiProperty({
    enum: BusinessType,
    description: 'Business type',
    example: BusinessType.RETAIL,
  })
  @IsEnum(BusinessType)
  businessType: BusinessType;
}

// ============================================================================
// Update Restaurant Settings DTO
// ============================================================================

export class UpdateRestaurantSettingsDto {
  @ApiProperty({ description: 'Restaurant settings configuration' })
  @ValidateNested()
  @Type(() => RestaurantSettingsDto)
  restaurantSettings: RestaurantSettingsDto;
}

// ============================================================================
// Get Restaurant Configuration Response DTO
// ============================================================================

export class RestaurantConfigurationDto {
  @ApiProperty({ enum: BusinessType, description: 'Current business type' })
  businessType: BusinessType;

  @ApiProperty({ description: 'Whether restaurant mode is enabled' })
  restaurantModeEnabled: boolean;

  @ApiProperty({ description: 'Restaurant settings configuration' })
  restaurantSettings: RestaurantSettingsDto;

  @ApiProperty({ description: 'Available restaurant features' })
  availableFeatures: string[];
}
