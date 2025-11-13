import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  IsEnum,
  Min,
} from 'class-validator';
import {
  KitchenStation,
  CourseTiming,
  RestaurantOrderStatus,
} from '../common/restaurant.constants';

export class UpdateOrderItemDto {
  @ApiPropertyOptional({
    example: 3,
    description: 'New quantity',
    minimum: 0.001,
  })
  @IsNumber()
  @Min(0.001)
  @IsOptional()
  quantity?: number;

  @ApiPropertyOptional({
    example: KitchenStation.GRILL,
    enum: KitchenStation,
    description: 'Kitchen station',
  })
  @IsEnum(KitchenStation)
  @IsOptional()
  kitchenStation?: KitchenStation;

  @ApiPropertyOptional({
    example: CourseTiming.DESSERT,
    enum: CourseTiming,
    description: 'Course timing',
  })
  @IsEnum(CourseTiming)
  @IsOptional()
  course?: CourseTiming;

  @ApiPropertyOptional({
    example: RestaurantOrderStatus.PREPARING,
    enum: RestaurantOrderStatus,
    description: 'Item status',
  })
  @IsEnum(RestaurantOrderStatus)
  @IsOptional()
  status?: RestaurantOrderStatus;

  @ApiPropertyOptional({
    example: 'Extra crispy',
    description: 'Special instructions',
  })
  @IsString()
  @IsOptional()
  specialInstructions?: string;

  @ApiPropertyOptional({
    example: 'Kitchen notes',
    description: 'Additional notes',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
