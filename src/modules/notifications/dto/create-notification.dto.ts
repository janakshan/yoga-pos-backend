import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  IsObject,
  IsDateString,
} from 'class-validator';
import {
  NotificationChannel,
  NotificationType,
} from '../entities/notification.entity';

export class CreateNotificationDto {
  @ApiProperty({
    enum: NotificationChannel,
    example: NotificationChannel.EMAIL,
    description: 'Notification channel',
  })
  @IsEnum(NotificationChannel)
  channel: NotificationChannel;

  @ApiProperty({
    enum: NotificationType,
    example: NotificationType.SYSTEM,
    description: 'Notification type',
  })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiPropertyOptional({ example: 'Low Stock Alert', description: 'Subject' })
  @IsString()
  @IsOptional()
  subject?: string;

  @ApiProperty({
    example: 'Product XYZ is running low on stock',
    description: 'Notification message',
  })
  @IsString()
  message: string;

  @ApiPropertyOptional({
    example: 'user@example.com',
    description: 'Recipient (email, phone, or device token)',
  })
  @IsString()
  @IsOptional()
  recipient?: string;

  @ApiPropertyOptional({
    example: 'uuid',
    description: 'User ID to send notification to',
  })
  @IsUUID()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({
    example: { priority: 'high', templateId: 'low-stock-alert' },
    description: 'Additional metadata',
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    example: '2025-11-08T10:00:00Z',
    description: 'Schedule notification for later',
  })
  @IsDateString()
  @IsOptional()
  scheduledFor?: Date;
}
