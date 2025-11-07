import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsNumber, Min } from 'class-validator';

export class UpdatePricingDto {
  @ApiProperty({
    example: { retail: 49.99, wholesale: 39.99, member: 44.99 },
    description: 'Pricing tiers',
  })
  @IsObject()
  pricing: {
    retail: number;
    wholesale: number;
    member: number;
  };
}
