import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ServerPerformanceService } from '../services/server-performance.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';

@ApiTags('Restaurant - Server Performance')
@Controller('restaurant/servers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ServerPerformanceController {
  constructor(
    private readonly serverPerformanceService: ServerPerformanceService,
  ) {}

  @Get(':serverId/performance')
  @ApiOperation({
    summary: 'Get server performance metrics',
    description: 'Get comprehensive performance metrics for a specific server',
  })
  @ApiParam({ name: 'serverId', description: 'Server/Waiter ID' })
  @ApiQuery({ name: 'branchId', description: 'Branch ID' })
  @ApiQuery({
    name: 'startDate',
    description: 'Start date (ISO format)',
    required: false,
  })
  @ApiQuery({
    name: 'endDate',
    description: 'End date (ISO format)',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Server performance metrics retrieved',
  })
  async getServerPerformance(
    @Param('serverId') serverId: string,
    @Query('branchId') branchId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: last 30 days
    const end = endDate ? new Date(endDate) : new Date();

    return this.serverPerformanceService.getServerPerformance(
      serverId,
      branchId,
      start,
      end,
    );
  }

  @Get('compare')
  @ApiOperation({
    summary: 'Compare server performance',
    description: 'Compare performance metrics of multiple servers',
  })
  @ApiQuery({
    name: 'serverIds',
    description: 'Comma-separated server IDs',
    example: 'uuid1,uuid2,uuid3',
  })
  @ApiQuery({ name: 'branchId', description: 'Branch ID' })
  @ApiQuery({
    name: 'startDate',
    description: 'Start date (ISO format)',
    required: false,
  })
  @ApiQuery({
    name: 'endDate',
    description: 'End date (ISO format)',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Server comparison metrics retrieved',
  })
  async compareServers(
    @Query('serverIds') serverIds: string,
    @Query('branchId') branchId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const ids = serverIds.split(',');
    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    return this.serverPerformanceService.compareServers(ids, branchId, start, end);
  }

  @Get('leaderboard')
  @ApiOperation({
    summary: 'Get server leaderboard',
    description: 'Get server rankings based on various metrics',
  })
  @ApiQuery({ name: 'branchId', description: 'Branch ID' })
  @ApiQuery({
    name: 'metric',
    description: 'Metric to rank by',
    enum: ['revenue', 'tips', 'orders', 'averageOrderValue'],
    required: false,
  })
  @ApiQuery({
    name: 'startDate',
    description: 'Start date (ISO format)',
    required: false,
  })
  @ApiQuery({
    name: 'endDate',
    description: 'End date (ISO format)',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Server leaderboard retrieved',
  })
  async getLeaderboard(
    @Query('branchId') branchId: string,
    @Query('metric') metric?: 'revenue' | 'tips' | 'orders' | 'averageOrderValue',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    return this.serverPerformanceService.getServerLeaderboard(
      branchId,
      start,
      end,
      metric || 'revenue',
    );
  }

  @Get('active')
  @ApiOperation({
    summary: 'Get active servers',
    description: 'Get list of servers currently serving orders',
  })
  @ApiQuery({ name: 'branchId', description: 'Branch ID' })
  @ApiResponse({
    status: 200,
    description: 'Active servers retrieved',
  })
  async getActiveServers(@Query('branchId') branchId: string) {
    return this.serverPerformanceService.getActiveServers(branchId);
  }
}
