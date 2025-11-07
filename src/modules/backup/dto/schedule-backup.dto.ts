import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsNumber,
} from 'class-validator';
import { BackupStorageLocation } from '../entities/backup.entity';

export class ScheduleBackupDto {
  @ApiProperty({
    example: '0 2 * * *',
    description: 'Cron expression for scheduling (e.g., "0 2 * * *" for 2 AM daily)',
  })
  @IsString()
  cronExpression: string;

  @ApiPropertyOptional({
    enum: BackupStorageLocation,
    example: BackupStorageLocation.LOCAL,
    description: 'Storage location for scheduled backups',
  })
  @IsEnum(BackupStorageLocation)
  @IsOptional()
  storageLocation?: BackupStorageLocation;

  @ApiPropertyOptional({
    example: true,
    description: 'Enable auto-delete for old backups',
  })
  @IsBoolean()
  @IsOptional()
  isAutoDeleteEnabled?: boolean;

  @ApiPropertyOptional({
    example: 30,
    description: 'Retention period in days',
  })
  @IsNumber()
  @IsOptional()
  retentionDays?: number;
}
