import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsDateString, IsEnum } from 'class-validator';

export enum ReportType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  CUSTOM = 'custom',
}

export enum ReportFormat {
  JSON = 'json',
  CSV = 'csv',
  PDF = 'pdf',
}

export class ServerReportQueryDto {
  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Filter by server ID',
  })
  @IsUUID()
  @IsOptional()
  serverId?: string;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Filter by branch ID',
  })
  @IsUUID()
  @IsOptional()
  branchId?: string;

  @ApiProperty({
    example: '2024-01-01T00:00:00Z',
    description: 'Start date for report',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    example: '2024-01-31T23:59:59Z',
    description: 'End date for report',
  })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({
    enum: ReportType,
    example: ReportType.MONTHLY,
    description: 'Report type',
  })
  @IsEnum(ReportType)
  @IsOptional()
  reportType?: ReportType;

  @ApiPropertyOptional({
    enum: ReportFormat,
    example: ReportFormat.JSON,
    description: 'Report format',
  })
  @IsEnum(ReportFormat)
  @IsOptional()
  format?: ReportFormat;
}
