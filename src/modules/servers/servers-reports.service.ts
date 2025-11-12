import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServerShift } from './entities/server-shift.entity';
import { ServerTip } from './entities/server-tip.entity';
import { ServerAssignment } from './entities/server-assignment.entity';
import { User } from '../users/entities/user.entity';
import { ServerReportQueryDto } from './dto/server-report.dto';

@Injectable()
export class ServersReportsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ServerShift)
    private readonly shiftRepository: Repository<ServerShift>,
    @InjectRepository(ServerTip)
    private readonly tipRepository: Repository<ServerTip>,
    @InjectRepository(ServerAssignment)
    private readonly assignmentRepository: Repository<ServerAssignment>,
  ) {}

  async generateServerReport(query: ServerReportQueryDto) {
    const { serverId, branchId, startDate, endDate } = query;

    const report = {
      reportMetadata: {
        generatedAt: new Date(),
        startDate,
        endDate,
        filters: { serverId, branchId },
      },
      summary: await this.getReportSummary(serverId, branchId, startDate, endDate),
      shiftDetails: await this.getShiftDetails(serverId, branchId, startDate, endDate),
      tipDetails: await this.getTipDetails(serverId, branchId, startDate, endDate),
      performanceMetrics: await this.getPerformanceMetrics(
        serverId,
        branchId,
        startDate,
        endDate,
      ),
      serverRankings: await this.getServerRankings(branchId, startDate, endDate),
    };

    return report;
  }

  private async getReportSummary(
    serverId?: string,
    branchId?: string,
    startDate?: string,
    endDate?: string,
  ) {
    const shiftQuery = this.shiftRepository
      .createQueryBuilder('shift')
      .select('COUNT(DISTINCT shift.serverId)', 'totalServers')
      .addSelect('COUNT(shift.id)', 'totalShifts')
      .addSelect('SUM(shift.totalSales)', 'totalSales')
      .addSelect('SUM(shift.totalTips)', 'totalTips')
      .addSelect('SUM(shift.orderCount)', 'totalOrders')
      .addSelect('AVG(shift.totalSales)', 'avgSalesPerShift');

    if (serverId) {
      shiftQuery.where('shift.serverId = :serverId', { serverId });
    }

    if (branchId) {
      shiftQuery.andWhere('shift.branchId = :branchId', { branchId });
    }

    if (startDate && endDate) {
      shiftQuery.andWhere('shift.scheduledStart BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    const result = await shiftQuery.getRawOne();

    return {
      totalServers: parseInt(result.totalServers) || 0,
      totalShifts: parseInt(result.totalShifts) || 0,
      totalSales: parseFloat(result.totalSales) || 0,
      totalTips: parseFloat(result.totalTips) || 0,
      totalOrders: parseInt(result.totalOrders) || 0,
      avgSalesPerShift: parseFloat(result.avgSalesPerShift) || 0,
    };
  }

  private async getShiftDetails(
    serverId?: string,
    branchId?: string,
    startDate?: string,
    endDate?: string,
  ) {
    const query = this.shiftRepository
      .createQueryBuilder('shift')
      .leftJoinAndSelect('shift.server', 'server')
      .leftJoinAndSelect('shift.branch', 'branch')
      .select([
        'shift.id',
        'shift.scheduledStart',
        'shift.scheduledEnd',
        'shift.actualStart',
        'shift.actualEnd',
        'shift.status',
        'shift.totalSales',
        'shift.totalTips',
        'shift.orderCount',
        'server.id',
        'server.firstName',
        'server.lastName',
        'server.serverCode',
        'branch.id',
        'branch.name',
      ]);

    if (serverId) {
      query.where('shift.serverId = :serverId', { serverId });
    }

    if (branchId) {
      query.andWhere('shift.branchId = :branchId', { branchId });
    }

    if (startDate && endDate) {
      query.andWhere('shift.scheduledStart BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    query.orderBy('shift.scheduledStart', 'DESC');

    return await query.getMany();
  }

  private async getTipDetails(
    serverId?: string,
    branchId?: string,
    startDate?: string,
    endDate?: string,
  ) {
    const query = this.tipRepository
      .createQueryBuilder('tip')
      .leftJoinAndSelect('tip.server', 'server')
      .leftJoin('tip.shift', 'shift')
      .select([
        'tip.id',
        'tip.amount',
        'tip.type',
        'tip.status',
        'tip.tipDate',
        'tip.tipPercentage',
        'tip.orderTotal',
        'server.id',
        'server.firstName',
        'server.lastName',
        'server.serverCode',
      ]);

    if (serverId) {
      query.where('tip.serverId = :serverId', { serverId });
    }

    if (branchId) {
      query.andWhere('shift.branchId = :branchId', { branchId });
    }

    if (startDate && endDate) {
      query.andWhere('tip.tipDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    query.orderBy('tip.tipDate', 'DESC');

    const tips = await query.getMany();

    // Group by type
    const byType = tips.reduce((acc, tip) => {
      if (!acc[tip.type]) {
        acc[tip.type] = { count: 0, total: 0 };
      }
      acc[tip.type].count++;
      acc[tip.type].total += parseFloat(tip.amount.toString());
      return acc;
    }, {});

    return {
      tips,
      summary: {
        totalTips: tips.length,
        totalAmount: tips.reduce((sum, tip) => sum + parseFloat(tip.amount.toString()), 0),
        byType,
      },
    };
  }

  private async getPerformanceMetrics(
    serverId?: string,
    branchId?: string,
    startDate?: string,
    endDate?: string,
  ) {
    const query = this.shiftRepository
      .createQueryBuilder('shift')
      .leftJoin('shift.server', 'server')
      .select('server.id', 'serverId')
      .addSelect('server.firstName', 'firstName')
      .addSelect('server.lastName', 'lastName')
      .addSelect('server.serverCode', 'serverCode')
      .addSelect('COUNT(shift.id)', 'shiftCount')
      .addSelect('SUM(shift.totalSales)', 'totalSales')
      .addSelect('SUM(shift.totalTips)', 'totalTips')
      .addSelect('SUM(shift.orderCount)', 'totalOrders')
      .addSelect('AVG(shift.totalSales)', 'avgSalesPerShift')
      .addSelect('AVG(shift.totalTips)', 'avgTipsPerShift')
      .groupBy('server.id')
      .addGroupBy('server.firstName')
      .addGroupBy('server.lastName')
      .addGroupBy('server.serverCode');

    if (serverId) {
      query.where('shift.serverId = :serverId', { serverId });
    }

    if (branchId) {
      query.andWhere('shift.branchId = :branchId', { branchId });
    }

    if (startDate && endDate) {
      query.andWhere('shift.scheduledStart BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    query.orderBy('SUM(shift.totalSales)', 'DESC');

    const results = await query.getRawMany();

    return results.map((r) => ({
      serverId: r.serverId,
      serverName: `${r.firstName} ${r.lastName}`.trim(),
      serverCode: r.serverCode,
      shiftCount: parseInt(r.shiftCount),
      totalSales: parseFloat(r.totalSales) || 0,
      totalTips: parseFloat(r.totalTips) || 0,
      totalOrders: parseInt(r.totalOrders) || 0,
      avgSalesPerShift: parseFloat(r.avgSalesPerShift) || 0,
      avgTipsPerShift: parseFloat(r.avgTipsPerShift) || 0,
    }));
  }

  private async getServerRankings(
    branchId?: string,
    startDate?: string,
    endDate?: string,
  ) {
    const query = this.shiftRepository
      .createQueryBuilder('shift')
      .leftJoin('shift.server', 'server')
      .select('server.id', 'serverId')
      .addSelect('server.firstName', 'firstName')
      .addSelect('server.lastName', 'lastName')
      .addSelect('server.serverCode', 'serverCode')
      .addSelect('SUM(shift.totalSales)', 'totalSales')
      .addSelect('SUM(shift.totalTips)', 'totalTips')
      .addSelect('SUM(shift.orderCount)', 'totalOrders')
      .groupBy('server.id')
      .addGroupBy('server.firstName')
      .addGroupBy('server.lastName')
      .addGroupBy('server.serverCode');

    if (branchId) {
      query.where('shift.branchId = :branchId', { branchId });
    }

    if (startDate && endDate) {
      query.andWhere('shift.scheduledStart BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    // Get top by sales
    const topBySales = await query
      .clone()
      .orderBy('SUM(shift.totalSales)', 'DESC')
      .limit(10)
      .getRawMany();

    // Get top by tips
    const topByTips = await query
      .clone()
      .orderBy('SUM(shift.totalTips)', 'DESC')
      .limit(10)
      .getRawMany();

    // Get top by orders
    const topByOrders = await query
      .clone()
      .orderBy('SUM(shift.orderCount)', 'DESC')
      .limit(10)
      .getRawMany();

    const formatRanking = (data: any[]) =>
      data.map((r, index) => ({
        rank: index + 1,
        serverId: r.serverId,
        serverName: `${r.firstName} ${r.lastName}`.trim(),
        serverCode: r.serverCode,
        value: parseFloat(r.totalSales || r.totalTips || r.totalOrders),
      }));

    return {
      topBySales: formatRanking(topBySales),
      topByTips: formatRanking(topByTips),
      topByOrders: formatRanking(topByOrders),
    };
  }

  async getDailySummary(date: string, branchId?: string) {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const query = this.shiftRepository
      .createQueryBuilder('shift')
      .leftJoinAndSelect('shift.server', 'server')
      .where('shift.scheduledStart BETWEEN :startDate AND :endDate', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

    if (branchId) {
      query.andWhere('shift.branchId = :branchId', { branchId });
    }

    const shifts = await query.getMany();

    const summary = {
      date,
      totalShifts: shifts.length,
      activeServers: new Set(shifts.map((s) => s.serverId)).size,
      totalSales: shifts.reduce((sum, s) => sum + parseFloat(s.totalSales.toString()), 0),
      totalTips: shifts.reduce((sum, s) => sum + parseFloat(s.totalTips.toString()), 0),
      totalOrders: shifts.reduce((sum, s) => sum + s.orderCount, 0),
      shiftsByServer: shifts.map((shift) => ({
        serverId: shift.serverId,
        serverName: `${shift.server.firstName} ${shift.server.lastName}`.trim(),
        serverCode: shift.server.serverCode,
        shiftId: shift.id,
        status: shift.status,
        sales: shift.totalSales,
        tips: shift.totalTips,
        orders: shift.orderCount,
      })),
    };

    return summary;
  }
}
