import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { ServerShift, ShiftStatus } from './entities/server-shift.entity';
import { ServerTip } from './entities/server-tip.entity';
import { ServerAssignment } from './entities/server-assignment.entity';
import { Invoice } from '../invoices/entities/invoice.entity';
import { Sale } from '../pos/entities/sale.entity';
import { ServerPerformanceQueryDto, ServerPerformanceResponseDto } from './dto/server-performance.dto';

@Injectable()
export class ServersPerformanceService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ServerShift)
    private readonly shiftRepository: Repository<ServerShift>,
    @InjectRepository(ServerTip)
    private readonly tipRepository: Repository<ServerTip>,
    @InjectRepository(ServerAssignment)
    private readonly assignmentRepository: Repository<ServerAssignment>,
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,
  ) {}

  async getServerPerformance(
    query: ServerPerformanceQueryDto,
  ): Promise<ServerPerformanceResponseDto[]> {
    const { serverId, branchId, startDate, endDate } = query;

    // Build query for servers
    const serverQuery = this.userRepository
      .createQueryBuilder('user')
      .where('user.isServer = :isServer', { isServer: true });

    if (serverId) {
      serverQuery.andWhere('user.id = :serverId', { serverId });
    }

    if (branchId) {
      serverQuery.andWhere('user.branchId = :branchId', { branchId });
    }

    const servers = await serverQuery.getMany();

    const performanceData: ServerPerformanceResponseDto[] = [];

    for (const server of servers) {
      const performance = await this.calculateServerPerformance(
        server.id,
        startDate,
        endDate,
      );
      performanceData.push({
        serverId: server.id,
        serverName: `${server.firstName} ${server.lastName}`.trim() || server.username,
        serverCode: server.serverCode,
        ...performance,
      });
    }

    return performanceData;
  }

  async getServerDashboard(serverId: string, startDate?: string, endDate?: string) {
    const server = await this.userRepository.findOne({
      where: { id: serverId, isServer: true },
    });

    if (!server) {
      throw new Error('Server not found');
    }

    const [
      performance,
      shifts,
      tips,
      topSections,
      recentOrders,
    ] = await Promise.all([
      this.calculateServerPerformance(serverId, startDate, endDate),
      this.getShiftSummary(serverId, startDate, endDate),
      this.getTipSummary(serverId, startDate, endDate),
      this.getTopSections(serverId, startDate, endDate),
      this.getRecentOrders(serverId, 10),
    ]);

    return {
      server: {
        id: server.id,
        name: `${server.firstName} ${server.lastName}`.trim() || server.username,
        serverCode: server.serverCode,
        email: server.email,
        rating: server.serverProfile?.rating || 0,
      },
      performance,
      shifts,
      tips,
      topSections,
      recentOrders,
    };
  }

  async getServerOrderHistory(
    serverId: string,
    filters: {
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const { page = 1, limit = 20, startDate, endDate } = filters;

    // Get orders from both invoices and sales
    const invoiceQuery = this.invoiceRepository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.customer', 'customer')
      .leftJoinAndSelect('invoice.items', 'items')
      .where('invoice.serverId = :serverId', { serverId });

    if (startDate) {
      invoiceQuery.andWhere('invoice.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      invoiceQuery.andWhere('invoice.createdAt <= :endDate', { endDate });
    }

    invoiceQuery.skip((page - 1) * limit).take(limit);
    invoiceQuery.orderBy('invoice.createdAt', 'DESC');

    const [invoices, totalItems] = await invoiceQuery.getManyAndCount();

    return {
      data: invoices.map((invoice) => ({
        id: invoice.id,
        orderNumber: invoice.invoiceNumber,
        type: 'invoice',
        customer: invoice.customer,
        tableNumber: invoice.tableNumber,
        sectionName: invoice.sectionName,
        total: invoice.total,
        status: invoice.status,
        createdAt: invoice.createdAt,
        items: invoice.items,
      })),
      meta: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  }

  private async calculateServerPerformance(
    serverId: string,
    startDate?: string,
    endDate?: string,
  ) {
    // Get shift stats
    const shiftQuery = this.shiftRepository
      .createQueryBuilder('shift')
      .select('COUNT(shift.id)', 'totalShifts')
      .addSelect('SUM(shift.totalSales)', 'totalSales')
      .addSelect('SUM(shift.totalTips)', 'totalTips')
      .addSelect('SUM(shift.orderCount)', 'totalOrders')
      .addSelect('SUM(shift.customerCount)', 'totalCustomers')
      .where('shift.serverId = :serverId', { serverId })
      .andWhere('shift.status = :status', { status: ShiftStatus.COMPLETED });

    if (startDate && endDate) {
      shiftQuery.andWhere(
        'shift.scheduledStart BETWEEN :startDate AND :endDate',
        { startDate, endDate },
      );
    }

    const shiftStats = await shiftQuery.getRawOne();

    // Calculate total hours worked
    const shiftsWithHours = await this.shiftRepository
      .createQueryBuilder('shift')
      .where('shift.serverId = :serverId', { serverId })
      .andWhere('shift.status = :status', { status: ShiftStatus.COMPLETED })
      .andWhere('shift.actualStart IS NOT NULL')
      .andWhere('shift.actualEnd IS NOT NULL')
      .getMany();

    let totalHoursWorked = 0;
    shiftsWithHours.forEach((shift) => {
      if (shift.actualStart && shift.actualEnd) {
        const hours =
          (new Date(shift.actualEnd).getTime() -
            new Date(shift.actualStart).getTime()) /
          (1000 * 60 * 60);
        totalHoursWorked += hours;
      }
    });

    // Get tip stats
    const tipQuery = this.tipRepository
      .createQueryBuilder('tip')
      .select('AVG(tip.tipPercentage)', 'avgTipPercentage')
      .where('tip.serverId = :serverId', { serverId });

    if (startDate && endDate) {
      tipQuery.andWhere('tip.tipDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    const tipStats = await tipQuery.getRawOne();

    // Get top sections
    const topSections = await this.getTopSections(serverId, startDate, endDate);

    const totalShifts = parseInt(shiftStats.totalShifts) || 0;
    const totalSales = parseFloat(shiftStats.totalSales) || 0;
    const totalTips = parseFloat(shiftStats.totalTips) || 0;
    const totalOrders = parseInt(shiftStats.totalOrders) || 0;
    const totalCustomers = parseInt(shiftStats.totalCustomers) || 0;

    return {
      totalShifts,
      totalHoursWorked: parseFloat(totalHoursWorked.toFixed(2)),
      totalSales,
      totalTips,
      averageTipPercentage: parseFloat(tipStats.avgTipPercentage) || 0,
      totalOrders,
      averageOrderValue: totalOrders > 0 ? totalSales / totalOrders : 0,
      totalCustomers,
      averageCustomersPerShift: totalShifts > 0 ? totalCustomers / totalShifts : 0,
      salesPerHour: totalHoursWorked > 0 ? totalSales / totalHoursWorked : 0,
      ordersPerHour: totalHoursWorked > 0 ? totalOrders / totalHoursWorked : 0,
      topSections: topSections.slice(0, 3),
    };
  }

  private async getShiftSummary(serverId: string, startDate?: string, endDate?: string) {
    const query = this.shiftRepository
      .createQueryBuilder('shift')
      .select('shift.status', 'status')
      .addSelect('COUNT(shift.id)', 'count')
      .where('shift.serverId = :serverId', { serverId })
      .groupBy('shift.status');

    if (startDate && endDate) {
      query.andWhere('shift.scheduledStart BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    const results = await query.getRawMany();
    return results.map((r) => ({
      status: r.status,
      count: parseInt(r.count),
    }));
  }

  private async getTipSummary(serverId: string, startDate?: string, endDate?: string) {
    const query = this.tipRepository
      .createQueryBuilder('tip')
      .select('tip.type', 'type')
      .addSelect('COUNT(tip.id)', 'count')
      .addSelect('SUM(tip.amount)', 'total')
      .where('tip.serverId = :serverId', { serverId })
      .groupBy('tip.type');

    if (startDate && endDate) {
      query.andWhere('tip.tipDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    const results = await query.getRawMany();
    return results.map((r) => ({
      type: r.type,
      count: parseInt(r.count),
      total: parseFloat(r.total),
    }));
  }

  private async getTopSections(serverId: string, startDate?: string, endDate?: string) {
    const query = this.assignmentRepository
      .createQueryBuilder('assignment')
      .leftJoin('assignment.section', 'section')
      .leftJoin('assignment.shift', 'shift')
      .select('section.id', 'sectionId')
      .addSelect('section.name', 'sectionName')
      .addSelect('COUNT(assignment.id)', 'shiftCount')
      .addSelect('SUM(shift.totalSales)', 'totalSales')
      .where('assignment.serverId = :serverId', { serverId })
      .groupBy('section.id')
      .addGroupBy('section.name')
      .orderBy('SUM(shift.totalSales)', 'DESC')
      .limit(5);

    if (startDate && endDate) {
      query.andWhere('assignment.startTime BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    const results = await query.getRawMany();
    return results.map((r) => ({
      sectionId: r.sectionId,
      sectionName: r.sectionName,
      shiftCount: parseInt(r.shiftCount),
      totalSales: parseFloat(r.totalSales) || 0,
    }));
  }

  private async getRecentOrders(serverId: string, limit: number = 10) {
    const invoices = await this.invoiceRepository.find({
      where: { serverId },
      relations: ['customer', 'items'],
      order: { createdAt: 'DESC' },
      take: limit,
    });

    return invoices.map((invoice) => ({
      id: invoice.id,
      orderNumber: invoice.invoiceNumber,
      customer: invoice.customer,
      tableNumber: invoice.tableNumber,
      total: invoice.total,
      status: invoice.status,
      createdAt: invoice.createdAt,
    }));
  }
}
