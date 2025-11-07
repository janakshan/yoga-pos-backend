import { ApiProperty } from '@nestjs/swagger';
import { IsObject } from 'class-validator';

export class BulkUpdateSettingsDto {
  @ApiProperty({
    example: {
      business_name: 'My Yoga Studio',
      currency: 'USD',
      tax_rate: '10',
      enable_notifications: 'true',
    },
    description: 'Key-value pairs of settings to update',
  })
  @IsObject()
  settings: Record<string, string>;
}
