import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsEnum, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import {
  BackupStatus,
  BackupType,
  BackupStorageLocation,
} from '../entities/backup.entity';

export class FilterBackupDto {
  @ApiPropertyOptional({ example: 1, description: 'Page number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, description: 'Items per page' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 10;

  @ApiPropertyOptional({
    example: 'backup-2025',
    description: 'Search term for filename',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: BackupStatus,
    example: BackupStatus.COMPLETED,
    description: 'Filter by status',
  })
  @IsOptional()
  @IsEnum(BackupStatus)
  status?: BackupStatus;

  @ApiPropertyOptional({
    enum: BackupType,
    example: BackupType.MANUAL,
    description: 'Filter by type',
  })
  @IsOptional()
  @IsEnum(BackupType)
  type?: BackupType;

  @ApiPropertyOptional({
    enum: BackupStorageLocation,
    example: BackupStorageLocation.LOCAL,
    description: 'Filter by storage location',
  })
  @IsOptional()
  @IsEnum(BackupStorageLocation)
  storageLocation?: BackupStorageLocation;

  @ApiPropertyOptional({
    example: 'createdAt',
    description: 'Sort field',
    enum: ['createdAt', 'completedAt', 'size'],
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    example: 'DESC',
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
