import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { ServerShift, ShiftStatus } from '../entities/server-shift.entity';
import { CreateServerShiftDto } from '../dto/create-server-shift.dto';
import { UpdateServerShiftDto } from '../dto/update-server-shift.dto';

@Injectable()
export class ServerShiftsService {
  constructor(
    @InjectRepository(ServerShift)
    private shiftRepository: Repository<ServerShift>,
  ) {}

  async create(createDto: CreateServerShiftDto): Promise<ServerShift> {
    const shift = this.shiftRepository.create(createDto);

    // Calculate scheduled duration
    const start = new Date(createDto.scheduledStart);
    const end = new Date(createDto.scheduledEnd);
    shift.scheduledDurationMinutes = Math.floor((end.getTime() - start.getTime()) / 60000);

    return this.shiftRepository.save(shift);
  }

  async findAll(query?: any): Promise<[ServerShift[], number]> {
    const {
      page = 1,
      limit = 20,
      serverId,
      branchId,
      status,
      startDate,
      endDate,
    } = query || {};

    const where: any = {};

    if (serverId) where.serverId = serverId;
    if (branchId) where.branchId = branchId;
    if (status) where.status = status;

    if (startDate && endDate) {
      where.shiftDate = Between(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      where.shiftDate = MoreThanOrEqual(new Date(startDate));
    } else if (endDate) {
      where.shiftDate = LessThanOrEqual(new Date(endDate));
    }

    return this.shiftRepository.findAndCount({
      where,
      relations: ['server', 'branch'],
      skip: (page - 1) * limit,
      take: limit,
      order: { shiftDate: 'DESC', scheduledStart: 'DESC' },
    });
  }

  async findOne(id: string): Promise<ServerShift> {
    const shift = await this.shiftRepository.findOne({
      where: { id },
      relations: ['server', 'branch'],
    });

    if (!shift) {
      throw new NotFoundException(`Shift ${id} not found`);
    }

    return shift;
  }

  async update(id: string, updateDto: UpdateServerShiftDto): Promise<ServerShift> {
    const shift = await this.findOne(id);

    Object.assign(shift, updateDto);

    return this.shiftRepository.save(shift);
  }

  async remove(id: string): Promise<void> {
    const shift = await this.findOne(id);

    if (shift.status === ShiftStatus.CLOCKED_IN) {
      throw new BadRequestException('Cannot delete a shift that is currently active');
    }

    await this.shiftRepository.remove(shift);
  }

  async clockIn(shiftId: string, metadata?: any): Promise<ServerShift> {
    const shift = await this.findOne(shiftId);

    if (shift.status !== ShiftStatus.SCHEDULED) {
      throw new BadRequestException(
        `Cannot clock in. Shift status is ${shift.status}`,
      );
    }

    shift.actualClockIn = new Date();
    shift.status = ShiftStatus.CLOCKED_IN;

    if (metadata) {
      shift.metadata = {
        ...shift.metadata,
        clockInLocation: metadata.location,
        clockInDevice: metadata.device,
      };
    }

    return this.shiftRepository.save(shift);
  }

  async clockOut(shiftId: string, metadata?: any): Promise<ServerShift> {
    const shift = await this.findOne(shiftId);

    if (shift.status !== ShiftStatus.CLOCKED_IN && shift.status !== ShiftStatus.ON_BREAK) {
      throw new BadRequestException(
        `Cannot clock out. Shift status is ${shift.status}`,
      );
    }

    if (!shift.actualClockIn) {
      throw new BadRequestException('Cannot clock out without clocking in first');
    }

    shift.actualClockOut = new Date();
    shift.status = ShiftStatus.CLOCKED_OUT;

    // Calculate actual duration
    const duration = shift.actualClockOut.getTime() - shift.actualClockIn.getTime();
    shift.actualDurationMinutes = Math.floor(duration / 60000);

    // Calculate overtime if applicable
    if (shift.scheduledDurationMinutes) {
      const overtime = shift.actualDurationMinutes - shift.scheduledDurationMinutes;
      shift.overtimeMinutes = overtime > 0 ? overtime : 0;
    }

    if (metadata) {
      shift.metadata = {
        ...shift.metadata,
        clockOutLocation: metadata.location,
        clockOutDevice: metadata.device,
      };
    }

    return this.shiftRepository.save(shift);
  }

  async startBreak(
    shiftId: string,
    breakType: 'meal' | 'rest' | 'other' = 'rest',
  ): Promise<ServerShift> {
    const shift = await this.findOne(shiftId);

    if (shift.status !== ShiftStatus.CLOCKED_IN) {
      throw new BadRequestException(
        `Cannot start break. Shift status is ${shift.status}`,
      );
    }

    shift.status = ShiftStatus.ON_BREAK;

    const currentBreak = {
      startTime: new Date(),
      endTime: null as any,
      duration: 0,
      type: breakType,
    };

    shift.breaks = shift.breaks || [];
    shift.breaks.push(currentBreak);

    return this.shiftRepository.save(shift);
  }

  async endBreak(shiftId: string, notes?: string): Promise<ServerShift> {
    const shift = await this.findOne(shiftId);

    if (shift.status !== ShiftStatus.ON_BREAK) {
      throw new BadRequestException(
        `Cannot end break. Shift status is ${shift.status}`,
      );
    }

    if (!shift.breaks || shift.breaks.length === 0) {
      throw new BadRequestException('No active break found');
    }

    // Find the last break (current break)
    const currentBreak = shift.breaks[shift.breaks.length - 1];

    if (currentBreak.endTime) {
      throw new BadRequestException('Break already ended');
    }

    currentBreak.endTime = new Date();
    const duration = currentBreak.endTime.getTime() - currentBreak.startTime.getTime();
    currentBreak.duration = Math.floor(duration / 60000);

    if (notes) {
      currentBreak.notes = notes;
    }

    // Update total break minutes
    shift.totalBreakMinutes = shift.breaks.reduce((sum, b) => sum + (b.duration || 0), 0);

    shift.status = ShiftStatus.CLOCKED_IN;

    return this.shiftRepository.save(shift);
  }

  async getActiveShift(serverId: string, branchId: string): Promise<ServerShift | null> {
    return this.shiftRepository.findOne({
      where: {
        serverId,
        branchId,
        status: ShiftStatus.CLOCKED_IN,
      },
      relations: ['server', 'branch'],
    });
  }

  async getShiftsByDateRange(
    serverId: string,
    startDate: string,
    endDate: string,
  ): Promise<ServerShift[]> {
    return this.shiftRepository.find({
      where: {
        serverId,
        shiftDate: Between(new Date(startDate), new Date(endDate)),
      },
      relations: ['server', 'branch'],
      order: { shiftDate: 'ASC', scheduledStart: 'ASC' },
    });
  }

  async updateShiftMetrics(
    shiftId: string,
    metrics: {
      ordersServed?: number;
      tablesServed?: number;
      totalSales?: number;
      totalTips?: number;
    },
  ): Promise<ServerShift> {
    const shift = await this.findOne(shiftId);

    if (metrics.ordersServed !== undefined) {
      shift.ordersServed = metrics.ordersServed;
    }
    if (metrics.tablesServed !== undefined) {
      shift.tablesServed = metrics.tablesServed;
    }
    if (metrics.totalSales !== undefined) {
      shift.totalSales = metrics.totalSales;
    }
    if (metrics.totalTips !== undefined) {
      shift.totalTips = metrics.totalTips;
    }

    return this.shiftRepository.save(shift);
  }
}
