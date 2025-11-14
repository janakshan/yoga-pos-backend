import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsInt,
  IsArray,
  IsUUID,
  Min,
  Max,
  IsObject,
  ValidateNested,
  IsNumber,
  IsIP,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  PrinterConnectionType,
  PrinterProtocol,
  PrinterStatus,
  PrintJobStatus,
  PrintJobPriority,
  PrinterRoutingStrategy,
  CustomerDisplayType,
  DisplayConnectionType,
  NotificationDeviceType,
  NotificationStatus,
} from '../common/hardware.constants';

// ============================================================================
// PRINTER CONFIGURATION DTOs
// ============================================================================

export class CreatePrinterConfigDto {
  @ApiProperty({ description: 'Branch ID' })
  @IsUUID()
  branchId: string;

  @ApiProperty({ description: 'Printer name', example: 'Kitchen Printer 1' })
  @IsString()
  @Length(1, 100)
  name: string;

  @ApiPropertyOptional({ description: 'Printer description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: PrinterConnectionType, description: 'Connection type' })
  @IsEnum(PrinterConnectionType)
  connectionType: PrinterConnectionType;

  @ApiProperty({ enum: PrinterProtocol, description: 'Printer protocol', default: PrinterProtocol.ESC_POS })
  @IsEnum(PrinterProtocol)
  protocol: PrinterProtocol;

  @ApiPropertyOptional({ description: 'IP address for network printers' })
  @IsOptional()
  @IsIP()
  ipAddress?: string;

  @ApiPropertyOptional({ description: 'Port for network printers', example: 9100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  port?: number;

  @ApiPropertyOptional({ description: 'Device path for USB/Serial printers', example: '/dev/usb/lp0' })
  @IsOptional()
  @IsString()
  devicePath?: string;

  @ApiPropertyOptional({ description: 'MAC address for Bluetooth printers' })
  @IsOptional()
  @IsString()
  macAddress?: string;

  @ApiPropertyOptional({ description: 'Paper width in mm', default: 80 })
  @IsOptional()
  @IsInt()
  @Min(58)
  @Max(80)
  paperWidth?: number;

  @ApiPropertyOptional({ description: 'Characters per line', default: 48 })
  @IsOptional()
  @IsInt()
  @Min(32)
  @Max(64)
  charactersPerLine?: number;

  @ApiPropertyOptional({ description: 'Text encoding', default: 'UTF-8' })
  @IsOptional()
  @IsString()
  encoding?: string;

  @ApiPropertyOptional({ description: 'Connection timeout in ms', default: 5000 })
  @IsOptional()
  @IsInt()
  @Min(1000)
  @Max(30000)
  timeout?: number;

  @ApiPropertyOptional({ description: 'Cloud configuration for cloud printers' })
  @IsOptional()
  @IsObject()
  cloudConfig?: {
    apiKey: string;
    printerId: string;
    provider: 'printnode' | 'google_cloud_print' | 'custom';
    endpoint?: string;
  };

  @ApiPropertyOptional({ description: 'Kitchen station mappings' })
  @IsOptional()
  @IsArray()
  stationMappings?: Array<{
    stationId: string;
    stationType: string;
    isPrimary: boolean;
  }>;

  @ApiPropertyOptional({ description: 'Is default printer', default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdatePrinterConfigDto extends PartialType(CreatePrinterConfigDto) {
  @ApiPropertyOptional({ description: 'Printer active status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ enum: PrinterStatus, description: 'Printer status' })
  @IsOptional()
  @IsEnum(PrinterStatus)
  status?: PrinterStatus;
}

// ============================================================================
// PRINT JOB DTOs
// ============================================================================

export class CreatePrintJobDto {
  @ApiProperty({ description: 'Order ID' })
  @IsUUID()
  orderId: string;

  @ApiPropertyOptional({ description: 'Specific printer IDs to use' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  printerIds?: string[];

  @ApiPropertyOptional({ description: 'Number of copies', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  copies?: number;

  @ApiPropertyOptional({ enum: PrintJobPriority, description: 'Job priority', default: PrintJobPriority.NORMAL })
  @IsOptional()
  @IsEnum(PrintJobPriority)
  priority?: PrintJobPriority;

  @ApiPropertyOptional({ description: 'Custom content to print' })
  @IsOptional()
  @IsString()
  customContent?: string;

  @ApiPropertyOptional({ description: 'Job metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class RetryPrintJobDto {
  @ApiProperty({ description: 'Print job ID to retry' })
  @IsUUID()
  jobId: string;

  @ApiPropertyOptional({ description: 'Force retry even if max retries exceeded', default: false })
  @IsOptional()
  @IsBoolean()
  force?: boolean;
}

export class CancelPrintJobDto {
  @ApiProperty({ description: 'Print job ID to cancel' })
  @IsUUID()
  jobId: string;

  @ApiPropertyOptional({ description: 'Reason for cancellation' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class FilterPrintJobsDto {
  @ApiPropertyOptional({ description: 'Filter by branch ID' })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Filter by printer ID' })
  @IsOptional()
  @IsUUID()
  printerId?: string;

  @ApiPropertyOptional({ description: 'Filter by order ID' })
  @IsOptional()
  @IsUUID()
  orderId?: string;

  @ApiPropertyOptional({ enum: PrintJobStatus, isArray: true, description: 'Filter by job status' })
  @IsOptional()
  @IsArray()
  @IsEnum(PrintJobStatus, { each: true })
  status?: PrintJobStatus[];

  @ApiPropertyOptional({ enum: PrintJobPriority, isArray: true, description: 'Filter by priority' })
  @IsOptional()
  @IsArray()
  @IsEnum(PrintJobPriority, { each: true })
  priority?: PrintJobPriority[];

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

// ============================================================================
// CUSTOMER DISPLAY DTOs
// ============================================================================

export class CustomerDisplayConfigDto {
  @ApiProperty({ description: 'Branch ID' })
  @IsUUID()
  branchId: string;

  @ApiProperty({ description: 'Display name', example: 'Counter Display 1' })
  @IsString()
  @Length(1, 100)
  name: string;

  @ApiProperty({ enum: CustomerDisplayType, description: 'Display type' })
  @IsEnum(CustomerDisplayType)
  displayType: CustomerDisplayType;

  @ApiProperty({ enum: DisplayConnectionType, description: 'Connection type' })
  @IsEnum(DisplayConnectionType)
  connectionType: DisplayConnectionType;

  @ApiPropertyOptional({ description: 'IP address for network displays' })
  @IsOptional()
  @IsIP()
  ipAddress?: string;

  @ApiPropertyOptional({ description: 'Port for network displays' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  port?: number;

  @ApiPropertyOptional({ description: 'Device path for serial/USB displays' })
  @IsOptional()
  @IsString()
  devicePath?: string;

  @ApiPropertyOptional({ description: 'Number of display rows', default: 2 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  rows?: number;

  @ApiPropertyOptional({ description: 'Number of display columns', default: 20 })
  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(80)
  columns?: number;

  @ApiPropertyOptional({ description: 'Display brightness (0-100)', default: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  brightness?: number;
}

export class UpdateCustomerDisplayDto {
  @ApiProperty({ description: 'Display ID' })
  @IsUUID()
  displayId: string;

  @ApiPropertyOptional({ description: 'Top line text' })
  @IsOptional()
  @IsString()
  topLine?: string;

  @ApiPropertyOptional({ description: 'Bottom line text' })
  @IsOptional()
  @IsString()
  bottomLine?: string;

  @ApiPropertyOptional({ description: 'Clear display before updating', default: false })
  @IsOptional()
  @IsBoolean()
  clear?: boolean;
}

export class ShowOrderOnDisplayDto {
  @ApiProperty({ description: 'Order ID to display' })
  @IsUUID()
  orderId: string;

  @ApiPropertyOptional({ description: 'Display ID (uses default if not specified)' })
  @IsOptional()
  @IsUUID()
  displayId?: string;

  @ApiPropertyOptional({ description: 'Show item details', default: false })
  @IsOptional()
  @IsBoolean()
  showItems?: boolean;
}

// ============================================================================
// NOTIFICATION DTOs
// ============================================================================

export class NotificationDeviceConfigDto {
  @ApiProperty({ description: 'Branch ID' })
  @IsUUID()
  branchId: string;

  @ApiProperty({ description: 'Device name', example: 'Pager #42' })
  @IsString()
  @Length(1, 100)
  name: string;

  @ApiProperty({ description: 'Device ID/Number', example: '42' })
  @IsString()
  @Length(1, 100)
  deviceId: string;

  @ApiProperty({ enum: NotificationDeviceType, description: 'Device type' })
  @IsEnum(NotificationDeviceType)
  deviceType: NotificationDeviceType;

  @ApiPropertyOptional({ description: 'Vibration pattern (duration in ms)' })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  vibrationPattern?: number[];

  @ApiPropertyOptional({ description: 'Light color (hex)', example: '#FF0000' })
  @IsOptional()
  @IsString()
  lightColor?: string;

  @ApiPropertyOptional({ description: 'Sound pattern identifier' })
  @IsOptional()
  @IsString()
  soundPattern?: string;

  @ApiPropertyOptional({ description: 'Auto-dismiss timeout in seconds', default: 300 })
  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(3600)
  timeout?: number;
}

export class SendNotificationDto {
  @ApiProperty({ description: 'Order ID' })
  @IsUUID()
  orderId: string;

  @ApiPropertyOptional({ description: 'Device ID to notify (auto-select if not specified)' })
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiPropertyOptional({ description: 'Custom message' })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional({ description: 'Notification metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class AcknowledgeNotificationDto {
  @ApiProperty({ description: 'Notification log ID' })
  @IsUUID()
  notificationId: string;

  @ApiPropertyOptional({ description: 'Acknowledged by user ID' })
  @IsOptional()
  @IsUUID()
  acknowledgedBy?: string;
}

export class FilterNotificationsDto {
  @ApiPropertyOptional({ description: 'Filter by branch ID' })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Filter by order ID' })
  @IsOptional()
  @IsUUID()
  orderId?: string;

  @ApiPropertyOptional({ description: 'Filter by device ID' })
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiPropertyOptional({ enum: NotificationStatus, isArray: true, description: 'Filter by status' })
  @IsOptional()
  @IsArray()
  @IsEnum(NotificationStatus, { each: true })
  status?: NotificationStatus[];

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

// ============================================================================
// HARDWARE MONITORING DTOs
// ============================================================================

export class PrinterHealthCheckDto {
  @ApiProperty({ description: 'Printer ID to check' })
  @IsUUID()
  printerId: string;
}

export class PrinterStatisticsDto {
  @ApiProperty({ description: 'Printer ID' })
  printerId: string;

  @ApiProperty({ description: 'Total jobs processed' })
  totalJobs: number;

  @ApiProperty({ description: 'Successful jobs' })
  successfulJobs: number;

  @ApiProperty({ description: 'Failed jobs' })
  failedJobs: number;

  @ApiProperty({ description: 'Success rate percentage' })
  successRate: number;

  @ApiProperty({ description: 'Average print time in ms' })
  averagePrintTime: number;

  @ApiProperty({ description: 'Last print time' })
  lastPrintAt: Date;

  @ApiProperty({ description: 'Current status' })
  status: PrinterStatus;
}

export class HardwareHealthResponseDto {
  @ApiProperty({ description: 'Health check timestamp' })
  timestamp: Date;

  @ApiProperty({ description: 'Printers status' })
  printers: Array<{
    id: string;
    name: string;
    status: PrinterStatus;
    lastCheck: Date;
    errorMessage?: string;
  }>;

  @ApiProperty({ description: 'Overall health status' })
  overallStatus: 'healthy' | 'degraded' | 'critical';

  @ApiPropertyOptional({ description: 'Issues found' })
  issues?: string[];
}

// ============================================================================
// HARDWARE SETTINGS DTOs
// ============================================================================

export class UpdateHardwareSettingsDto {
  @ApiProperty({ description: 'Branch ID' })
  @IsUUID()
  branchId: string;

  @ApiPropertyOptional({ description: 'Enable printer integration', default: true })
  @IsOptional()
  @IsBoolean()
  printersEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Default printer ID' })
  @IsOptional()
  @IsUUID()
  defaultPrinterId?: string;

  @ApiPropertyOptional({ enum: PrinterRoutingStrategy, description: 'Routing strategy' })
  @IsOptional()
  @IsEnum(PrinterRoutingStrategy)
  routingStrategy?: PrinterRoutingStrategy;

  @ApiPropertyOptional({ description: 'Auto-print orders', default: true })
  @IsOptional()
  @IsBoolean()
  autoPrint?: boolean;

  @ApiPropertyOptional({ description: 'Default number of copies', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  printCopies?: number;

  @ApiPropertyOptional({ description: 'Enable customer display', default: false })
  @IsOptional()
  @IsBoolean()
  customerDisplayEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Enable notifications', default: false })
  @IsOptional()
  @IsBoolean()
  notificationsEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Auto-notify on order ready', default: true })
  @IsOptional()
  @IsBoolean()
  autoNotifyOnReady?: boolean;
}
