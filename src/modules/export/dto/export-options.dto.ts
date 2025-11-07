import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsArray, IsString } from 'class-validator';

export enum ExportFormat {
  CSV = 'csv',
  JSON = 'json',
}

export enum ExportReportType {
  SALES = 'sales',
  INVENTORY = 'inventory',
  PROFIT_LOSS = 'profit_loss',
  SLOW_MOVING = 'slow_moving',
  EMPLOYEE_PERFORMANCE = 'employee_performance',
  CUSTOMER_ANALYTICS = 'customer_analytics',
  TAX = 'tax',
}

export class ExportOptionsDto {
  @ApiProperty({ enum: ExportFormat, description: 'Export format' })
  @IsEnum(ExportFormat)
  format: ExportFormat;

  @ApiProperty({ enum: ExportReportType, description: 'Report type to export' })
  @IsEnum(ExportReportType)
  reportType: ExportReportType;

  @ApiProperty({ required: false, description: 'Report title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ required: false, description: 'Columns to include', type: [String] })
  @IsOptional()
  @IsArray()
  columns?: string[];

  @ApiProperty({ required: false, description: 'Start date in ISO format' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiProperty({ required: false, description: 'End date in ISO format' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiProperty({ required: false, description: 'Branch ID' })
  @IsOptional()
  @IsString()
  branchId?: string;
}
