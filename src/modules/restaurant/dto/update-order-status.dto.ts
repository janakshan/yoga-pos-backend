import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { RestaurantOrderStatus } from '../common/restaurant.constants';

export class UpdateOrderStatusDto {
  @ApiProperty({
    example: RestaurantOrderStatus.CONFIRMED,
    enum: RestaurantOrderStatus,
    description: 'New order status',
  })
  @IsEnum(RestaurantOrderStatus)
  status: RestaurantOrderStatus;

  @ApiPropertyOptional({
    example: 'Customer requested cancellation',
    description: 'Reason for status change (required for cancellation)',
  })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({
    example: 'Manager approved',
    description: 'Additional notes about the status change',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
