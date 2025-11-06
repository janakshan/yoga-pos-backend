import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
  IsEnum,
  IsDateString,
  Min,
} from 'class-validator';
import { PaymentMethod, PaymentStatus } from '../entities/payment.entity';

export class CreatePaymentDto {
  @ApiPropertyOptional({ example: 'uuid', description: 'Invoice ID' })
  @IsUUID()
  @IsOptional()
  invoiceId?: string;

  @ApiPropertyOptional({ example: 'uuid', description: 'Sale ID' })
  @IsUUID()
  @IsOptional()
  saleId?: string;

  @ApiPropertyOptional({ example: 'uuid', description: 'Customer ID' })
  @IsUUID()
  @IsOptional()
  customerId?: string;

  @ApiProperty({ example: 500.00, description: 'Payment amount' })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({
    enum: PaymentMethod,
    example: PaymentMethod.CASH,
    description: 'Payment method',
  })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({ example: '2025-11-06T00:00:00Z', description: 'Payment date' })
  @IsDateString()
  @IsOptional()
  paymentDate?: string;

  @ApiPropertyOptional({ example: 'REF123456', description: 'Payment reference' })
  @IsString()
  @IsOptional()
  reference?: string;

  @ApiPropertyOptional({
    enum: PaymentStatus,
    example: PaymentStatus.COMPLETED,
    description: 'Payment status',
  })
  @IsEnum(PaymentStatus)
  @IsOptional()
  status?: PaymentStatus;

  @ApiPropertyOptional({ example: 'Payment notes', description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}
