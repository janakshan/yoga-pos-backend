import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto, TimeGranularity } from './dto/analytics-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get dashboard analytics with overview and charts' })
  @ApiResponse({ status: 200, description: 'Dashboard analytics retrieved successfully' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'branchId', required: false, type: String })
  @ApiQuery({ name: 'granularity', required: false, enum: TimeGranularity })
  getDashboardAnalytics(@Query() dto: AnalyticsQueryDto) {
    return this.analyticsService.getDashboardAnalytics(dto);
  }

  @Get('trends')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get trend analysis with growth metrics and forecasting' })
  @ApiResponse({ status: 200, description: 'Trend analysis retrieved successfully' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'branchId', required: false, type: String })
  @ApiQuery({ name: 'granularity', required: false, enum: TimeGranularity })
  getTrendAnalysis(@Query() dto: AnalyticsQueryDto) {
    return this.analyticsService.getTrendAnalysis(dto);
  }

  @Get('comparative')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get comparative analysis across multiple periods' })
  @ApiResponse({ status: 200, description: 'Comparative analysis retrieved successfully' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'branchId', required: false, type: String })
  @ApiQuery({ name: 'comparePeriodsCount', required: false, type: Number })
  getComparativeAnalysis(@Query() dto: AnalyticsQueryDto) {
    return this.analyticsService.getComparativeAnalysis(dto);
  }

  @Get('products/performance')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get product performance analytics' })
  @ApiResponse({ status: 200, description: 'Product performance analytics retrieved successfully' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'branchId', required: false, type: String })
  getProductPerformanceAnalytics(@Query() dto: AnalyticsQueryDto) {
    return this.analyticsService.getProductPerformanceAnalytics(dto);
  }

  @Get('customers/behavior')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get customer behavior analytics' })
  @ApiResponse({ status: 200, description: 'Customer behavior analytics retrieved successfully' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'branchId', required: false, type: String })
  getCustomerBehaviorAnalytics(@Query() dto: AnalyticsQueryDto) {
    return this.analyticsService.getCustomerBehaviorAnalytics(dto);
  }
}
