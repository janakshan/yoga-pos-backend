import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Table } from '../entities/table.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { User } from '../../users/entities/user.entity';
import { FloorPlan } from '../entities/floor-plan.entity';
import { TableSection } from '../entities/table-section.entity';
import {
  CreateTableDto,
  UpdateTableDto,
  FilterTableDto,
  UpdateTableStatusDto,
  AssignServerDto,
} from '../dto';
import { TableStatus } from '../common/restaurant.constants';

@Injectable()
export class TablesService {
  constructor(
    @InjectRepository(Table)
    private readonly tableRepository: Repository<Table>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(FloorPlan)
    private readonly floorPlanRepository: Repository<FloorPlan>,
    @InjectRepository(TableSection)
    private readonly tableSectionRepository: Repository<TableSection>,
  ) {}

  async create(createTableDto: CreateTableDto): Promise<Table> {
    // Verify branch exists
    const branch = await this.branchRepository.findOne({
      where: { id: createTableDto.branchId },
    });
    if (!branch) {
      throw new NotFoundException(
        `Branch with ID ${createTableDto.branchId} not found`,
      );
    }

    // Check if table number already exists for this branch
    const existingTable = await this.tableRepository.findOne({
      where: {
        branchId: createTableDto.branchId,
        tableNumber: createTableDto.tableNumber,
      },
    });
    if (existingTable) {
      throw new BadRequestException(
        `Table ${createTableDto.tableNumber} already exists in this branch`,
      );
    }

    // Verify floor plan if provided
    if (createTableDto.floorPlanId) {
      const floorPlan = await this.floorPlanRepository.findOne({
        where: { id: createTableDto.floorPlanId },
      });
      if (!floorPlan) {
        throw new NotFoundException(
          `Floor plan with ID ${createTableDto.floorPlanId} not found`,
        );
      }
    }

    // Verify section if provided
    if (createTableDto.sectionId) {
      const section = await this.tableSectionRepository.findOne({
        where: { id: createTableDto.sectionId },
      });
      if (!section) {
        throw new NotFoundException(
          `Section with ID ${createTableDto.sectionId} not found`,
        );
      }
    }

    // Verify server if provided
    if (createTableDto.assignedServerId) {
      const server = await this.userRepository.findOne({
        where: { id: createTableDto.assignedServerId },
      });
      if (!server) {
        throw new NotFoundException(
          `Server with ID ${createTableDto.assignedServerId} not found`,
        );
      }
    }

    const table = this.tableRepository.create(createTableDto);
    return await this.tableRepository.save(table);
  }

