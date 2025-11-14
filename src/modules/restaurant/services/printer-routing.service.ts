import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PrinterConfig } from '../entities/printer-config.entity';
import { RestaurantOrder } from '../entities/restaurant-order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { PrinterQueueService } from './printer-queue.service';
import {
  PrinterRoutingStrategy,
  PrinterStatus,
  PrintJobPriority,
} from '../common/hardware.constants';
import { KitchenStation as KitchenStationType } from '../common/restaurant.constants';

/**
 * Printer Routing Service
 *
 * Handles intelligent routing of print jobs to multiple printers
 * Supports various routing strategies: station-based, round-robin, load-balanced, etc.
 */
@Injectable()
export class PrinterRoutingService {
  private readonly logger = new Logger(PrinterRoutingService.name);
  private roundRobinIndex = new Map<string, number>(); // branchId -> index

  constructor(
    @InjectRepository(PrinterConfig)
    private readonly printerConfigRepository: Repository<PrinterConfig>,
    private readonly printerQueueService: PrinterQueueService,
  ) {}

  /**
   * Route order to appropriate printers and create print jobs
   */
  async routeOrderToPrinters(
    order: RestaurantOrder,
    strategy: PrinterRoutingStrategy = PrinterRoutingStrategy.STATION_BASED,
    options: {
      specificPrinterIds?: string[];
      copies?: number;
      priority?: PrintJobPriority;
    } = {},
  ): Promise<string[]> {
    // If specific printers are requested, use those
    if (options.specificPrinterIds?.length) {
      return this.routeToSpecificPrinters(order, options.specificPrinterIds, options);
    }

    // Otherwise, use the routing strategy
    switch (strategy) {
      case PrinterRoutingStrategy.STATION_BASED:
        return this.routeByStation(order, options);
      case PrinterRoutingStrategy.ROUND_ROBIN:
        return this.routeRoundRobin(order, options);
      case PrinterRoutingStrategy.LOAD_BALANCED:
        return this.routeLoadBalanced(order, options);
      case PrinterRoutingStrategy.MANUAL:
        throw new Error('Manual routing requires specificPrinterIds');
      default:
        return this.routeByStation(order, options);
    }
  }

  /**
   * Station-based routing: Route items to printers based on kitchen station
   */
  private async routeByStation(
    order: RestaurantOrder,
    options: { copies?: number; priority?: PrintJobPriority },
  ): Promise<string[]> {
    const jobIds: string[] = [];

    // Group items by kitchen station
    const itemsByStation = new Map<KitchenStationType, OrderItem[]>();
    for (const item of order.items) {
      const station = item.kitchenStation;
      if (!itemsByStation.has(station)) {
        itemsByStation.set(station, []);
      }
      itemsByStation.get(station).push(item);
    }

    // For each station, find printers and create jobs
    for (const [station, items] of itemsByStation.entries()) {
      const printers = await this.findPrintersByStation(order.branchId, station);

      if (printers.length === 0) {
        this.logger.warn(
          `No printers configured for station ${station} at branch ${order.branchId}`,
        );
        continue;
      }

      // Use primary printer for the station, or first available
      const printer = printers.find((p) => {
        const mapping = p.stationMappings?.find((m) => m.stationType === station);
        return mapping?.isPrimary;
      }) || printers[0];

      const content = this.generateTicketContent(order, items);
      const job = await this.printerQueueService.createJob(
        order.branchId,
        printer.id,
        order.orderNumber,
        content,
        {
          orderId: order.id,
          copies: options.copies,
          priority: options.priority,
          metadata: {
            jobType: 'order',
            stationId: station,
            stationName: station,
          },
        },
      );

      jobIds.push(job.id);
    }

    return jobIds;
  }

  /**
   * Round-robin routing: Distribute orders evenly across all printers
   */
  private async routeRoundRobin(
    order: RestaurantOrder,
    options: { copies?: number; priority?: PrintJobPriority },
  ): Promise<string[]> {
    const printers = await this.findAvailablePrinters(order.branchId);

    if (printers.length === 0) {
      throw new NotFoundException(
        `No active printers found for branch ${order.branchId}`,
      );
    }

    // Get or initialize round-robin index for this branch
    let index = this.roundRobinIndex.get(order.branchId) || 0;
    const printer = printers[index % printers.length];

    // Update index for next time
    this.roundRobinIndex.set(order.branchId, (index + 1) % printers.length);

    const content = this.generateTicketContent(order, order.items);
    const job = await this.printerQueueService.createJob(
      order.branchId,
      printer.id,
      order.orderNumber,
      content,
      {
        orderId: order.id,
        copies: options.copies,
        priority: options.priority,
        metadata: { jobType: 'order' },
      },
    );

    return [job.id];
  }

