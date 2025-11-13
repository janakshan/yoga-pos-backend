import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsInt,
  IsArray,
  IsOptional,
  ValidateNested,
  ArrayMinSize,
  Min,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum SplitMethod {
  EQUAL = 'equal',
  CUSTOM = 'custom',
  BY_ITEM = 'by_item',
  BY_SEAT = 'by_seat',
}

export class SplitByItemDto {
  @ApiProperty({
    description: 'Item IDs for this split',
    example: ['uuid-1', 'uuid-2'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  itemIds: string[];
}

export class SplitPaymentDto {
  @ApiProperty({
    description: 'Method of splitting the bill',
    enum: SplitMethod,
    example: SplitMethod.EQUAL,
  })
  @IsEnum(SplitMethod)
  splitMethod: SplitMethod;

  @ApiPropertyOptional({
    description: 'Number of equal splits (required if splitMethod is equal)',
    example: 4,
    minimum: 2,
  })
  @ValidateIf((o) => o.splitMethod === SplitMethod.EQUAL)
  @IsInt()
  @Min(2)
  splitCount?: number;

  @ApiPropertyOptional({
    description: 'Custom amounts for each split (required if splitMethod is custom)',
    example: [25.50, 30.00, 24.50],
    type: [Number],
  })
  @ValidateIf((o) => o.splitMethod === SplitMethod.CUSTOM)
  @IsArray()
  @ArrayMinSize(2)
  @IsNumber({}, { each: true })
  customAmounts?: number[];

  @ApiPropertyOptional({
    description: 'Item splits (required if splitMethod is by_item)',
    type: [SplitByItemDto],
  })
  @ValidateIf((o) => o.splitMethod === SplitMethod.BY_ITEM)
  @ValidateNested({ each: true })
  @Type(() => SplitByItemDto)
  @IsArray()
  @ArrayMinSize(2)
  itemSplits?: SplitByItemDto[];
}

export class SplitPaymentResultDto {
  @ApiProperty({
    description: 'Order ID',
    example: 'uuid-123',
  })
  orderId: string;

  @ApiProperty({
    description: 'Split method used',
    enum: SplitMethod,
  })
  splitMethod: string;

  @ApiProperty({
    description: 'Individual splits',
    type: 'array',
  })
  splits: Array<{
    splitNumber: number;
    amount: number;
    items?: string[];
    seats?: number[];
    tipAmount?: number;
    totalWithTip?: number;
  }>;

  @ApiProperty({
    description: 'Total order amount',
    example: 150.00,
  })
  totalAmount: number;

  @ApiProperty({
    description: 'Remaining amount to be paid',
    example: 150.00,
  })
  remainingAmount: number;
}