  async findAll(filterDto: FilterTableDto): Promise<{
    data: Table[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const {
      page = 1,
      limit = 20,
      search,
      branchId,
      floorPlanId,
      sectionId,
      status,
      assignedServerId,
      minCapacity,
      maxCapacity,
      isActive,
      sortBy = 'tableNumber',
      sortOrder = 'ASC',
    } = filterDto;

    const queryBuilder = this.tableRepository
      .createQueryBuilder('table')
      .leftJoinAndSelect('table.branch', 'branch')
      .leftJoinAndSelect('table.floorPlan', 'floorPlan')
      .leftJoinAndSelect('table.section', 'section')
      .leftJoinAndSelect('table.assignedServer', 'assignedServer');

    // Search filter
    if (search) {
      queryBuilder.andWhere('table.tableNumber ILIKE :search', {
        search: `%${search}%`,
      });
    }

    // Branch filter
    if (branchId) {
      queryBuilder.andWhere('table.branchId = :branchId', { branchId });
    }

    // Floor plan filter
    if (floorPlanId) {
      queryBuilder.andWhere('table.floorPlanId = :floorPlanId', {
        floorPlanId,
      });
    }

    // Section filter
    if (sectionId) {
      queryBuilder.andWhere('table.sectionId = :sectionId', { sectionId });
    }

    // Status filter
    if (status) {
      queryBuilder.andWhere('table.status = :status', { status });
    }

    // Assigned server filter
    if (assignedServerId) {
      queryBuilder.andWhere('table.assignedServerId = :assignedServerId', {
        assignedServerId,
      });
    }

    // Capacity filters
    if (minCapacity) {
      queryBuilder.andWhere('table.capacity >= :minCapacity', { minCapacity });
    }
    if (maxCapacity) {
      queryBuilder.andWhere('table.capacity <= :maxCapacity', { maxCapacity });
    }

    // Active status filter
    if (isActive !== undefined) {
      queryBuilder.andWhere('table.isActive = :isActive', { isActive });
    }

    // Get total count before pagination
    const total = await queryBuilder.getCount();

    // Sorting
    const allowedSortFields = [
      'tableNumber',
      'capacity',
      'status',
      'createdAt',
      'updatedAt',
    ];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'tableNumber';
    queryBuilder.orderBy(`table.${sortField}`, sortOrder);

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const data = await queryBuilder.getMany();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Table> {
    const table = await this.tableRepository.findOne({
      where: { id },
      relations: ['branch', 'floorPlan', 'section', 'assignedServer'],
    });

    if (!table) {
      throw new NotFoundException(`Table with ID ${id} not found`);
    }

    return table;
  }

  async findByTableNumber(
    branchId: string,
    tableNumber: string,
  ): Promise<Table> {
    const table = await this.tableRepository.findOne({
      where: { branchId, tableNumber },
      relations: ['branch', 'floorPlan', 'section', 'assignedServer'],
    });

    if (!table) {
      throw new NotFoundException(
        `Table ${tableNumber} not found in this branch`,
      );
    }

    return table;
  }

  async update(id: string, updateTableDto: UpdateTableDto): Promise<Table> {
    const table = await this.findOne(id);

    // Check if table number is being updated and if it already exists
    if (
      updateTableDto.tableNumber &&
      updateTableDto.tableNumber !== table.tableNumber
    ) {
      const existingTable = await this.tableRepository.findOne({
        where: {
          branchId: table.branchId,
          tableNumber: updateTableDto.tableNumber,
        },
      });
      if (existingTable) {
        throw new BadRequestException(
          `Table ${updateTableDto.tableNumber} already exists in this branch`,
        );
      }
    }

    // Verify floor plan if provided
    if (updateTableDto.floorPlanId) {
      const floorPlan = await this.floorPlanRepository.findOne({
        where: { id: updateTableDto.floorPlanId },
      });
      if (!floorPlan) {
        throw new NotFoundException(
          `Floor plan with ID ${updateTableDto.floorPlanId} not found`,
        );
      }
    }

    // Verify section if provided
    if (updateTableDto.sectionId) {
      const section = await this.tableSectionRepository.findOne({
        where: { id: updateTableDto.sectionId },
      });
      if (!section) {
        throw new NotFoundException(
          `Section with ID ${updateTableDto.sectionId} not found`,
        );
      }
    }

    // Verify server if provided
    if (updateTableDto.assignedServerId) {
      const server = await this.userRepository.findOne({
        where: { id: updateTableDto.assignedServerId },
      });
      if (!server) {
        throw new NotFoundException(
          `Server with ID ${updateTableDto.assignedServerId} not found`,
        );
      }
    }

    Object.assign(table, updateTableDto);
    return await this.tableRepository.save(table);
  }

  async remove(id: string): Promise<void> {
    const table = await this.findOne(id);
    await this.tableRepository.remove(table);
  }

  // Table Status Management
  async updateStatus(
    id: string,
    updateTableStatusDto: UpdateTableStatusDto,
  ): Promise<Table> {
    const table = await this.findOne(id);
    const oldStatus = table.status;
    const newStatus = updateTableStatusDto.status;

    // Validate status transitions
    if (oldStatus === TableStatus.OUT_OF_SERVICE && newStatus === TableStatus.OCCUPIED) {
      throw new BadRequestException(
        'Cannot occupy a table that is out of service',
      );
    }

    table.status = newStatus;

    // Update timestamps based on status
    if (newStatus === TableStatus.OCCUPIED) {
      table.lastOccupiedAt = new Date();
    } else if (newStatus === TableStatus.CLEANING) {
      table.lastCleanedAt = new Date();
    } else if (newStatus === TableStatus.AVAILABLE) {
      // Clear current order when table becomes available
      table.currentOrderId = null as any;
      table.reservationId = null as any;
    }

    return await this.tableRepository.save(table);
  }

  // Server Assignment
  async assignServer(
    id: string,
    assignServerDto: AssignServerDto,
  ): Promise<Table> {
    const table = await this.findOne(id);

    // Verify server exists
    const server = await this.userRepository.findOne({
      where: { id: assignServerDto.assignedServerId },
      relations: ['roles'],
    });

    if (!server) {
      throw new NotFoundException(
        `Server with ID ${assignServerDto.assignedServerId} not found`,
      );
    }

    table.assignedServerId = assignServerDto.assignedServerId;
    table.assignedServer = server;

    return await this.tableRepository.save(table);
  }

  async unassignServer(id: string): Promise<Table> {
    const table = await this.findOne(id);
    table.assignedServerId = null as any;
    table.assignedServer = null as any;

    return await this.tableRepository.save(table);
  }

  // Table Availability
  async checkAvailability(branchId: string, partySize: number): Promise<Table[]> {
    const tables = await this.tableRepository.find({
      where: {
        branchId,
        status: TableStatus.AVAILABLE,
        isActive: true,
      },
      relations: ['section', 'floorPlan'],
      order: { capacity: 'ASC' },
    });

    // Filter tables that can accommodate the party size
    return tables.filter(
      (table) =>
        table.capacity >= partySize &&
        table.minCapacity <= partySize,
    );
  }

  async getAvailableTables(branchId: string): Promise<Table[]> {
    return await this.tableRepository.find({
      where: {
        branchId,
        status: TableStatus.AVAILABLE,
        isActive: true,
      },
      relations: ['section', 'floorPlan', 'assignedServer'],
      order: { tableNumber: 'ASC' },
    });
  }

  // Bulk Operations
  async bulkStatusUpdate(
    tableIds: string[],
    status: TableStatus,
  ): Promise<{ updated: number; tables: Table[] }> {
    const tables = await this.tableRepository.find({
      where: { id: In(tableIds) },
    });

    if (tables.length === 0) {
      throw new NotFoundException('No tables found with provided IDs');
    }

    // Update status for all tables
    tables.forEach((table) => {
      table.status = status;
      if (status === TableStatus.OCCUPIED) {
        table.lastOccupiedAt = new Date();
      } else if (status === TableStatus.CLEANING) {
        table.lastCleanedAt = new Date();
      }
    });

    const updatedTables = await this.tableRepository.save(tables);

    return {
      updated: updatedTables.length,
      tables: updatedTables,
    };
  }

  // Table Statistics
  async getTableStats(branchId: string): Promise<any> {
    const queryBuilder = this.tableRepository
      .createQueryBuilder('table')
      .where('table.branchId = :branchId', { branchId });

    const total = await queryBuilder.getCount();
    const active = await queryBuilder
      .clone()
      .andWhere('table.isActive = :isActive', { isActive: true })
      .getCount();

    // Count by status
    const statusCounts = await this.tableRepository
      .createQueryBuilder('table')
      .select('table.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('table.branchId = :branchId', { branchId })
      .andWhere('table.isActive = :isActive', { isActive: true })
      .groupBy('table.status')
      .getRawMany();

    // Total capacity
    const capacityStats = await this.tableRepository
      .createQueryBuilder('table')
      .select('SUM(table.capacity)', 'totalCapacity')
      .addSelect('AVG(table.capacity)', 'averageCapacity')
      .where('table.branchId = :branchId', { branchId })
      .andWhere('table.isActive = :isActive', { isActive: true })
      .getRawOne();

    return {
      total,
      active,
      inactive: total - active,
      byStatus: statusCounts.reduce((acc, item) => {
        acc[item.status] = parseInt(item.count);
        return acc;
      }, {}),
      capacity: {
        total: parseInt(capacityStats.totalCapacity) || 0,
        average: parseFloat(capacityStats.averageCapacity) || 0,
      },
    };
  }

  // Get tables by server
  async getTablesByServer(serverId: string): Promise<Table[]> {
    return await this.tableRepository.find({
      where: { assignedServerId: serverId, isActive: true },
      relations: ['branch', 'section', 'floorPlan'],
      order: { tableNumber: 'ASC' },
    });
  }

  // Get tables by section
  async getTablesBySection(sectionId: string): Promise<Table[]> {
    return await this.tableRepository.find({
      where: { sectionId, isActive: true },
      relations: ['branch', 'assignedServer'],
      order: { tableNumber: 'ASC' },
    });
  }

  // Get tables by floor plan
  async getTablesByFloorPlan(floorPlanId: string): Promise<Table[]> {
    return await this.tableRepository.find({
      where: { floorPlanId, isActive: true },
      relations: ['branch', 'section', 'assignedServer'],
      order: { tableNumber: 'ASC' },
    });
  }
}
