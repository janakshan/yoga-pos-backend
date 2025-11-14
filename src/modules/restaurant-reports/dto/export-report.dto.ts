import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum ExportFormat {
  CSV = 'csv',
  PDF = 'pdf',
  JSON = 'json',
}

export enum ReportType {
  TABLE_PERFORMANCE = 'table_performance',
  MENU_ANALYTICS = 'menu_analytics',
  SERVER_PERFORMANCE = 'server_performance',
  KITCHEN_METRICS = 'kitchen_metrics',
  SERVICE_TYPE_ANALYSIS = 'service_type_analysis',
  FOOD_COST_ANALYSIS = 'food_cost_analysis',
  TABLE_TURNOVER = 'table_turnover',
  PEAK_HOURS = 'peak_hours',
  PROFIT_MARGIN = 'profit_margin',
  QR_ORDERING = 'qr_ordering',
  COMPREHENSIVE_SUMMARY = 'comprehensive_summary',
}

export class ExportReportDto {
  @ApiProperty({
    description: 'Report type to export',
    enum: ReportType,
    example: ReportType.TABLE_PERFORMANCE,
  })
  @IsEnum(ReportType)
  reportType: ReportType;

  @ApiProperty({
    description: 'Export format',
    enum: ExportFormat,
    example: ExportFormat.PDF,
  })
  @IsEnum(ExportFormat)
  format: ExportFormat;

  @ApiProperty({
    description: 'Optional report title',
    required: false,
    example: 'Monthly Table Performance Report',
  })
  @IsOptional()
  @IsString()
  title?: string;
}
