import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsEmail,
  IsArray,
  ValidateNested,
  IsBoolean,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QRCodeType } from '../entities/table-qr-code.entity';

// ============== QR Code DTOs ==============

export class GenerateQRCodeDto {
  @ApiProperty({ description: 'Branch ID' })
  @IsString()
  branchId: string;

  @ApiProperty({ description: 'Table ID' })
  @IsString()
  tableId: string;

  @ApiPropertyOptional({
    enum: QRCodeType,
    default: QRCodeType.FULL_SERVICE,
    description: 'QR code type',
  })
  @IsOptional()
  @IsEnum(QRCodeType)
  type?: QRCodeType;

  @ApiPropertyOptional({ description: 'QR code width in pixels', default: 300 })
  @IsOptional()
  @IsNumber()
  @Min(100)
  width?: number;

  @ApiPropertyOptional({ description: 'QR code foreground color', default: '#000000' })
  @IsOptional()
  @IsString()
  foregroundColor?: string;

  @ApiPropertyOptional({ description: 'QR code background color', default: '#FFFFFF' })
  @IsOptional()
  @IsString()
  backgroundColor?: string;
}

export class GenerateBranchQRCodesDto {
  @ApiProperty({ description: 'Branch ID' })
  @IsString()
  branchId: string;

  @ApiPropertyOptional({
    enum: QRCodeType,
    default: QRCodeType.FULL_SERVICE,
    description: 'QR code type for all tables',
  })
  @IsOptional()
  @IsEnum(QRCodeType)
  type?: QRCodeType;

  @ApiPropertyOptional({ description: 'QR code width in pixels', default: 300 })
  @IsOptional()
  @IsNumber()
  width?: number;
}

// ============== Session DTOs ==============

export class CreateSessionDto {
  @ApiProperty({ description: 'QR code scanned by the guest' })
  @IsString()
  qrCode: string;

  @ApiPropertyOptional({ description: 'Device ID for tracking' })
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiPropertyOptional({ description: 'User agent string' })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiPropertyOptional({ description: 'IP address of the guest' })
  @IsOptional()
  @IsString()
  ipAddress?: string;
}

export class UpdateGuestInfoDto {
  @ApiPropertyOptional({ description: 'Guest name' })
  @IsOptional()
  @IsString()
  guestName?: string;

  @ApiPropertyOptional({ description: 'Guest phone number' })
  @IsOptional()
  @IsString()
  guestPhone?: string;

  @ApiPropertyOptional({ description: 'Guest email address' })
  @IsOptional()
  @IsEmail()
  guestEmail?: string;

  @ApiPropertyOptional({ description: 'Number of guests' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  guestCount?: number;
}

// ============== Cart DTOs ==============

export class CartModifierDto {
  @ApiProperty({ description: 'Modifier ID' })
  @IsString()
  modifierId: string;

  @ApiProperty({ description: 'Modifier name' })
  @IsString()
  modifierName: string;

  @ApiProperty({ description: 'Price adjustment' })
  @IsNumber()
  priceAdjustment: number;
}

export class CartItemDto {
  @ApiProperty({ description: 'Product ID' })
  @IsString()
  productId: string;

  @ApiProperty({ description: 'Product name' })
  @IsString()
  productName: string;

  @ApiProperty({ description: 'Quantity' })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: 'Unit price' })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional({ type: [CartModifierDto], description: 'Selected modifiers' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartModifierDto)
  modifiers?: CartModifierDto[];

  @ApiPropertyOptional({ description: 'Special instructions' })
  @IsOptional()
  @IsString()
  specialInstructions?: string;

  @ApiProperty({ description: 'Subtotal for this item' })
  @IsNumber()
  @Min(0)
  subtotal: number;
}

export class UpdateCartDto {
  @ApiProperty({ type: [CartItemDto], description: 'Cart items' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items: CartItemDto[];

  @ApiProperty({ description: 'Subtotal' })
  @IsNumber()
  @Min(0)
  subtotal: number;

  @ApiProperty({ description: 'Tax amount' })
  @IsNumber()
  @Min(0)
  tax: number;

  @ApiProperty({ description: 'Total amount' })
  @IsNumber()
  @Min(0)
  total: number;
}

// ============== Order DTOs ==============

export class CreateGuestOrderDto {
  @ApiProperty({ description: 'Session token' })
  @IsString()
  sessionToken: string;

  @ApiProperty({ type: [CartItemDto], description: 'Order items' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items: CartItemDto[];

  @ApiPropertyOptional({ description: 'Special instructions for the entire order' })
  @IsOptional()
  @IsString()
  specialInstructions?: string;

  @ApiPropertyOptional({ description: 'Guest name (if not already provided)' })
  @IsOptional()
  @IsString()
  guestName?: string;

  @ApiPropertyOptional({ description: 'Guest phone (if not already provided)' })
  @IsOptional()
  @IsString()
  guestPhone?: string;
}

// ============== Service Request DTOs ==============

export class CallServerDto {
  @ApiProperty({ description: 'Session token' })
  @IsString()
  sessionToken: string;

  @ApiPropertyOptional({ description: 'Additional notes for the server' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RequestBillDto {
  @ApiProperty({ description: 'Session token' })
  @IsString()
  sessionToken: string;
}

// ============== Payment DTOs ==============

export class RecordPaymentDto {
  @ApiProperty({ description: 'Session token' })
  @IsString()
  sessionToken: string;

  @ApiProperty({ description: 'Payment method (CASH, CARD, ONLINE, etc.)' })
  @IsString()
  paymentMethod: string;

  @ApiProperty({ description: 'Payment amount in cents' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ description: 'Payment reference/transaction ID' })
  @IsOptional()
  @IsString()
  paymentReference?: string;
}

// ============== Analytics DTOs ==============

export class QRAnalyticsQueryDto {
  @ApiProperty({ description: 'Branch ID' })
  @IsString()
  branchId: string;

  @ApiPropertyOptional({ description: 'Start date for analytics' })
  @IsOptional()
  @Type(() => Date)
  startDate?: Date;

  @ApiPropertyOptional({ description: 'End date for analytics' })
  @IsOptional()
  @Type(() => Date)
  endDate?: Date;
}

export class SessionAnalyticsDto {
  @ApiProperty({ description: 'Branch ID' })
  @IsString()
  branchId: string;

  @ApiPropertyOptional({ description: 'Start date' })
  @IsOptional()
  @Type(() => Date)
  startDate?: Date;

  @ApiPropertyOptional({ description: 'End date' })
  @IsOptional()
  @Type(() => Date)
  endDate?: Date;
}
