import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  In,
  Between,
  MoreThanOrEqual,
  LessThanOrEqual,
  IsNull,
  Not,
} from 'typeorm';
import { KitchenStation } from '../entities/kitchen-station.entity';
import { OrderItem } from '../entities/order-item.entity';
import { RestaurantOrder } from '../entities/restaurant-order.entity';
import {
  CreateKitchenStationDto,
  UpdateKitchenStationDto,
  FilterKitchenQueueDto,
  MarkItemReadyDto,
  BumpOrderItemDto,
  BumpOrderDto,
  RecallOrderDto,
  KitchenPerformanceQueryDto,
  KitchenMetricsResponseDto,
  KitchenOrderDisplayDto,
  KitchenOrderItemDto,
} from '../dto';
import {
  KitchenStation as KitchenStationType,
  RestaurantOrderStatus,
  OrderPriority,
  CourseTiming,
} from '../common/restaurant.constants';

@Injectable()
export class KitchenService {
  private readonly logger = new Logger(KitchenService.name);

  constructor(
    @InjectRepository(KitchenStation)
    private readonly kitchenStationRepository: Repository<KitchenStation>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(RestaurantOrder)
    private readonly orderRepository: Repository<RestaurantOrder>,
  ) {}

  // ============================================================================
  // KITCHEN STATION MANAGEMENT
  // ============================================================================

  /**
   * Create a new kitchen station
   */
  async createStation(
    createDto: CreateKitchenStationDto,
  ): Promise<KitchenStation> {
    const station = this.kitchenStationRepository.create(createDto);
    return await this.kitchenStationRepository.save(station);
  }

  /**
   * Update kitchen station
   */
  async updateStation(
    id: string,
    updateDto: UpdateKitchenStationDto,
  ): Promise<KitchenStation> {
    const station = await this.kitchenStationRepository.findOne({
      where: { id },
    });

    if (!station) {
      throw new NotFoundException(`Kitchen station with ID ${id} not found`);
    }

    Object.assign(station, updateDto);
    return await this.kitchenStationRepository.save(station);
  }

  /**
   * Get kitchen station by ID
   */
  async getStation(id: string): Promise<KitchenStation> {
    const station = await this.kitchenStationRepository.findOne({
      where: { id },
    });

    if (!station) {
      throw new NotFoundException(`Kitchen station with ID ${id} not found`);
    }

    return station;
  }

  /**
   * Get all kitchen stations for a branch
   */
  async getStationsByBranch(branchId: string): Promise<KitchenStation[]> {
    return await this.kitchenStationRepository.find({
      where: { branchId, isActive: true },
      order: { displayOrder: 'ASC' },
    });
  }

