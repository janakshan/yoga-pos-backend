import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsEnum, IsNumber, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export enum ReportPeriod {
  TODAY = 'today',
  YESTERDAY = 'yesterday',
  THIS_WEEK = 'this_week',
  LAST_WEEK = 'last_week',
  THIS_MONTH = 'this_month',
  LAST_MONTH = 'last_month',
  THIS_QUARTER = 'this_quarter',
  LAST_QUARTER = 'last_quarter',
  THIS_YEAR = 'this_year',
  LAST_YEAR = 'last_year',
  CUSTOM = 'custom',
}

export enum ReportGranularity {
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

export class DateRangeFilterDto {
  @ApiProperty({
    description: 'Predefined report period',
    enum: ReportPeriod,
    required: false,
    example: ReportPeriod.THIS_MONTH,
  })
  @IsOptional()
  @IsEnum(ReportPeriod)
  period?: ReportPeriod;

  @ApiProperty({
    description: 'Custom start date (ISO 8601 format)',
    required: false,
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: 'Custom end date (ISO 8601 format)',
    required: false,
    example: '2024-01-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({
    description: 'Branch ID filter',
    required: false,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiProperty({
    description: 'Report data granularity',
    enum: ReportGranularity,
    required: false,
    example: ReportGranularity.DAILY,
  })
  @IsOptional()
  @IsEnum(ReportGranularity)
  granularity?: ReportGranularity;

  @ApiProperty({
    description: 'Compare with previous period',
    required: false,
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  compareWithPrevious?: boolean;
}
