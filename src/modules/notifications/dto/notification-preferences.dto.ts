import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsObject } from 'class-validator';

export class NotificationPreferencesDto {
  @ApiPropertyOptional({
    example: true,
    description: 'Enable email notifications',
  })
  @IsBoolean()
  @IsOptional()
  email?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Enable SMS notifications',
  })
  @IsBoolean()
  @IsOptional()
  sms?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Enable push notifications',
  })
  @IsBoolean()
  @IsOptional()
  push?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Enable WhatsApp notifications',
  })
  @IsBoolean()
  @IsOptional()
  whatsapp?: boolean;

  @ApiPropertyOptional({
    example: {
      lowStock: true,
      orderUpdates: true,
      marketing: false,
    },
    description: 'Notification type preferences',
  })
  @IsObject()
  @IsOptional()
  types?: {
    lowStock?: boolean;
    orderUpdates?: boolean;
    marketing?: boolean;
    system?: boolean;
  };
}
