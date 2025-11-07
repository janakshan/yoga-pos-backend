import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EmailInvoiceDto {
  @ApiProperty({
    description: 'Email address to send invoice to',
    example: 'customer@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Email subject',
    example: 'Your Invoice from Yoga POS',
    required: false,
  })
  @IsString()
  @IsOptional()
  subject?: string;

  @ApiProperty({
    description: 'Email body message',
    example: 'Please find attached your invoice. Thank you for your business!',
    required: false,
  })
  @IsString()
  @IsOptional()
  message?: string;
}
