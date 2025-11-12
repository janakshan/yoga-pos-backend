import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServerAssignment, AssignmentStatus } from './entities/server-assignment.entity';
import { CreateServerAssignmentDto } from './dto/create-server-assignment.dto';
import { UpdateServerAssignmentDto } from './dto/update-server-assignment.dto';

@Injectable()
export class ServersAssignmentsService {
  constructor(
    @InjectRepository(ServerAssignment)
    private readonly assignmentRepository: Repository<ServerAssignment>,
  ) {}

  async create(
    createServerAssignmentDto: CreateServerAssignmentDto,
  ): Promise<ServerAssignment> {
    // Validate that end time is after start time if provided
    if (
      createServerAssignmentDto.endTime &&
      new Date(createServerAssignmentDto.endTime) <=
        new Date(createServerAssignmentDto.startTime)
    ) {
      throw new BadRequestException('End time must be after start time');
    }

    const assignment = this.assignmentRepository.create(
      createServerAssignmentDto,
    );
    return await this.assignmentRepository.save(assignment);
  }

  async findAll(filters: {
    serverId?: string;
    sectionId?: string;
    shiftId?: string;
    status?: AssignmentStatus;
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 20, serverId, sectionId, shiftId, status } = filters;

    const queryBuilder = this.assignmentRepository
      .createQueryBuilder('assignment')
      .leftJoinAndSelect('assignment.server', 'server')
      .leftJoinAndSelect('assignment.section', 'section')
      .leftJoinAndSelect('assignment.shift', 'shift');

    if (serverId) {
      queryBuilder.andWhere('assignment.serverId = :serverId', { serverId });
    }

    if (sectionId) {
      queryBuilder.andWhere('assignment.sectionId = :sectionId', { sectionId });
    }

    if (shiftId) {
      queryBuilder.andWhere('assignment.shiftId = :shiftId', { shiftId });
    }

    if (status) {
      queryBuilder.andWhere('assignment.status = :status', { status });
    }

    queryBuilder.skip((page - 1) * limit).take(limit);
    queryBuilder.orderBy('assignment.startTime', 'DESC');

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

  async findOne(id: string): Promise<ServerAssignment> {
    const assignment = await this.assignmentRepository.findOne({
      where: { id },
      relations: ['server', 'section', 'shift'],
    });

    if (!assignment) {
      throw new NotFoundException(`Server assignment with ID ${id} not found`);
    }

    return assignment;
  }

  async findActiveAssignments(serverId: string): Promise<ServerAssignment[]> {
    return await this.assignmentRepository.find({
      where: {
        serverId,
        status: AssignmentStatus.ACTIVE,
      },
      relations: ['server', 'section', 'shift'],
      order: { startTime: 'DESC' },
    });
  }

  async findCurrentSectionServers(sectionId: string): Promise<ServerAssignment[]> {
    return await this.assignmentRepository.find({
      where: {
        sectionId,
        status: AssignmentStatus.ACTIVE,
      },
      relations: ['server', 'section', 'shift'],
      order: { isPrimary: 'DESC', startTime: 'ASC' },
    });
  }

  async update(
    id: string,
    updateServerAssignmentDto: UpdateServerAssignmentDto,
  ): Promise<ServerAssignment> {
    const assignment = await this.findOne(id);
    Object.assign(assignment, updateServerAssignmentDto);
    return await this.assignmentRepository.save(assignment);
  }

  async endAssignment(id: string, endTime: Date): Promise<ServerAssignment> {
    const assignment = await this.findOne(id);

    if (assignment.status !== AssignmentStatus.ACTIVE) {
      throw new BadRequestException(
        `Cannot end assignment with status: ${assignment.status}`,
      );
    }

    if (new Date(endTime) <= new Date(assignment.startTime)) {
      throw new BadRequestException('End time must be after start time');
    }

    assignment.endTime = endTime;
    assignment.status = AssignmentStatus.INACTIVE;

    return await this.assignmentRepository.save(assignment);
  }

  async remove(id: string): Promise<void> {
    const assignment = await this.findOne(id);
    await this.assignmentRepository.remove(assignment);
  }

  async getAssignmentStats(serverId?: string, sectionId?: string) {
    const queryBuilder = this.assignmentRepository
      .createQueryBuilder('assignment')
      .select('COUNT(assignment.id)', 'totalAssignments')
      .addSelect(
        "COUNT(CASE WHEN assignment.status = 'active' THEN 1 END)",
        'activeAssignments',
      )
      .addSelect(
        'COUNT(CASE WHEN assignment.isPrimary = true THEN 1 END)',
        'primaryAssignments',
      );

    if (serverId) {
      queryBuilder.where('assignment.serverId = :serverId', { serverId });
    }

    if (sectionId) {
      queryBuilder.andWhere('assignment.sectionId = :sectionId', { sectionId });
    }

    const result = await queryBuilder.getRawOne();

    return {
      totalAssignments: parseInt(result.totalAssignments) || 0,
      activeAssignments: parseInt(result.activeAssignments) || 0,
      primaryAssignments: parseInt(result.primaryAssignments) || 0,
    };
  }
}
