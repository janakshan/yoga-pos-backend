import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsArray, IsEnum } from 'class-validator';
import { DateRangeFilterDto } from './date-range-filter.dto';

export enum ServiceType {
  DINE_IN = 'DINE_IN',
  TAKEAWAY = 'TAKEAWAY',
  DELIVERY = 'DELIVERY',
}

export class ServerPerformanceFilterDto extends DateRangeFilterDto {
  @ApiProperty({
    description: 'Filter by specific server IDs',
    required: false,
    type: [String],
    example: ['123e4567-e89b-12d3-a456-426614174000'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  serverIds?: string[];
}

export class MenuAnalyticsFilterDto extends DateRangeFilterDto {
  @ApiProperty({
    description: 'Filter by category IDs',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  categoryIds?: string[];

  @ApiProperty({
    description: 'Filter by service type',
    required: false,
    enum: ServiceType,
  })
  @IsOptional()
  @IsEnum(ServiceType)
  serviceType?: ServiceType;
}

export class TablePerformanceFilterDto extends DateRangeFilterDto {
  @ApiProperty({
    description: 'Filter by specific table IDs',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tableIds?: string[];

  @ApiProperty({
    description: 'Filter by section IDs',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  sectionIds?: string[];
}

export class KitchenMetricsFilterDto extends DateRangeFilterDto {
  @ApiProperty({
    description: 'Filter by kitchen station IDs',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  stationIds?: string[];
}
