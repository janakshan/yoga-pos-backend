import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { RestaurantOrder } from '../entities/restaurant-order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { Table } from '../entities/table.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { User } from '../../users/entities/user.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { Product } from '../../products/entities/product.entity';
import {
  CreateOrderDto,
  UpdateOrderDto,
  FilterOrderDto,
  UpdateOrderStatusDto,
  AddOrderItemsDto,
  RemoveOrderItemsDto,
  UpdateOrderItemDto,
} from '../dto';
import {
  RestaurantOrderStatus,
  DiningType,
  OrderPriority,
  OrderPaymentStatus,
  KitchenStation,
  ORDER_STATUS_TRANSITIONS,
  TableStatus,
} from '../common/restaurant.constants';
import { RestaurantOrdersGateway } from '../gateways/restaurant-orders.gateway';

@Injectable()
export class RestaurantOrdersService {
  constructor(
    @InjectRepository(RestaurantOrder)
    private readonly orderRepository: Repository<RestaurantOrder>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Table)
    private readonly tableRepository: Repository<Table>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @Inject(forwardRef(() => RestaurantOrdersGateway))
    private readonly ordersGateway: RestaurantOrdersGateway,
  ) {}

  /**
   * Generate unique order number
   */
  private async generateOrderNumber(branchId: string): Promise<string> {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');

    // Get count of orders today for this branch
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const count = await this.orderRepository.count({
      where: {
        branchId,
        createdAt: Between(startOfDay, endOfDay),
      },
    });

    const sequence = (count + 1).toString().padStart(4, '0');
    return `ORD-${year}${month}${day}-${sequence}`;
  }

  /**
   * Calculate order totals from items
   */
  private calculateOrderTotals(
    items: OrderItem[],
    discount: number = 0,
    deliveryFee: number = 0,
  ): { subtotal: number; tax: number; total: number } {
    const subtotal = items.reduce(
      (sum, item) => sum + Number(item.subtotal),
      0,
    );
    const tax = items.reduce((sum, item) => sum + Number(item.tax), 0);
    const total = subtotal + tax - discount + deliveryFee;

    return {
      subtotal: Number(subtotal.toFixed(2)),
      tax: Number(tax.toFixed(2)),
      total: Number(total.toFixed(2)),
    };
  }

  /**
   * Calculate item pricing
   */
  private calculateItemPricing(
    unitPrice: number,
    quantity: number,
    modifiers: any[] = [],
    discount: number = 0,
    taxRate: number = 0,
  ): { subtotal: number; tax: number; total: number } {
    // Calculate modifier adjustments
    const modifierTotal = modifiers.reduce((sum, modifier) => {
      const optionsTotal = modifier.options.reduce(
        (optSum: number, opt: any) => optSum + Number(opt.priceAdjustment || 0),
        0,
      );
      return sum + optionsTotal;
    }, 0);

    const adjustedPrice = unitPrice + modifierTotal;
    const subtotal = adjustedPrice * quantity - discount;
    const tax = subtotal * (taxRate / 100);
    const total = subtotal + tax;

    return {
      subtotal: Number(subtotal.toFixed(2)),
      tax: Number(tax.toFixed(2)),
      total: Number(total.toFixed(2)),
    };
  }

  /**
   * Determine kitchen station based on product category
   */
  private async determineKitchenStation(
    product: Product,
    specifiedStation?: KitchenStation,
  ): Promise<KitchenStation> {
    if (specifiedStation) {
      return specifiedStation;
    }

    // Default logic based on product attributes
    // This can be extended based on product.category or other attributes
    return KitchenStation.GENERAL;
  }

  /**
   * Add audit log entry
   */
  private addAuditLogEntry(
    order: RestaurantOrder,
    userId: string,
    userName: string,
    action: string,
    previousValue?: any,
    newValue?: any,
    notes?: string,
  ): void {
    if (!order.auditLog) {
      order.auditLog = [];
    }

    order.auditLog.push({
      timestamp: new Date(),
      userId,
      userName,
      action,
      previousValue,
      newValue,
      notes,
    });
  }

  /**
   * Create a new restaurant order
   */
  async create(
    createOrderDto: CreateOrderDto,
    userId: string,
    userName: string,
  ): Promise<RestaurantOrder> {
    // Verify branch exists
    const branch = await this.branchRepository.findOne({
      where: { id: createOrderDto.branchId },
    });
    if (!branch) {
      throw new NotFoundException(
        `Branch with ID ${createOrderDto.branchId} not found`,
      );
    }

    // Verify server exists
    const server = await this.userRepository.findOne({
      where: { id: createOrderDto.serverId },
    });
    if (!server) {
      throw new NotFoundException(
        `Server with ID ${createOrderDto.serverId} not found`,
      );
    }

    // Validate table for dine-in orders
    let table: Table | null = null;
    if (createOrderDto.serviceType === DiningType.DINE_IN) {
      if (!createOrderDto.tableId) {
        throw new BadRequestException(
          'Table ID is required for dine-in orders',
        );
      }

      table = await this.tableRepository.findOne({
        where: { id: createOrderDto.tableId },
      });
      if (!table) {
        throw new NotFoundException(
          `Table with ID ${createOrderDto.tableId} not found`,
        );
      }

      // Check table status
      if (table.status === TableStatus.OUT_OF_SERVICE) {
        throw new BadRequestException('This table is out of service');
      }

      // Mark table as occupied
      table.status = TableStatus.OCCUPIED;
    }

    // Validate delivery requirements
    if (createOrderDto.serviceType === DiningType.DELIVERY) {
      if (!createOrderDto.deliveryAddress || !createOrderDto.deliveryPhone) {
        throw new BadRequestException(
          'Delivery address and phone are required for delivery orders',
        );
      }
    }

    // Verify customer if provided
    if (createOrderDto.customerId) {
      const customer = await this.customerRepository.findOne({
        where: { id: createOrderDto.customerId },
      });
      if (!customer) {
        throw new NotFoundException(
          `Customer with ID ${createOrderDto.customerId} not found`,
        );
      }
    }

    // Generate order number
    const orderNumber = await this.generateOrderNumber(
      createOrderDto.branchId,
    );

    // Create order items
    const orderItems: OrderItem[] = [];
    for (const itemDto of createOrderDto.items) {
      const product = await this.productRepository.findOne({
        where: { id: itemDto.productId },
      });
      if (!product) {
        throw new NotFoundException(
          `Product with ID ${itemDto.productId} not found`,
        );
      }

      // Use provided unit price or product price
      const unitPrice = itemDto.unitPrice ?? Number(product.price);

      // Calculate item pricing
      const pricing = this.calculateItemPricing(
        unitPrice,
        itemDto.quantity,
        itemDto.modifiers,
        0,
        Number(product.taxRate || 0),
      );

      // Determine kitchen station
      const kitchenStation = await this.determineKitchenStation(
        product,
        itemDto.kitchenStation,
      );

      const orderItem = this.orderItemRepository.create({
        productId: itemDto.productId,
        productName: product.name,
        quantity: itemDto.quantity,
        unitPrice,
        ...pricing,
        kitchenStation,
        course: itemDto.course,
        specialInstructions: itemDto.specialInstructions,
        notes: itemDto.notes,
        modifiers: itemDto.modifiers,
        isCombo: itemDto.isCombo,
        comboGroupId: itemDto.comboGroupId,
        status: RestaurantOrderStatus.PENDING,
      });

      orderItems.push(orderItem);
    }

    // Calculate order totals
    const totals = this.calculateOrderTotals(
      orderItems,
      createOrderDto.discount,
      createOrderDto.deliveryFee,
    );

    // Create order
    const order = this.orderRepository.create({
      orderNumber,
      branchId: createOrderDto.branchId,
      tableId: createOrderDto.tableId,
      customerId: createOrderDto.customerId,
      serverId: createOrderDto.serverId,
      serviceType: createOrderDto.serviceType,
      priority: createOrderDto.priority || OrderPriority.NORMAL,
      status: RestaurantOrderStatus.PENDING,
      paymentStatus: OrderPaymentStatus.UNPAID,
      ...totals,
      discount: createOrderDto.discount || 0,
      guestCount: createOrderDto.guestCount,
      specialInstructions: createOrderDto.specialInstructions,
      notes: createOrderDto.notes,
      deliveryAddress: createOrderDto.deliveryAddress,
      deliveryPhone: createOrderDto.deliveryPhone,
      deliveryFee: createOrderDto.deliveryFee || 0,
      metadata: createOrderDto.metadata,
      items: orderItems,
    });

    // Add audit log
    this.addAuditLogEntry(
      order,
      userId,
      userName,
      'ORDER_CREATED',
      null,
      { status: RestaurantOrderStatus.PENDING },
      'Order created',
    );

    // Save order (cascade will save items)
    const savedOrder = await this.orderRepository.save(order);

    // Update table if dine-in
    if (table) {
      table.currentOrderId = savedOrder.id;
      await this.tableRepository.save(table);
    }

    // Emit WebSocket event
    this.ordersGateway.emitOrderCreated(savedOrder);

    return savedOrder;
  }

  /**
   * Find all orders with filtering and pagination
   */
  async findAll(filterDto: FilterOrderDto): Promise<{
    data: RestaurantOrder[];
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
      branchId,
      tableId,
      customerId,
      serverId,
      status,
      serviceType,
      priority,
      paymentStatus,
      startDate,
      endDate,
      orderNumber,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = filterDto;

    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.branch', 'branch')
      .leftJoinAndSelect('order.table', 'table')
      .leftJoinAndSelect('order.customer', 'customer')
      .leftJoinAndSelect('order.server', 'server')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product');

    // Apply filters
    if (branchId) {
      queryBuilder.andWhere('order.branchId = :branchId', { branchId });
    }

    if (tableId) {
      queryBuilder.andWhere('order.tableId = :tableId', { tableId });
    }

    if (customerId) {
      queryBuilder.andWhere('order.customerId = :customerId', { customerId });
    }

    if (serverId) {
      queryBuilder.andWhere('order.serverId = :serverId', { serverId });
    }

    if (status) {
      queryBuilder.andWhere('order.status = :status', { status });
    }

    if (serviceType) {
      queryBuilder.andWhere('order.serviceType = :serviceType', {
        serviceType,
      });
    }

    if (priority) {
      queryBuilder.andWhere('order.priority = :priority', { priority });
    }

    if (paymentStatus) {
      queryBuilder.andWhere('order.paymentStatus = :paymentStatus', {
        paymentStatus,
      });
    }

    if (orderNumber) {
      queryBuilder.andWhere('order.orderNumber ILIKE :orderNumber', {
        orderNumber: `%${orderNumber}%`,
      });
    }

    if (startDate) {
      queryBuilder.andWhere('order.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('order.createdAt <= :endDate', { endDate });
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination and sorting
    const data = await queryBuilder
      .orderBy(`order.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

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

  /**
   * Find one order by ID
   */
  async findOne(id: string): Promise<RestaurantOrder> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: [
        'branch',
        'table',
        'customer',
        'server',
        'items',
        'items.product',
      ],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  /**
   * Update order status with state machine validation
   */
  async updateStatus(
    id: string,
    updateStatusDto: UpdateOrderStatusDto,
    userId: string,
    userName: string,
  ): Promise<RestaurantOrder> {
    const order = await this.findOne(id);

    // Validate status transition
    const allowedTransitions = ORDER_STATUS_TRANSITIONS[order.status];
    if (!allowedTransitions.includes(updateStatusDto.status)) {
      throw new BadRequestException(
        `Cannot transition from ${order.status} to ${updateStatusDto.status}`,
      );
    }

    // Validate cancellation reason
    if (
      updateStatusDto.status === RestaurantOrderStatus.CANCELLED &&
      !updateStatusDto.reason
    ) {
      throw new BadRequestException(
        'Cancellation reason is required when cancelling an order',
      );
    }

    const previousStatus = order.status;
    order.status = updateStatusDto.status;

    // Update timestamp fields based on status
    const now = new Date();
    switch (updateStatusDto.status) {
      case RestaurantOrderStatus.CONFIRMED:
        order.confirmedAt = now;
        break;
      case RestaurantOrderStatus.PREPARING:
        order.preparingAt = now;
        // Update all items to preparing
        order.items.forEach((item) => {
          item.status = RestaurantOrderStatus.PREPARING;
          item.sentToKitchenAt = now;
        });
        break;
      case RestaurantOrderStatus.READY:
        order.readyAt = now;
        // Update all items to ready
        order.items.forEach((item) => {
          item.status = RestaurantOrderStatus.READY;
          item.completedAt = now;
        });
        break;
      case RestaurantOrderStatus.SERVED:
        order.servedAt = now;
        break;
      case RestaurantOrderStatus.COMPLETED:
        order.completedAt = now;
        // Free up table if dine-in
        if (order.tableId) {
          const table = await this.tableRepository.findOne({
            where: { id: order.tableId },
          });
          if (table && table.currentOrderId === order.id) {
            table.status = TableStatus.CLEANING;
            table.currentOrderId = null;
            await this.tableRepository.save(table);
          }
        }
        break;
      case RestaurantOrderStatus.CANCELLED:
        order.cancelledAt = now;
        order.cancellationReason = updateStatusDto.reason;
        // Free up table if dine-in
        if (order.tableId) {
          const table = await this.tableRepository.findOne({
            where: { id: order.tableId },
          });
          if (table && table.currentOrderId === order.id) {
            table.status = TableStatus.AVAILABLE;
            table.currentOrderId = null;
            await this.tableRepository.save(table);
          }
        }
        break;
    }

    // Add audit log
    this.addAuditLogEntry(
      order,
      userId,
      userName,
      'STATUS_UPDATED',
      previousStatus,
      updateStatusDto.status,
      updateStatusDto.notes || updateStatusDto.reason,
    );

    const savedOrder = await this.orderRepository.save(order);

    // Emit WebSocket event
    this.ordersGateway.emitOrderStatusChanged(
      savedOrder,
      previousStatus,
      updateStatusDto.status,
    );

    // Emit special events for specific statuses
    if (updateStatusDto.status === RestaurantOrderStatus.CANCELLED) {
      this.ordersGateway.emitOrderCancelled(
        savedOrder,
        updateStatusDto.reason || 'No reason provided',
      );
    } else if (updateStatusDto.status === RestaurantOrderStatus.COMPLETED) {
      this.ordersGateway.emitOrderCompleted(savedOrder);
    }

    return savedOrder;
  }

  /**
   * Update order details
   */
  async update(
    id: string,
    updateOrderDto: UpdateOrderDto,
    userId: string,
    userName: string,
  ): Promise<RestaurantOrder> {
    const order = await this.findOne(id);

    // Don't allow updates to completed or cancelled orders
    if (
      order.status === RestaurantOrderStatus.COMPLETED ||
      order.status === RestaurantOrderStatus.CANCELLED
    ) {
      throw new ForbiddenException(
        'Cannot update completed or cancelled orders',
      );
    }

    // Update allowed fields
    Object.assign(order, updateOrderDto);

    // Add audit log
    this.addAuditLogEntry(
      order,
      userId,
      userName,
      'ORDER_UPDATED',
      null,
      updateOrderDto,
      'Order details updated',
    );

    const savedOrder = await this.orderRepository.save(order);

    // Emit WebSocket event
    this.ordersGateway.emitOrderUpdated(savedOrder);

    return savedOrder;
  }

  /**
   * Add items to existing order
   */
  async addItems(
    id: string,
    addItemsDto: AddOrderItemsDto,
    userId: string,
    userName: string,
  ): Promise<RestaurantOrder> {
    const order = await this.findOne(id);

    // Don't allow adding items to completed or cancelled orders
    if (
      order.status === RestaurantOrderStatus.COMPLETED ||
      order.status === RestaurantOrderStatus.CANCELLED
    ) {
      throw new ForbiddenException(
        'Cannot add items to completed or cancelled orders',
      );
    }

    const newItems: OrderItem[] = [];
    for (const itemDto of addItemsDto.items) {
      const product = await this.productRepository.findOne({
        where: { id: itemDto.productId },
      });
      if (!product) {
        throw new NotFoundException(
          `Product with ID ${itemDto.productId} not found`,
        );
      }

      const unitPrice = itemDto.unitPrice ?? Number(product.price);
      const pricing = this.calculateItemPricing(
        unitPrice,
        itemDto.quantity,
        itemDto.modifiers,
        0,
        Number(product.taxRate || 0),
      );

      const kitchenStation = await this.determineKitchenStation(
        product,
        itemDto.kitchenStation,
      );

      const orderItem = this.orderItemRepository.create({
        orderId: order.id,
        productId: itemDto.productId,
        productName: product.name,
        quantity: itemDto.quantity,
        unitPrice,
        ...pricing,
        kitchenStation,
        course: itemDto.course,
        specialInstructions: itemDto.specialInstructions,
        notes: itemDto.notes,
        modifiers: itemDto.modifiers,
        isCombo: itemDto.isCombo,
        comboGroupId: itemDto.comboGroupId,
        status: RestaurantOrderStatus.PENDING,
        isModified: true,
        modificationType: 'added',
      });

      newItems.push(orderItem);
    }

    // Save new items
    const savedItems = await this.orderItemRepository.save(newItems);

    // Update order totals
    order.items.push(...savedItems);
    const totals = this.calculateOrderTotals(
      order.items,
      Number(order.discount),
      Number(order.deliveryFee),
    );
    Object.assign(order, totals);

    // Add audit log
    this.addAuditLogEntry(
      order,
      userId,
      userName,
      'ITEMS_ADDED',
      null,
      { itemCount: newItems.length },
      `Added ${newItems.length} item(s) to order`,
    );

    const savedOrder = await this.orderRepository.save(order);

    // Emit WebSocket event
    this.ordersGateway.emitOrderItemsAdded(savedOrder, savedItems);

    return savedOrder;
  }

  /**
   * Remove items from order
   */
  async removeItems(
    id: string,
    removeItemsDto: RemoveOrderItemsDto,
    userId: string,
    userName: string,
  ): Promise<RestaurantOrder> {
    const order = await this.findOne(id);

    // Don't allow removing items from completed or cancelled orders
    if (
      order.status === RestaurantOrderStatus.COMPLETED ||
      order.status === RestaurantOrderStatus.CANCELLED
    ) {
      throw new ForbiddenException(
        'Cannot remove items from completed or cancelled orders',
      );
    }

    // Verify all items belong to this order
    const itemsToRemove = await this.orderItemRepository.find({
      where: {
        id: In(removeItemsDto.itemIds),
        orderId: id,
      },
    });

    if (itemsToRemove.length !== removeItemsDto.itemIds.length) {
      throw new BadRequestException('Some items do not belong to this order');
    }

    // Don't allow removing all items
    if (itemsToRemove.length === order.items.length) {
      throw new BadRequestException(
        'Cannot remove all items. Cancel the order instead.',
      );
    }

    // Remove items
    await this.orderItemRepository.remove(itemsToRemove);

    // Refresh order and recalculate totals
    const updatedOrder = await this.findOne(id);
    const totals = this.calculateOrderTotals(
      updatedOrder.items,
      Number(updatedOrder.discount),
      Number(updatedOrder.deliveryFee),
    );
    Object.assign(updatedOrder, totals);

    // Add audit log
    this.addAuditLogEntry(
      updatedOrder,
      userId,
      userName,
      'ITEMS_REMOVED',
      null,
      { itemIds: removeItemsDto.itemIds },
      `Removed ${itemsToRemove.length} item(s) from order`,
    );

    const savedOrder = await this.orderRepository.save(updatedOrder);

    // Emit WebSocket event
    this.ordersGateway.emitOrderItemsRemoved(savedOrder, removeItemsDto.itemIds);

    return savedOrder;
  }

  /**
   * Update order item
   */
  async updateItem(
    orderId: string,
    itemId: string,
    updateItemDto: UpdateOrderItemDto,
    userId: string,
    userName: string,
  ): Promise<RestaurantOrder> {
    const order = await this.findOne(orderId);

    // Don't allow updating items in completed or cancelled orders
    if (
      order.status === RestaurantOrderStatus.COMPLETED ||
      order.status === RestaurantOrderStatus.CANCELLED
    ) {
      throw new ForbiddenException(
        'Cannot update items in completed or cancelled orders',
      );
    }

    const item = order.items.find((i) => i.id === itemId);
    if (!item) {
      throw new NotFoundException(
        `Order item with ID ${itemId} not found in this order`,
      );
    }

    // If quantity is being updated, recalculate pricing
    if (updateItemDto.quantity !== undefined) {
      const pricing = this.calculateItemPricing(
        Number(item.unitPrice),
        updateItemDto.quantity,
        item.modifiers,
        0,
        Number(item.tax / item.subtotal) * 100, // Extract tax rate
      );
      Object.assign(item, { quantity: updateItemDto.quantity, ...pricing });
      item.isModified = true;
      item.modificationType = 'quantity_changed';
    }

    // Update other fields
    if (updateItemDto.kitchenStation !== undefined) {
      item.kitchenStation = updateItemDto.kitchenStation;
    }
    if (updateItemDto.course !== undefined) {
      item.course = updateItemDto.course;
    }
    if (updateItemDto.status !== undefined) {
      item.status = updateItemDto.status;
    }
    if (updateItemDto.specialInstructions !== undefined) {
      item.specialInstructions = updateItemDto.specialInstructions;
      item.isModified = true;
      item.modificationType = 'customization_changed';
    }
    if (updateItemDto.notes !== undefined) {
      item.notes = updateItemDto.notes;
    }

    await this.orderItemRepository.save(item);

    // Recalculate order totals
    const updatedOrder = await this.findOne(orderId);
    const totals = this.calculateOrderTotals(
      updatedOrder.items,
      Number(updatedOrder.discount),
      Number(updatedOrder.deliveryFee),
    );
    Object.assign(updatedOrder, totals);

    // Add audit log
    this.addAuditLogEntry(
      updatedOrder,
      userId,
      userName,
      'ITEM_UPDATED',
      null,
      { itemId, changes: updateItemDto },
      'Order item updated',
    );

    const savedOrder = await this.orderRepository.save(updatedOrder);

    // Find the updated item to emit
    const updatedItem = savedOrder.items.find((i) => i.id === itemId);
    if (updatedItem) {
      // Emit WebSocket event
      this.ordersGateway.emitOrderItemUpdated(savedOrder, updatedItem);
    }

    return savedOrder;
  }

  /**
   * Get orders by kitchen station
   */
  async getOrdersByKitchenStation(
    branchId: string,
    kitchenStation: KitchenStation,
  ): Promise<OrderItem[]> {
    return await this.orderItemRepository
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.order', 'order')
      .leftJoinAndSelect('item.product', 'product')
      .where('order.branchId = :branchId', { branchId })
      .andWhere('item.kitchenStation = :kitchenStation', { kitchenStation })
      .andWhere('item.status IN (:...statuses)', {
        statuses: [
          RestaurantOrderStatus.CONFIRMED,
          RestaurantOrderStatus.PREPARING,
        ],
      })
      .orderBy('order.priority', 'DESC')
      .addOrderBy('order.createdAt', 'ASC')
      .getMany();
  }

  /**
   * Delete order (soft delete - mark as cancelled)
   */
  async remove(
    id: string,
    reason: string,
    userId: string,
    userName: string,
  ): Promise<void> {
    const order = await this.findOne(id);

    if (order.status === RestaurantOrderStatus.COMPLETED) {
      throw new ForbiddenException('Cannot delete completed orders');
    }

    await this.updateStatus(
      id,
      {
        status: RestaurantOrderStatus.CANCELLED,
        reason,
      },
      userId,
      userName,
    );
  }

  /**
   * Reorder - Create a new order based on a previous order
   */
  async reorder(
    originalOrderId: string,
    createOrderDto: Partial<CreateOrderDto>,
  ): Promise<RestaurantOrder> {
    // Get the original order with all items
    const originalOrder = await this.findOne(originalOrderId);

    if (!originalOrder) {
      throw new NotFoundException('Original order not found');
    }

    // Create new order DTO based on original order
    const newOrderDto: CreateOrderDto = {
      branchId: createOrderDto.branchId || originalOrder.branchId,
      serviceType: createOrderDto.serviceType || originalOrder.serviceType,
      serverId: createOrderDto.serverId || originalOrder.serverId,
      tableId: createOrderDto.tableId || originalOrder.tableId,
      customerId: createOrderDto.customerId || originalOrder.customerId,
      priority: createOrderDto.priority || originalOrder.priority,
      guestCount: createOrderDto.guestCount || originalOrder.guestCount,
      specialInstructions:
        createOrderDto.specialInstructions ||
        originalOrder.specialInstructions,
      notes: createOrderDto.notes || `Reorder of ${originalOrder.orderNumber}`,
      discount: createOrderDto.discount || Number(originalOrder.discount),
      deliveryAddress:
        createOrderDto.deliveryAddress || originalOrder.deliveryAddress,
      deliveryPhone:
        createOrderDto.deliveryPhone || originalOrder.deliveryPhone,
      deliveryFee: createOrderDto.deliveryFee || Number(originalOrder.deliveryFee),
      items: originalOrder.items.map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        kitchenStation: item.kitchenStation,
        course: item.course,
        specialInstructions: item.specialInstructions,
        notes: item.notes,
        modifiers: item.modifiers,
        isCombo: item.isCombo,
        comboGroupId: item.comboGroupId,
        seatNumber: item.seatNumber,
      })),
      metadata: {
        ...createOrderDto.metadata,
        reorderedFrom: originalOrderId,
        originalOrderNumber: originalOrder.orderNumber,
      },
    };

    // Create the new order
    return this.create(newOrderDto);
  }
}