  /**
   * Delete kitchen station
   */
  async deleteStation(id: string): Promise<void> {
    const result = await this.kitchenStationRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Kitchen station with ID ${id} not found`);
    }
  }

  // ============================================================================
  // ORDER QUEUE QUERIES
  // ============================================================================

  /**
   * Get kitchen queue for display
   * Returns orders and items filtered by station with timing calculations
   */
  async getKitchenQueue(
    filter: FilterKitchenQueueDto,
  ): Promise<{
    orders: KitchenOrderDisplayDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      branchId,
      station,
      status,
      priority,
      course,
      overdueOnly,
      warningOnly,
      sortBy = 'createdAt',
      sortOrder = 'ASC',
      page = 1,
      limit = 20,
    } = filter;

    // Build query for orders
    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('order.table', 'table')
      .where('order.status IN (:...statuses)', {
        statuses: status || [
          RestaurantOrderStatus.CONFIRMED,
          RestaurantOrderStatus.PREPARING,
        ],
      });

    if (branchId) {
      queryBuilder.andWhere('order.branchId = :branchId', { branchId });
    }

    if (station) {
      queryBuilder.andWhere('items.kitchenStation = :station', { station });
    }

    if (priority && priority.length > 0) {
      queryBuilder.andWhere('order.priority IN (:...priority)', { priority });
    }

    if (course) {
      queryBuilder.andWhere('items.course = :course', { course });
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply sorting
    const priorityOrder = {
      [OrderPriority.URGENT]: 0,
      [OrderPriority.HIGH]: 1,
      [OrderPriority.NORMAL]: 2,
      [OrderPriority.LOW]: 3,
    };

    let orders = await queryBuilder.getMany();

    // Calculate timing and filter
    const now = new Date();
    const processedOrders = orders.map((order) =>
      this.mapToKitchenOrderDisplay(order, now),
    );

    let filteredOrders = processedOrders;

    if (overdueOnly) {
      filteredOrders = filteredOrders.filter((o) => o.hasOverdueItems);
    }

    if (warningOnly) {
      filteredOrders = filteredOrders.filter((o) => o.hasWarningItems);
    }

    // Apply sorting
    if (sortBy === 'priority') {
      filteredOrders.sort((a, b) => {
        const priorityDiff =
          priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return a.orderAge - b.orderAge; // Secondary sort by age
      });
    } else if (sortBy === 'age') {
      filteredOrders.sort((a, b) =>
        sortOrder === 'ASC' ? a.orderAge - b.orderAge : b.orderAge - a.orderAge,
      );
    } else if (sortBy === 'prepTime') {
      filteredOrders.sort((a, b) => {
        const aTime = a.estimatedPrepTime || 0;
        const bTime = b.estimatedPrepTime || 0;
        return sortOrder === 'ASC' ? aTime - bTime : bTime - aTime;
      });
    } else {
      // Default: sort by createdAt
      filteredOrders.sort((a, b) => {
        const aTime = new Date(a.createdAt).getTime();
        const bTime = new Date(b.createdAt).getTime();
        return sortOrder === 'ASC' ? aTime - bTime : bTime - aTime;
      });
    }

    // Apply pagination
    const skip = (page - 1) * limit;
    const paginatedOrders = filteredOrders.slice(skip, skip + limit);

    return {
      orders: paginatedOrders,
      total: filteredOrders.length,
      page,
      limit,
    };
  }

  /**
   * Get active orders for a specific station
   */
  async getStationOrders(
    branchId: string,
    station: KitchenStationType,
  ): Promise<KitchenOrderDisplayDto[]> {
    const result = await this.getKitchenQueue({
      branchId,
      station,
      status: [RestaurantOrderStatus.CONFIRMED, RestaurantOrderStatus.PREPARING],
      sortBy: 'priority',
    });

    return result.orders;
  }

  // ============================================================================
  // ORDER TIMER AND AGING LOGIC
  // ============================================================================

  /**
   * Calculate order age in minutes
   */
  private calculateOrderAge(order: RestaurantOrder): number {
    const startTime = order.confirmedAt || order.createdAt;
    const now = new Date();
    const ageMs = now.getTime() - new Date(startTime).getTime();
    return Math.floor(ageMs / 60000); // Convert to minutes
  }

  /**
   * Calculate item age in minutes
   */
  private calculateItemAge(item: OrderItem): number {
    const startTime = item.sentToKitchenAt || item.createdAt;
    const now = new Date();
    const ageMs = now.getTime() - new Date(startTime).getTime();
    return Math.floor(ageMs / 60000); // Convert to minutes
  }

  /**
   * Check if item is overdue
   */
  private async isItemOverdue(item: OrderItem): Promise<boolean> {
    const age = this.calculateItemAge(item);
    const prepTime = item.preparationTime || 15; // Default 15 minutes

    // Get station configuration for thresholds
    const station = await this.kitchenStationRepository.findOne({
      where: {
        stationType: item.kitchenStation,
      },
    });

    const threshold = station?.criticalThreshold || 5;
    return age > prepTime + threshold;
  }

  /**
   * Check if item is in warning state
   */
  private async isItemInWarning(item: OrderItem): Promise<boolean> {
    const age = this.calculateItemAge(item);
    const prepTime = item.preparationTime || 15;

    const station = await this.kitchenStationRepository.findOne({
      where: {
        stationType: item.kitchenStation,
      },
    });

    const threshold = station?.warningThreshold || 10;
    return age > prepTime - threshold && age <= prepTime;
  }

  /**
   * Map order to kitchen display DTO with timing calculations
   */
  private mapToKitchenOrderDisplay(
    order: RestaurantOrder,
    now: Date = new Date(),
  ): KitchenOrderDisplayDto {
    const orderAge = this.calculateOrderAge(order);

    const items: KitchenOrderItemDto[] = order.items.map((item) => {
      const itemAge = this.calculateItemAge(item);
      const prepTime = item.preparationTime || 15;

      // Simple synchronous checks (will be enhanced with async station lookup)
      const isOverdue = itemAge > prepTime + 5;
      const isWarning = itemAge > prepTime - 10 && !isOverdue;

      return {
        id: item.id,
        productName: item.productName,
        quantity: Number(item.quantity),
        specialInstructions: item.specialInstructions,
        modifiers: item.modifiers,
        course: item.course,
        status: item.status,
        preparationTime: item.preparationTime,
        age: itemAge,
        isOverdue,
        isWarning,
        sentToKitchenAt: item.sentToKitchenAt,
        startedPreparingAt: item.startedPreparingAt,
        completedAt: item.completedAt,
      };
    });

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      tableNumber: order.table?.tableNumber,
      serviceType: order.serviceType,
      priority: order.priority,
      status: order.status,
      specialInstructions: order.specialInstructions,
      guestCount: order.guestCount,
      items,
      orderAge,
      hasOverdueItems: items.some((i) => i.isOverdue),
      hasWarningItems: items.some((i) => i.isWarning),
      createdAt: order.createdAt,
      confirmedAt: order.confirmedAt,
      estimatedPrepTime: order.estimatedPrepTime,
    };
  }

  // ============================================================================
  // MARK READY / BUMP OPERATIONS
  // ============================================================================

  /**
   * Mark an order item as ready
   */
  async markItemReady(dto: MarkItemReadyDto): Promise<OrderItem> {
    const item = await this.orderItemRepository.findOne({
      where: { id: dto.itemId },
      relations: ['order'],
    });

    if (!item) {
      throw new NotFoundException(`Order item with ID ${dto.itemId} not found`);
    }

    if (item.status === RestaurantOrderStatus.READY) {
      throw new BadRequestException('Item is already marked as ready');
    }

    // Update item status
    item.status = RestaurantOrderStatus.READY;
    item.completedAt = new Date();

    if (dto.notes) {
      item.notes = dto.notes;
    }

    const updatedItem = await this.orderItemRepository.save(item);

    // Check if all items in order are ready
    await this.checkAndUpdateOrderStatus(item.orderId);

    this.logger.log(
      `Item ${item.id} marked as ready for order ${item.orderId}`,
    );

    return updatedItem;
  }

  /**
   * Bump (remove from display) an order item
   */
  async bumpOrderItem(dto: BumpOrderItemDto): Promise<OrderItem> {
    const item = await this.orderItemRepository.findOne({
      where: { id: dto.itemId },
      relations: ['order'],
    });

    if (!item) {
      throw new NotFoundException(`Order item with ID ${dto.itemId} not found`);
    }

    // Mark as served (bumped from kitchen display)
    item.status = RestaurantOrderStatus.SERVED;

    if (dto.reason) {
      item.notes = dto.reason;
    }

    const updatedItem = await this.orderItemRepository.save(item);

    // Check if all items are served
    await this.checkAndUpdateOrderStatus(item.orderId);

    this.logger.log(
      `Item ${item.id} bumped from kitchen display for order ${item.orderId}`,
    );

    return updatedItem;
  }

  /**
   * Bump entire order
   */
  async bumpOrder(dto: BumpOrderDto): Promise<RestaurantOrder> {
    const order = await this.orderRepository.findOne({
      where: { id: dto.orderId },
      relations: ['items'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${dto.orderId} not found`);
    }

    const itemsToBump = dto.itemIds
      ? order.items.filter((item) => dto.itemIds.includes(item.id))
      : order.items;

    // Update all items to served
    for (const item of itemsToBump) {
      item.status = RestaurantOrderStatus.SERVED;
      if (dto.reason) {
        item.notes = dto.reason;
      }
    }

    await this.orderItemRepository.save(itemsToBump);

    // Update order status
    await this.checkAndUpdateOrderStatus(order.id);

    this.logger.log(`Order ${order.orderNumber} bumped from kitchen display`);

    return await this.orderRepository.findOne({
      where: { id: dto.orderId },
      relations: ['items', 'table'],
    });
  }

  /**
   * Recall order to kitchen display
   */
  async recallOrder(dto: RecallOrderDto): Promise<RestaurantOrder> {
    const order = await this.orderRepository.findOne({
      where: { id: dto.orderId },
      relations: ['items'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${dto.orderId} not found`);
    }

    // Set order back to preparing
    order.status = RestaurantOrderStatus.PREPARING;

    // Update items to preparing
    for (const item of order.items) {
      if (
        item.status === RestaurantOrderStatus.READY ||
        item.status === RestaurantOrderStatus.SERVED
      ) {
        item.status = RestaurantOrderStatus.PREPARING;
      }
    }

    await this.orderItemRepository.save(order.items);
    await this.orderRepository.save(order);

    this.logger.log(`Order ${order.orderNumber} recalled to kitchen display`);

    return await this.orderRepository.findOne({
      where: { id: dto.orderId },
      relations: ['items', 'table'],
    });
  }

  /**
   * Check order item statuses and update order status accordingly
   */
  private async checkAndUpdateOrderStatus(orderId: string): Promise<void> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['items'],
    });

    if (!order) return;

    const allReady = order.items.every(
      (item) => item.status === RestaurantOrderStatus.READY,
    );
    const allServed = order.items.every(
      (item) => item.status === RestaurantOrderStatus.SERVED,
    );

    if (allServed && order.status !== RestaurantOrderStatus.SERVED) {
      order.status = RestaurantOrderStatus.SERVED;
      order.servedAt = new Date();
      await this.orderRepository.save(order);
    } else if (allReady && order.status !== RestaurantOrderStatus.READY) {
      order.status = RestaurantOrderStatus.READY;
      order.readyAt = new Date();
      await this.orderRepository.save(order);
    }
  }

  // ============================================================================
  // PERFORMANCE METRICS
  // ============================================================================

  /**
   * Get kitchen performance metrics
   */
  async getPerformanceMetrics(
    query: KitchenPerformanceQueryDto,
  ): Promise<KitchenMetricsResponseDto> {
    const { branchId, station, startDate, endDate, groupBy } = query;

    // Default to last 24 hours if no dates provided
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 86400000);
    const end = endDate ? new Date(endDate) : new Date();

    // Build query
    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .where('order.branchId = :branchId', { branchId })
      .andWhere('order.createdAt BETWEEN :start AND :end', { start, end })
      .andWhere('order.status != :cancelled', {
        cancelled: RestaurantOrderStatus.CANCELLED,
      });

    if (station) {
      queryBuilder.andWhere('items.kitchenStation = :station', { station });
    }

    const orders = await queryBuilder.getMany();

    // Calculate metrics
    const totalOrders = orders.length;
    const allItems = orders.flatMap((o) => o.items);
    const totalItems = allItems.length;

    // Calculate average prep time
    const itemsWithPrepTime = allItems.filter(
      (item) => item.startedPreparingAt && item.completedAt,
    );

    const avgPrepTime =
      itemsWithPrepTime.length > 0
        ? itemsWithPrepTime.reduce((sum, item) => {
            const prepMs =
              new Date(item.completedAt).getTime() -
              new Date(item.startedPreparingAt).getTime();
            return sum + prepMs / 60000; // Convert to minutes
          }, 0) / itemsWithPrepTime.length
        : 0;

    // Calculate average completion time (from order creation to all items ready)
    const completedOrders = orders.filter((o) => o.readyAt);
    const avgCompletionTime =
      completedOrders.length > 0
        ? completedOrders.reduce((sum, order) => {
            const completionMs =
              new Date(order.readyAt).getTime() -
              new Date(order.createdAt).getTime();
            return sum + completionMs / 60000;
          }, 0) / completedOrders.length
        : 0;

    // Calculate on-time rate
    const onTimeItems = allItems.filter((item) => {
      if (!item.completedAt) return false;
      const age = this.calculateItemAge(item);
      const targetTime = item.preparationTime || 15;
      return age <= targetTime;
    });

    const onTimeRate =
      totalItems > 0 ? (onTimeItems.length / totalItems) * 100 : 0;

    // Count overdue and cancelled
    const now = new Date();
    const overdueItems = allItems.filter((item) => {
      if (item.status === RestaurantOrderStatus.READY) return false;
      const age = this.calculateItemAge(item);
      const targetTime = item.preparationTime || 15;
      return age > targetTime + 5;
    });

    const cancelledItems = allItems.filter(
      (item) => item.status === RestaurantOrderStatus.CANCELLED,
    );

    // Orders by priority
    const ordersByPriority = {
      low: orders.filter((o) => o.priority === OrderPriority.LOW).length,
      normal: orders.filter((o) => o.priority === OrderPriority.NORMAL).length,
      high: orders.filter((o) => o.priority === OrderPriority.HIGH).length,
      urgent: orders.filter((o) => o.priority === OrderPriority.URGENT).length,
    };

    // Items by course
    const itemsByCourse = {
      appetizer: allItems.filter((i) => i.course === CourseTiming.APPETIZER)
        .length,
      main_course: allItems.filter((i) => i.course === CourseTiming.MAIN_COURSE)
        .length,
      dessert: allItems.filter((i) => i.course === CourseTiming.DESSERT).length,
      beverage: allItems.filter((i) => i.course === CourseTiming.BEVERAGE)
        .length,
    };

    // Peak hour calculation
    const ordersByHour = new Map<number, number>();
    orders.forEach((order) => {
      const hour = new Date(order.createdAt).getHours();
      ordersByHour.set(hour, (ordersByHour.get(hour) || 0) + 1);
    });

    let peakHour: number | undefined;
    let maxOrders = 0;
    ordersByHour.forEach((count, hour) => {
      if (count > maxOrders) {
        maxOrders = count;
        peakHour = hour;
      }
    });

    return {
      totalOrders,
      totalItems,
      averagePrepTime: Math.round(avgPrepTime * 10) / 10,
      averageCompletionTime: Math.round(avgCompletionTime * 10) / 10,
      onTimeRate: Math.round(onTimeRate * 10) / 10,
      overdueCount: overdueItems.length,
      cancelledCount: cancelledItems.length,
      peakHour,
      ordersByPriority,
      itemsByCourse,
    };
  }

  // ============================================================================
  // COURSE SEQUENCING AND PRIORITY SORTING
  // ============================================================================

  /**
   * Get orders sorted by course sequence
   */
  async getOrdersByCourseSequence(
    branchId: string,
    station: KitchenStationType,
  ): Promise<KitchenOrderDisplayDto[]> {
    const result = await this.getKitchenQueue({
      branchId,
      station,
      status: [RestaurantOrderStatus.CONFIRMED, RestaurantOrderStatus.PREPARING],
    });

    // Sort by course timing
    const courseOrder = {
      [CourseTiming.APPETIZER]: 0,
      [CourseTiming.MAIN_COURSE]: 1,
      [CourseTiming.DESSERT]: 2,
      [CourseTiming.BEVERAGE]: 3,
    };

    result.orders.sort((a, b) => {
      // Group by table first
      const tableCompare = (a.tableNumber || '').localeCompare(
        b.tableNumber || '',
      );
      if (tableCompare !== 0) return tableCompare;

      // Then by course
      const aMinCourse = Math.min(
        ...a.items.map((i) => courseOrder[i.course] ?? 99),
      );
      const bMinCourse = Math.min(
        ...b.items.map((i) => courseOrder[i.course] ?? 99),
      );

      return aMinCourse - bMinCourse;
    });

    return result.orders;
  }

  /**
   * Get orders sorted by priority with intelligent sorting
   */
  async getOrdersByPriority(
    branchId: string,
    station?: KitchenStationType,
  ): Promise<KitchenOrderDisplayDto[]> {
    const result = await this.getKitchenQueue({
      branchId,
      station,
      sortBy: 'priority',
    });

    return result.orders;
  }
}
