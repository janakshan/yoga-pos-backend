import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { ServerAssignment, AssignmentStatus } from '../entities/server-assignment.entity';
import { CreateServerAssignmentDto } from '../dto/create-server-assignment.dto';
import { UpdateServerAssignmentDto } from '../dto/update-server-assignment.dto';

@Injectable()
export class ServerAssignmentsService {
  constructor(
    @InjectRepository(ServerAssignment)
    private assignmentRepository: Repository<ServerAssignment>,
  ) {}

  async create(createDto: CreateServerAssignmentDto): Promise<ServerAssignment> {
    // Check for existing active assignment on the same date
    const existing = await this.assignmentRepository.findOne({
      where: {
        serverId: createDto.serverId,
        assignmentDate: new Date(createDto.assignmentDate),
        status: AssignmentStatus.ACTIVE,
      },
    });

    if (existing) {
      throw new ConflictException(
        `Server already has an active assignment for ${createDto.assignmentDate}`,
      );
    }

    const assignment = this.assignmentRepository.create(createDto);
    return this.assignmentRepository.save(assignment);
  }

  async findAll(query?: any): Promise<[ServerAssignment[], number]> {
    const {
      page = 1,
      limit = 20,
      serverId,
      branchId,
      sectionId,
      status,
      startDate,
      endDate,
    } = query || {};

    const where: any = {};

    if (serverId) where.serverId = serverId;
    if (branchId) where.branchId = branchId;
    if (sectionId) where.sectionId = sectionId;
    if (status) where.status = status;

    if (startDate && endDate) {
      where.assignmentDate = Between(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      where.assignmentDate = MoreThanOrEqual(new Date(startDate));
    } else if (endDate) {
      where.assignmentDate = LessThanOrEqual(new Date(endDate));
    }

    return this.assignmentRepository.findAndCount({
      where,
      relations: ['server', 'branch', 'section'],
      skip: (page - 1) * limit,
      take: limit,
      order: { assignmentDate: 'DESC', priorityOrder: 'ASC' },
    });
  }

  async findOne(id: string): Promise<ServerAssignment> {
    const assignment = await this.assignmentRepository.findOne({
      where: { id },
      relations: ['server', 'branch', 'section'],
    });

    if (!assignment) {
      throw new NotFoundException(`Assignment ${id} not found`);
    }

    return assignment;
  }

  async update(
    id: string,
    updateDto: UpdateServerAssignmentDto,
  ): Promise<ServerAssignment> {
    const assignment = await this.findOne(id);

    Object.assign(assignment, updateDto);

    return this.assignmentRepository.save(assignment);
  }

  async remove(id: string): Promise<void> {
    const assignment = await this.findOne(id);
    await this.assignmentRepository.remove(assignment);
  }

  async getActiveAssignments(branchId: string, date?: string): Promise<ServerAssignment[]> {
    const assignmentDate = date ? new Date(date) : new Date();

    return this.assignmentRepository.find({
      where: {
        branchId,
        assignmentDate,
        status: AssignmentStatus.ACTIVE,
      },
      relations: ['server', 'section'],
      order: { priorityOrder: 'ASC' },
    });
  }

  async assignServerToSection(
    serverId: string,
    sectionId: string,
    branchId: string,
    date: string,
  ): Promise<ServerAssignment> {
    // Check if assignment already exists
    let assignment = await this.assignmentRepository.findOne({
      where: {
        serverId,
        branchId,
        assignmentDate: new Date(date),
      },
    });

    if (assignment) {
      // Update existing assignment
      assignment.sectionId = sectionId;
      assignment.status = AssignmentStatus.ACTIVE;
    } else {
      // Create new assignment
      assignment = this.assignmentRepository.create({
        serverId,
        sectionId,
        branchId,
        assignmentDate: new Date(date),
        status: AssignmentStatus.ACTIVE,
      });
    }

    return this.assignmentRepository.save(assignment);
  }

  async updateTableCount(id: string, increment: number): Promise<ServerAssignment> {
    const assignment = await this.findOne(id);

    const newCount = assignment.currentTableCount + increment;

    if (newCount < 0) {
      throw new BadRequestException('Table count cannot be negative');
    }

    if (assignment.tableLimit && newCount > assignment.tableLimit) {
      throw new BadRequestException(
        `Table count (${newCount}) exceeds limit (${assignment.tableLimit})`,
      );
    }

    assignment.currentTableCount = newCount;
    return this.assignmentRepository.save(assignment);
  }

  async getNextServerForRotation(
    branchId: string,
    sectionId: string,
    date?: string,
  ): Promise<ServerAssignment | null> {
    const assignmentDate = date ? new Date(date) : new Date();

    const assignments = await this.assignmentRepository.find({
      where: {
        branchId,
        sectionId,
        assignmentDate,
        status: AssignmentStatus.ACTIVE,
      },
      relations: ['server'],
      order: { priorityOrder: 'ASC', currentTableCount: 'ASC' },
    });

    if (assignments.length === 0) {
      return null;
    }

    // Find server with lowest table count (fair rotation)
    const minTableCount = Math.min(...assignments.map(a => a.currentTableCount));
    const availableServers = assignments.filter(
      a => a.currentTableCount === minTableCount &&
           (!a.tableLimit || a.currentTableCount < a.tableLimit)
    );

    if (availableServers.length === 0) {
      return null; // All servers are at capacity
    }

    // Return the server with the lowest priority order (first in rotation)
    return availableServers[0];
  }
}
