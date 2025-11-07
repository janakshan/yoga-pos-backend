import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { BackupStorageLocation } from '../entities/backup.entity';

export class CloudUploadDto {
  @ApiProperty({
    enum: BackupStorageLocation,
    example: BackupStorageLocation.GOOGLE_DRIVE,
    description: 'Cloud storage provider',
  })
  @IsEnum(BackupStorageLocation)
  storageLocation: BackupStorageLocation;

  @ApiPropertyOptional({
    example: '/backups',
    description: 'Folder path in cloud storage',
  })
  @IsString()
  @IsOptional()
  folderPath?: string;

  @ApiPropertyOptional({
    example: 'custom-backup-name.sql',
    description: 'Custom filename for cloud storage',
  })
  @IsString()
  @IsOptional()
  customFilename?: string;
}
