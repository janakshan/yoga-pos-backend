import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { PurchaseOrderItem } from './entities/purchase-order-item.entity';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { FilterPurchaseOrderDto } from './dto/filter-purchase-order.dto';
import { ReceivePurchaseOrderDto } from './dto/receive-purchase-order.dto';
import { SuppliersService } from '../suppliers/suppliers.service';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    @InjectRepository(PurchaseOrder)
    private purchaseOrdersRepository: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseOrderItem)
    private purchaseOrderItemsRepository: Repository<PurchaseOrderItem>,
    private suppliersService: SuppliersService,
  ) {}

  private async generatePONumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.purchaseOrdersRepository.count();
    const paddedCount = String(count + 1).padStart(4, '0');
    return `PO-${year}-${paddedCount}`;
  }

  private calculateItemTotal(item: any): number {
    const subtotal = item.quantity * item.unitPrice;
    const discountAmount = item.discount || 0;
    const taxAmount = item.tax || 0;
    return subtotal - discountAmount + taxAmount;
  }

  private calculateOrderTotals(items: any[], dto: CreatePurchaseOrderDto): any {
    let subtotal = 0;
    let totalTax = 0;

    const itemsWithTotals = items.map((item) => {
      const itemTotal = this.calculateItemTotal(item);
      subtotal += item.quantity * item.unitPrice;
      totalTax += item.tax || 0;
      return {
        ...item,
        total: itemTotal,
        quantityReceived: 0,
      };
    });

    const shippingCost = dto.shippingCost || 0;
    const discountAmount = dto.discountAmount || 0;
    const total = subtotal + totalTax + shippingCost - discountAmount;

    return {
      items: itemsWithTotals,
      subtotal,
      tax: totalTax,
      shippingCost,
      discountAmount,
      total,
    };
  }

  async create(
    createPurchaseOrderDto: CreatePurchaseOrderDto,
    userId?: string,
  ): Promise<PurchaseOrder> {
    // Verify supplier exists
    await this.suppliersService.findOne(createPurchaseOrderDto.supplierId);

    // Generate PO number
    const poNumber = await this.generatePONumber();

    // Calculate totals
    const totals = this.calculateOrderTotals(
      createPurchaseOrderDto.items,
      createPurchaseOrderDto,
    );

    // Create purchase order
    const purchaseOrder = this.purchaseOrdersRepository.create({
      poNumber,
      supplierId: createPurchaseOrderDto.supplierId,
      subtotal: totals.subtotal,
      tax: totals.tax,
      shippingCost: totals.shippingCost,
      discountAmount: totals.discountAmount,
      total: totals.total,
      status: 'draft',
      orderDate: new Date(),
      expectedDelivery: createPurchaseOrderDto.expectedDelivery,
      branchId: createPurchaseOrderDto.branchId,
      locationId: createPurchaseOrderDto.locationId,
      locationName: createPurchaseOrderDto.locationName,
      notes: createPurchaseOrderDto.notes,
      terms: createPurchaseOrderDto.terms,
      customFields: createPurchaseOrderDto.customFields,
      createdBy: userId,
    });

    const savedPO = await this.purchaseOrdersRepository.save(purchaseOrder);

    // Create purchase order items
    const items = totals.items.map((item) =>
      this.purchaseOrderItemsRepository.create({
        ...item,
        purchaseOrderId: savedPO.id,
      }),
    );

    await this.purchaseOrderItemsRepository.save(items);

    return this.findOne(savedPO.id);
  }

  async findAll(
    filterDto: FilterPurchaseOrderDto,
  ): Promise<PurchaseOrder[]> {
    const {
      search,
      supplierId,
      status,
      branchId,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = filterDto;

    const query = this.purchaseOrdersRepository.createQueryBuilder('po');

    if (search) {
      query.where('po.poNumber ILIKE :search', { search: `%${search}%` });
    }

    if (supplierId) {
      query.andWhere('po.supplierId = :supplierId', { supplierId });
    }

    if (status) {
      query.andWhere('po.status = :status', { status });
    }

    if (branchId) {
      query.andWhere('po.branchId = :branchId', { branchId });
    }

    if (startDate && endDate) {
      query.andWhere('po.orderDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    query.orderBy(`po.${sortBy}`, sortOrder);

    return await query.getMany();
  }

  async findOne(id: string): Promise<PurchaseOrder> {
    const purchaseOrder = await this.purchaseOrdersRepository.findOne({
      where: { id },
      relations: ['supplier', 'items'],
    });

    if (!purchaseOrder) {
      throw new NotFoundException(`Purchase Order with ID ${id} not found`);
    }

    return purchaseOrder;
  }

  async findByPONumber(poNumber: string): Promise<PurchaseOrder> {
    const purchaseOrder = await this.purchaseOrdersRepository.findOne({
      where: { poNumber },
      relations: ['supplier', 'items'],
    });

    if (!purchaseOrder) {
      throw new NotFoundException(
        `Purchase Order with number ${poNumber} not found`,
      );
    }

    return purchaseOrder;
  }

  async update(
    id: string,
    updatePurchaseOrderDto: UpdatePurchaseOrderDto,
  ): Promise<PurchaseOrder> {
    const purchaseOrder = await this.findOne(id);

    if (purchaseOrder.status !== 'draft') {
      throw new BadRequestException(
        'Only draft purchase orders can be updated',
      );
    }

    // If items are being updated, recalculate totals
    if (updatePurchaseOrderDto.items) {
      const totals = this.calculateOrderTotals(
        updatePurchaseOrderDto.items,
        updatePurchaseOrderDto as CreatePurchaseOrderDto,
      );

      // Delete existing items
      await this.purchaseOrderItemsRepository.delete({
        purchaseOrderId: id,
      });

      // Create new items
      const items = totals.items.map((item) =>
        this.purchaseOrderItemsRepository.create({
          ...item,
          purchaseOrderId: id,
        }),
      );

      await this.purchaseOrderItemsRepository.save(items);

      Object.assign(purchaseOrder, {
        ...updatePurchaseOrderDto,
        subtotal: totals.subtotal,
        tax: totals.tax,
        total: totals.total,
      });
    } else {
      Object.assign(purchaseOrder, updatePurchaseOrderDto);
    }

    return await this.purchaseOrdersRepository.save(purchaseOrder);
  }

  async remove(id: string): Promise<void> {
    const purchaseOrder = await this.findOne(id);

    if (purchaseOrder.status !== 'draft') {
      throw new BadRequestException(
        'Only draft purchase orders can be deleted',
      );
    }

    await this.purchaseOrdersRepository.remove(purchaseOrder);
  }

  async submit(id: string): Promise<PurchaseOrder> {
    const purchaseOrder = await this.findOne(id);

    if (purchaseOrder.status !== 'draft') {
      throw new BadRequestException(
        'Only draft purchase orders can be submitted',
      );
    }

    purchaseOrder.status = 'submitted';
    return await this.purchaseOrdersRepository.save(purchaseOrder);
  }

  async approve(id: string, userId?: string): Promise<PurchaseOrder> {
    const purchaseOrder = await this.findOne(id);

    if (purchaseOrder.status !== 'submitted') {
      throw new BadRequestException(
        'Only submitted purchase orders can be approved',
      );
    }

    purchaseOrder.status = 'approved';
    purchaseOrder.approvedBy = userId;
    purchaseOrder.approvedAt = new Date();

    return await this.purchaseOrdersRepository.save(purchaseOrder);
  }

  async receive(
    id: string,
    receiveDto: ReceivePurchaseOrderDto,
    userId?: string,
  ): Promise<PurchaseOrder> {
    const purchaseOrder = await this.findOne(id);

    if (purchaseOrder.status !== 'approved' && purchaseOrder.status !== 'partially_received') {
      throw new BadRequestException(
        'Only approved or partially received purchase orders can be received',
      );
    }

    // Update quantities received for each item
    for (const receivedItem of receiveDto.items) {
      const item = purchaseOrder.items.find(
        (i) => i.productId === receivedItem.productId,
      );

      if (!item) {
        throw new BadRequestException(
          `Item with product ID ${receivedItem.productId} not found in purchase order`,
        );
      }

      item.quantityReceived += receivedItem.quantityReceived;

      if (item.quantityReceived > item.quantity) {
        throw new BadRequestException(
          `Received quantity (${item.quantityReceived}) exceeds ordered quantity (${item.quantity}) for product ${item.productName}`,
        );
      }

      await this.purchaseOrderItemsRepository.save(item);
    }

    // Check if all items are fully received
    const allItemsReceived = purchaseOrder.items.every(
      (item) => item.quantityReceived === item.quantity,
    );

    purchaseOrder.status = allItemsReceived ? 'received' : 'partially_received';
    purchaseOrder.actualDelivery = receiveDto.actualDelivery || new Date();
    purchaseOrder.receivedBy = userId;
    purchaseOrder.receivedAt = new Date();

    if (receiveDto.notes) {
      purchaseOrder.notes = purchaseOrder.notes
        ? `${purchaseOrder.notes}\n\nReceiving notes: ${receiveDto.notes}`
        : `Receiving notes: ${receiveDto.notes}`;
    }

    const savedPO = await this.purchaseOrdersRepository.save(purchaseOrder);

    // Update supplier statistics
    if (allItemsReceived) {
      await this.suppliersService.updatePerformanceStats(
        purchaseOrder.supplierId,
        {
          totalOrders: purchaseOrder.supplier.totalOrders + 1,
          totalSpent:
            Number(purchaseOrder.supplier.totalSpent) + Number(purchaseOrder.total),
          lastOrderDate: new Date(),
        },
      );
    }

    return savedPO;
  }

  async cancel(id: string): Promise<PurchaseOrder> {
    const purchaseOrder = await this.findOne(id);

    if (purchaseOrder.status === 'received') {
      throw new BadRequestException(
        'Received purchase orders cannot be cancelled',
      );
    }

    purchaseOrder.status = 'cancelled';
    return await this.purchaseOrdersRepository.save(purchaseOrder);
  }

  async getStats(): Promise<any> {
    const totalPOs = await this.purchaseOrdersRepository.count();

    const posByStatus = await this.purchaseOrdersRepository
      .createQueryBuilder('po')
      .select('po.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('po.status')
      .getRawMany();

    const allPOs = await this.purchaseOrdersRepository.find();

    const totalValue = allPOs.reduce(
      (sum, po) => sum + Number(po.total || 0),
      0,
    );
    const averageValue = totalPOs > 0 ? totalValue / totalPOs : 0;

    return {
      totalPurchaseOrders: totalPOs,
      totalValue,
      averageValue: parseFloat(averageValue.toFixed(2)),
      ordersByStatus: posByStatus.reduce((acc, item) => {
        acc[item.status || 'unknown'] = parseInt(item.count);
        return acc;
      }, {}),
    };
  }
}
