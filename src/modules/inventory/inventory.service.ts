import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, Like } from 'typeorm';
import { InventoryTransaction, TransactionType, TransactionStatus } from './entities/inventory-transaction.entity';
import { StockLevel } from './entities/stock-level.entity';
import { Product } from '../products/entities/product.entity';
import { Branch } from '../branches/entities/branch.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';
import { CreateAdjustmentDto } from './dto/create-adjustment.dto';
import { CreateWriteOffDto } from './dto/create-writeoff.dto';
import { TransferStockDto } from './dto/transfer-stock.dto';
import { QueryStockLevelDto } from './dto/query-stock-level.dto';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(InventoryTransaction)
    private transactionRepository: Repository<InventoryTransaction>,
    @InjectRepository(StockLevel)
    private stockLevelRepository: Repository<StockLevel>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Branch)
    private branchRepository: Repository<Branch>,
  ) {}

  async findAllTransactions(query: QueryTransactionDto) {
    const queryBuilder = this.transactionRepository.createQueryBuilder('transaction');

    if (query.search) {
      queryBuilder.andWhere(
        '(transaction.productName ILIKE :search OR transaction.productSku ILIKE :search OR transaction.referenceNumber ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.productId) {
      queryBuilder.andWhere('transaction.productId = :productId', { productId: query.productId });
    }

    if (query.type) {
      queryBuilder.andWhere('transaction.type = :type', { type: query.type });
    }

    if (query.status) {
      queryBuilder.andWhere('transaction.status = :status', { status: query.status });
    }

    if (query.locationId) {
      queryBuilder.andWhere('transaction.locationId = :locationId', { locationId: query.locationId });
    }

    if (query.startDate) {
      queryBuilder.andWhere('transaction.transactionDate >= :startDate', { startDate: query.startDate });
    }

    if (query.endDate) {
      queryBuilder.andWhere('transaction.transactionDate <= :endDate', { endDate: query.endDate });
    }

    if (query.batchNumber) {
      queryBuilder.andWhere('transaction.batchNumber = :batchNumber', { batchNumber: query.batchNumber });
    }

    if (query.referenceNumber) {
      queryBuilder.andWhere('transaction.referenceNumber = :referenceNumber', { referenceNumber: query.referenceNumber });
    }

    const sortBy = query.sortBy || 'transactionDate';
    const sortOrder = query.sortOrder || 'DESC';
    queryBuilder.orderBy(`transaction.${sortBy}`, sortOrder);

    return await queryBuilder.getMany();
  }

  async findOneTransaction(id: string) {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: ['product', 'location'],
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    return transaction;
  }

  async createTransaction(createDto: CreateTransactionDto, userId?: string) {
    const product = await this.productRepository.findOne({
      where: { id: createDto.productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${createDto.productId} not found`);
    }

    // Calculate total cost
    const totalCost = createDto.quantity * createDto.unitCost;

    const transaction = this.transactionRepository.create({
      ...createDto,
      totalCost,
      productName: createDto.productName || product.name,
      productSku: createDto.productSku || product.sku,
      createdBy: userId,
      status: TransactionStatus.COMPLETED,
    });

    const savedTransaction = await this.transactionRepository.save(transaction);

    // Update stock levels
    await this.updateStockLevel(savedTransaction);

    return savedTransaction;
  }

  async updateTransaction(id: string, updateDto: UpdateTransactionDto) {
    const transaction = await this.findOneTransaction(id);

    // Revert previous stock changes
    await this.revertStockLevel(transaction);

    Object.assign(transaction, updateDto);

    if (updateDto.quantity !== undefined || updateDto.unitCost !== undefined) {
      transaction.totalCost = transaction.quantity * transaction.unitCost;
    }

    const updatedTransaction = await this.transactionRepository.save(transaction);

    // Apply new stock changes
    await this.updateStockLevel(updatedTransaction);

    return updatedTransaction;
  }

  async deleteTransaction(id: string) {
    const transaction = await this.findOneTransaction(id);

    // Revert stock changes
    await this.revertStockLevel(transaction);

    await this.transactionRepository.remove(transaction);
  }

  async cancelTransaction(id: string) {
    const transaction = await this.findOneTransaction(id);

    if (transaction.status === TransactionStatus.CANCELLED) {
      throw new BadRequestException('Transaction is already cancelled');
    }

    // Revert stock changes
    await this.revertStockLevel(transaction);

    transaction.status = TransactionStatus.CANCELLED;
    return await this.transactionRepository.save(transaction);
  }

  async findAllStockLevels(query: QueryStockLevelDto) {
    const queryBuilder = this.stockLevelRepository.createQueryBuilder('stock');

    if (query.search) {
      queryBuilder.andWhere(
        '(stock.productName ILIKE :search OR stock.productSku ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.locationId) {
      queryBuilder.andWhere('stock.locationId = :locationId', { locationId: query.locationId });
    }

    if (query.lowStock) {
      queryBuilder.andWhere('stock.isLowStock = :lowStock', { lowStock: true });
    }

    if (query.outOfStock) {
      queryBuilder.andWhere('stock.isOutOfStock = :outOfStock', { outOfStock: true });
    }

    const sortBy = query.sortBy || 'productName';
    const sortOrder = query.sortOrder || 'ASC';
    queryBuilder.orderBy(`stock.${sortBy}`, sortOrder);

    return await queryBuilder.getMany();
  }

  async findStockLevelByProduct(productId: string, locationId?: string) {
    const where: any = { productId };

    if (locationId) {
      where.locationId = locationId;
    }

    return await this.stockLevelRepository.find({ where });
  }

  async getLowStockProducts() {
    return await this.stockLevelRepository.find({
      where: { isLowStock: true },
      order: { quantity: 'ASC' },
    });
  }

  async getOutOfStockProducts() {
    return await this.stockLevelRepository.find({
      where: { isOutOfStock: true },
    });
  }

  async createAdjustment(adjustmentDto: CreateAdjustmentDto, userId?: string) {
    const product = await this.productRepository.findOne({
      where: { id: adjustmentDto.productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${adjustmentDto.productId} not found`);
    }

    const transactionType = adjustmentDto.quantity < 0
      ? TransactionType.DAMAGE
      : TransactionType.ADJUSTMENT;

    const transaction = this.transactionRepository.create({
      productId: adjustmentDto.productId,
      productName: product.name,
      productSku: product.sku,
      type: transactionType,
      quantity: Math.abs(adjustmentDto.quantity),
      unitCost: product.cost || 0,
      totalCost: Math.abs(adjustmentDto.quantity) * (product.cost || 0),
      locationId: adjustmentDto.locationId,
      notes: `${adjustmentDto.reason} - ${adjustmentDto.notes || ''}`,
      transactionDate: new Date(),
      createdBy: userId,
      status: TransactionStatus.COMPLETED,
    });

    const savedTransaction = await this.transactionRepository.save(transaction);
    await this.updateStockLevel(savedTransaction);

    return savedTransaction;
  }

  async createWriteOff(writeOffDto: CreateWriteOffDto, userId?: string) {
    const transaction = this.transactionRepository.create({
      productId: writeOffDto.productId,
      productName: writeOffDto.productName,
      productSku: writeOffDto.productSku,
      type: TransactionType.WRITE_OFF,
      quantity: writeOffDto.quantity,
      unitCost: writeOffDto.unitCost,
      totalCost: writeOffDto.quantity * writeOffDto.unitCost,
      locationId: writeOffDto.locationId,
      notes: `${writeOffDto.reason} - ${writeOffDto.notes || ''}`,
      transactionDate: new Date(),
      createdBy: userId,
      status: TransactionStatus.COMPLETED,
    });

    const savedTransaction = await this.transactionRepository.save(transaction);
    await this.updateStockLevel(savedTransaction);

    return savedTransaction;
  }

  async transferStock(transferDto: TransferStockDto, userId?: string) {
    const product = await this.productRepository.findOne({
      where: { id: transferDto.productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${transferDto.productId} not found`);
    }

    // Check if sufficient stock exists at source location
    const sourceStock = await this.stockLevelRepository.findOne({
      where: {
        productId: transferDto.productId,
        locationId: transferDto.fromLocationId,
      },
    });

    if (!sourceStock || sourceStock.quantity < transferDto.quantity) {
      throw new BadRequestException('Insufficient stock at source location');
    }

    const referenceNumber = `TRF-${Date.now()}`;

    // Create transfer out transaction
    const transferOut = this.transactionRepository.create({
      productId: transferDto.productId,
      productName: product.name,
      productSku: product.sku,
      type: TransactionType.TRANSFER_OUT,
      quantity: transferDto.quantity,
      unitCost: sourceStock.averageCost,
      totalCost: transferDto.quantity * sourceStock.averageCost,
      locationId: transferDto.fromLocationId,
      referenceNumber,
      notes: transferDto.notes,
      transactionDate: new Date(),
      createdBy: userId,
      status: TransactionStatus.COMPLETED,
    });

    // Create transfer in transaction
    const transferIn = this.transactionRepository.create({
      productId: transferDto.productId,
      productName: product.name,
      productSku: product.sku,
      type: TransactionType.TRANSFER_IN,
      quantity: transferDto.quantity,
      unitCost: sourceStock.averageCost,
      totalCost: transferDto.quantity * sourceStock.averageCost,
      locationId: transferDto.toLocationId,
      referenceNumber,
      notes: transferDto.notes,
      transactionDate: new Date(),
      createdBy: userId,
      status: TransactionStatus.COMPLETED,
    });

    const savedTransferOut = await this.transactionRepository.save(transferOut);
    const savedTransferIn = await this.transactionRepository.save(transferIn);

    await this.updateStockLevel(savedTransferOut);
    await this.updateStockLevel(savedTransferIn);

    return {
      transferOut: savedTransferOut,
      transferIn: savedTransferIn,
      referenceNumber,
    };
  }

  async getTransactionsByBatch(batchNumber: string) {
    return await this.transactionRepository.find({
      where: { batchNumber },
      order: { transactionDate: 'DESC' },
    });
  }

  async getTransactionsBySerial(serialNumber: string) {
    return await this.transactionRepository.find({
      where: { serialNumber },
      order: { transactionDate: 'DESC' },
    });
  }

  async getExpiringBatches(daysThreshold: number = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysThreshold);

    const transactions = await this.transactionRepository
      .createQueryBuilder('transaction')
      .where('transaction.expiryDate IS NOT NULL')
      .andWhere('transaction.expiryDate <= :futureDate', { futureDate })
      .andWhere('transaction.expiryDate > :today', { today: new Date() })
      .orderBy('transaction.expiryDate', 'ASC')
      .getMany();

    return transactions.map(t => {
      const daysUntilExpiry = Math.ceil(
        (new Date(t.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        batchNumber: t.batchNumber,
        productId: t.productId,
        productName: t.productName,
        expiryDate: t.expiryDate,
        locationId: t.locationId,
        daysUntilExpiry,
      };
    });
  }

  async getExpiredBatches() {
    const transactions = await this.transactionRepository
      .createQueryBuilder('transaction')
      .where('transaction.expiryDate IS NOT NULL')
      .andWhere('transaction.expiryDate < :today', { today: new Date() })
      .orderBy('transaction.expiryDate', 'DESC')
      .getMany();

    return transactions.map(t => ({
      batchNumber: t.batchNumber,
      productId: t.productId,
      productName: t.productName,
      expiryDate: t.expiryDate,
      locationId: t.locationId,
    }));
  }

  async getInventoryStats() {
    const totalTransactions = await this.transactionRepository.count();

    const stockLevels = await this.stockLevelRepository.find();
    const totalProducts = stockLevels.length;
    const lowStockProducts = stockLevels.filter(s => s.isLowStock).length;
    const outOfStockProducts = stockLevels.filter(s => s.isOutOfStock).length;

    const totalInventoryValue = stockLevels.reduce((sum, s) => sum + Number(s.totalValue), 0);

    const transactionsByType = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('transaction.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('transaction.type')
      .getRawMany();

    const valueByLocation = await this.stockLevelRepository
      .createQueryBuilder('stock')
      .select('stock.locationName', 'location')
      .addSelect('SUM(stock.totalValue)', 'value')
      .groupBy('stock.locationName')
      .getRawMany();

    const recentTransactions = await this.transactionRepository.find({
      order: { createdAt: 'DESC' },
      take: 10,
    });

    return {
      totalTransactions,
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      totalInventoryValue,
      transactionsByType: transactionsByType.reduce((acc, t) => {
        acc[t.type] = parseInt(t.count);
        return acc;
      }, {}),
      valueByLocation: valueByLocation.reduce((acc, v) => {
        acc[v.location || 'Unknown'] = parseFloat(v.value || 0);
        return acc;
      }, {}),
      recentTransactions,
    };
  }

  private async updateStockLevel(transaction: InventoryTransaction) {
    if (!transaction.locationId) {
      return; // Skip if no location specified
    }

    let stockLevel = await this.stockLevelRepository.findOne({
      where: {
        productId: transaction.productId,
        locationId: transaction.locationId,
      },
    });

    if (!stockLevel) {
      stockLevel = this.stockLevelRepository.create({
        productId: transaction.productId,
        productName: transaction.productName,
        productSku: transaction.productSku,
        locationId: transaction.locationId,
        locationName: transaction.locationName,
        quantity: 0,
        averageCost: 0,
        totalValue: 0,
      });
    }

    const quantityChange = this.calculateQuantityChange(transaction);
    stockLevel.quantity += quantityChange;

    // Update timestamps
    if ([TransactionType.PURCHASE, TransactionType.TRANSFER_IN, TransactionType.ADJUSTMENT].includes(transaction.type)) {
      stockLevel.lastRestockedAt = new Date();
    } else if (transaction.type === TransactionType.SALE) {
      stockLevel.lastSoldAt = new Date();
    }

    // Recalculate average cost and total value
    if (transaction.type === TransactionType.PURCHASE || transaction.type === TransactionType.TRANSFER_IN) {
      const currentValue = Number(stockLevel.averageCost) * (stockLevel.quantity - quantityChange);
      const newValue = Number(transaction.unitCost) * quantityChange;
      stockLevel.averageCost = (currentValue + newValue) / stockLevel.quantity;
    }

    stockLevel.totalValue = stockLevel.quantity * Number(stockLevel.averageCost);

    // Update stock status flags
    stockLevel.isOutOfStock = stockLevel.quantity <= 0;
    stockLevel.isLowStock = stockLevel.quantity > 0 && stockLevel.quantity <= stockLevel.lowStockThreshold;

    // Update balance after in transaction
    transaction.balanceAfter = stockLevel.quantity;
    await this.transactionRepository.save(transaction);

    await this.stockLevelRepository.save(stockLevel);
  }

  private async revertStockLevel(transaction: InventoryTransaction) {
    if (!transaction.locationId) {
      return;
    }

    const stockLevel = await this.stockLevelRepository.findOne({
      where: {
        productId: transaction.productId,
        locationId: transaction.locationId,
      },
    });

    if (stockLevel) {
      const quantityChange = this.calculateQuantityChange(transaction);
      stockLevel.quantity -= quantityChange;

      stockLevel.totalValue = stockLevel.quantity * Number(stockLevel.averageCost);
      stockLevel.isOutOfStock = stockLevel.quantity <= 0;
      stockLevel.isLowStock = stockLevel.quantity > 0 && stockLevel.quantity <= stockLevel.lowStockThreshold;

      await this.stockLevelRepository.save(stockLevel);
    }
  }

  private calculateQuantityChange(transaction: InventoryTransaction): number {
    switch (transaction.type) {
      case TransactionType.PURCHASE:
      case TransactionType.RETURN:
      case TransactionType.TRANSFER_IN:
      case TransactionType.ADJUSTMENT:
        return transaction.quantity;

      case TransactionType.SALE:
      case TransactionType.DAMAGE:
      case TransactionType.WRITE_OFF:
      case TransactionType.TRANSFER_OUT:
        return -transaction.quantity;

      default:
        return 0;
    }
  }
}
