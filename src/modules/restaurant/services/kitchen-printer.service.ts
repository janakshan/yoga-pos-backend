import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KitchenStation } from '../entities/kitchen-station.entity';
import { RestaurantOrder } from '../entities/restaurant-order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { KitchenStation as KitchenStationType } from '../common/restaurant.constants';

/**
 * Kitchen Printer Service
 *
 * Handles printing of kitchen tickets to network/USB printers
 * Supports ESC/POS protocol for thermal printers
 *
 * Note: This is a base implementation. For production use, you would integrate with:
 * - node-thermal-printer package for ESC/POS printers
 * - CUPS (Common Unix Printing System) for network printers
 * - Cloud printing services (Google Cloud Print, PrintNode, etc.)
 */
@Injectable()
export class KitchenPrinterService {
  private readonly logger = new Logger(KitchenPrinterService.name);

  constructor(
    @InjectRepository(KitchenStation)
    private readonly kitchenStationRepository: Repository<KitchenStation>,
  ) {}

  /**
   * Print kitchen ticket for entire order
   */
  async printOrderTicket(
    order: RestaurantOrder,
    station?: KitchenStationType,
    copies: number = 1,
  ): Promise<void> {
    try {
      // Filter items by station if specified
      const itemsToPrint = station
        ? order.items.filter((item) => item.kitchenStation === station)
        : order.items;

      if (itemsToPrint.length === 0) {
        this.logger.warn(
          `No items to print for order ${order.orderNumber} at station ${station}`,
        );
        return;
      }

      // Get station configuration
      const stationConfig = station
        ? await this.kitchenStationRepository.findOne({
            where: {
              branchId: order.branchId,
              stationType: station,
              isActive: true,
            },
          })
        : null;

      // Generate ticket content
      const ticketContent = this.generateTicketContent(order, itemsToPrint);

      // Print based on configuration
      if (stationConfig && stationConfig.autoPrintEnabled) {
        await this.sendToPrinter(stationConfig, ticketContent, copies);
      } else {
        // Log ticket content for debugging/testing
        this.logger.log(
          `Kitchen ticket for order ${order.orderNumber}:\n${ticketContent}`,
        );
      }

      this.logger.log(
        `Printed kitchen ticket for order ${order.orderNumber} to station ${station || 'ALL'}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to print kitchen ticket: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to print kitchen ticket');
    }
  }

  /**
   * Reprint kitchen ticket
   */
  async reprintOrderTicket(
    order: RestaurantOrder,
    station?: KitchenStationType,
    copies: number = 1,
    reason?: string,
  ): Promise<void> {
    this.logger.log(
      `Reprinting kitchen ticket for order ${order.orderNumber}. Reason: ${reason || 'Not specified'}`,
    );
    await this.printOrderTicket(order, station, copies);
  }

  /**
   * Print specific items only
   */
  async printItems(
    order: RestaurantOrder,
    itemIds: string[],
    copies: number = 1,
  ): Promise<void> {
    const itemsToPrint = order.items.filter((item) =>
      itemIds.includes(item.id),
    );

    if (itemsToPrint.length === 0) {
      throw new BadRequestException('No valid items to print');
    }

    const ticketContent = this.generateTicketContent(order, itemsToPrint);

    // Group items by station and print to respective printers
    const itemsByStation = this.groupItemsByStation(itemsToPrint);

    for (const [station, items] of itemsByStation.entries()) {
      const stationConfig = await this.kitchenStationRepository.findOne({
        where: {
          branchId: order.branchId,
          stationType: station,
          isActive: true,
        },
      });

      if (stationConfig && stationConfig.autoPrintEnabled) {
        const stationTicket = this.generateTicketContent(order, items);
        await this.sendToPrinter(stationConfig, stationTicket, copies);
      }
    }

    this.logger.log(
      `Printed ${itemsToPrint.length} items for order ${order.orderNumber}`,
    );
  }

  /**
   * Generate ticket content in plain text format
   */
  private generateTicketContent(
    order: RestaurantOrder,
    items: OrderItem[],
  ): string {
    const lines: string[] = [];

    // Header
    lines.push('================================');
    lines.push('      KITCHEN ORDER TICKET      ');
    lines.push('================================');
    lines.push('');

    // Order info
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

    // Items
    items.forEach((item, index) => {
      lines.push(`${index + 1}. ${item.productName}`);
      lines.push(`   Qty: ${item.quantity}`);

      if (item.course) {
        lines.push(`   Course: ${item.course.toUpperCase()}`);
      }

      // Modifiers
      if (item.modifiers && item.modifiers.length > 0) {
        lines.push('   Modifiers:');
        item.modifiers.forEach((modifier) => {
          modifier.options.forEach((option) => {
            lines.push(`   - ${option.name}`);
          });
        });
      }

      // Special instructions
      if (item.specialInstructions) {
        lines.push(`   *** ${item.specialInstructions} ***`);
      }

      lines.push('');
    });

    // Footer
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
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Send ticket to printer
   * This is a stub implementation - integrate with actual printer service
   */
  private async sendToPrinter(
    station: KitchenStation,
    content: string,
    copies: number,
  ): Promise<void> {
    // TODO: Integrate with actual printer library
    // Examples:
    // 1. For network printers (ESC/POS):
    //    - Use node-thermal-printer package
    //    - Connect to printer IP and port
    //    - Send ESC/POS commands
    //
    // 2. For USB printers:
    //    - Use node-usb or node-printer packages
    //    - Detect printer device
    //    - Send raw print data
    //
    // 3. For cloud printing:
    //    - Use PrintNode API or Google Cloud Print
    //    - Send print job via REST API

    this.logger.debug(
      `Sending to printer: ${station.printerName || station.printerIp}`,
    );
    this.logger.debug(`Content:\n${content}`);
    this.logger.debug(`Copies: ${copies}`);

    // Simulate printer delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // In production, this would:
    // 1. Establish connection to printer
    // 2. Format content according to printer capabilities
    // 3. Send print job
    // 4. Handle printer errors and status
    // 5. Implement retry logic for failed prints
  }

  /**
   * Group items by kitchen station
   */
  private groupItemsByStation(
    items: OrderItem[],
  ): Map<KitchenStationType, OrderItem[]> {
    const grouped = new Map<KitchenStationType, OrderItem[]>();

    items.forEach((item) => {
      const station = item.kitchenStation;
      if (!grouped.has(station)) {
        grouped.set(station, []);
      }
      grouped.get(station).push(item);
    });

    return grouped;
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

  /**
   * Test printer connectivity
   */
  async testPrinter(stationId: string): Promise<{ success: boolean; message: string }> {
    try {
      const station = await this.kitchenStationRepository.findOne({
        where: { id: stationId },
      });

      if (!station) {
        return {
          success: false,
          message: 'Kitchen station not found',
        };
      }

      if (!station.autoPrintEnabled) {
        return {
          success: false,
          message: 'Auto-print is not enabled for this station',
        };
      }

      // Test print
      const testContent = this.generateTestTicket(station);
      await this.sendToPrinter(station, testContent, 1);

      return {
        success: true,
        message: 'Test print sent successfully',
      };
    } catch (error) {
      this.logger.error(`Printer test failed: ${error.message}`, error.stack);
      return {
        success: false,
        message: `Printer test failed: ${error.message}`,
      };
    }
  }

  /**
   * Generate test ticket
   */
  private generateTestTicket(station: KitchenStation): string {
    const lines: string[] = [];

    lines.push('================================');
    lines.push('       PRINTER TEST             ');
    lines.push('================================');
    lines.push('');
    lines.push(`Station: ${station.name}`);
    lines.push(`Type: ${station.stationType}`);
    lines.push(`Time: ${this.formatTime(new Date())}`);
    lines.push('');
    lines.push('If you can read this message,');
    lines.push('your printer is working correctly!');
    lines.push('');
    lines.push('================================');
    lines.push('');

    return lines.join('\n');
  }
}
