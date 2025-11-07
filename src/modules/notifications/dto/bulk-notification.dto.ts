import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  IsObject,
  IsDateString,
} from 'class-validator';
import {
  NotificationChannel,
  NotificationType,
} from '../entities/notification.entity';

export class BulkNotificationDto {
  @ApiProperty({
    enum: NotificationChannel,
    example: NotificationChannel.EMAIL,
    description: 'Notification channel',
  })
  @IsEnum(NotificationChannel)
  channel: NotificationChannel;

  @ApiProperty({
    enum: NotificationType,
    example: NotificationType.MARKETING,
    description: 'Notification type',
  })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiPropertyOptional({
    example: 'Special Offer!',
    description: 'Subject',
  })
  @IsString()
  @IsOptional()
  subject?: string;

  @ApiProperty({
    example: 'Check out our new yoga classes!',
    description: 'Notification message',
  })
  @IsString()
  message: string;

  @ApiProperty({
    example: ['user-id-1', 'user-id-2'],
    description: 'Array of user IDs to send notification to',
  })
  @IsArray()
  @IsString({ each: true })
  userIds: string[];

  @ApiPropertyOptional({
    example: { priority: 'medium', campaign: 'spring-sale' },
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
