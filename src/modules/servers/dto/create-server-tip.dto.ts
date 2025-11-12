import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsEnum,
  IsDateString,
  IsBoolean,
  IsNumber,
  IsObject,
  Min,
} from 'class-validator';
import { TipType, TipStatus } from '../entities/server-tip.entity';

export class CreateServerTipDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Server (User) ID',
  })
  @IsUUID()
  @IsNotEmpty()
  serverId: string;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Invoice ID (optional)',
  })
  @IsUUID()
  @IsOptional()
  invoiceId?: string;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Shift ID (optional)',
  })
  @IsUUID()
  @IsOptional()
  shiftId?: string;

  @ApiProperty({
    example: 15.50,
    description: 'Tip amount',
  })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  amount: number;

  @ApiProperty({
    enum: TipType,
    example: TipType.CASH,
    description: 'Tip type',
  })
  @IsEnum(TipType)
  @IsNotEmpty()
  type: TipType;

  @ApiPropertyOptional({
    enum: TipStatus,
    example: TipStatus.PENDING,
    description: 'Tip status',
  })
  @IsEnum(TipStatus)
  @IsOptional()
  status?: TipStatus;

  @ApiProperty({
    example: '2024-01-15T12:00:00Z',
    description: 'Tip date',
  })
  @IsDateString()
  @IsNotEmpty()
  tipDate: Date;

  @ApiPropertyOptional({
    example: '2024-01-15T18:00:00Z',
    description: 'Date tip was paid out',
  })
  @IsDateString()
  @IsOptional()
  paidDate?: Date;

  @ApiPropertyOptional({
    example: 18.5,
    description: 'Tip as percentage of order total',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  tipPercentage?: number;

  @ApiPropertyOptional({
    example: 85.75,
    description: 'Total order amount',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  orderTotal?: number;

  @ApiPropertyOptional({
    example: false,
    description: 'Is this tip part of pooled tips',
  })
  @IsBoolean()
  @IsOptional()
  isPooled?: boolean;

  @ApiPropertyOptional({
    example: 25.5,
    description: 'Server share percentage if pooled',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  pooledSharePercentage?: number;

  @ApiPropertyOptional({
    example: 'Excellent service',
    description: 'Tip notes',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    example: { customerName: 'John Doe', tableNumber: 'T5' },
    description: 'Additional metadata',
  })
  @IsObject()
  @IsOptional()
  metadata?: {
    customerName?: string;
    tableNumber?: string;
    paymentMethod?: string;
    [key: string]: any;
  };
}
