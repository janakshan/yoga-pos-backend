import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FloorPlan } from '../entities/floor-plan.entity';
import { Branch } from '../../branches/entities/branch.entity';
import {
  CreateFloorPlanDto,
  UpdateFloorPlanDto,
  FilterFloorPlanDto,
} from '../dto';

@Injectable()
export class FloorPlanService {
  constructor(
    @InjectRepository(FloorPlan)
    private readonly floorPlanRepository: Repository<FloorPlan>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
  ) {}

  async create(createFloorPlanDto: CreateFloorPlanDto): Promise<FloorPlan> {
    // Verify branch exists
    const branch = await this.branchRepository.findOne({
      where: { id: createFloorPlanDto.branchId },
    });
    if (!branch) {
      throw new NotFoundException(
        `Branch with ID ${createFloorPlanDto.branchId} not found`,
      );
    }

    // Check if floor plan name already exists for this branch
    const existingFloorPlan = await this.floorPlanRepository.findOne({
      where: {
        branchId: createFloorPlanDto.branchId,
        name: createFloorPlanDto.name,
      },
    });
    if (existingFloorPlan) {
      throw new BadRequestException(
        `Floor plan "${createFloorPlanDto.name}" already exists in this branch`,
      );
    }

    // If this is marked as default, unset other defaults
    if (createFloorPlanDto.isDefault) {
      await this.unsetDefaultFloorPlans(createFloorPlanDto.branchId);
    }

    const floorPlan = this.floorPlanRepository.create(createFloorPlanDto);
    return await this.floorPlanRepository.save(floorPlan);
  }

  async findAll(filterDto: FilterFloorPlanDto): Promise<{
    data: FloorPlan[];
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
      isActive,
      isDefault,
      sortBy = 'displayOrder',
      sortOrder = 'ASC',
    } = filterDto;

    const queryBuilder = this.floorPlanRepository
      .createQueryBuilder('floorPlan')
      .leftJoinAndSelect('floorPlan.branch', 'branch')
      .leftJoinAndSelect('floorPlan.tables', 'tables')
      .leftJoinAndSelect('floorPlan.sections', 'sections');

