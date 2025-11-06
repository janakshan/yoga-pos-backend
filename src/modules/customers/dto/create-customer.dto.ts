import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsObject,
  IsEnum,
} from 'class-validator';

export enum CustomerType {
  REGULAR = 'regular',
  VIP = 'vip',
  WHOLESALE = 'wholesale',
  MEMBER = 'member',
}

export enum CustomerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export class CreateCustomerDto {
  @ApiProperty({ example: 'John', description: 'Customer first name' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'Customer last name' })
  @IsString()
  lastName: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Customer email address',
  })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+1234567890', description: 'Customer phone number' })
  @IsString()
  phone: string;

  @ApiPropertyOptional({
    example: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA',
    },
    description: 'Customer address',
  })
  @IsObject()
  @IsOptional()
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };

  @ApiPropertyOptional({
    example: 'regular',
    description: 'Customer type',
    enum: CustomerType,
  })
  @IsEnum(CustomerType)
  @IsOptional()
  customerType?: CustomerType;

  @ApiPropertyOptional({
    example: 'active',
    description: 'Customer status',
    enum: CustomerStatus,
  })
  @IsEnum(CustomerStatus)
  @IsOptional()
  status?: CustomerStatus;

  @ApiPropertyOptional({
    example: {
      points: 0,
      tier: 'bronze',
      joinDate: '2024-01-01',
      expiryDate: '2025-01-01',
    },
    description: 'Customer loyalty program information',
  })
  @IsObject()
  @IsOptional()
  loyaltyInfo?: {
    points?: number;
    tier?: string;
    joinDate?: string;
    expiryDate?: string;
    membershipNumber?: string;
  };

  @ApiPropertyOptional({
    example: {
      communicationPreference: 'email',
      marketingOptIn: true,
      preferredLanguage: 'en',
    },
    description: 'Customer preferences',
  })
  @IsObject()
  @IsOptional()
  preferences?: {
    communicationPreference?: string;
    marketingOptIn?: boolean;
    preferredLanguage?: string;
    notificationSettings?: any;
  };
}
