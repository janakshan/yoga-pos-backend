import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsUUID,
  IsEnum,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  KitchenStation,
  CourseTiming,
} from '../common/restaurant.constants';

class ModifierOptionDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Modifier option ID',
  })
  @IsString()
  id: string;

  @ApiProperty({ example: 'Extra Cheese', description: 'Option name' })
  @IsString()
  name: string;

  @ApiProperty({ example: 2.5, description: 'Price adjustment' })
  @IsNumber()
  priceAdjustment: number;
}

class ItemModifierDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174001',
    description: 'Modifier ID',
  })
  @IsString()
  id: string;

  @ApiProperty({ example: 'Toppings', description: 'Modifier name' })
  @IsString()
  name: string;

  @ApiProperty({
    type: [ModifierOptionDto],
    description: 'Selected modifier options',
  })
  @ValidateNested({ each: true })
  @Type(() => ModifierOptionDto)
  @IsArray()
  options: ModifierOptionDto[];
}

export class CreateOrderItemDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Product ID',
  })
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 2, description: 'Quantity', minimum: 0.001 })
  @IsNumber()
  @Min(0.001)
  quantity: number;

  @ApiPropertyOptional({
    example: 15.99,
    description: 'Unit price (optional, will use product price if not provided)',
  })
  @IsNumber()
  @IsOptional()
  unitPrice?: number;

  @ApiPropertyOptional({
    example: KitchenStation.GRILL,
    enum: KitchenStation,
    description: 'Kitchen station for this item',
  })
  @IsEnum(KitchenStation)
  @IsOptional()
  kitchenStation?: KitchenStation;

  @ApiPropertyOptional({
    example: CourseTiming.MAIN_COURSE,
    enum: CourseTiming,
    description: 'Course timing',
  })
  @IsEnum(CourseTiming)
  @IsOptional()
  course?: CourseTiming;

  @ApiPropertyOptional({
    example: 'No onions, extra sauce',
    description: 'Special instructions for this item',
  })
  @IsString()
  @IsOptional()
  specialInstructions?: string;

  @ApiPropertyOptional({
    example: 'Customer allergic to peanuts',
    description: 'Additional notes',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    type: [ItemModifierDto],
    description: 'Item modifiers/customizations',
  })
  @ValidateNested({ each: true })
  @Type(() => ItemModifierDto)
  @IsArray()
  @IsOptional()
  modifiers?: ItemModifierDto[];

  @ApiPropertyOptional({
    example: false,
    description: 'Is this part of a combo meal',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isCombo?: boolean;

  @ApiPropertyOptional({
    example: 'combo-123',
    description: 'Combo group identifier',
  })
  @IsString()
  @IsOptional()
  comboGroupId?: string;
}
