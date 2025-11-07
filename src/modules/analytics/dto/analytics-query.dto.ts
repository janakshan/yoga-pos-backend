import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsUUID, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum TimeGranularity {
  HOUR = 'hour',
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
}

export class AnalyticsQueryDto {
  @ApiProperty({ required: false, description: 'Start date in ISO format' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ required: false, description: 'End date in ISO format' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ required: false, description: 'Branch ID' })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiProperty({ required: false, enum: TimeGranularity, description: 'Time granularity' })
  @IsOptional()
  @IsEnum(TimeGranularity)
  granularity?: TimeGranularity;

  @ApiProperty({ required: false, description: 'Number of periods to compare' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  comparePeriodsCount?: number;
}
