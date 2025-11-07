import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, ValidateNested, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '../../payments/entities/payment.entity';

export class PaymentSplitDto {
  @ApiProperty({ example: 100.00, description: 'Payment amount' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({
    enum: PaymentMethod,
    example: PaymentMethod.CASH,
    description: 'Payment method'
  })
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({ example: 'REF123', description: 'Payment reference' })
  reference?: string;

  @ApiPropertyOptional({ example: 'Cash portion', description: 'Notes' })
  notes?: string;
}

export class SplitPaymentDto {
  @ApiProperty({
    type: [PaymentSplitDto],
    description: 'Array of payment splits',
    example: [
      { amount: 50, paymentMethod: 'cash', reference: 'CASH001', notes: 'Cash portion' },
      { amount: 50, paymentMethod: 'card', reference: 'CARD001', notes: 'Card portion' }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentSplitDto)
  payments: PaymentSplitDto[];
}
