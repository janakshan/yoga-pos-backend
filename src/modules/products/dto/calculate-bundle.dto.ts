import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsObject, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class BundleItemDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Product ID',
  })
  productId: string;

  @ApiProperty({
    example: 2,
    description: 'Quantity of this product in the bundle',
  })
  @IsNumber()
  quantity: number;
}

export class CalculateBundleDto {
  @ApiProperty({
    type: [BundleItemDto],
    example: [
      { productId: '123e4567-e89b-12d3-a456-426614174000', quantity: 2 },
      { productId: '123e4567-e89b-12d3-a456-426614174001', quantity: 1 },
    ],
    description: 'Products in the bundle',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BundleItemDto)
  products: BundleItemDto[];

  @ApiProperty({
    example: 10,
    description: 'Discount percentage for the bundle',
  })
  @IsNumber()
  discountPercentage: number;
}
