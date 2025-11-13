import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsInt,
  IsUUID,
  IsEnum,
  IsArray,
  ValidateNested,
  IsPhoneNumber,
  Min,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DiningType, OrderPriority } from '../common/restaurant.constants';
import { CreateOrderItemDto } from './create-order-item.dto';

export class CreateOrderDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Branch ID',
  })
  @IsUUID()
  branchId: string;

  @ApiProperty({
    example: DiningType.DINE_IN,
    enum: DiningType,
    description: 'Service type',
  })
  @IsEnum(DiningType)
  serviceType: DiningType;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174001',
    description: 'Table ID (required for dine-in)',
  })
  @IsUUID()
  @IsOptional()
  tableId?: string;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174002',
    description: 'Customer ID',
  })
  @IsUUID()
  @IsOptional()
  customerId?: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174003',
    description: 'Server/Waiter ID',
  })
  @IsUUID()
  serverId: string;

  @ApiProperty({
    type: [CreateOrderItemDto],
    description: 'Order items',
  })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  @IsArray()
  @ArrayMinSize(1)
  items: CreateOrderItemDto[];

  @ApiPropertyOptional({
    example: OrderPriority.NORMAL,
    enum: OrderPriority,
    description: 'Order priority',
    default: OrderPriority.NORMAL,
  })
  @IsEnum(OrderPriority)
  @IsOptional()
  priority?: OrderPriority;

  @ApiPropertyOptional({
    example: 4,
    description: 'Number of guests',
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  guestCount?: number;

  @ApiPropertyOptional({
    example: 'Please serve hot',
    description: 'Special instructions for the order',
  })
  @IsString()
  @IsOptional()
  specialInstructions?: string;

  @ApiPropertyOptional({
    example: 'Customer birthday celebration',
    description: 'Additional notes',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    example: 5.0,
    description: 'Discount amount',
  })
  @IsNumber()
  @IsOptional()
  discount?: number;

  // Delivery-specific fields
  @ApiPropertyOptional({
    example: '123 Main St, Apt 4B, New York, NY 10001',
    description: 'Delivery address (required for delivery orders)',
  })
  @IsString()
  @IsOptional()
  deliveryAddress?: string;

  @ApiPropertyOptional({
    example: '+1234567890',
    description: 'Delivery phone number (required for delivery orders)',
  })
  @IsString()
  @IsOptional()
  deliveryPhone?: string;

  @ApiPropertyOptional({
    example: 3.5,
    description: 'Delivery fee',
  })
  @IsNumber()
  @IsOptional()
  deliveryFee?: number;

  @ApiPropertyOptional({
    example: { promoCode: 'SAVE10', loyaltyPointsUsed: 50 },
    description: 'Additional metadata',
  })
  @IsOptional()
  metadata?: Record<string, any>;

  // Tip fields
  @ApiPropertyOptional({
    example: 15.00,
    description: 'Tip amount',
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  tipAmount?: number;

  @ApiPropertyOptional({
    example: 15,
    description: 'Tip percentage (0-100)',
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  tipPercentage?: number;

  @ApiPropertyOptional({
    example: 'percentage',
    description: 'Tip calculation method: percentage, fixed, custom, none',
  })
  @IsString()
  @IsOptional()
  tipMethod?: 'percentage' | 'fixed' | 'custom' | 'none';
}