  /**
   * Load-balanced routing: Route to least busy printer
   */
  private async routeLoadBalanced(
    order: RestaurantOrder,
    options: { copies?: number; priority?: PrintJobPriority },
  ): Promise<string[]> {
    const printers = await this.findAvailablePrinters(order.branchId);

    if (printers.length === 0) {
      throw new NotFoundException(
        `No active printers found for branch ${order.branchId}`,
      );
    }

    // Find printer with best success rate and lowest job count
    const printer = printers.reduce((best, current) => {
      const currentSuccessRate =
        current.totalJobs > 0 ? current.successfulJobs / current.totalJobs : 1;
      const bestSuccessRate =
        best.totalJobs > 0 ? best.successfulJobs / best.totalJobs : 1;

      // Prefer higher success rate, then lower total jobs
      if (currentSuccessRate > bestSuccessRate) return current;
      if (currentSuccessRate === bestSuccessRate && current.totalJobs < best.totalJobs)
        return current;
      return best;
    });

    const content = this.generateTicketContent(order, order.items);
    const job = await this.printerQueueService.createJob(
      order.branchId,
      printer.id,
      order.orderNumber,
      content,
      {
        orderId: order.id,
        copies: options.copies,
        priority: options.priority,
        metadata: { jobType: 'order' },
      },
    );

    return [job.id];
  }

  /**
   * Route to specific printers
   */
  private async routeToSpecificPrinters(
    order: RestaurantOrder,
    printerIds: string[],
    options: { copies?: number; priority?: PrintJobPriority },
  ): Promise<string[]> {
    const jobIds: string[] = [];
    const content = this.generateTicketContent(order, order.items);

    for (const printerId of printerIds) {
      const printer = await this.printerConfigRepository.findOne({
        where: { id: printerId, branchId: order.branchId },
      });

      if (!printer) {
        this.logger.warn(
          `Printer ${printerId} not found or not accessible for branch ${order.branchId}`,
        );
        continue;
      }

      const job = await this.printerQueueService.createJob(
        order.branchId,
        printer.id,
        order.orderNumber,
        content,
        {
          orderId: order.id,
          copies: options.copies,
          priority: options.priority,
          metadata: { jobType: 'order', manualPrint: true },
        },
      );

      jobIds.push(job.id);
    }

    return jobIds;
  }

  /**
   * Find printers for a specific kitchen station
   */
  private async findPrintersByStation(
    branchId: string,
    station: KitchenStationType,
  ): Promise<PrinterConfig[]> {
    const allPrinters = await this.printerConfigRepository.find({
      where: { branchId, isActive: true },
    });

    return allPrinters.filter((printer) => {
      return printer.stationMappings?.some((mapping) => mapping.stationType === station);
    });
  }

  /**
   * Find all available printers for a branch
   */
  private async findAvailablePrinters(branchId: string): Promise<PrinterConfig[]> {
    return this.printerConfigRepository.find({
      where: {
        branchId,
        isActive: true,
        status: PrinterStatus.ONLINE,
      },
      order: { totalJobs: 'ASC' }, // Prefer printers with fewer jobs
    });
  }

  /**
   * Generate ticket content (simplified version)
   */
  private generateTicketContent(order: RestaurantOrder, items: OrderItem[]): string {
    const lines: string[] = [];

    lines.push('================================');
    lines.push('      KITCHEN ORDER TICKET      ');
    lines.push('================================');
    lines.push('');
    lines.push(`Order #: ${order.orderNumber}`);
    lines.push(`Table: ${order.table?.tableNumber || 'N/A'}`);
    lines.push(`Type: ${order.serviceType.toUpperCase()}`);
    lines.push(`Priority: ${order.priority.toUpperCase()}`);
    lines.push(`Time: ${this.formatTime(order.createdAt)}`);

    if (order.guestCount) {
      lines.push(`Guests: ${order.guestCount}`);
    }

    lines.push('--------------------------------');
    lines.push('');

    items.forEach((item, index) => {
      lines.push(`${index + 1}. ${item.productName}`);
      lines.push(`   Qty: ${item.quantity}`);

      if (item.course) {
        lines.push(`   Course: ${item.course.toUpperCase()}`);
      }

      if (item.modifiers && item.modifiers.length > 0) {
        lines.push('   Modifiers:');
        item.modifiers.forEach((modifier) => {
          modifier.options.forEach((option) => {
            lines.push(`   - ${option.name}`);
          });
        });
      }

      if (item.specialInstructions) {
        lines.push(`   *** ${item.specialInstructions} ***`);
      }

      lines.push('');
    });

    if (order.specialInstructions) {
      lines.push('--------------------------------');
      lines.push('ORDER NOTES:');
      lines.push(order.specialInstructions);
      lines.push('');
    }

    lines.push('================================');
    lines.push(`Total Items: ${items.length}`);
    lines.push('================================');
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Format timestamp for ticket
   */
  private formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }
}
