import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsObject,
  IsUUID,
} from 'class-validator';

export class CreateBranchDto {
  @ApiProperty({ example: 'Downtown Branch', description: 'Branch name' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'DT001', description: 'Unique branch code' })
  @IsString()
  code: string;

  @ApiProperty({
    example: '123 Main Street',
    description: 'Branch street address',
  })
  @IsString()
  address: string;

  @ApiProperty({ example: 'New York', description: 'City' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'NY', description: 'State or province' })
  @IsString()
  state: string;

  @ApiProperty({ example: '10001', description: 'ZIP or postal code' })
  @IsString()
  zipCode: string;

  @ApiProperty({ example: 'USA', description: 'Country' })
  @IsString()
  country: string;

  @ApiProperty({ example: '+1234567890', description: 'Branch phone number' })
  @IsString()
  phone: string;

  @ApiProperty({
    example: 'downtown@example.com',
    description: 'Branch email address',
  })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Manager user ID',
  })
  @IsUUID()
  @IsOptional()
  managerId?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the branch is active',
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: {
      timezone: 'America/New_York',
      currency: 'USD',
      taxRate: 8.5,
      operatingHours: {
        monday: { open: '09:00', close: '18:00' },
        tuesday: { open: '09:00', close: '18:00' },
        wednesday: { open: '09:00', close: '18:00' },
        thursday: { open: '09:00', close: '18:00' },
        friday: { open: '09:00', close: '18:00' },
        saturday: { open: '10:00', close: '16:00' },
        sunday: { open: '10:00', close: '16:00' },
      },
    },
    description: 'Branch settings and configuration',
  })
  @IsObject()
  @IsOptional()
  settings?: {
    timezone?: string;
    currency?: string;
    taxRate?: number;
    operatingHours?: Record<string, { open: string; close: string }>;
    [key: string]: any;
  };
}