    // Search filter
    if (search) {
      queryBuilder.andWhere(
        '(floorPlan.name ILIKE :search OR floorPlan.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Branch filter
    if (branchId) {
      queryBuilder.andWhere('floorPlan.branchId = :branchId', { branchId });
    }

    // Active status filter
    if (isActive !== undefined) {
      queryBuilder.andWhere('floorPlan.isActive = :isActive', { isActive });
    }

    // Default status filter
    if (isDefault !== undefined) {
      queryBuilder.andWhere('floorPlan.isDefault = :isDefault', { isDefault });
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
    queryBuilder.orderBy(`floorPlan.${sortField}`, sortOrder);

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

  async findOne(id: string): Promise<FloorPlan> {
    const floorPlan = await this.floorPlanRepository.findOne({
      where: { id },
      relations: ['branch', 'tables', 'sections'],
    });

    if (!floorPlan) {
      throw new NotFoundException(`Floor plan with ID ${id} not found`);
    }

    return floorPlan;
  }

  async findByName(branchId: string, name: string): Promise<FloorPlan> {
    const floorPlan = await this.floorPlanRepository.findOne({
      where: { branchId, name },
      relations: ['branch', 'tables', 'sections'],
    });

    if (!floorPlan) {
      throw new NotFoundException(
        `Floor plan "${name}" not found in this branch`,
      );
    }

    return floorPlan;
  }

  async update(
    id: string,
    updateFloorPlanDto: UpdateFloorPlanDto,
  ): Promise<FloorPlan> {
    const floorPlan = await this.findOne(id);

    // Check if name is being updated and if it already exists
    if (updateFloorPlanDto.name && updateFloorPlanDto.name !== floorPlan.name) {
      const existingFloorPlan = await this.floorPlanRepository.findOne({
        where: {
          branchId: floorPlan.branchId,
          name: updateFloorPlanDto.name,
        },
      });
      if (existingFloorPlan) {
        throw new BadRequestException(
          `Floor plan "${updateFloorPlanDto.name}" already exists in this branch`,
        );
      }
    }

    // If this is being set as default, unset other defaults
    if (updateFloorPlanDto.isDefault && !floorPlan.isDefault) {
      await this.unsetDefaultFloorPlans(floorPlan.branchId);
    }

    Object.assign(floorPlan, updateFloorPlanDto);
    return await this.floorPlanRepository.save(floorPlan);
  }

  async remove(id: string): Promise<void> {
    const floorPlan = await this.findOne(id);

    // Check if this is the default floor plan
    if (floorPlan.isDefault) {
      throw new BadRequestException(
        'Cannot delete the default floor plan. Please set another floor plan as default first.',
      );
    }

    await this.floorPlanRepository.remove(floorPlan);
  }

  // Floor Plan Management
  async setAsDefault(id: string): Promise<FloorPlan> {
    const floorPlan = await this.findOne(id);

    // Unset other defaults in the same branch
    await this.unsetDefaultFloorPlans(floorPlan.branchId);

    floorPlan.isDefault = true;
    return await this.floorPlanRepository.save(floorPlan);
  }

  async getDefaultFloorPlan(branchId: string): Promise<FloorPlan> {
    const floorPlan = await this.floorPlanRepository.findOne({
      where: { branchId, isDefault: true, isActive: true },
      relations: ['tables', 'sections'],
    });

    if (!floorPlan) {
      throw new NotFoundException(
        'No default floor plan found for this branch',
      );
    }

    return floorPlan;
  }

  async getFloorPlansByBranch(branchId: string): Promise<FloorPlan[]> {
    return await this.floorPlanRepository.find({
      where: { branchId, isActive: true },
      relations: ['tables', 'sections'],
      order: { displayOrder: 'ASC' },
    });
  }

  async duplicateFloorPlan(
    id: string,
    newName: string,
  ): Promise<FloorPlan> {
    const sourceFloorPlan = await this.findOne(id);

    // Check if new name already exists
    const existingFloorPlan = await this.floorPlanRepository.findOne({
      where: {
        branchId: sourceFloorPlan.branchId,
        name: newName,
      },
    });
    if (existingFloorPlan) {
      throw new BadRequestException(
        `Floor plan "${newName}" already exists in this branch`,
      );
    }

    // Create a copy of the floor plan
    const duplicateFloorPlan = this.floorPlanRepository.create({
      name: newName,
      description: sourceFloorPlan.description,
      branchId: sourceFloorPlan.branchId,
      displayOrder: sourceFloorPlan.displayOrder + 1,
      layout: sourceFloorPlan.layout,
      isActive: true,
      isDefault: false, // Duplicates should never be default
      settings: sourceFloorPlan.settings,
    });

    return await this.floorPlanRepository.save(duplicateFloorPlan);
  }

  async updateLayout(
    id: string,
    layout: any,
  ): Promise<FloorPlan> {
    const floorPlan = await this.findOne(id);
    floorPlan.layout = layout;
    return await this.floorPlanRepository.save(floorPlan);
  }

  async getFloorPlanStats(id: string): Promise<any> {
    const floorPlan = await this.findOne(id);

    const tableStats = {
      total: floorPlan.tables?.length || 0,
      active: floorPlan.tables?.filter((t) => t.isActive).length || 0,
      byStatus: {},
      totalCapacity: 0,
    };

    if (floorPlan.tables) {
      // Count by status
      floorPlan.tables.forEach((table) => {
        if (table.isActive) {
          tableStats.byStatus[table.status] =
            (tableStats.byStatus[table.status] || 0) + 1;
          tableStats.totalCapacity += table.capacity;
        }
      });
    }

    const sectionStats = {
      total: floorPlan.sections?.length || 0,
      active: floorPlan.sections?.filter((s) => s.isActive).length || 0,
    };

    return {
      floorPlanId: floorPlan.id,
      floorPlanName: floorPlan.name,
      isDefault: floorPlan.isDefault,
      isActive: floorPlan.isActive,
      tables: tableStats,
      sections: sectionStats,
    };
  }

  // Helper method to unset all default floor plans in a branch
  private async unsetDefaultFloorPlans(branchId: string): Promise<void> {
    await this.floorPlanRepository.update(
      { branchId, isDefault: true },
      { isDefault: false },
    );
  }
}
