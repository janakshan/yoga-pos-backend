import { ApiProperty } from '@nestjs/swagger';
import { IsObject } from 'class-validator';

export class UpdateOperatingHoursDto {
  @ApiProperty({
    example: {
      monday: { open: '09:00', close: '18:00' },
      tuesday: { open: '09:00', close: '18:00' },
      wednesday: { open: '09:00', close: '18:00' },
      thursday: { open: '09:00', close: '18:00' },
      friday: { open: '09:00', close: '18:00' },
      saturday: { open: '10:00', close: '16:00' },
      sunday: { open: '10:00', close: '16:00' },
    },
    description: 'Operating hours for each day of the week',
  })
  @IsObject()
  operatingHours: Record<string, { open: string; close: string }>;
}

export class UpdateBranchSettingsDto {
  @ApiProperty({
    example: {
      timezone: 'America/New_York',
      currency: 'USD',
      taxRate: 8.5,
    },
    description: 'Branch settings to update',
  })
  @IsObject()
  settings: {
    timezone?: string;
    currency?: string;
    taxRate?: number;
    [key: string]: any;
  };
}
