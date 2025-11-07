import { IsEmail, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendInvoiceDto {
  @ApiProperty({
    description: 'Email address to send invoice to (optional, defaults to customer email)',
    example: 'customer@example.com',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Additional message to include in email',
    example: 'Thank you for your business!',
    required: false,
  })
  @IsString()
  @IsOptional()
  message?: string;
}
