import {
  Controller,
  Get,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { DateRangeDto, ReportPeriod } from './dto/date-range.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Reports')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Generate sales report' })
  @ApiResponse({ status: 200, description: 'Sales report generated successfully' })
  @ApiQuery({ name: 'period', required: false, enum: ReportPeriod })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'branchId', required: false, type: String })
  getSalesReport(@Query() dto: DateRangeDto) {
    return this.reportsService.generateSalesReport(dto);
  }

  @Get('sales/daily')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Generate daily sales report' })
  @ApiResponse({ status: 200, description: 'Daily sales report generated successfully' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'branchId', required: false, type: String })
  getDailySalesReport(@Query() dto: DateRangeDto) {
    return this.reportsService.generateSalesReport({
      ...dto,
      period: ReportPeriod.DAILY,
    });
  }

  @Get('sales/weekly')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Generate weekly sales report' })
  @ApiResponse({ status: 200, description: 'Weekly sales report generated successfully' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'branchId', required: false, type: String })
  getWeeklySalesReport(@Query() dto: DateRangeDto) {
    return this.reportsService.generateSalesReport({
      ...dto,
      period: ReportPeriod.WEEKLY,
    });
  }

  @Get('sales/monthly')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Generate monthly sales report' })
  @ApiResponse({ status: 200, description: 'Monthly sales report generated successfully' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'branchId', required: false, type: String })
  getMonthlySalesReport(@Query() dto: DateRangeDto) {
    return this.reportsService.generateSalesReport({
      ...dto,
      period: ReportPeriod.MONTHLY,
    });
  }

  @Get('sales/yearly')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Generate yearly sales report' })
  @ApiResponse({ status: 200, description: 'Yearly sales report generated successfully' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'branchId', required: false, type: String })
  getYearlySalesReport(@Query() dto: DateRangeDto) {
    return this.reportsService.generateSalesReport({
      ...dto,
      period: ReportPeriod.YEARLY,
    });
  }

  @Get('inventory/valuation')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Generate inventory valuation report' })
  @ApiResponse({ status: 200, description: 'Inventory valuation report generated successfully' })
  @ApiQuery({ name: 'branchId', required: false, type: String })
  getInventoryValuationReport(@Query('branchId') branchId?: string) {
    return this.reportsService.generateInventoryValuationReport(branchId);
  }

  @Get('profit-loss')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Generate profit and loss report' })
  @ApiResponse({ status: 200, description: 'Profit and loss report generated successfully' })
  @ApiQuery({ name: 'period', required: false, enum: ReportPeriod })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'branchId', required: false, type: String })
  getProfitLossReport(@Query() dto: DateRangeDto) {
    return this.reportsService.generateProfitLossReport(dto);
  }

  @Get('inventory/slow-moving')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Generate slow-moving stock analysis report' })
  @ApiResponse({
    status: 200,
    description: 'Slow-moving stock report generated successfully',
  })
  @ApiQuery({
    name: 'daysThreshold',
    required: false,
    type: Number,
    description: 'Days threshold for slow-moving items (default: 90)',
  })
  @ApiQuery({ name: 'branchId', required: false, type: String })
  getSlowMovingStockReport(
    @Query('daysThreshold', new DefaultValuePipe(90), ParseIntPipe) daysThreshold: number,
    @Query('branchId') branchId?: string,
  ) {
    return this.reportsService.generateSlowMovingStockReport(daysThreshold, branchId);
  }

  @Get('employees/performance')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Generate employee performance report' })
  @ApiResponse({ status: 200, description: 'Employee performance report generated successfully' })
  @ApiQuery({ name: 'period', required: false, enum: ReportPeriod })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'branchId', required: false, type: String })
  getEmployeePerformanceReport(@Query() dto: DateRangeDto) {
    return this.reportsService.generateEmployeePerformanceReport(dto);
  }

  @Get('customers/analytics')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Generate customer analytics report' })
  @ApiResponse({ status: 200, description: 'Customer analytics report generated successfully' })
  @ApiQuery({ name: 'period', required: false, enum: ReportPeriod })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'branchId', required: false, type: String })
  getCustomerAnalyticsReport(@Query() dto: DateRangeDto) {
    return this.reportsService.generateCustomerAnalytics(dto);
  }

  @Get('tax')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Generate tax report' })
  @ApiResponse({ status: 200, description: 'Tax report generated successfully' })
  @ApiQuery({ name: 'period', required: false, enum: ReportPeriod })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'branchId', required: false, type: String })
  getTaxReport(@Query() dto: DateRangeDto) {
    return this.reportsService.generateTaxReport(dto);
  }
}
