import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, Between } from 'typeorm';
import { Sale, PaymentStatus } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { Product } from '../products/entities/product.entity';
import { InventoryTransaction } from '../inventory/entities/inventory-transaction.entity';

@Injectable()
export class PosService {
  constructor(
    @InjectRepository(Sale)
    private salesRepository: Repository<Sale>,
    @InjectRepository(SaleItem)
    private saleItemsRepository: Repository<SaleItem>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(InventoryTransaction)
    private inventoryRepository: Repository<InventoryTransaction>,
  ) {}

  async create(
    createSaleDto: CreateSaleDto,
    cashierId: string,
  ): Promise<Sale> {
    // Validate products and stock
    for (const item of createSaleDto.items) {
      const product = await this.productsRepository.findOne({
        where: { id: item.productId },
      });

      if (!product) {
        throw new NotFoundException(
          `Product with ID ${item.productId} not found`,
        );
      }

      if (
        product.trackInventory &&
        product.stockQuantity < item.quantity &&
        !product.allowBackorder
      ) {
        throw new BadRequestException(
          `Insufficient stock for product ${product.name}. Available: ${product.stockQuantity}, Requested: ${item.quantity}`,
        );
      }
    }

    // Generate sale number
    const saleNumber = await this.generateSaleNumber();

    // Calculate totals
    let subtotal = 0;
    let totalTax = 0;
    const saleItems: Partial<SaleItem>[] = [];

    for (const itemDto of createSaleDto.items) {
      const product = await this.productsRepository.findOne({
        where: { id: itemDto.productId },
      });

      const itemSubtotal = itemDto.quantity * itemDto.unitPrice;
      const itemDiscount = itemDto.discount || 0;
      const itemTax =
        itemDto.tax || (itemSubtotal - itemDiscount) * ((product?.taxRate || 0) / 100);
      const itemTotal = itemSubtotal - itemDiscount + itemTax;

      subtotal += itemSubtotal;
      totalTax += itemTax;

      saleItems.push({
        productId: itemDto.productId,
        quantity: itemDto.quantity,
        unitPrice: itemDto.unitPrice,
        discount: itemDiscount,
        tax: itemTax,
        subtotal: itemSubtotal,
        total: itemTotal,
        notes: itemDto.notes,
      });
    }

    const discount = createSaleDto.discount || 0;
    const total = subtotal - discount + totalTax;

    // Create sale
    const sale = this.salesRepository.create({
      saleNumber,
      customerId: createSaleDto.customerId,
      cashierId,
      branchId: createSaleDto.branchId,
      subtotal,
      tax: totalTax,
      discount,
      total,
      paymentStatus: createSaleDto.paymentStatus || PaymentStatus.PENDING,
      saleType: createSaleDto.saleType,
      notes: createSaleDto.notes,
    });

    const savedSale = await this.salesRepository.save(sale);

    // Create sale items
    for (const itemData of saleItems) {
      const saleItem = this.saleItemsRepository.create({
        ...itemData,
        saleId: savedSale.id,
      });
      await this.saleItemsRepository.save(saleItem);

      // Update inventory
      const product = await this.productsRepository.findOne({
        where: { id: itemData.productId },
      });

      if (product && product.trackInventory && itemData.quantity) {
        product.stockQuantity -= itemData.quantity;
        await this.productsRepository.save(product);

        // Create inventory transaction
        const inventoryTransaction = this.inventoryRepository.create({
          productId: itemData.productId,
          type: 'sale',
          quantity: -itemData.quantity,
          unitCost: product.cost,
          totalCost: Number(product.cost) * itemData.quantity,
          referenceType: 'sale',
          referenceId: savedSale.id,
          status: 'completed',
          transactionDate: new Date(),
        });
        await this.inventoryRepository.save(inventoryTransaction);
      }
    }

    return this.findOne(savedSale.id);
  }

  async findAll(query?: any): Promise<[Sale[], number]> {
    const {
      page = 1,
      limit = 20,
      search,
      customerId,
      cashierId,
      branchId,
      paymentStatus,
      saleType,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    } = query || {};

    const where: any = {};

    if (search) {
      where.saleNumber = ILike(`%${search}%`);
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (cashierId) {
      where.cashierId = cashierId;
    }

    if (branchId) {
      where.branchId = branchId;
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    if (saleType) {
      where.saleType = saleType;
    }

    if (startDate && endDate) {
      where.createdAt = Between(new Date(startDate), new Date(endDate));
    }

    const order: any = {};
    if (sortBy) {
      order[sortBy] = sortOrder || 'DESC';
    } else {
      order.createdAt = 'DESC';
    }

    return this.salesRepository.findAndCount({
      where,
      order,
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async findOne(id: string): Promise<Sale> {
    const sale = await this.salesRepository.findOne({
      where: { id },
      relations: ['items', 'items.product', 'customer', 'cashier', 'branch'],
    });

    if (!sale) {
      throw new NotFoundException(`Sale with ID ${id} not found`);
    }

    return sale;
  }

  async update(id: string, updateSaleDto: UpdateSaleDto): Promise<Sale> {
    const sale = await this.findOne(id);

    // Only allow updating certain fields
    if (updateSaleDto.paymentStatus !== undefined) {
      sale.paymentStatus = updateSaleDto.paymentStatus;
    }

    if (updateSaleDto.notes !== undefined) {
      sale.notes = updateSaleDto.notes;
    }

    return this.salesRepository.save(sale);
  }

  async remove(id: string): Promise<void> {
    const sale = await this.findOne(id);
    await this.salesRepository.remove(sale);
  }

  async getStats(branchId?: string): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const where: any = {
      createdAt: Between(today, tomorrow),
    };

    if (branchId) {
      where.branchId = branchId;
    }

    const [todaySales, totalSales, pendingSales, completedSales] =
      await Promise.all([
        this.salesRepository
          .createQueryBuilder('sale')
          .select('SUM(sale.total)', 'total')
          .where(where)
          .getRawOne(),
        this.salesRepository.count(),
        this.salesRepository.count({ where: { paymentStatus: PaymentStatus.PENDING } }),
        this.salesRepository.count({ where: { paymentStatus: PaymentStatus.PAID } }),
      ]);

    return {
      todaySalesAmount: parseFloat(todaySales?.total || '0'),
      totalSales,
      pendingSales,
      completedSales,
    };
  }

  private async generateSaleNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    const prefix = `SAL-${year}${month}${day}`;

    const lastSale = await this.salesRepository.findOne({
      where: { saleNumber: ILike(`${prefix}%`) },
      order: { createdAt: 'DESC' },
    });

    let sequence = 1;
    if (lastSale) {
      const lastSequence = parseInt(lastSale.saleNumber.split('-').pop() || '0', 10);
      sequence = lastSequence + 1;
    }

    return `${prefix}-${String(sequence).padStart(4, '0')}`;
  }
}
