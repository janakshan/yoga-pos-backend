import { IsNumber, IsPositive, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PartialPaymentDto {
  @ApiProperty({
    description: 'Amount to pay',
    example: 100.0,
  })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({
    description: 'Payment notes',
    example: 'Partial payment received',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
