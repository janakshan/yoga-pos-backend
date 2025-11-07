import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Sale, PaymentStatus, SaleType } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { RefundSaleDto } from './dto/refund-sale.dto';
import { SplitPaymentDto } from './dto/split-payment.dto';
import { Product } from '../products/entities/product.entity';
import {
  InventoryTransaction,
  TransactionType,
  TransactionStatus,
} from '../inventory/entities/inventory-transaction.entity';
import {
  Payment,
  PaymentMethod,
  PaymentStatus as PaymentPaymentStatus,
} from '../payments/entities/payment.entity';

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
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
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
          type: TransactionType.SALE,
          quantity: -itemData.quantity,
          unitCost: product.cost,
          totalCost: Number(product.cost) * itemData.quantity,
          referenceType: 'sale',
          referenceId: savedSale.id,
          status: TransactionStatus.COMPLETED,
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

  async holdTransaction(id: string): Promise<Sale> {
    const sale = await this.findOne(id);

    if (sale.isHeld) {
      throw new BadRequestException('Transaction is already on hold');
    }

    if (sale.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Cannot hold a completed transaction');
    }

    sale.isHeld = true;
    sale.heldAt = new Date();

    return this.salesRepository.save(sale);
  }

  async getHeldTransactions(query?: any): Promise<[Sale[], number]> {
    const {
      page = 1,
      limit = 20,
      branchId,
      cashierId,
      sortBy,
      sortOrder,
    } = query || {};

    const where: any = {
      isHeld: true,
    };

    if (branchId) {
      where.branchId = branchId;
    }

    if (cashierId) {
      where.cashierId = cashierId;
    }

    const order: any = {};
    if (sortBy) {
      order[sortBy] = sortOrder || 'DESC';
    } else {
      order.heldAt = 'DESC';
    }

    return this.salesRepository.findAndCount({
      where,
      order,
      skip: (page - 1) * limit,
      take: limit,
      relations: ['items', 'items.product', 'customer', 'cashier', 'branch'],
    });
  }

  async getHeldTransaction(id: string): Promise<Sale> {
    const sale = await this.findOne(id);

    if (!sale.isHeld) {
      throw new NotFoundException(`Held transaction with ID ${id} not found`);
    }

    return sale;
  }

  async resumeHeldTransaction(id: string): Promise<Sale> {
    const sale = await this.findOne(id);

    if (!sale.isHeld) {
      throw new BadRequestException('Transaction is not on hold');
    }

    sale.isHeld = false;
    sale.heldAt = null as any;

    return this.salesRepository.save(sale);
  }

  async refundTransaction(
    id: string,
    refundDto: RefundSaleDto,
    cashierId: string,
  ): Promise<Sale> {
    const originalSale = await this.findOne(id);

    if (originalSale.paymentStatus === PaymentStatus.REFUNDED) {
      throw new BadRequestException('Transaction is already refunded');
    }

    if (originalSale.paymentStatus !== PaymentStatus.PAID) {
      throw new BadRequestException('Only paid transactions can be refunded');
    }

    // Create return sale
    const returnItems: Partial<SaleItem>[] = [];
    let subtotal = 0;
    let totalTax = 0;

    if (refundDto.items && refundDto.items.length > 0) {
      // Partial refund
      for (const refundItem of refundDto.items) {
        const originalItem = originalSale.items.find(
          (item) => item.productId === refundItem.productId,
        );

        if (!originalItem) {
          throw new NotFoundException(
            `Product with ID ${refundItem.productId} not found in original sale`,
          );
        }

        if (refundItem.quantity > originalItem.quantity) {
          throw new BadRequestException(
            `Refund quantity for product ${refundItem.productId} exceeds original quantity`,
          );
        }

        const ratio = refundItem.quantity / originalItem.quantity;
        const itemSubtotal = Number(originalItem.subtotal) * ratio;
        const itemDiscount = Number(originalItem.discount) * ratio;
        const itemTax = Number(originalItem.tax) * ratio;
        const itemTotal = Number(originalItem.total) * ratio;

        subtotal += itemSubtotal;
        totalTax += itemTax;

        returnItems.push({
          productId: refundItem.productId,
          quantity: refundItem.quantity,
          unitPrice: originalItem.unitPrice,
          discount: itemDiscount,
          tax: itemTax,
          subtotal: itemSubtotal,
          total: itemTotal,
          notes: refundDto.reason,
        });

        // Update inventory
        const product = await this.productsRepository.findOne({
          where: { id: refundItem.productId },
        });

        if (product && product.trackInventory) {
          product.stockQuantity += refundItem.quantity;
          await this.productsRepository.save(product);

          // Create inventory transaction
          const inventoryTransaction = this.inventoryRepository.create({
            productId: refundItem.productId,
            type: TransactionType.RETURN,
            quantity: refundItem.quantity,
            unitCost: product.cost,
            totalCost: Number(product.cost) * refundItem.quantity,
            referenceType: 'sale',
            referenceId: id,
            status: TransactionStatus.COMPLETED,
            transactionDate: new Date(),
          });
          await this.inventoryRepository.save(inventoryTransaction);
        }
      }
    } else {
      // Full refund
      for (const item of originalSale.items) {
        subtotal += Number(item.subtotal);
        totalTax += Number(item.tax);

        returnItems.push({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          tax: item.tax,
          subtotal: item.subtotal,
          total: item.total,
          notes: refundDto.reason,
        });

        // Update inventory
        const product = await this.productsRepository.findOne({
          where: { id: item.productId },
        });

        if (product && product.trackInventory) {
          product.stockQuantity += item.quantity;
          await this.productsRepository.save(product);

          // Create inventory transaction
          const inventoryTransaction = this.inventoryRepository.create({
            productId: item.productId,
            type: TransactionType.RETURN,
            quantity: item.quantity,
            unitCost: product.cost,
            totalCost: Number(product.cost) * item.quantity,
            referenceType: 'sale',
            referenceId: id,
            status: TransactionStatus.COMPLETED,
            transactionDate: new Date(),
          });
          await this.inventoryRepository.save(inventoryTransaction);
        }
      }
    }

    const discount = Number(originalSale.discount) * (subtotal / Number(originalSale.subtotal));
    const total = subtotal - discount + totalTax;

    // Generate return sale number
    const returnSaleNumber = await this.generateSaleNumber();

    // Create return sale
    const returnSale = this.salesRepository.create({
      saleNumber: returnSaleNumber,
      customerId: originalSale.customerId,
      cashierId,
      branchId: originalSale.branchId,
      subtotal,
      tax: totalTax,
      discount,
      total,
      paymentStatus: PaymentStatus.REFUNDED,
      saleType: SaleType.RETURN,
      notes: `Refund for sale ${originalSale.saleNumber}. ${refundDto.reason || ''} ${refundDto.notes || ''}`,
      metadata: {
        originalSaleId: id,
        originalSaleNumber: originalSale.saleNumber,
        refundReason: refundDto.reason,
      },
    });

    const savedReturnSale = await this.salesRepository.save(returnSale);

    // Create return sale items
    for (const itemData of returnItems) {
      const saleItem = this.saleItemsRepository.create({
        ...itemData,
        saleId: savedReturnSale.id,
      });
      await this.saleItemsRepository.save(saleItem);
    }

    // Update original sale status
    originalSale.paymentStatus = PaymentStatus.REFUNDED;
    originalSale.notes = `${originalSale.notes || ''}\nRefunded via ${returnSaleNumber}`;
    await this.salesRepository.save(originalSale);

    return this.findOne(savedReturnSale.id);
  }

  async splitPayment(
    id: string,
    splitPaymentDto: SplitPaymentDto,
    processedById: string,
  ): Promise<{ sale: Sale; payments: Payment[] }> {
    const sale = await this.findOne(id);

    if (sale.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Transaction is already paid');
    }

    if (sale.paymentStatus === PaymentStatus.REFUNDED) {
      throw new BadRequestException('Cannot process payment for refunded transaction');
    }

    // Validate total payment amount
    const totalPaymentAmount = splitPaymentDto.payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0,
    );

    if (totalPaymentAmount > Number(sale.total)) {
      throw new BadRequestException(
        `Total payment amount (${totalPaymentAmount}) exceeds sale total (${sale.total})`,
      );
    }

    // Create payments
    const createdPayments: Payment[] = [];

    for (const paymentData of splitPaymentDto.payments) {
      const paymentNumber = await this.generatePaymentNumber();

      const payment = this.paymentsRepository.create({
        paymentNumber,
        saleId: id,
        customerId: sale.customerId,
        amount: paymentData.amount,
        paymentMethod: paymentData.paymentMethod,
        paymentDate: new Date(),
        reference: paymentData.reference,
        status: PaymentPaymentStatus.COMPLETED,
        processedById,
        notes: paymentData.notes,
      });

      const savedPayment = await this.paymentsRepository.save(payment);
      createdPayments.push(savedPayment);
    }

    // Update sale payment status
    if (totalPaymentAmount >= Number(sale.total)) {
      sale.paymentStatus = PaymentStatus.PAID;
    } else {
      sale.paymentStatus = PaymentStatus.PARTIAL;
    }

    const updatedSale = await this.salesRepository.save(sale);

    return {
      sale: updatedSale,
      payments: createdPayments,
    };
  }

  async getDailySalesReport(date?: string, branchId?: string): Promise<any> {
    const reportDate = date ? new Date(date) : new Date();
    reportDate.setHours(0, 0, 0, 0);

    const nextDay = new Date(reportDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const where: any = {
      createdAt: Between(reportDate, nextDay),
      isHeld: false,
    };

    if (branchId) {
      where.branchId = branchId;
    }

    const [sales, totalSales] = await this.salesRepository.findAndCount({
      where,
      relations: ['items', 'items.product', 'customer', 'cashier', 'branch'],
    });

    // Calculate summary statistics
    const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
    const totalTax = sales.reduce((sum, sale) => sum + Number(sale.tax), 0);
    const totalDiscount = sales.reduce((sum, sale) => sum + Number(sale.discount), 0);
    const totalSubtotal = sales.reduce((sum, sale) => sum + Number(sale.subtotal), 0);

    // Count by payment status
    const paidSales = sales.filter((s) => s.paymentStatus === PaymentStatus.PAID).length;
    const pendingSales = sales.filter((s) => s.paymentStatus === PaymentStatus.PENDING).length;
    const partialSales = sales.filter((s) => s.paymentStatus === PaymentStatus.PARTIAL).length;
    const refundedSales = sales.filter((s) => s.paymentStatus === PaymentStatus.REFUNDED).length;

    // Get payment method breakdown
    const paymentWhere: any = {
      paymentDate: Between(reportDate, nextDay),
      status: PaymentPaymentStatus.COMPLETED,
    };

    if (branchId) {
      const branchSaleIds = sales.map((s) => s.id);
      if (branchSaleIds.length > 0) {
        paymentWhere.saleId = branchSaleIds;
      }
    }

    const payments = await this.paymentsRepository.find({
      where: paymentWhere,
    });

    const paymentsByMethod: any = {};
    for (const payment of payments) {
      const method = payment.paymentMethod;
      if (!paymentsByMethod[method]) {
        paymentsByMethod[method] = {
          count: 0,
          total: 0,
        };
      }
      paymentsByMethod[method].count++;
      paymentsByMethod[method].total += Number(payment.amount);
    }

    // Get top selling products
    const productSales: any = {};
    for (const sale of sales) {
      if (sale.saleType === SaleType.SALE) {
        for (const item of sale.items) {
          if (!productSales[item.productId]) {
            productSales[item.productId] = {
              productId: item.productId,
              productName: item.product?.name || 'Unknown',
              quantity: 0,
              revenue: 0,
            };
          }
          productSales[item.productId].quantity += Number(item.quantity);
          productSales[item.productId].revenue += Number(item.total);
        }
      }
    }

    const topProducts = Object.values(productSales)
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 10);

    return {
      date: reportDate.toISOString().split('T')[0],
      summary: {
        totalSales,
        totalRevenue,
        totalSubtotal,
        totalTax,
        totalDiscount,
        averageSaleValue: totalSales > 0 ? totalRevenue / totalSales : 0,
      },
      salesByStatus: {
        paid: paidSales,
        pending: pendingSales,
        partial: partialSales,
        refunded: refundedSales,
      },
      paymentsByMethod: paymentsByMethod,
      topSellingProducts: topProducts,
      sales: sales,
    };
  }

  async getTransactionHistory(query?: any): Promise<[Sale[], number]> {
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
      includeHeld = false,
      sortBy,
      sortOrder,
    } = query || {};

    const where: any = {};

    if (!includeHeld) {
      where.isHeld = false;
    }

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
    } else if (startDate) {
      where.createdAt = MoreThanOrEqual(new Date(startDate));
    } else if (endDate) {
      where.createdAt = LessThanOrEqual(new Date(endDate));
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
      relations: ['items', 'items.product', 'customer', 'cashier', 'branch'],
    });
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

  private async generatePaymentNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    const prefix = `PAY-${year}${month}${day}`;

    const lastPayment = await this.paymentsRepository.findOne({
      where: { paymentNumber: ILike(`${prefix}%`) },
      order: { createdAt: 'DESC' },
    });

    let sequence = 1;
    if (lastPayment) {
      const lastSequence = parseInt(
        lastPayment.paymentNumber.split('-').pop() || '0',
        10,
      );
      sequence = lastSequence + 1;
    }

    return `${prefix}-${String(sequence).padStart(4, '0')}`;
  }
}
