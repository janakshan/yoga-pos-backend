import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { FilterCustomerDto } from './dto/filter-customer.dto';
import {
  UpdateLoyaltyPointsDto,
  UpdateLoyaltyTierDto,
} from './dto/update-loyalty.dto';
import { BulkStatusUpdateDto, UpdatePurchaseStatsDto } from './dto/bulk-operations.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  async create(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    // Check if email already exists
    const existingEmail = await this.customerRepository.findOne({
      where: { email: createCustomerDto.email },
    });
    if (existingEmail) {
      throw new BadRequestException(
        `Customer with email ${createCustomerDto.email} already exists`,
      );
    }

    // Initialize loyalty info if not provided
    if (!createCustomerDto.loyaltyInfo) {
      createCustomerDto.loyaltyInfo = {
        points: 0,
        tier: 'bronze',
        joinDate: new Date().toISOString(),
      };
    }

    const customer = this.customerRepository.create(createCustomerDto);
    return await this.customerRepository.save(customer);
  }

  async findAll(filterDto: FilterCustomerDto): Promise<{
    data: Customer[];
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
      customerType,
      status,
      loyaltyTier,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = filterDto;

    const queryBuilder =
      this.customerRepository.createQueryBuilder('customer');

    // Search filter
    if (search) {
      queryBuilder.andWhere(
        '(customer.firstName ILIKE :search OR customer.lastName ILIKE :search OR customer.email ILIKE :search OR customer.phone ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Customer type filter
    if (customerType) {
      queryBuilder.andWhere('customer.customerType = :customerType', {
        customerType,
      });
    }

    // Status filter
    if (status) {
      queryBuilder.andWhere('customer.status = :status', { status });
    }

    // Loyalty tier filter
    if (loyaltyTier) {
      queryBuilder.andWhere("customer.loyaltyInfo->>'tier' = :loyaltyTier", {
        loyaltyTier,
      });
    }

    // Get total count before pagination
    const total = await queryBuilder.getCount();

    // Sorting
    const allowedSortFields = ['firstName', 'lastName', 'email', 'createdAt'];
    const sortField = allowedSortFields.includes(sortBy)
      ? sortBy
      : 'createdAt';
    queryBuilder.orderBy(`customer.${sortField}`, sortOrder);

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

  async findOne(id: string): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    return customer;
  }

  async findByEmail(email: string): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { email },
    });

    if (!customer) {
      throw new NotFoundException(
        `Customer with email ${email} not found`,
      );
    }

    return customer;
  }

  async update(
    id: string,
    updateCustomerDto: UpdateCustomerDto,
  ): Promise<Customer> {
    const customer = await this.findOne(id);

    // Check if email is being updated and if it already exists
    if (updateCustomerDto.email && updateCustomerDto.email !== customer.email) {
      const existingEmail = await this.customerRepository.findOne({
        where: { email: updateCustomerDto.email },
      });
      if (existingEmail) {
        throw new BadRequestException(
          `Customer with email ${updateCustomerDto.email} already exists`,
        );
      }
    }

    Object.assign(customer, updateCustomerDto);
    return await this.customerRepository.save(customer);
  }

  async remove(id: string): Promise<void> {
    const customer = await this.findOne(id);
    await this.customerRepository.remove(customer);
  }

  // Loyalty Program Management
  async updateLoyaltyPoints(
    id: string,
    updateLoyaltyPointsDto: UpdateLoyaltyPointsDto,
  ): Promise<Customer> {
    const customer = await this.findOne(id);

    const currentPoints = customer.loyaltyInfo?.points || 0;
    const newPoints = currentPoints + updateLoyaltyPointsDto.points;

    if (newPoints < 0) {
      throw new BadRequestException('Loyalty points cannot be negative');
    }

    customer.loyaltyInfo = {
      ...customer.loyaltyInfo,
      points: newPoints,
    };

    return await this.customerRepository.save(customer);
  }

  async updateLoyaltyTier(
    id: string,
    updateLoyaltyTierDto: UpdateLoyaltyTierDto,
  ): Promise<Customer> {
    const customer = await this.findOne(id);

    customer.loyaltyInfo = {
      ...customer.loyaltyInfo,
      tier: updateLoyaltyTierDto.tier,
    };

    return await this.customerRepository.save(customer);
  }

  async getLoyaltyInfo(id: string): Promise<any> {
    const customer = await this.findOne(id);
    return {
      customerId: customer.id,
      customerName: `${customer.firstName} ${customer.lastName}`,
      loyaltyInfo: customer.loyaltyInfo,
    };
  }

  // Purchase History (requires relations to be queried)
  async getPurchaseHistory(
    id: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<any> {
    const customer = await this.findOne(id);

    // This will be implemented once we have proper relations
    // For now, we return the structure
    const queryBuilder = this.customerRepository
      .createQueryBuilder('customer')
      .leftJoinAndSelect('customer.sales', 'sales')
      .leftJoinAndSelect('customer.invoices', 'invoices')
      .where('customer.id = :id', { id })
      .orderBy('sales.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    try {
      const customerWithHistory = await queryBuilder.getOne();

      return {
        customerId: customer.id,
        customerName: `${customer.firstName} ${customer.lastName}`,
        purchases: customerWithHistory?.['sales'] || [],
        invoices: customerWithHistory?.['invoices'] || [],
        meta: {
          page,
          limit,
        },
      };
    } catch (error) {
      // If relations don't exist yet, return empty
      return {
        customerId: customer.id,
        customerName: `${customer.firstName} ${customer.lastName}`,
        purchases: [],
        invoices: [],
        meta: {
          page,
          limit,
        },
      };
    }
  }

  // Customer Statistics
  async getCustomerStats(id: string): Promise<any> {
    const customer = await this.findOne(id);

    try {
      // Try to get stats with relations
      const stats = await this.customerRepository
        .createQueryBuilder('customer')
        .leftJoin('customer.sales', 'sales')
        .leftJoin('customer.invoices', 'invoices')
        .where('customer.id = :id', { id })
        .select([
          'COUNT(DISTINCT sales.id) as totalPurchases',
          'COALESCE(SUM(sales.total), 0) as totalSpent',
          'COALESCE(AVG(sales.total), 0) as averageOrderValue',
        ])
        .getRawOne();

      return {
        customerId: customer.id,
        customerName: `${customer.firstName} ${customer.lastName}`,
        customerType: customer.customerType,
        loyaltyTier: customer.loyaltyInfo?.tier || 'bronze',
        loyaltyPoints: customer.loyaltyInfo?.points || 0,
        totalPurchases: parseInt(stats.totalPurchases) || 0,
        totalSpent: parseFloat(stats.totalSpent) || 0,
        averageOrderValue: parseFloat(stats.averageOrderValue) || 0,
        memberSince: customer.createdAt,
        status: customer.status,
      };
    } catch (error) {
      // If relations don't exist yet, return basic stats
      return {
        customerId: customer.id,
        customerName: `${customer.firstName} ${customer.lastName}`,
        customerType: customer.customerType,
        loyaltyTier: customer.loyaltyInfo?.tier || 'bronze',
        loyaltyPoints: customer.loyaltyInfo?.points || 0,
        totalPurchases: 0,
        totalSpent: 0,
        averageOrderValue: 0,
        memberSince: customer.createdAt,
        status: customer.status,
      };
    }
  }

  // Get overall customer statistics
  async getOverallStats(): Promise<any> {
    const totalCustomers = await this.customerRepository.count();
    const activeCustomers = await this.customerRepository.count({
      where: { status: 'active' },
    });

    const customersByType = await this.customerRepository
      .createQueryBuilder('customer')
      .select('customer.customerType', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('customer.customerType')
      .getRawMany();

    const customersByTier = await this.customerRepository
      .createQueryBuilder('customer')
      .select("customer.loyaltyInfo->>'tier'", 'tier')
      .addSelect('COUNT(*)', 'count')
      .groupBy("customer.loyaltyInfo->>'tier'")
      .getRawMany();

    return {
      totalCustomers,
      activeCustomers,
      inactiveCustomers: totalCustomers - activeCustomers,
      customersByType,
      customersByTier,
    };
  }

  // Update purchase stats
  async updatePurchaseStats(id: string, updateStatsDto: UpdatePurchaseStatsDto): Promise<Customer> {
    const customer = await this.findOne(id);

    const currentTotal = Number(customer.totalPurchases) || 0;
    customer.totalPurchases = currentTotal + Number(updateStatsDto.purchaseAmount);

    return await this.customerRepository.save(customer);
  }

  // Bulk status update
  async bulkUpdateStatus(bulkUpdateDto: BulkStatusUpdateDto): Promise<{
    updated: number;
    customerIds: string[];
  }> {
    const customers = await this.customerRepository.findBy({
      id: In(bulkUpdateDto.customerIds),
    });

    if (customers.length === 0) {
      throw new BadRequestException('No valid customer IDs provided');
    }

    // Update all customers
    await this.customerRepository.update(
      { id: In(bulkUpdateDto.customerIds) },
      { status: bulkUpdateDto.status }
    );

    return {
      updated: customers.length,
      customerIds: customers.map(c => c.id),
    };
  }

  // Get detailed purchase statistics
  async getDetailedPurchaseStats(customerId: string): Promise<any> {
    const customer = await this.findOne(customerId);

    try {
      // Try to get detailed stats with relations
      const purchaseData = await this.customerRepository
        .createQueryBuilder('customer')
        .leftJoin('customer.sales', 'sales')
        .where('customer.id = :id', { id: customerId })
        .select([
          'COUNT(DISTINCT sales.id) as totalOrders',
          'COALESCE(SUM(sales.total), 0) as totalSpent',
          'COALESCE(AVG(sales.total), 0) as averageOrderValue',
          'COALESCE(MAX(sales.total), 0) as largestPurchase',
          'COALESCE(MIN(sales.total), 0) as smallestPurchase',
          'MAX(sales.createdAt) as lastPurchaseDate',
        ])
        .getRawOne();

      return {
        customerId: customer.id,
        customerName: `${customer.firstName} ${customer.lastName}`,
        stats: {
          totalOrders: parseInt(purchaseData.totalOrders) || 0,
          totalSpent: parseFloat(purchaseData.totalSpent) || 0,
          averageOrderValue: parseFloat(purchaseData.averageOrderValue) || 0,
          largestPurchase: parseFloat(purchaseData.largestPurchase) || 0,
          smallestPurchase: parseFloat(purchaseData.smallestPurchase) || 0,
          lastPurchaseDate: purchaseData.lastPurchaseDate,
          lifetimeValue: parseFloat(purchaseData.totalSpent) || 0,
          customerSince: customer.createdAt,
        },
        loyaltyInfo: customer.loyaltyInfo,
        creditBalance: customer.creditBalance,
        storeCreditBalance: customer.storeCreditBalance,
      };
    } catch (error) {
      // If relations don't exist yet, return basic stats
      return {
        customerId: customer.id,
        customerName: `${customer.firstName} ${customer.lastName}`,
        stats: {
          totalOrders: 0,
          totalSpent: 0,
          averageOrderValue: 0,
          largestPurchase: 0,
          smallestPurchase: 0,
          lastPurchaseDate: null,
          lifetimeValue: 0,
          customerSince: customer.createdAt,
        },
        loyaltyInfo: customer.loyaltyInfo,
        creditBalance: customer.creditBalance,
        storeCreditBalance: customer.storeCreditBalance,
      };
    }
  }
}
