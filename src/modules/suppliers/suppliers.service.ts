import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Supplier } from './entities/supplier.entity';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { FilterSupplierDto } from './dto/filter-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private suppliersRepository: Repository<Supplier>,
  ) {}

  async create(createSupplierDto: CreateSupplierDto): Promise<Supplier> {
    // Check if supplier code already exists
    const existingSupplier = await this.suppliersRepository.findOne({
      where: { code: createSupplierDto.code },
    });

    if (existingSupplier) {
      throw new ConflictException(
        `Supplier with code ${createSupplierDto.code} already exists`,
      );
    }

    const supplier = this.suppliersRepository.create(createSupplierDto);
    return await this.suppliersRepository.save(supplier);
  }

  async findAll(filterDto: FilterSupplierDto): Promise<Supplier[]> {
    const { search, status, type, sortBy = 'name', sortOrder = 'ASC' } = filterDto;

    const query = this.suppliersRepository.createQueryBuilder('supplier');

    if (search) {
      query.where(
        '(supplier.name ILIKE :search OR supplier.code ILIKE :search OR supplier.email ILIKE :search OR supplier.phone ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (status) {
      query.andWhere('supplier.status = :status', { status });
    }

    if (type) {
      query.andWhere('supplier.type = :type', { type });
    }

    query.orderBy(`supplier.${sortBy}`, sortOrder);

    return await query.getMany();
  }

  async findOne(id: string): Promise<Supplier> {
    const supplier = await this.suppliersRepository.findOne({ where: { id } });

    if (!supplier) {
      throw new NotFoundException(`Supplier with ID ${id} not found`);
    }

    return supplier;
  }

  async findByCode(code: string): Promise<Supplier> {
    const supplier = await this.suppliersRepository.findOne({
      where: { code },
    });

    if (!supplier) {
      throw new NotFoundException(`Supplier with code ${code} not found`);
    }

    return supplier;
  }

  async update(
    id: string,
    updateSupplierDto: UpdateSupplierDto,
  ): Promise<Supplier> {
    const supplier = await this.findOne(id);

    // Check if code is being updated and if it conflicts with existing
    if (updateSupplierDto.code && updateSupplierDto.code !== supplier.code) {
      const existingSupplier = await this.suppliersRepository.findOne({
        where: { code: updateSupplierDto.code },
      });

      if (existingSupplier) {
        throw new ConflictException(
          `Supplier with code ${updateSupplierDto.code} already exists`,
        );
      }
    }

    Object.assign(supplier, updateSupplierDto);
    return await this.suppliersRepository.save(supplier);
  }

  async remove(id: string): Promise<void> {
    const supplier = await this.findOne(id);
    await this.suppliersRepository.remove(supplier);
  }

  async updatePaymentTerms(
    id: string,
    paymentTerms: string,
  ): Promise<Supplier> {
    const supplier = await this.findOne(id);
    supplier.paymentTerms = paymentTerms;
    return await this.suppliersRepository.save(supplier);
  }

  async updatePerformanceStats(
    id: string,
    stats: {
      totalOrders?: number;
      totalSpent?: number;
      averageRating?: number;
      onTimeDeliveryRate?: number;
      lastOrderDate?: Date;
    },
  ): Promise<Supplier> {
    const supplier = await this.findOne(id);

    if (stats.totalOrders !== undefined) {
      supplier.totalOrders = stats.totalOrders;
    }
    if (stats.totalSpent !== undefined) {
      supplier.totalSpent = stats.totalSpent;
    }
    if (stats.averageRating !== undefined) {
      supplier.averageRating = stats.averageRating;
    }
    if (stats.onTimeDeliveryRate !== undefined) {
      supplier.onTimeDeliveryRate = stats.onTimeDeliveryRate;
    }
    if (stats.lastOrderDate !== undefined) {
      supplier.lastOrderDate = stats.lastOrderDate;
    }

    return await this.suppliersRepository.save(supplier);
  }

  async getStats(): Promise<any> {
    const totalSuppliers = await this.suppliersRepository.count();
    const activeSuppliers = await this.suppliersRepository.count({
      where: { status: 'active' },
    });
    const inactiveSuppliers = await this.suppliersRepository.count({
      where: { status: 'inactive' },
    });

    const suppliers = await this.suppliersRepository.find();

    const totalSpent = suppliers.reduce(
      (sum, supplier) => sum + Number(supplier.totalSpent || 0),
      0,
    );
    const totalOrders = suppliers.reduce(
      (sum, supplier) => sum + Number(supplier.totalOrders || 0),
      0,
    );

    const averageRating =
      suppliers.length > 0
        ? suppliers.reduce(
            (sum, supplier) => sum + Number(supplier.averageRating || 0),
            0,
          ) / suppliers.length
        : 0;

    const suppliersByType = await this.suppliersRepository
      .createQueryBuilder('supplier')
      .select('supplier.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('supplier.type')
      .getRawMany();

    return {
      totalSuppliers,
      activeSuppliers,
      inactiveSuppliers,
      totalSpent,
      totalOrders,
      averageRating: parseFloat(averageRating.toFixed(1)),
      suppliersByType: suppliersByType.reduce((acc, item) => {
        acc[item.type || 'unknown'] = parseInt(item.count);
        return acc;
      }, {}),
    };
  }
}
