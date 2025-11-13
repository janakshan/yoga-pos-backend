import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsInt,
  Min,
  Max,
  IsArray,
  IsUUID,
  ValidateNested,
  IsNumber,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  KitchenStation,
  RestaurantOrderStatus,
  OrderPriority,
  CourseTiming,
} from '../common/restaurant.constants';

// ============================================================================
// KITCHEN STATION DTOs
// ============================================================================

export class CreateKitchenStationDto {
  @ApiProperty({ description: 'Branch ID' })
  @IsUUID()
  branchId: string;

  @ApiProperty({ enum: KitchenStation, description: 'Station type' })
  @IsEnum(KitchenStation)
  stationType: KitchenStation;

  @ApiProperty({ description: 'Station name', example: 'Main Grill Station' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Station description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Display order', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  displayOrder?: number;

  @ApiPropertyOptional({ description: 'Color hex code', example: '#FF5733' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: 'Default prep time in minutes', default: 15 })
  @IsOptional()
  @IsInt()
  @Min(1)
  defaultPrepTime?: number;

  @ApiPropertyOptional({ description: 'Warning threshold in minutes', default: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  warningThreshold?: number;

  @ApiPropertyOptional({ description: 'Critical threshold in minutes', default: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  criticalThreshold?: number;

  @ApiPropertyOptional({ description: 'Enable sound alerts', default: true })
  @IsOptional()
  @IsBoolean()
  soundAlertsEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Enable visual alerts', default: true })
  @IsOptional()
  @IsBoolean()
  visualAlertsEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Auto print enabled', default: false })
  @IsOptional()
  @IsBoolean()
  autoPrintEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Printer name' })
  @IsOptional()
  @IsString()
  printerName?: string;

  @ApiPropertyOptional({ description: 'Printer IP address' })
  @IsOptional()
  @IsString()
  printerIp?: string;

  @ApiPropertyOptional({ description: 'Printer port' })
  @IsOptional()
  @IsInt()
  printerPort?: number;

  @ApiPropertyOptional({ description: 'Target completion time in minutes', default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  targetCompletionTime?: number;

  @ApiPropertyOptional({ description: 'Enable course sequencing', default: false })
  @IsOptional()
  @IsBoolean()
  enableCourseSequencing?: boolean;
}

export class UpdateKitchenStationDto extends PartialType(CreateKitchenStationDto) {
  @ApiPropertyOptional({ description: 'Station active status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ============================================================================
// KITCHEN QUEUE DTOs
// ============================================================================

export class FilterKitchenQueueDto {
  @ApiPropertyOptional({ description: 'Filter by branch ID' })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ enum: KitchenStation, description: 'Filter by kitchen station' })
  @IsOptional()
  @IsEnum(KitchenStation)
  station?: KitchenStation;

  @ApiPropertyOptional({
    enum: RestaurantOrderStatus,
    isArray: true,
    description: 'Filter by order status',
  })
  @IsOptional()
  @IsArray()
  @IsEnum(RestaurantOrderStatus, { each: true })
  status?: RestaurantOrderStatus[];

  @ApiPropertyOptional({
    enum: OrderPriority,
    isArray: true,
    description: 'Filter by priority',
  })
  @IsOptional()
  @IsArray()
  @IsEnum(OrderPriority, { each: true })
  priority?: OrderPriority[];

  @ApiPropertyOptional({ enum: CourseTiming, description: 'Filter by course' })
  @IsOptional()
  @IsEnum(CourseTiming)
  course?: CourseTiming;

  @ApiPropertyOptional({ description: 'Show only overdue orders', default: false })
  @IsOptional()
  @IsBoolean()
  overdueOnly?: boolean;

  @ApiPropertyOptional({ description: 'Show only orders in warning state', default: false })
  @IsOptional()
  @IsBoolean()
  warningOnly?: boolean;

  @ApiPropertyOptional({ description: 'Sort by field', enum: ['createdAt', 'priority', 'prepTime', 'age'] })
  @IsOptional()
  @IsString()
  sortBy?: 'createdAt' | 'priority' | 'prepTime' | 'age';

  @ApiPropertyOptional({ description: 'Sort order', enum: ['ASC', 'DESC'], default: 'ASC' })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC';

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

// ============================================================================
// ORDER ITEM ACTION DTOs
// ============================================================================

export class MarkItemReadyDto {
  @ApiProperty({ description: 'Order item ID' })
  @IsUUID()
  itemId: string;

  @ApiPropertyOptional({ description: 'Notes about completion' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class BumpOrderItemDto {
  @ApiProperty({ description: 'Order item ID to bump (remove from display)' })
  @IsUUID()
  itemId: string;

  @ApiPropertyOptional({ description: 'Reason for bumping' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class BumpOrderDto {
  @ApiProperty({ description: 'Order ID to bump all items' })
  @IsUUID()
  orderId: string;

  @ApiPropertyOptional({ description: 'Specific item IDs to bump (if not all)' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  itemIds?: string[];

  @ApiPropertyOptional({ description: 'Reason for bumping' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class RecallOrderDto {
  @ApiProperty({ description: 'Order ID to recall to kitchen display' })
  @IsUUID()
  orderId: string;

  @ApiPropertyOptional({ description: 'Reason for recalling' })
  @IsOptional()
  @IsString()
  reason?: string;
}

// ============================================================================
// PERFORMANCE METRICS DTOs
// ============================================================================

export class KitchenPerformanceQueryDto {
  @ApiProperty({ description: 'Branch ID' })
  @IsUUID()
  branchId: string;

  @ApiPropertyOptional({ enum: KitchenStation, description: 'Filter by station' })
  @IsOptional()
  @IsEnum(KitchenStation)
  station?: KitchenStation;

  @ApiPropertyOptional({ description: 'Start date (ISO format)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (ISO format)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Group by interval', enum: ['hour', 'day', 'week', 'month'] })
  @IsOptional()
  @IsEnum(['hour', 'day', 'week', 'month'])
  groupBy?: 'hour' | 'day' | 'week' | 'month';
}

export class KitchenMetricsResponseDto {
  @ApiProperty({ description: 'Total orders processed' })
  totalOrders: number;

  @ApiProperty({ description: 'Total items processed' })
  totalItems: number;

  @ApiProperty({ description: 'Average preparation time in minutes' })
  averagePrepTime: number;

  @ApiProperty({ description: 'Average completion time in minutes' })
  averageCompletionTime: number;

  @ApiProperty({ description: 'On-time completion rate (percentage)' })
  onTimeRate: number;

  @ApiProperty({ description: 'Number of overdue orders' })
  overdueCount: number;

  @ApiProperty({ description: 'Number of cancelled items' })
  cancelledCount: number;

  @ApiProperty({ description: 'Peak hour (24-hour format)' })
  peakHour?: number;

  @ApiProperty({ description: 'Orders by priority breakdown' })
  ordersByPriority: {
    low: number;
    normal: number;
    high: number;
    urgent: number;
  };

  @ApiProperty({ description: 'Items by course breakdown' })
  itemsByCourse?: {
    appetizer: number;
    main_course: number;
    dessert: number;
    beverage: number;
  };

  @ApiPropertyOptional({ description: 'Time series data if grouped' })
  timeSeries?: Array<{
    period: string;
    orderCount: number;
    averagePrepTime: number;
    onTimeRate: number;
  }>;
}

// ============================================================================
// KITCHEN DISPLAY DTOs
// ============================================================================

export class KitchenOrderItemDto {
  @ApiProperty({ description: 'Order item ID' })
  id: string;

  @ApiProperty({ description: 'Product name' })
  productName: string;

  @ApiProperty({ description: 'Quantity' })
  quantity: number;

  @ApiProperty({ description: 'Special instructions' })
  specialInstructions?: string;

  @ApiProperty({ description: 'Modifiers' })
  modifiers?: Array<{
    name: string;
    options: Array<{ name: string; priceAdjustment: number }>;
  }>;

  @ApiProperty({ enum: CourseTiming, description: 'Course timing' })
  course?: CourseTiming;

  @ApiProperty({ enum: RestaurantOrderStatus, description: 'Item status' })
  status: RestaurantOrderStatus;

  @ApiProperty({ description: 'Preparation time in minutes' })
  preparationTime?: number;

  @ApiProperty({ description: 'Time since sent to kitchen in minutes' })
  age?: number;

  @ApiProperty({ description: 'Is item overdue' })
  isOverdue?: boolean;

  @ApiProperty({ description: 'Is item in warning state' })
  isWarning?: boolean;

  @ApiProperty({ description: 'Sent to kitchen timestamp' })
  sentToKitchenAt?: Date;

  @ApiProperty({ description: 'Started preparing timestamp' })
  startedPreparingAt?: Date;

  @ApiProperty({ description: 'Completed timestamp' })
  completedAt?: Date;
}

export class KitchenOrderDisplayDto {
  @ApiProperty({ description: 'Order ID' })
  id: string;

  @ApiProperty({ description: 'Order number' })
  orderNumber: string;

  @ApiProperty({ description: 'Table number or name' })
  tableNumber?: string;

  @ApiProperty({ description: 'Service type' })
  serviceType: string;

  @ApiProperty({ enum: OrderPriority, description: 'Order priority' })
  priority: OrderPriority;

  @ApiProperty({ enum: RestaurantOrderStatus, description: 'Order status' })
  status: RestaurantOrderStatus;

  @ApiProperty({ description: 'Special instructions for entire order' })
  specialInstructions?: string;

  @ApiProperty({ description: 'Guest count' })
  guestCount?: number;

  @ApiProperty({ type: [KitchenOrderItemDto], description: 'Order items' })
  items: KitchenOrderItemDto[];

  @ApiProperty({ description: 'Order age in minutes' })
  orderAge: number;

  @ApiProperty({ description: 'Has overdue items' })
  hasOverdueItems: boolean;

  @ApiProperty({ description: 'Has warning items' })
  hasWarningItems: boolean;

  @ApiProperty({ description: 'Order created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Order confirmed at' })
  confirmedAt?: Date;

  @ApiProperty({ description: 'Estimated prep time' })
  estimatedPrepTime?: number;
}

// ============================================================================
// PRINTER DTOs
// ============================================================================

export class PrintKitchenTicketDto {
  @ApiProperty({ description: 'Order ID' })
  @IsUUID()
  orderId: string;

  @ApiPropertyOptional({ enum: KitchenStation, description: 'Print for specific station' })
  @IsOptional()
  @IsEnum(KitchenStation)
  station?: KitchenStation;

  @ApiPropertyOptional({ description: 'Number of copies', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  copies?: number;
}

export class ReprintKitchenTicketDto extends PrintKitchenTicketDto {
  @ApiPropertyOptional({ description: 'Reason for reprinting' })
  @IsOptional()
  @IsString()
  reason?: string;
}
