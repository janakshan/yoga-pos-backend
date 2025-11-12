import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsDateString } from 'class-validator';

export class ServerPerformanceQueryDto {
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

  @ApiPropertyOptional({
    example: '2024-01-01T00:00:00Z',
    description: 'Start date for performance metrics',
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    example: '2024-01-31T23:59:59Z',
    description: 'End date for performance metrics',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}

export class ServerPerformanceResponseDto {
  serverId: string;
  serverName: string;
  serverCode: string;
  totalShifts: number;
  totalHoursWorked: number;
  totalSales: number;
  totalTips: number;
  averageTipPercentage: number;
  totalOrders: number;
  averageOrderValue: number;
  totalCustomers: number;
  averageCustomersPerShift: number;
  salesPerHour: number;
  ordersPerHour: number;
  rating?: number;
  topSections?: Array<{
    sectionId: string;
    sectionName: string;
    totalSales: number;
    shiftCount: number;
  }>;
}
