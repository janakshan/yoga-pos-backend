import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TableSection } from '../entities/table-section.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { FloorPlan } from '../entities/floor-plan.entity';
import {
  CreateTableSectionDto,
  UpdateTableSectionDto,
  FilterTableSectionDto,
} from '../dto';

@Injectable()
export class TableSectionService {
  constructor(
    @InjectRepository(TableSection)
    private readonly tableSectionRepository: Repository<TableSection>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(FloorPlan)
    private readonly floorPlanRepository: Repository<FloorPlan>,
  ) {}

  async create(
    createTableSectionDto: CreateTableSectionDto,
  ): Promise<TableSection> {
    // Verify branch exists
    const branch = await this.branchRepository.findOne({
      where: { id: createTableSectionDto.branchId },
    });
    if (!branch) {
      throw new NotFoundException(
        `Branch with ID ${createTableSectionDto.branchId} not found`,
      );
    }

    // Check if section name already exists for this branch
    const existingSection = await this.tableSectionRepository.findOne({
      where: {
        branchId: createTableSectionDto.branchId,
        name: createTableSectionDto.name,
      },
    });
    if (existingSection) {
      throw new BadRequestException(
        `Section "${createTableSectionDto.name}" already exists in this branch`,
      );
    }

    // Verify floor plan if provided
    if (createTableSectionDto.floorPlanId) {
      const floorPlan = await this.floorPlanRepository.findOne({
        where: { id: createTableSectionDto.floorPlanId },
      });
      if (!floorPlan) {
        throw new NotFoundException(
          `Floor plan with ID ${createTableSectionDto.floorPlanId} not found`,
        );
      }
    }

    const section = this.tableSectionRepository.create(createTableSectionDto);
    return await this.tableSectionRepository.save(section);
  }

  async findAll(filterDto: FilterTableSectionDto): Promise<{
    data: TableSection[];
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
      isActive,
      sortBy = 'displayOrder',
      sortOrder = 'ASC',
    } = filterDto;

    const queryBuilder = this.tableSectionRepository
      .createQueryBuilder('section')
      .leftJoinAndSelect('section.branch', 'branch')
      .leftJoinAndSelect('section.floorPlan', 'floorPlan')
      .leftJoinAndSelect('section.tables', 'tables');

    // Search filter
    if (search) {
      queryBuilder.andWhere(
        '(section.name ILIKE :search OR section.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Branch filter
    if (branchId) {
      queryBuilder.andWhere('section.branchId = :branchId', { branchId });
    }

    // Floor plan filter
    if (floorPlanId) {
      queryBuilder.andWhere('section.floorPlanId = :floorPlanId', {
        floorPlanId,
      });
    }

    // Active status filter
    if (isActive !== undefined) {
      queryBuilder.andWhere('section.isActive = :isActive', { isActive });
    }

    // Get total count before pagination
    const total = await queryBuilder.getCount();

    // Sorting
    const allowedSortFields = [
      'name',
      'displayOrder',
      'createdAt',
      'updatedAt',
    ];
    const sortField = allowedSortFields.includes(sortBy)
      ? sortBy
      : 'displayOrder';
    queryBuilder.orderBy(`section.${sortField}`, sortOrder);

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

  async findOne(id: string): Promise<TableSection> {
    const section = await this.tableSectionRepository.findOne({
      where: { id },
      relations: ['branch', 'floorPlan', 'tables'],
    });

    if (!section) {
      throw new NotFoundException(`Section with ID ${id} not found`);
    }

    return section;
  }

  async findByName(branchId: string, name: string): Promise<TableSection> {
    const section = await this.tableSectionRepository.findOne({
      where: { branchId, name },
      relations: ['branch', 'floorPlan', 'tables'],
    });

    if (!section) {
      throw new NotFoundException(
        `Section "${name}" not found in this branch`,
      );
    }

    return section;
  }

  async update(
    id: string,
    updateTableSectionDto: UpdateTableSectionDto,
  ): Promise<TableSection> {
    const section = await this.findOne(id);

    // Check if name is being updated and if it already exists
    if (
      updateTableSectionDto.name &&
      updateTableSectionDto.name !== section.name
    ) {
      const existingSection = await this.tableSectionRepository.findOne({
        where: {
          branchId: section.branchId,
          name: updateTableSectionDto.name,
        },
      });
      if (existingSection) {
        throw new BadRequestException(
          `Section "${updateTableSectionDto.name}" already exists in this branch`,
        );
      }
    }

    // Verify floor plan if provided
    if (updateTableSectionDto.floorPlanId) {
      const floorPlan = await this.floorPlanRepository.findOne({
        where: { id: updateTableSectionDto.floorPlanId },
      });
      if (!floorPlan) {
        throw new NotFoundException(
          `Floor plan with ID ${updateTableSectionDto.floorPlanId} not found`,
        );
      }
    }

    Object.assign(section, updateTableSectionDto);
    return await this.tableSectionRepository.save(section);
  }

  async remove(id: string): Promise<void> {
    const section = await this.findOne(id);

    // Check if section has active tables
    if (section.tables && section.tables.length > 0) {
      const activeTables = section.tables.filter((t) => t.isActive);
      if (activeTables.length > 0) {
        throw new BadRequestException(
          `Cannot delete section with ${activeTables.length} active table(s). Please reassign or deactivate the tables first.`,
        );
      }
    }

    await this.tableSectionRepository.remove(section);
  }

  // Section Management
  async getSectionsByBranch(branchId: string): Promise<TableSection[]> {
    return await this.tableSectionRepository.find({
      where: { branchId, isActive: true },
      relations: ['floorPlan', 'tables'],
      order: { displayOrder: 'ASC' },
    });
  }

  async getSectionsByFloorPlan(floorPlanId: string): Promise<TableSection[]> {
    return await this.tableSectionRepository.find({
      where: { floorPlanId, isActive: true },
      relations: ['tables'],
      order: { displayOrder: 'ASC' },
    });
  }

  async getSectionStats(id: string): Promise<any> {
    const section = await this.findOne(id);

    const tableStats = {
      total: section.tables?.length || 0,
      active: section.tables?.filter((t) => t.isActive).length || 0,
      byStatus: {},
      totalCapacity: 0,
    };

    if (section.tables) {
      // Count by status
      section.tables.forEach((table) => {
        if (table.isActive) {
          tableStats.byStatus[table.status] =
            (tableStats.byStatus[table.status] || 0) + 1;
          tableStats.totalCapacity += table.capacity;
        }
      });
    }

    return {
      sectionId: section.id,
      sectionName: section.name,
      color: section.color,
      isActive: section.isActive,
      floorPlan: section.floorPlan
        ? {
            id: section.floorPlan.id,
            name: section.floorPlan.name,
          }
        : null,
      tables: tableStats,
      settings: section.settings,
    };
  }
}
