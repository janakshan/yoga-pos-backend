import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsUUID,
  IsEnum,
  IsDateString,
  IsInt,
  Min,
  IsString,
} from 'class-validator';
import {
  RestaurantOrderStatus,
  DiningType,
  OrderPriority,
  OrderPaymentStatus,
} from '../common/restaurant.constants';

export class FilterOrderDto {
  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Filter by branch ID',
  })
  @IsUUID()
  @IsOptional()
  branchId?: string;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174001',
    description: 'Filter by table ID',
  })
  @IsUUID()
  @IsOptional()
  tableId?: string;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174002',
    description: 'Filter by customer ID',
  })
  @IsUUID()
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174003',
    description: 'Filter by server ID',
  })
  @IsUUID()
  @IsOptional()
  serverId?: string;

  @ApiPropertyOptional({
    example: RestaurantOrderStatus.PENDING,
    enum: RestaurantOrderStatus,
    description: 'Filter by order status',
  })
  @IsEnum(RestaurantOrderStatus)
  @IsOptional()
  status?: RestaurantOrderStatus;

  @ApiPropertyOptional({
    example: DiningType.DINE_IN,
    enum: DiningType,
    description: 'Filter by service type',
  })
  @IsEnum(DiningType)
  @IsOptional()
  serviceType?: DiningType;

  @ApiPropertyOptional({
    example: OrderPriority.HIGH,
    enum: OrderPriority,
    description: 'Filter by priority',
  })
  @IsEnum(OrderPriority)
  @IsOptional()
  priority?: OrderPriority;

  @ApiPropertyOptional({
    example: OrderPaymentStatus.UNPAID,
    enum: OrderPaymentStatus,
    description: 'Filter by payment status',
  })
  @IsEnum(OrderPaymentStatus)
  @IsOptional()
  paymentStatus?: OrderPaymentStatus;

  @ApiPropertyOptional({
    example: '2024-01-01T00:00:00Z',
    description: 'Filter orders created after this date',
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    example: '2024-12-31T23:59:59Z',
    description: 'Filter orders created before this date',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({
    example: 'ORD-001',
    description: 'Search by order number',
  })
  @IsString()
  @IsOptional()
  orderNumber?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Page number',
    default: 1,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    example: 20,
    description: 'Items per page',
    default: 20,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({
    example: 'createdAt',
    description: 'Sort by field',
    enum: ['createdAt', 'updatedAt', 'orderNumber', 'total'],
  })
  @IsString()
  @IsOptional()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    example: 'DESC',
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
  })
  @IsString()
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
