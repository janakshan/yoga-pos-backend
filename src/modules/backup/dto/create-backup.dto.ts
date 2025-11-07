import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
  IsDateString,
} from 'class-validator';
import {
  BackupType,
  BackupStorageLocation,
} from '../entities/backup.entity';

export class CreateBackupDto {
  @ApiPropertyOptional({
    example: 'backup-2025-11-07.sql',
    description: 'Backup filename',
  })
  @IsString()
  @IsOptional()
  filename?: string;

  @ApiPropertyOptional({
    enum: BackupType,
    example: BackupType.MANUAL,
    description: 'Backup type',
  })
  @IsEnum(BackupType)
  @IsOptional()
  type?: BackupType;

  @ApiPropertyOptional({
    enum: BackupStorageLocation,
    example: BackupStorageLocation.LOCAL,
    description: 'Storage location',
  })
  @IsEnum(BackupStorageLocation)
  @IsOptional()
  storageLocation?: BackupStorageLocation;

  @ApiPropertyOptional({
    example: ['users', 'products', 'orders'],
    description: 'Tables to include in backup',
  })
  @IsArray()
  @IsOptional()
  tablesIncluded?: string[];

  @ApiPropertyOptional({
    example: true,
    description: 'Enable auto-delete',
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

  @ApiPropertyOptional({
    example: '2025-11-08T02:00:00Z',
    description: 'Schedule backup for later',
  })
  @IsDateString()
  @IsOptional()
  scheduledFor?: Date;
}
