import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEmail,
  IsObject,
  IsNumber,
  IsArray,
  Min,
  Max,
} from 'class-validator';

export class CreateSupplierDto {
  @ApiProperty({ example: 'SUP001', description: 'Unique supplier code' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'Yoga Supplies Co.', description: 'Supplier name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: 'manufacturer',
    description: 'Supplier type',
  })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ example: 'active', description: 'Supplier status' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({
    example: 'contact@supplier.com',
    description: 'Email address',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    example: '+1-555-0100',
    description: 'Phone number',
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    example: 'https://supplier.com',
    description: 'Website URL',
  })
  @IsString()
  @IsOptional()
  website?: string;

  @ApiPropertyOptional({
    example: {
      street: '123 Supply St',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90001',
      country: 'USA',
    },
    description: 'Address information',
  })
  @IsObject()
  @IsOptional()
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };

  @ApiPropertyOptional({
    example: 'John Smith',
    description: 'Primary contact person',
  })
  @IsString()
  @IsOptional()
  contactPerson?: string;

  @ApiPropertyOptional({
    example: '+1-555-0101',
    description: 'Contact phone number',
  })
  @IsString()
  @IsOptional()
  contactPhone?: string;

  @ApiPropertyOptional({
    example: 'john@supplier.com',
    description: 'Contact email',
  })
  @IsEmail()
  @IsOptional()
  contactEmail?: string;

  @ApiPropertyOptional({
    example: 'Net 30',
    description: 'Payment terms',
  })
  @IsString()
  @IsOptional()
  paymentTerms?: string;

  @ApiPropertyOptional({
    example: 50000,
    description: 'Credit limit',
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  creditLimit?: number;

  @ApiPropertyOptional({
    example: 8.5,
    description: 'Tax rate percentage',
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  taxRate?: number;

  @ApiPropertyOptional({
    example: 'TAX-123456',
    description: 'Tax identification number',
  })
  @IsString()
  @IsOptional()
  taxId?: string;

  @ApiPropertyOptional({
    example: 'Bank of America',
    description: 'Bank name',
  })
  @IsString()
  @IsOptional()
  bankName?: string;

  @ApiPropertyOptional({
    example: '1234567890',
    description: 'Bank account number',
  })
  @IsString()
  @IsOptional()
  bankAccount?: string;

  @ApiPropertyOptional({
    example: ['prod_001', 'prod_002'],
    description: 'Product catalog',
  })
  @IsArray()
  @IsOptional()
  products?: string[];

  @ApiPropertyOptional({
    example: {},
    description: 'Custom fields',
  })
  @IsObject()
  @IsOptional()
  customFields?: any;

  @ApiPropertyOptional({
    example: 'Additional notes about supplier',
    description: 'Notes',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
