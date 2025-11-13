import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import {
  TipDistribution,
  TipDistributionMethod,
  TipDistributionStatus,
} from '../entities/tip-distribution.entity';
import { ServerShift } from '../entities/server-shift.entity';
import { RestaurantOrder } from '../../restaurant/entities/restaurant-order.entity';
import { CreateTipDistributionDto } from '../dto/create-tip-distribution.dto';
import { UpdateTipDistributionDto } from '../dto/update-tip-distribution.dto';

@Injectable()
export class TipDistributionService {
  constructor(
    @InjectRepository(TipDistribution)
    private distributionRepository: Repository<TipDistribution>,
    @InjectRepository(ServerShift)
    private shiftRepository: Repository<ServerShift>,
    @InjectRepository(RestaurantOrder)
    private orderRepository: Repository<RestaurantOrder>,
  ) {}

  async create(createDto: CreateTipDistributionDto): Promise<TipDistribution> {
    const distribution = this.distributionRepository.create(createDto);

    // Set initial final tip amount to original amount
    distribution.finalTipAmount = distribution.originalTipAmount;

    return this.distributionRepository.save(distribution);
  }

  async findAll(query?: any): Promise<[TipDistribution[], number]> {
    const {
      page = 1,
      limit = 20,
      serverId,
      branchId,
      shiftId,
      status,
      startDate,
      endDate,
    } = query || {};

    const where: any = {};

    if (serverId) where.serverId = serverId;
    if (branchId) where.branchId = branchId;
    if (shiftId) where.shiftId = shiftId;
    if (status) where.status = status;

    if (startDate && endDate) {
      where.distributionDate = Between(new Date(startDate), new Date(endDate));
    }

    return this.distributionRepository.findAndCount({
      where,
      relations: ['server', 'branch', 'shift', 'order'],
      skip: (page - 1) * limit,
      take: limit,
      order: { distributionDate: 'DESC', createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<TipDistribution> {
    const distribution = await this.distributionRepository.findOne({
      where: { id },
      relations: ['server', 'branch', 'shift', 'order'],
    });

    if (!distribution) {
      throw new NotFoundException(`Tip distribution ${id} not found`);
    }

    return distribution;
  }

  async update(
    id: string,
    updateDto: UpdateTipDistributionDto,
  ): Promise<TipDistribution> {
    const distribution = await this.findOne(id);

    Object.assign(distribution, updateDto);

    return this.distributionRepository.save(distribution);
  }

  async remove(id: string): Promise<void> {
    const distribution = await this.findOne(id);

    if (distribution.status === TipDistributionStatus.FINALIZED) {
      throw new BadRequestException('Cannot delete finalized tip distribution');
    }

    await this.distributionRepository.remove(distribution);
  }

  async calculateTipPool(
    branchId: string,
    startDate: Date,
    endDate: Date,
    method: TipDistributionMethod,
    serverIds?: string[],
  ): Promise<any> {
    // Get all shifts in the period
    const shiftsQuery: any = {
      branchId,
      shiftDate: Between(startDate, endDate),
    };

    if (serverIds && serverIds.length > 0) {
      shiftsQuery.serverId = serverIds;
    }

    const shifts = await this.shiftRepository.find({
      where: shiftsQuery,
      relations: ['server'],
    });

    if (shifts.length === 0) {
      throw new BadRequestException('No shifts found for the specified period');
    }

    // Get all orders with tips
    const ordersQuery: any = {
      branchId,
      createdAt: Between(startDate, endDate),
    };

    if (serverIds && serverIds.length > 0) {
      ordersQuery.serverId = serverIds;
    }

    const orders = await this.orderRepository.find({
      where: ordersQuery,
    });

    const totalTips = orders.reduce((sum, o) => sum + Number(o.tipAmount || 0), 0);

    let distribution: any[] = [];

    switch (method) {
      case TipDistributionMethod.POOLED_EQUAL:
        distribution = this.calculateEqualSplit(shifts, totalTips);
        break;

      case TipDistributionMethod.POOLED_WEIGHTED:
        distribution = this.calculateWeightedSplit(shifts, totalTips);
        break;

      case TipDistributionMethod.POOLED_POINTS:
        distribution = this.calculatePointsSplit(shifts, totalTips);
        break;

      case TipDistributionMethod.INDIVIDUAL:
        distribution = this.calculateIndividualTips(shifts, orders);
        break;

      default:
        throw new BadRequestException(`Unsupported distribution method: ${method}`);
    }

    return {
      method,
      totalTips,
      periodStart: startDate,
      periodEnd: endDate,
      numberOfServers: shifts.length,
      distribution,
    };
  }

  private calculateEqualSplit(shifts: ServerShift[], totalTips: number): any[] {
    const uniqueServers = new Map<string, ServerShift>();
    shifts.forEach(shift => {
      if (!uniqueServers.has(shift.serverId)) {
        uniqueServers.set(shift.serverId, shift);
      }
    });

    const perServerAmount = totalTips / uniqueServers.size;

    return Array.from(uniqueServers.values()).map(shift => ({
      serverId: shift.serverId,
      serverName: `${shift.server.firstName} ${shift.server.lastName}`,
      amount: perServerAmount,
      percentage: (perServerAmount / totalTips) * 100,
      calculationMethod: 'equal_split',
    }));
  }

  private calculateWeightedSplit(shifts: ServerShift[], totalTips: number): any[] {
    // Group shifts by server and calculate total hours worked
    const serverHours = new Map<string, { shift: ServerShift; hours: number }>();

    shifts.forEach(shift => {
      const hours = (shift.actualDurationMinutes || shift.scheduledDurationMinutes || 0) / 60;
      const existing = serverHours.get(shift.serverId);

      if (existing) {
        existing.hours += hours;
      } else {
        serverHours.set(shift.serverId, { shift, hours });
      }
    });

    const totalHours = Array.from(serverHours.values()).reduce(
      (sum, data) => sum + data.hours,
      0,
    );

    return Array.from(serverHours.entries()).map(([serverId, data]) => {
      const percentage = (data.hours / totalHours) * 100;
      const amount = (totalTips * percentage) / 100;

      return {
        serverId,
        serverName: `${data.shift.server.firstName} ${data.shift.server.lastName}`,
        amount,
        percentage,
        hoursWorked: data.hours,
        calculationMethod: 'weighted_by_hours',
      };
    });
  }

  private calculatePointsSplit(shifts: ServerShift[], totalTips: number): any[] {
    // Point system: 1 point per hour worked, bonus points for performance
    const serverPoints = new Map<string, { shift: ServerShift; points: number }>();

    shifts.forEach(shift => {
      const hours = (shift.actualDurationMinutes || shift.scheduledDurationMinutes || 0) / 60;
      let points = hours; // Base points = hours worked

      // Bonus points for orders served (0.1 point per order)
      points += (shift.ordersServed || 0) * 0.1;

      // Bonus points for sales (0.001 point per dollar)
      points += Number(shift.totalSales || 0) * 0.001;

      const existing = serverPoints.get(shift.serverId);

      if (existing) {
        existing.points += points;
      } else {
        serverPoints.set(shift.serverId, { shift, points });
      }
    });

    const totalPoints = Array.from(serverPoints.values()).reduce(
      (sum, data) => sum + data.points,
      0,
    );

    return Array.from(serverPoints.entries()).map(([serverId, data]) => {
      const percentage = (data.points / totalPoints) * 100;
      const amount = (totalTips * percentage) / 100;

      return {
        serverId,
        serverName: `${data.shift.server.firstName} ${data.shift.server.lastName}`,
        amount,
        percentage,
        points: data.points,
        calculationMethod: 'points_based',
      };
    });
  }

  private calculateIndividualTips(shifts: ServerShift[], orders: RestaurantOrder[]): any[] {
    const serverTips = new Map<string, { shift: ServerShift; tips: number }>();

    orders.forEach(order => {
      const existing = serverTips.get(order.serverId);
      const tipAmount = Number(order.tipAmount || 0);

      if (existing) {
        existing.tips += tipAmount;
      } else {
        const shift = shifts.find(s => s.serverId === order.serverId);
        if (shift) {
          serverTips.set(order.serverId, { shift, tips: tipAmount });
        }
      }
    });

    const totalTips = Array.from(serverTips.values()).reduce(
      (sum, data) => sum + data.tips,
      0,
    );

    return Array.from(serverTips.entries()).map(([serverId, data]) => {
      const percentage = totalTips > 0 ? (data.tips / totalTips) * 100 : 0;

      return {
        serverId,
        serverName: `${data.shift.server.firstName} ${data.shift.server.lastName}`,
        amount: data.tips,
        percentage,
        calculationMethod: 'individual_tips',
      };
    });
  }

  async applyTipPool(poolId: string, distributions: any[]): Promise<TipDistribution[]> {
    const created: TipDistribution[] = [];

    for (const dist of distributions) {
      const tipDistribution = this.distributionRepository.create({
        branchId: dist.branchId,
        serverId: dist.serverId,
        distributionDate: dist.distributionDate,
        distributionMethod: dist.method,
        originalTipAmount: 0,
        pooledTipReceived: dist.amount,
        finalTipAmount: dist.amount,
        status: TipDistributionStatus.CALCULATED,
        poolId,
        calculationDetails: dist.calculationDetails,
      });

      created.push(await this.distributionRepository.save(tipDistribution));
    }

    return created;
  }

  async getTipSummary(serverId: string, startDate: string, endDate: string): Promise<any> {
    const distributions = await this.distributionRepository.find({
      where: {
        serverId,
        distributionDate: Between(new Date(startDate), new Date(endDate)),
      },
    });

    const summary = {
      totalTips: 0,
      tipsFromOrders: 0,
      tipsFromPool: 0,
      tipOut: 0,
      netTips: 0,
      numberOfDistributions: distributions.length,
    };

    distributions.forEach(d => {
      summary.totalTips += Number(d.originalTipAmount || 0);
      summary.tipsFromPool += Number(d.pooledTipReceived || 0);
      summary.tipOut += Number(d.tipOutAmount || 0);
      summary.netTips += Number(d.finalTipAmount || 0);
    });

    summary.tipsFromOrders = summary.totalTips - summary.tipsFromPool;

    return {
      summary,
      distributions,
    };
  }
}
