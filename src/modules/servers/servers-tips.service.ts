import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServerTip, TipStatus } from './entities/server-tip.entity';
import { CreateServerTipDto } from './dto/create-server-tip.dto';
import { UpdateServerTipDto } from './dto/update-server-tip.dto';

@Injectable()
export class ServersTipsService {
  constructor(
    @InjectRepository(ServerTip)
    private readonly tipRepository: Repository<ServerTip>,
  ) {}

  async create(createServerTipDto: CreateServerTipDto): Promise<ServerTip> {
    // Calculate tip percentage if order total is provided
    if (createServerTipDto.orderTotal && createServerTipDto.amount) {
      createServerTipDto.tipPercentage =
        (createServerTipDto.amount / createServerTipDto.orderTotal) * 100;
    }

    const tip = this.tipRepository.create(createServerTipDto);
    return await this.tipRepository.save(tip);
  }

  async findAll(filters: {
    serverId?: string;
    shiftId?: string;
    status?: TipStatus;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const {
      page = 1,
      limit = 20,
      serverId,
      shiftId,
      status,
      startDate,
      endDate,
    } = filters;

    const queryBuilder = this.tipRepository
      .createQueryBuilder('tip')
      .leftJoinAndSelect('tip.server', 'server')
      .leftJoinAndSelect('tip.invoice', 'invoice')
      .leftJoinAndSelect('tip.shift', 'shift');

    if (serverId) {
      queryBuilder.andWhere('tip.serverId = :serverId', { serverId });
    }

    if (shiftId) {
      queryBuilder.andWhere('tip.shiftId = :shiftId', { shiftId });
    }

    if (status) {
      queryBuilder.andWhere('tip.status = :status', { status });
    }

    if (startDate) {
      queryBuilder.andWhere('tip.tipDate >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('tip.tipDate <= :endDate', { endDate });
    }

    queryBuilder.skip((page - 1) * limit).take(limit);
    queryBuilder.orderBy('tip.tipDate', 'DESC');

    const [data, totalItems] = await queryBuilder.getManyAndCount();

    return {
      data,
      meta: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  }

  async findOne(id: string): Promise<ServerTip> {
    const tip = await this.tipRepository.findOne({
      where: { id },
      relations: ['server', 'invoice', 'shift'],
    });

    if (!tip) {
      throw new NotFoundException(`Server tip with ID ${id} not found`);
    }

    return tip;
  }

  async findByServer(serverId: string, filters?: {
    startDate?: string;
    endDate?: string;
    status?: TipStatus;
  }): Promise<ServerTip[]> {
    const queryBuilder = this.tipRepository
      .createQueryBuilder('tip')
      .leftJoinAndSelect('tip.invoice', 'invoice')
      .leftJoinAndSelect('tip.shift', 'shift')
      .where('tip.serverId = :serverId', { serverId });

    if (filters?.startDate) {
      queryBuilder.andWhere('tip.tipDate >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters?.endDate) {
      queryBuilder.andWhere('tip.tipDate <= :endDate', {
        endDate: filters.endDate,
      });
    }

    if (filters?.status) {
      queryBuilder.andWhere('tip.status = :status', { status: filters.status });
    }

    queryBuilder.orderBy('tip.tipDate', 'DESC');

    return await queryBuilder.getMany();
  }

  async update(
    id: string,
    updateServerTipDto: UpdateServerTipDto,
  ): Promise<ServerTip> {
    const tip = await this.findOne(id);

    // Recalculate tip percentage if amount or order total changed
    if (updateServerTipDto.orderTotal || updateServerTipDto.amount) {
      const orderTotal = updateServerTipDto.orderTotal || tip.orderTotal;
      const amount = updateServerTipDto.amount || tip.amount;
      if (orderTotal && amount) {
        updateServerTipDto.tipPercentage = (amount / orderTotal) * 100;
      }
    }

    Object.assign(tip, updateServerTipDto);
    return await this.tipRepository.save(tip);
  }

  async markAsPaid(id: string, paidDate?: Date): Promise<ServerTip> {
    const tip = await this.findOne(id);

    if (tip.status === TipStatus.PAID) {
      throw new BadRequestException('Tip is already marked as paid');
    }

    tip.status = TipStatus.PAID;
    tip.paidDate = paidDate || new Date();

    return await this.tipRepository.save(tip);
  }

  async remove(id: string): Promise<void> {
    const tip = await this.findOne(id);
    await this.tipRepository.remove(tip);
  }

  async getTipStats(
    serverId?: string,
    shiftId?: string,
    startDate?: string,
    endDate?: string,
  ) {
    const queryBuilder = this.tipRepository
      .createQueryBuilder('tip')
      .select('COUNT(tip.id)', 'totalTips')
      .addSelect('SUM(tip.amount)', 'totalAmount')
      .addSelect('AVG(tip.amount)', 'avgTipAmount')
      .addSelect('AVG(tip.tipPercentage)', 'avgTipPercentage')
      .addSelect('MAX(tip.amount)', 'maxTip')
      .addSelect('MIN(tip.amount)', 'minTip')
      .addSelect('SUM(CASE WHEN tip.isPooled = true THEN tip.amount ELSE 0 END)', 'pooledAmount')
      .addSelect("COUNT(CASE WHEN tip.status = 'paid' THEN 1 END)", 'paidTipsCount')
      .addSelect("COUNT(CASE WHEN tip.status = 'pending' THEN 1 END)", 'pendingTipsCount');

    if (serverId) {
      queryBuilder.where('tip.serverId = :serverId', { serverId });
    }

    if (shiftId) {
      queryBuilder.andWhere('tip.shiftId = :shiftId', { shiftId });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere('tip.tipDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    const result = await queryBuilder.getRawOne();

    return {
      totalTips: parseInt(result.totalTips) || 0,
      totalAmount: parseFloat(result.totalAmount) || 0,
      avgTipAmount: parseFloat(result.avgTipAmount) || 0,
      avgTipPercentage: parseFloat(result.avgTipPercentage) || 0,
      maxTip: parseFloat(result.maxTip) || 0,
      minTip: parseFloat(result.minTip) || 0,
      pooledAmount: parseFloat(result.pooledAmount) || 0,
      paidTipsCount: parseInt(result.paidTipsCount) || 0,
      pendingTipsCount: parseInt(result.pendingTipsCount) || 0,
    };
  }

  async getTipsByType(serverId?: string, startDate?: string, endDate?: string) {
    const queryBuilder = this.tipRepository
      .createQueryBuilder('tip')
      .select('tip.type', 'type')
      .addSelect('COUNT(tip.id)', 'count')
      .addSelect('SUM(tip.amount)', 'total')
      .groupBy('tip.type');

    if (serverId) {
      queryBuilder.where('tip.serverId = :serverId', { serverId });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere('tip.tipDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    const results = await queryBuilder.getRawMany();

    return results.map((result) => ({
      type: result.type,
      count: parseInt(result.count),
      total: parseFloat(result.total),
    }));
  }
}
