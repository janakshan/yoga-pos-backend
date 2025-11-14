import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { RestaurantReportsService } from '../services/restaurant-reports.service';
import { ReportExportService } from '../services/report-export.service';
import {
  DateRangeFilterDto,
  ReportPeriod,
  ReportGranularity,
} from '../dto/date-range-filter.dto';
import {
  ServerPerformanceFilterDto,
  MenuAnalyticsFilterDto,
  TablePerformanceFilterDto,
  KitchenMetricsFilterDto,
} from '../dto/report-filters.dto';
import { ExportReportDto, ReportType, ExportFormat } from '../dto/export-report.dto';

@ApiTags('Restaurant Reports & Analytics')
@ApiBearerAuth()
@Controller('restaurant-reports')
@UseGuards(JwtAuthGuard)
export class RestaurantReportsController {
  constructor(
    private readonly reportsService: RestaurantReportsService,
    private readonly exportService: ReportExportService,
  ) {}

  /**
   * Get table performance report
   */
  @Get('table-performance')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(1800) // Cache for 30 minutes
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get table performance report',
    description:
      'Analyzes table utilization, revenue, turnover rate, and dining duration',
  })
  @ApiResponse({
    status: 200,
    description: 'Table performance report generated successfully',
  })
  @ApiQuery({ name: 'period', enum: ReportPeriod, required: false })
  @ApiQuery({ name: 'startDate', type: String, required: false })
  @ApiQuery({ name: 'endDate', type: String, required: false })
  @ApiQuery({ name: 'branchId', type: String, required: false })
  @ApiQuery({ name: 'tableIds', type: [String], required: false })
  @ApiQuery({ name: 'sectionIds', type: [String], required: false })
  async getTablePerformance(@Query() filter: TablePerformanceFilterDto) {
    return this.reportsService.getTablePerformanceReport(filter);
  }

  /**
   * Get menu analytics report
   */
  @Get('menu-analytics')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(1800)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get menu analytics report',
    description:
      'Analyzes menu item performance, popularity, profitability, and sales trends',
  })
  @ApiResponse({
    status: 200,
    description: 'Menu analytics report generated successfully',
  })
  @ApiQuery({ name: 'period', enum: ReportPeriod, required: false })
  @ApiQuery({ name: 'startDate', type: String, required: false })
  @ApiQuery({ name: 'endDate', type: String, required: false })
  @ApiQuery({ name: 'branchId', type: String, required: false })
  @ApiQuery({ name: 'categoryIds', type: [String], required: false })
  @ApiQuery({ name: 'serviceType', type: String, required: false })
  async getMenuAnalytics(@Query() filter: MenuAnalyticsFilterDto) {
    return this.reportsService.getMenuAnalyticsReport(filter);
  }

  /**
   * Get server performance report
   */
  @Get('server-performance')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(1800)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get server performance report',
    description:
      'Analyzes server efficiency, sales performance, tips, and customer satisfaction',
  })
  @ApiResponse({
    status: 200,
    description: 'Server performance report generated successfully',
  })
  @ApiQuery({ name: 'period', enum: ReportPeriod, required: false })
  @ApiQuery({ name: 'startDate', type: String, required: false })
  @ApiQuery({ name: 'endDate', type: String, required: false })
  @ApiQuery({ name: 'branchId', type: String, required: false })
  @ApiQuery({ name: 'serverIds', type: [String], required: false })
  async getServerPerformance(@Query() filter: ServerPerformanceFilterDto) {
    return this.reportsService.getServerPerformanceReport(filter);
  }

  /**
   * Get kitchen metrics report
   */
  @Get('kitchen-metrics')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(1800)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get kitchen metrics report',
    description:
      'Analyzes kitchen efficiency, preparation times, station performance, and on-time rates',
  })
  @ApiResponse({
    status: 200,
    description: 'Kitchen metrics report generated successfully',
  })
  @ApiQuery({ name: 'period', enum: ReportPeriod, required: false })
  @ApiQuery({ name: 'startDate', type: String, required: false })
  @ApiQuery({ name: 'endDate', type: String, required: false })
  @ApiQuery({ name: 'branchId', type: String, required: false })
  @ApiQuery({ name: 'stationIds', type: [String], required: false })
  async getKitchenMetrics(@Query() filter: KitchenMetricsFilterDto) {
    return this.reportsService.getKitchenMetricsReport(filter);
  }

  /**
   * Get service type analysis report
   */
  @Get('service-type-analysis')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(1800)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get service type analysis report',
    description:
      'Compares performance across DINE_IN, TAKEAWAY, and DELIVERY service types',
  })
  @ApiResponse({
    status: 200,
    description: 'Service type analysis report generated successfully',
  })
  @ApiQuery({ name: 'period', enum: ReportPeriod, required: false })
  @ApiQuery({ name: 'startDate', type: String, required: false })
  @ApiQuery({ name: 'endDate', type: String, required: false })
  @ApiQuery({ name: 'branchId', type: String, required: false })
  async getServiceTypeAnalysis(@Query() filter: DateRangeFilterDto) {
    return this.reportsService.getServiceTypeAnalysisReport(filter);
  }

  /**
   * Get food cost analysis report
   */
  @Get('food-cost-analysis')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(1800)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get food cost analysis report',
    description:
      'Analyzes cost of goods sold, food cost percentages, and profitability by category',
  })
  @ApiResponse({
    status: 200,
    description: 'Food cost analysis report generated successfully',
  })
  @ApiQuery({ name: 'period', enum: ReportPeriod, required: false })
  @ApiQuery({ name: 'startDate', type: String, required: false })
  @ApiQuery({ name: 'endDate', type: String, required: false })
  @ApiQuery({ name: 'branchId', type: String, required: false })
  async getFoodCostAnalysis(@Query() filter: DateRangeFilterDto) {
    return this.reportsService.getFoodCostAnalysisReport(filter);
  }

  /**
   * Get table turnover report
   */
  @Get('table-turnover')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(1800)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get table turnover report',
    description:
      'Analyzes table turnover rates, dining duration, and revenue per turnover',
  })
  @ApiResponse({
    status: 200,
    description: 'Table turnover report generated successfully',
  })
  @ApiQuery({ name: 'period', enum: ReportPeriod, required: false })
  @ApiQuery({ name: 'startDate', type: String, required: false })
  @ApiQuery({ name: 'endDate', type: String, required: false })
  @ApiQuery({ name: 'branchId', type: String, required: false })
  @ApiQuery({ name: 'tableIds', type: [String], required: false })
  @ApiQuery({ name: 'sectionIds', type: [String], required: false })
  async getTableTurnover(@Query() filter: TablePerformanceFilterDto) {
    return this.reportsService.getTableTurnoverReport(filter);
  }

  /**
   * Get peak hours analysis report
   */
  @Get('peak-hours')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(3600) // Cache for 1 hour
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get peak hours analysis report',
    description:
      'Identifies busiest hours, days of week, and revenue patterns throughout the day',
  })
  @ApiResponse({
    status: 200,
    description: 'Peak hours analysis report generated successfully',
  })
  @ApiQuery({ name: 'period', enum: ReportPeriod, required: false })
  @ApiQuery({ name: 'startDate', type: String, required: false })
  @ApiQuery({ name: 'endDate', type: String, required: false })
  @ApiQuery({ name: 'branchId', type: String, required: false })
  async getPeakHours(@Query() filter: DateRangeFilterDto) {
    return this.reportsService.getPeakHoursAnalysisReport(filter);
  }

  /**
   * Get profit margin analysis report
   */
  @Get('profit-margin')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(1800)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get profit margin analysis report',
    description:
      'Analyzes overall profitability, revenue, costs, and profit margins',
  })
  @ApiResponse({
    status: 200,
    description: 'Profit margin analysis report generated successfully',
  })
  @ApiQuery({ name: 'period', enum: ReportPeriod, required: false })
  @ApiQuery({ name: 'startDate', type: String, required: false })
  @ApiQuery({ name: 'endDate', type: String, required: false })
  @ApiQuery({ name: 'branchId', type: String, required: false })
  async getProfitMargin(@Query() filter: DateRangeFilterDto) {
    return this.reportsService.getProfitMarginAnalysisReport(filter);
  }

  /**
   * Get QR ordering analytics report
   */
  @Get('qr-ordering')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(1800)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get QR ordering analytics report',
    description:
      'Analyzes QR code ordering patterns, adoption rates, and conversion metrics',
  })
  @ApiResponse({
    status: 200,
    description: 'QR ordering analytics report generated successfully',
  })
  @ApiQuery({ name: 'period', enum: ReportPeriod, required: false })
  @ApiQuery({ name: 'startDate', type: String, required: false })
  @ApiQuery({ name: 'endDate', type: String, required: false })
  @ApiQuery({ name: 'branchId', type: String, required: false })
  async getQROrdering(@Query() filter: DateRangeFilterDto) {
    return this.reportsService.getQROrderingAnalyticsReport(filter);
  }

  /**
   * Export report
   */
  @Post('export')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Export report to CSV or PDF',
    description: 'Exports a specific report type in the requested format',
  })
  @ApiResponse({
    status: 200,
    description: 'Report exported successfully',
  })
  async exportReport(
    @Query() exportDto: ExportReportDto,
    @Query() filter: DateRangeFilterDto,
    @Res() res: Response,
  ) {
    let reportData: any;
    let buffer: Buffer;
    let filename: string;

    // Generate report data based on type
    switch (exportDto.reportType) {
      case ReportType.TABLE_PERFORMANCE:
        reportData = await this.reportsService.getTablePerformanceReport(filter);
        buffer = await this.exportService.exportTablePerformanceReport(
          reportData,
          exportDto.format,
        );
        filename = `table-performance.${exportDto.format}`;
        break;

      case ReportType.MENU_ANALYTICS:
        reportData = await this.reportsService.getMenuAnalyticsReport(filter);
        buffer = await this.exportService.exportMenuAnalyticsReport(
          reportData,
          exportDto.format,
        );
        filename = `menu-analytics.${exportDto.format}`;
        break;

      case ReportType.SERVER_PERFORMANCE:
        reportData = await this.reportsService.getServerPerformanceReport(filter);
        buffer = await this.exportService.exportServerPerformanceReport(
          reportData,
          exportDto.format,
        );
        filename = `server-performance.${exportDto.format}`;
        break;

      case ReportType.KITCHEN_METRICS:
        reportData = await this.reportsService.getKitchenMetricsReport(filter);
        buffer = await this.exportService.exportKitchenMetricsReport(
          reportData,
          exportDto.format,
        );
        filename = `kitchen-metrics.${exportDto.format}`;
        break;

      case ReportType.SERVICE_TYPE_ANALYSIS:
        reportData =
          await this.reportsService.getServiceTypeAnalysisReport(filter);
        buffer = await this.exportService.exportServiceTypeReport(
          reportData,
          exportDto.format,
        );
        filename = `service-type-analysis.${exportDto.format}`;
        break;

      case ReportType.FOOD_COST_ANALYSIS:
        reportData = await this.reportsService.getFoodCostAnalysisReport(filter);
        buffer = await this.exportService.exportFoodCostReport(
          reportData,
          exportDto.format,
        );
        filename = `food-cost-analysis.${exportDto.format}`;
        break;

      case ReportType.TABLE_TURNOVER:
        reportData = await this.reportsService.getTableTurnoverReport(filter);
        buffer = await this.exportService.exportTableTurnoverReport(
          reportData,
          exportDto.format,
        );
        filename = `table-turnover.${exportDto.format}`;
        break;

      case ReportType.PEAK_HOURS:
        reportData = await this.reportsService.getPeakHoursAnalysisReport(filter);
        buffer = await this.exportService.exportPeakHoursReport(
          reportData,
          exportDto.format,
        );
        filename = `peak-hours.${exportDto.format}`;
        break;

      case ReportType.PROFIT_MARGIN:
        reportData =
          await this.reportsService.getProfitMarginAnalysisReport(filter);
        buffer = await this.exportService.exportProfitMarginReport(
          reportData,
          exportDto.format,
        );
        filename = `profit-margin.${exportDto.format}`;
        break;

      case ReportType.QR_ORDERING:
        reportData = await this.reportsService.getQROrderingAnalyticsReport(filter);
        buffer = await this.exportService.exportQROrderingReport(
          reportData,
          exportDto.format,
        );
        filename = `qr-ordering.${exportDto.format}`;
        break;

      default:
        throw new Error(`Unknown report type: ${exportDto.reportType}`);
    }

    // Set response headers
    const contentType =
      exportDto.format === 'pdf' ? 'application/pdf' : 'text/csv';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Send buffer
    res.send(buffer);
  }

  /**
   * Get comprehensive summary report
   */
  @Get('comprehensive-summary')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(3600) // Cache for 1 hour
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get comprehensive summary report',
    description:
      'Combines all analytics into a single comprehensive overview report',
  })
  @ApiResponse({
    status: 200,
    description: 'Comprehensive summary report generated successfully',
  })
  @ApiQuery({ name: 'period', enum: ReportPeriod, required: false })
  @ApiQuery({ name: 'startDate', type: String, required: false })
  @ApiQuery({ name: 'endDate', type: String, required: false })
  @ApiQuery({ name: 'branchId', type: String, required: false })
  async getComprehensiveSummary(@Query() filter: DateRangeFilterDto) {
    const [
      tablePerformance,
      menuAnalytics,
      serverPerformance,
      kitchenMetrics,
      serviceTypeAnalysis,
      foodCostAnalysis,
      peakHours,
      profitMargin,
      qrOrdering,
    ] = await Promise.all([
      this.reportsService.getTablePerformanceReport(filter),
      this.reportsService.getMenuAnalyticsReport(filter),
      this.reportsService.getServerPerformanceReport(filter),
      this.reportsService.getKitchenMetricsReport(filter),
      this.reportsService.getServiceTypeAnalysisReport(filter),
      this.reportsService.getFoodCostAnalysisReport(filter),
      this.reportsService.getPeakHoursAnalysisReport(filter),
      this.reportsService.getProfitMarginAnalysisReport(filter),
      this.reportsService.getQROrderingAnalyticsReport(filter),
    ]);

    return {
      period: tablePerformance.period,
      overview: {
        profitability: profitMargin.analysis.profitability,
        revenue: profitMargin.analysis.revenue,
        costs: profitMargin.analysis.costs,
      },
      performance: {
        tables: tablePerformance.summary,
        servers: serverPerformance.summary,
        kitchen: kitchenMetrics.summary,
      },
      menu: menuAnalytics.summary,
      serviceTypes: serviceTypeAnalysis.summary,
      foodCost: foodCostAnalysis.summary,
      peakHours: peakHours.summary,
      qrOrdering: qrOrdering.analytics,
    };
  }
}
