import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  UseGuards,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { ServerPerformanceService } from '../services/server-performance.service';
import { MetricPeriod } from '../entities/server-performance-metrics.entity';

@ApiTags('Server Management - Performance')
@Controller('server-performance')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ServerPerformanceController {
  constructor(private readonly performanceService: ServerPerformanceService) {}

  @Get()
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get all performance metrics' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'serverId', required: false, type: String })
  @ApiQuery({ name: 'branchId', required: false, type: String })
  @ApiQuery({ name: 'periodType', required: false, enum: MetricPeriod })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async findAll(@Query() query: any) {
    const [data, total] = await this.performanceService.findAll(query);
    return {
      data,
      meta: {
        page: query.page || 1,
        limit: query.limit || 20,
        totalItems: total,
        totalPages: Math.ceil(total / (query.limit || 20)),
      },
    };
  }

  @Get(':id')
  @Roles('admin', 'manager', 'staff')
  @ApiOperation({ summary: 'Get performance metrics by ID' })
  @ApiParam({ name: 'id', description: 'Metrics UUID' })
  findOne(@Param('id') id: string) {
    return this.performanceService.findOne(id);
  }

  @Post('calculate')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Calculate performance metrics for a period' })
  @ApiResponse({ status: 200, description: 'Metrics calculated successfully' })
  calculateMetrics(
    @Body()
    body: {
      serverId: string;
      branchId: string;
      periodType: MetricPeriod;
      periodStart: string;
      periodEnd: string;
    },
  ) {
    return this.performanceService.calculateMetrics(
      body.serverId,
      body.branchId,
      body.periodType,
      new Date(body.periodStart),
      new Date(body.periodEnd),
    );
  }

  @Get('report/server/:serverId')
  @Roles('admin', 'manager', 'staff')
  @ApiOperation({ summary: 'Get comprehensive server performance report' })
  @ApiParam({ name: 'serverId', description: 'Server UUID' })
  @ApiQuery({ name: 'branchId', required: true, type: String })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  getServerReport(
    @Param('serverId') serverId: string,
    @Query('branchId') branchId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.performanceService.getServerReport(serverId, branchId, startDate, endDate);
  }

  @Get('top-performers/branch/:branchId')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get top performing servers for a branch' })
  @ApiParam({ name: 'branchId', description: 'Branch UUID' })
  @ApiQuery({ name: 'periodType', required: true, enum: MetricPeriod })
  @ApiQuery({ name: 'periodStart', required: true, type: String })
  @ApiQuery({ name: 'periodEnd', required: true, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getTopPerformers(
    @Param('branchId') branchId: string,
    @Query('periodType') periodType: MetricPeriod,
    @Query('periodStart') periodStart: string,
    @Query('periodEnd') periodEnd: string,
    @Query('limit') limit?: number,
  ) {
    return this.performanceService.getTopPerformers(
      branchId,
      periodType,
      new Date(periodStart),
      new Date(periodEnd),
      limit ? parseInt(limit.toString()) : 10,
    );
  }

  @Post('compare')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Compare performance between multiple servers' })
  compareServers(
    @Body()
    body: {
      serverIds: string[];
      branchId: string;
      periodType: MetricPeriod;
      periodStart: string;
      periodEnd: string;
    },
  ) {
    return this.performanceService.compareServers(
      body.serverIds,
      body.branchId,
      body.periodType,
      new Date(body.periodStart),
      new Date(body.periodEnd),
    );
  }
}
