import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Branch } from './entities/branch.entity';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { FilterBranchDto } from './dto/filter-branch.dto';
import {
  UpdateOperatingHoursDto,
  UpdateBranchSettingsDto,
} from './dto/update-operating-hours.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class BranchesService {
  constructor(
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createBranchDto: CreateBranchDto): Promise<Branch> {
    // Check if code already exists
    const existingCode = await this.branchRepository.findOne({
      where: { code: createBranchDto.code },
    });
    if (existingCode) {
      throw new BadRequestException(
        `Branch with code ${createBranchDto.code} already exists`,
      );
    }

    // Initialize settings if not provided
    if (!createBranchDto.settings) {
      createBranchDto.settings = {
        timezone: 'UTC',
        currency: 'USD',
        taxRate: 0,
      };
    }

    const branch = this.branchRepository.create(createBranchDto);
    return await this.branchRepository.save(branch);
  }

  async findAll(filterDto: FilterBranchDto): Promise<{
    data: Branch[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const {
      page = 1,
      limit = 10,
      search,
      city,
      state,
      country,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = filterDto;

    const queryBuilder = this.branchRepository
      .createQueryBuilder('branch')
      .leftJoinAndSelect('branch.manager', 'manager');

    // Search filter
    if (search) {
      queryBuilder.andWhere(
        '(branch.name ILIKE :search OR branch.code ILIKE :search OR branch.city ILIKE :search OR branch.state ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // City filter
    if (city) {
      queryBuilder.andWhere('branch.city = :city', { city });
    }

    // State filter
    if (state) {
      queryBuilder.andWhere('branch.state = :state', { state });
    }

    // Country filter
    if (country) {
      queryBuilder.andWhere('branch.country = :country', { country });
    }

    // Active status filter
    if (isActive !== undefined) {
      queryBuilder.andWhere('branch.isActive = :isActive', { isActive });
    }

    // Get total count before pagination
    const total = await queryBuilder.getCount();

    // Sorting
    const allowedSortFields = ['name', 'code', 'city', 'createdAt'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    queryBuilder.orderBy(`branch.${sortField}`, sortOrder);

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

  async findOne(id: string): Promise<Branch> {
    const branch = await this.branchRepository.findOne({
      where: { id },
      relations: ['manager'],
    });

    if (!branch) {
      throw new NotFoundException(`Branch with ID ${id} not found`);
    }

    return branch;
  }

  async findByCode(code: string): Promise<Branch> {
    const branch = await this.branchRepository.findOne({
      where: { code },
      relations: ['manager'],
    });

    if (!branch) {
      throw new NotFoundException(`Branch with code ${code} not found`);
    }

    return branch;
  }

  async update(id: string, updateBranchDto: UpdateBranchDto): Promise<Branch> {
    const branch = await this.findOne(id);

    // Check if code is being updated and if it already exists
    if (updateBranchDto.code && updateBranchDto.code !== branch.code) {
      const existingCode = await this.branchRepository.findOne({
        where: { code: updateBranchDto.code },
      });
      if (existingCode) {
        throw new BadRequestException(
          `Branch with code ${updateBranchDto.code} already exists`,
        );
      }
    }

    Object.assign(branch, updateBranchDto);
    return await this.branchRepository.save(branch);
  }

  async remove(id: string): Promise<void> {
    const branch = await this.findOne(id);
    await this.branchRepository.remove(branch);
  }

  // Operating Hours Management
  async updateOperatingHours(
    id: string,
    updateOperatingHoursDto: UpdateOperatingHoursDto,
  ): Promise<Branch> {
    const branch = await this.findOne(id);

    branch.settings = {
      ...branch.settings,
      operatingHours: updateOperatingHoursDto.operatingHours,
    };

    return await this.branchRepository.save(branch);
  }

  async getOperatingHours(id: string): Promise<any> {
    const branch = await this.findOne(id);

    return {
      branchId: branch.id,
      branchName: branch.name,
      operatingHours: branch.settings?.operatingHours || {},
    };
  }

  // Branch Settings Management
  async updateSettings(
    id: string,
    updateBranchSettingsDto: UpdateBranchSettingsDto,
  ): Promise<Branch> {
    const branch = await this.findOne(id);

    branch.settings = {
      ...branch.settings,
      ...updateBranchSettingsDto.settings,
    };

    return await this.branchRepository.save(branch);
  }

  async getSettings(id: string): Promise<any> {
    const branch = await this.findOne(id);

    return {
      branchId: branch.id,
      branchName: branch.name,
      settings: branch.settings || {},
    };
  }

  // Branch Performance Statistics
  async getBranchStats(id: string): Promise<any> {
    const branch = await this.findOne(id);

    try {
      // Try to get stats with relations
      const salesStats = await this.branchRepository
        .createQueryBuilder('branch')
        .leftJoin('branch.sales', 'sales')
        .where('branch.id = :id', { id })
        .select([
          'COUNT(DISTINCT sales.id) as totalSales',
          'COALESCE(SUM(sales.total), 0) as totalRevenue',
          'COALESCE(AVG(sales.total), 0) as averageSaleValue',
        ])
        .getRawOne();

      const invoiceStats = await this.branchRepository
        .createQueryBuilder('branch')
        .leftJoin('branch.invoices', 'invoices')
        .where('branch.id = :id', { id })
        .select([
          'COUNT(DISTINCT invoices.id) as totalInvoices',
          'COALESCE(SUM(invoices.total), 0) as totalInvoiceAmount',
        ])
        .getRawOne();

      return {
        branchId: branch.id,
        branchName: branch.name,
        branchCode: branch.code,
        isActive: branch.isActive,
        manager: branch.manager
          ? {
              id: branch.manager.id,
              name: `${branch.manager.firstName} ${branch.manager.lastName}`,
            }
          : null,
        salesStats: {
          totalSales: parseInt(salesStats.totalSales) || 0,
          totalRevenue: parseFloat(salesStats.totalRevenue) || 0,
          averageSaleValue: parseFloat(salesStats.averageSaleValue) || 0,
        },
        invoiceStats: {
          totalInvoices: parseInt(invoiceStats.totalInvoices) || 0,
          totalInvoiceAmount: parseFloat(invoiceStats.totalInvoiceAmount) || 0,
        },
      };
    } catch (error) {
      // If relations don't exist yet, return basic stats
      return {
        branchId: branch.id,
        branchName: branch.name,
        branchCode: branch.code,
        isActive: branch.isActive,
        manager: branch.manager
          ? {
              id: branch.manager.id,
              name: `${branch.manager.firstName} ${branch.manager.lastName}`,
            }
          : null,
        salesStats: {
          totalSales: 0,
          totalRevenue: 0,
          averageSaleValue: 0,
        },
        invoiceStats: {
          totalInvoices: 0,
          totalInvoiceAmount: 0,
        },
      };
    }
  }

  // Get overall branch statistics
  async getOverallStats(): Promise<any> {
    const totalBranches = await this.branchRepository.count();
    const activeBranches = await this.branchRepository.count({
      where: { isActive: true },
    });

    const branchesByCity = await this.branchRepository
      .createQueryBuilder('branch')
      .select('branch.city', 'city')
      .addSelect('COUNT(*)', 'count')
      .groupBy('branch.city')
      .getRawMany();

    const branchesByState = await this.branchRepository
      .createQueryBuilder('branch')
      .select('branch.state', 'state')
      .addSelect('COUNT(*)', 'count')
      .groupBy('branch.state')
      .getRawMany();

    return {
      totalBranches,
      activeBranches,
      inactiveBranches: totalBranches - activeBranches,
      branchesByCity,
      branchesByState,
    };
  }

  // Assign Manager to Branch
  async assignManager(branchId: string, managerId: string): Promise<Branch> {
    const branch = await this.findOne(branchId);

    // Verify manager exists and has appropriate role
    const manager = await this.userRepository.findOne({
      where: { id: managerId },
      relations: ['roles'],
    });

    if (!manager) {
      throw new NotFoundException(`User with ID ${managerId} not found`);
    }

    // Check if user has manager or admin role
    const hasManagerRole = manager.roles?.some(
      (role) => role.code === 'manager' || role.code === 'admin',
    );

    if (!hasManagerRole) {
      throw new BadRequestException('User does not have manager privileges');
    }

    branch.managerId = managerId;
    branch.manager = manager;

    return await this.branchRepository.save(branch);
  }

  // Bulk Status Update
  async bulkStatusUpdate(
    branchIds: string[],
    isActive: boolean,
  ): Promise<{ updated: number; branches: Branch[] }> {
    const branches = await this.branchRepository.find({
      where: { id: In(branchIds) },
    });

    if (branches.length === 0) {
      throw new NotFoundException('No branches found with provided IDs');
    }

    // Update status for all branches
    branches.forEach((branch) => {
      branch.isActive = isActive;
    });

    const updatedBranches = await this.branchRepository.save(branches);

    return {
      updated: updatedBranches.length,
      branches: updatedBranches,
    };
  }

  // Get Consolidated Performance
  async getPerformance(): Promise<any> {
    const branches = await this.branchRepository.find({
      relations: ['manager'],
    });

    const performanceData = await Promise.all(
      branches.map(async (branch) => {
        try {
          const stats = await this.getBranchStats(branch.id);
          return {
            branchId: branch.id,
            branchName: branch.name,
            branchCode: branch.code,
            isActive: branch.isActive,
            manager: stats.manager,
            performance: {
              totalSales: stats.salesStats.totalSales,
              totalRevenue: stats.salesStats.totalRevenue,
              averageSaleValue: stats.salesStats.averageSaleValue,
              totalInvoices: stats.invoiceStats.totalInvoices,
              totalInvoiceAmount: stats.invoiceStats.totalInvoiceAmount,
            },
          };
        } catch (error) {
          return {
            branchId: branch.id,
            branchName: branch.name,
            branchCode: branch.code,
            isActive: branch.isActive,
            manager: branch.manager
              ? {
                  id: branch.manager.id,
                  name: `${branch.manager.firstName} ${branch.manager.lastName}`,
                }
              : null,
            performance: {
              totalSales: 0,
              totalRevenue: 0,
              averageSaleValue: 0,
              totalInvoices: 0,
              totalInvoiceAmount: 0,
            },
          };
        }
      }),
    );

    // Calculate aggregate metrics
    const aggregateMetrics = performanceData.reduce(
      (acc, branch) => ({
        totalSales: acc.totalSales + branch.performance.totalSales,
        totalRevenue: acc.totalRevenue + branch.performance.totalRevenue,
        totalInvoices: acc.totalInvoices + branch.performance.totalInvoices,
        totalInvoiceAmount:
          acc.totalInvoiceAmount + branch.performance.totalInvoiceAmount,
      }),
      {
        totalSales: 0,
        totalRevenue: 0,
        totalInvoices: 0,
        totalInvoiceAmount: 0,
      },
    );

    // Sort by revenue
    performanceData.sort(
      (a, b) => b.performance.totalRevenue - a.performance.totalRevenue,
    );

    return {
      branches: performanceData,
      aggregateMetrics,
      totalBranches: branches.length,
      activeBranches: branches.filter((b) => b.isActive).length,
    };
  }

  // Compare Branches
  async compareBranches(branchIds: string[]): Promise<any> {
    const branches = await this.branchRepository.find({
      where: { id: In(branchIds) },
      relations: ['manager'],
    });

    if (branches.length < 2) {
      throw new BadRequestException('At least 2 branches required for comparison');
    }

    const comparisonData = await Promise.all(
      branches.map(async (branch) => {
        try {
          const stats = await this.getBranchStats(branch.id);
          return {
            branchId: branch.id,
            branchName: branch.name,
            branchCode: branch.code,
            location: `${branch.city}, ${branch.state}`,
            isActive: branch.isActive,
            manager: stats.manager,
            metrics: {
              totalSales: stats.salesStats.totalSales,
              totalRevenue: stats.salesStats.totalRevenue,
              averageSaleValue: stats.salesStats.averageSaleValue,
              totalInvoices: stats.invoiceStats.totalInvoices,
              totalInvoiceAmount: stats.invoiceStats.totalInvoiceAmount,
            },
          };
        } catch (error) {
          return {
            branchId: branch.id,
            branchName: branch.name,
            branchCode: branch.code,
            location: `${branch.city}, ${branch.state}`,
            isActive: branch.isActive,
            manager: branch.manager
              ? {
                  id: branch.manager.id,
                  name: `${branch.manager.firstName} ${branch.manager.lastName}`,
                }
              : null,
            metrics: {
              totalSales: 0,
              totalRevenue: 0,
              averageSaleValue: 0,
              totalInvoices: 0,
              totalInvoiceAmount: 0,
            },
          };
        }
      }),
    );

    // Calculate comparison insights
    const revenues = comparisonData.map((b) => b.metrics.totalRevenue);
    const maxRevenue = Math.max(...revenues);
    const minRevenue = Math.min(...revenues);

    return {
      branches: comparisonData,
      insights: {
        topPerformer: comparisonData.find(
          (b) => b.metrics.totalRevenue === maxRevenue,
        ),
        lowestPerformer: comparisonData.find(
          (b) => b.metrics.totalRevenue === minRevenue,
        ),
        averageRevenue:
          revenues.reduce((sum, val) => sum + val, 0) / revenues.length,
        revenueDifference: maxRevenue - minRevenue,
      },
    };
  }

  // Clone Settings
  async cloneSettings(
    sourceBranchId: string,
    targetBranchId: string,
  ): Promise<Branch> {
    const sourceBranch = await this.findOne(sourceBranchId);
    const targetBranch = await this.findOne(targetBranchId);

    if (!sourceBranch.settings) {
      throw new BadRequestException('Source branch has no settings to clone');
    }

    // Clone settings (deep copy)
    targetBranch.settings = JSON.parse(JSON.stringify(sourceBranch.settings));

    return await this.branchRepository.save(targetBranch);
  }
}
