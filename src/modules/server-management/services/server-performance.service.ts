import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import {
  ServerPerformanceMetrics,
  MetricPeriod,
} from '../entities/server-performance-metrics.entity';
import { ServerShift } from '../entities/server-shift.entity';
import { RestaurantOrder } from '../../restaurant/entities/restaurant-order.entity';

@Injectable()
export class ServerPerformanceService {
  constructor(
    @InjectRepository(ServerPerformanceMetrics)
    private metricsRepository: Repository<ServerPerformanceMetrics>,
    @InjectRepository(ServerShift)
    private shiftRepository: Repository<ServerShift>,
    @InjectRepository(RestaurantOrder)
    private orderRepository: Repository<RestaurantOrder>,
  ) {}

  async findAll(query?: any): Promise<[ServerPerformanceMetrics[], number]> {
    const {
      page = 1,
      limit = 20,
      serverId,
      branchId,
      periodType,
      startDate,
      endDate,
    } = query || {};

    const where: any = {};

    if (serverId) where.serverId = serverId;
    if (branchId) where.branchId = branchId;
    if (periodType) where.periodType = periodType;

    if (startDate && endDate) {
      where.periodStart = Between(new Date(startDate), new Date(endDate));
    }

    return this.metricsRepository.findAndCount({
      where,
      relations: ['server', 'branch'],
      skip: (page - 1) * limit,
      take: limit,
      order: { periodStart: 'DESC' },
    });
  }

  async findOne(id: string): Promise<ServerPerformanceMetrics> {
    const metrics = await this.metricsRepository.findOne({
      where: { id },
      relations: ['server', 'branch'],
    });

    if (!metrics) {
      throw new NotFoundException(`Performance metrics ${id} not found`);
    }

    return metrics;
  }

  async calculateMetrics(
    serverId: string,
    branchId: string,
    periodType: MetricPeriod,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<ServerPerformanceMetrics> {
    // Check if metrics already exist
    let metrics = await this.metricsRepository.findOne({
      where: {
        serverId,
        branchId,
        periodType,
        periodStart,
        periodEnd,
      },
    });

    if (!metrics) {
      metrics = this.metricsRepository.create({
        serverId,
        branchId,
        periodType,
        periodStart,
        periodEnd,
      });
    }

    // Get all shifts in the period
    const shifts = await this.shiftRepository.find({
      where: {
        serverId,
        branchId,
        shiftDate: Between(periodStart, periodEnd),
      },
    });

    // Get all orders in the period
    const orders = await this.orderRepository.find({
      where: {
        serverId,
        branchId,
        createdAt: Between(periodStart, periodEnd),
      },
    });

    // Calculate shift metrics
    metrics.numberOfShifts = shifts.length;
    metrics.totalHoursWorked = shifts.reduce(
      (sum, s) => sum + (s.actualDurationMinutes || 0),
      0,
    );
    metrics.averageShiftDuration = metrics.numberOfShifts > 0
      ? metrics.totalHoursWorked / metrics.numberOfShifts / 60
      : 0;
    metrics.overtimeMinutes = shifts.reduce(
      (sum, s) => sum + (s.overtimeMinutes || 0),
      0,
    );

    // Calculate order metrics
    metrics.totalOrders = orders.length;
    metrics.completedOrders = orders.filter(o => o.status === 'completed').length;
    metrics.cancelledOrders = orders.filter(o => o.status === 'cancelled').length;

    // Calculate financial metrics
    metrics.totalSales = orders.reduce((sum, o) => sum + Number(o.total), 0);
    metrics.averageOrderValue = metrics.completedOrders > 0
      ? metrics.totalSales / metrics.completedOrders
      : 0;

    metrics.totalTips = orders.reduce((sum, o) => sum + Number(o.tipAmount || 0), 0);
    metrics.averageTipAmount = metrics.completedOrders > 0
      ? metrics.totalTips / metrics.completedOrders
      : 0;

    // Calculate tip percentage
    const ordersWithTips = orders.filter(o => Number(o.tipPercentage) > 0);
    metrics.averageTipPercentage = ordersWithTips.length > 0
      ? ordersWithTips.reduce((sum, o) => sum + Number(o.tipPercentage || 0), 0) /
        ordersWithTips.length
      : 0;

    // Calculate efficiency metrics
    const hoursWorked = metrics.totalHoursWorked / 60;
    metrics.salesPerHour = hoursWorked > 0 ? metrics.totalSales / hoursWorked : 0;
    metrics.tipsPerHour = hoursWorked > 0 ? metrics.totalTips / hoursWorked : 0;
    metrics.ordersPerHour = hoursWorked > 0 ? metrics.totalOrders / hoursWorked : 0;

    // Calculate guest metrics
    metrics.guestsServed = orders.reduce((sum, o) => sum + (o.guestCount || 0), 0);
    metrics.tablesServed = shifts.reduce((sum, s) => sum + (s.tablesServed || 0), 0);
    metrics.averageGuestsPerTable = metrics.tablesServed > 0
      ? metrics.guestsServed / metrics.tablesServed
      : 0;

    return this.metricsRepository.save(metrics);
  }

  async getServerReport(
    serverId: string,
    branchId: string,
    startDate: string,
    endDate: string,
  ): Promise<any> {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Get or calculate daily metrics
    const dailyMetrics = await this.metricsRepository.find({
      where: {
        serverId,
        branchId,
        periodType: MetricPeriod.DAILY,
        periodStart: Between(start, end),
      },
      order: { periodStart: 'ASC' },
    });

    // Calculate summary
    const summary = {
      totalDays: dailyMetrics.length,
      totalOrders: dailyMetrics.reduce((sum, m) => sum + m.totalOrders, 0),
      totalSales: dailyMetrics.reduce((sum, m) => sum + Number(m.totalSales), 0),
      totalTips: dailyMetrics.reduce((sum, m) => sum + Number(m.totalTips), 0),
      totalHoursWorked: dailyMetrics.reduce((sum, m) => sum + m.totalHoursWorked, 0) / 60,
      averageOrderValue: 0,
      averageTipPercentage: 0,
      salesPerHour: 0,
      tipsPerHour: 0,
    };

    if (summary.totalOrders > 0) {
      summary.averageOrderValue = summary.totalSales / summary.totalOrders;
    }

    if (dailyMetrics.length > 0) {
      summary.averageTipPercentage =
        dailyMetrics.reduce((sum, m) => sum + Number(m.averageTipPercentage), 0) /
        dailyMetrics.length;
    }

    if (summary.totalHoursWorked > 0) {
      summary.salesPerHour = summary.totalSales / summary.totalHoursWorked;
      summary.tipsPerHour = summary.totalTips / summary.totalHoursWorked;
    }

    return {
      summary,
      dailyBreakdown: dailyMetrics,
    };
  }

  async getTopPerformers(
    branchId: string,
    periodType: MetricPeriod,
    periodStart: Date,
    periodEnd: Date,
    limit: number = 10,
  ): Promise<ServerPerformanceMetrics[]> {
    return this.metricsRepository.find({
      where: {
        branchId,
        periodType,
        periodStart: Between(periodStart, periodEnd),
      },
      relations: ['server'],
      order: { totalSales: 'DESC' },
      take: limit,
    });
  }

  async compareServers(
    serverIds: string[],
    branchId: string,
    periodType: MetricPeriod,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<ServerPerformanceMetrics[]> {
    return this.metricsRepository.find({
      where: serverIds.map(serverId => ({
        serverId,
        branchId,
        periodType,
        periodStart,
        periodEnd,
      })),
      relations: ['server'],
      order: { totalSales: 'DESC' },
    });
  }
}
