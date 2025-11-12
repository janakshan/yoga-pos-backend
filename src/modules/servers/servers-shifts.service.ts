import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ServerShift, ShiftStatus } from './entities/server-shift.entity';
import { CreateServerShiftDto } from './dto/create-server-shift.dto';
import { UpdateServerShiftDto } from './dto/update-server-shift.dto';
import { FilterServerShiftDto } from './dto/filter-server-shift.dto';
import { StartShiftDto, EndShiftDto } from './dto/start-shift.dto';

@Injectable()
export class ServersShiftsService {
  constructor(
    @InjectRepository(ServerShift)
    private readonly shiftRepository: Repository<ServerShift>,
  ) {}

  async create(createServerShiftDto: CreateServerShiftDto): Promise<ServerShift> {
    // Validate that scheduled end is after scheduled start
    if (
      new Date(createServerShiftDto.scheduledEnd) <=
      new Date(createServerShiftDto.scheduledStart)
    ) {
      throw new BadRequestException(
        'Scheduled end time must be after start time',
      );
    }

    const shift = this.shiftRepository.create(createServerShiftDto);
    return await this.shiftRepository.save(shift);
  }

  async findAll(filters: FilterServerShiftDto) {
    const { page = 1, limit = 20, serverId, branchId, status, startDate, endDate } = filters;

    const queryBuilder = this.shiftRepository
      .createQueryBuilder('shift')
      .leftJoinAndSelect('shift.server', 'server')
      .leftJoinAndSelect('shift.branch', 'branch');

    if (serverId) {
      queryBuilder.andWhere('shift.serverId = :serverId', { serverId });
    }

    if (branchId) {
      queryBuilder.andWhere('shift.branchId = :branchId', { branchId });
    }

    if (status) {
      queryBuilder.andWhere('shift.status = :status', { status });
    }

    if (startDate) {
      queryBuilder.andWhere('shift.scheduledStart >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('shift.scheduledEnd <= :endDate', { endDate });
    }

    queryBuilder.skip((page - 1) * limit).take(limit);
    queryBuilder.orderBy('shift.scheduledStart', 'DESC');

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

  async findOne(id: string): Promise<ServerShift> {
    const shift = await this.shiftRepository.findOne({
      where: { id },
      relations: ['server', 'branch'],
    });

    if (!shift) {
      throw new NotFoundException(`Server shift with ID ${id} not found`);
    }

    return shift;
  }

  async findActiveShift(serverId: string): Promise<ServerShift | null> {
    return await this.shiftRepository.findOne({
      where: {
        serverId,
        status: ShiftStatus.STARTED,
      },
      relations: ['server', 'branch'],
      order: { actualStart: 'DESC' },
    });
  }

  async update(
    id: string,
    updateServerShiftDto: UpdateServerShiftDto,
  ): Promise<ServerShift> {
    const shift = await this.findOne(id);
    Object.assign(shift, updateServerShiftDto);
    return await this.shiftRepository.save(shift);
  }

  async startShift(id: string, startShiftDto: StartShiftDto): Promise<ServerShift> {
    const shift = await this.findOne(id);

    if (shift.status !== ShiftStatus.SCHEDULED) {
      throw new BadRequestException(
        `Cannot start shift with status: ${shift.status}`,
      );
    }

    // Check if server already has an active shift
    const activeShift = await this.findActiveShift(shift.serverId);
    if (activeShift && activeShift.id !== id) {
      throw new BadRequestException(
        'Server already has an active shift. Please end the current shift first.',
      );
    }

    shift.actualStart = startShiftDto.actualStart;
    shift.status = ShiftStatus.STARTED;
    if (startShiftDto.notes) {
      shift.notes = shift.notes
        ? `${shift.notes}\n${startShiftDto.notes}`
        : startShiftDto.notes;
    }

    return await this.shiftRepository.save(shift);
  }

  async endShift(id: string, endShiftDto: EndShiftDto): Promise<ServerShift> {
    const shift = await this.findOne(id);

    if (shift.status !== ShiftStatus.STARTED) {
      throw new BadRequestException(
        `Cannot end shift with status: ${shift.status}`,
      );
    }

    if (!shift.actualStart) {
      throw new BadRequestException('Shift must be started before ending');
    }

    if (new Date(endShiftDto.actualEnd) <= new Date(shift.actualStart)) {
      throw new BadRequestException('End time must be after start time');
    }

    shift.actualEnd = endShiftDto.actualEnd;
    shift.status = ShiftStatus.COMPLETED;
    if (endShiftDto.notes) {
      shift.notes = shift.notes
        ? `${shift.notes}\n${endShiftDto.notes}`
        : endShiftDto.notes;
    }

    return await this.shiftRepository.save(shift);
  }

  async remove(id: string): Promise<void> {
    const shift = await this.findOne(id);

    if (shift.status === ShiftStatus.STARTED) {
      throw new BadRequestException('Cannot delete an active shift');
    }

    await this.shiftRepository.remove(shift);
  }

  async getShiftStats(serverId?: string, branchId?: string, startDate?: string, endDate?: string) {
    const queryBuilder = this.shiftRepository
      .createQueryBuilder('shift')
      .select('COUNT(shift.id)', 'totalShifts')
      .addSelect('SUM(shift.totalSales)', 'totalSales')
      .addSelect('SUM(shift.totalTips)', 'totalTips')
      .addSelect('SUM(shift.orderCount)', 'totalOrders')
      .addSelect('AVG(shift.totalSales)', 'avgSalesPerShift')
      .addSelect('AVG(shift.totalTips)', 'avgTipsPerShift');

    if (serverId) {
      queryBuilder.where('shift.serverId = :serverId', { serverId });
    }

    if (branchId) {
      queryBuilder.andWhere('shift.branchId = :branchId', { branchId });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere('shift.scheduledStart BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    const result = await queryBuilder.getRawOne();

    return {
      totalShifts: parseInt(result.totalShifts) || 0,
      totalSales: parseFloat(result.totalSales) || 0,
      totalTips: parseFloat(result.totalTips) || 0,
      totalOrders: parseInt(result.totalOrders) || 0,
      avgSalesPerShift: parseFloat(result.avgSalesPerShift) || 0,
      avgTipsPerShift: parseFloat(result.avgTipsPerShift) || 0,
    };
  }
}
