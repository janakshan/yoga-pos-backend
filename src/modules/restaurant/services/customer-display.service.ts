import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { RestaurantOrder } from '../entities/restaurant-order.entity';
import {
  CustomerDisplayType,
  DisplayConnectionType,
  DISPLAY_MESSAGES,
} from '../common/hardware.constants';
import {
  CustomerDisplayConfigDto,
  UpdateCustomerDisplayDto,
} from '../dto/hardware.dto';

/**
 * Customer Display Service
 *
 * Manages customer-facing displays (LCD, LED, VFD, Web)
 * Shows order totals, item details, and custom messages
 */
@Injectable()
export class CustomerDisplayService {
  private readonly logger = new Logger(CustomerDisplayService.name);
  private displays = new Map<string, CustomerDisplayConfigDto>();
  private displayStates = new Map<string, { topLine: string; bottomLine: string }>();

  /**
   * Register a customer display
   */
  async registerDisplay(config: CustomerDisplayConfigDto): Promise<void> {
    this.displays.set(config.branchId, config);
    this.logger.log(
      `Registered customer display: ${config.name} (${config.displayType})`,
    );

    // Initialize display with welcome message
    await this.showWelcomeMessage(config.branchId);
  }

  /**
   * Show order details on display
   */
  async showOrder(
    branchId: string,
    order: RestaurantOrder,
    options: { showItems?: boolean } = {},
  ): Promise<void> {
    const display = this.displays.get(branchId);
    if (!display) {
      this.logger.warn(`No customer display configured for branch ${branchId}`);
      return;
    }

    const topLine = `Order #${order.orderNumber}`;
    const bottomLine = `Total: $${order.finalAmount?.toFixed(2) || '0.00'}`;

    await this.updateDisplay(branchId, topLine, bottomLine);

    this.logger.log(
      `Displayed order ${order.orderNumber} on customer display for branch ${branchId}`,
    );
  }

  /**
   * Show total amount
   */
  async showTotal(branchId: string, amount: number, itemCount?: number): Promise<void> {
    const display = this.displays.get(branchId);
    if (!display) {
      this.logger.warn(`No customer display configured for branch ${branchId}`);
      return;
    }

    const topLine = itemCount ? `Items: ${itemCount}` : DISPLAY_MESSAGES.total;
    const bottomLine = `$${amount.toFixed(2)}`;

    await this.updateDisplay(branchId, topLine, bottomLine);
  }

  /**
   * Show custom message
   */
  async showMessage(
    branchId: string,
    topLine: string,
    bottomLine?: string,
  ): Promise<void> {
    const display = this.displays.get(branchId);
    if (!display) {
      this.logger.warn(`No customer display configured for branch ${branchId}`);
      return;
    }

    await this.updateDisplay(branchId, topLine, bottomLine || '');
  }

  /**
   * Show welcome message
   */
  async showWelcomeMessage(branchId: string): Promise<void> {
    await this.showMessage(branchId, DISPLAY_MESSAGES.welcome, 'Have a great day!');
  }

  /**
   * Show thank you message
   */
  async showThankYouMessage(branchId: string): Promise<void> {
    await this.showMessage(branchId, DISPLAY_MESSAGES.thankYou, 'Please come again!');
  }

  /**
   * Show processing message
   */
  async showProcessing(branchId: string): Promise<void> {
    await this.showMessage(branchId, DISPLAY_MESSAGES.processing, 'Please wait...');
  }

  /**
   * Clear display
   */
  async clearDisplay(branchId: string): Promise<void> {
    const display = this.displays.get(branchId);
    if (!display) {
      this.logger.warn(`No customer display configured for branch ${branchId}`);
      return;
    }

    await this.updateDisplay(branchId, '', '');
    this.logger.log(`Cleared customer display for branch ${branchId}`);
  }

  /**
   * Get display configuration
   */
  getDisplayConfig(branchId: string): CustomerDisplayConfigDto | undefined {
    return this.displays.get(branchId);
  }

  /**
   * Get current display state
   */
  getDisplayState(branchId: string): { topLine: string; bottomLine: string } | undefined {
    return this.displayStates.get(branchId);
  }

  /**
   * Test display
   */
  async testDisplay(branchId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const display = this.displays.get(branchId);
    if (!display) {
      return {
        success: false,
        message: 'Display not configured',
      };
    }

    try {
      // Show test pattern
      await this.showMessage(branchId, '*** TEST MODE ***', 'Display working OK');

      // Wait 2 seconds
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Return to welcome message
      await this.showWelcomeMessage(branchId);

      return {
        success: true,
        message: 'Display test successful',
      };
    } catch (error) {
      this.logger.error(`Display test failed: ${error.message}`, error.stack);
      return {
        success: false,
        message: `Test failed: ${error.message}`,
      };
    }
  }

  /**
   * Private: Update display hardware
   */
  private async updateDisplay(
    branchId: string,
    topLine: string,
    bottomLine: string,
  ): Promise<void> {
    const display = this.displays.get(branchId);
    if (!display) {
      throw new NotFoundException(`Display not found for branch ${branchId}`);
    }

    // Store state
    this.displayStates.set(branchId, { topLine, bottomLine });

    // TODO: Implement actual hardware communication
    // This would depend on the display type and connection method:
    //
    // For Serial/USB displays:
    // - Use SerialPort library to send commands
    // - Format text according to display protocol
    //
    // For Network displays:
    // - Send TCP/UDP packets to display IP
    // - Use display-specific API
    //
    // For Web displays:
    // - Emit WebSocket event to connected display client
    // - Update display state in real-time
    //
    // For now, just log the update
    this.logger.debug(
      `Display update for ${display.name}:\n  Top: ${topLine}\n  Bottom: ${bottomLine}`,
    );

    // Simulate hardware delay
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  /**
   * Format text for display (truncate to fit columns)
   */
  private formatTextForDisplay(
    text: string,
    maxLength: number,
    align: 'left' | 'center' | 'right' = 'left',
  ): string {
    if (text.length > maxLength) {
      return text.substring(0, maxLength);
    }

    const padding = maxLength - text.length;

    switch (align) {
      case 'center':
        const leftPad = Math.floor(padding / 2);
        const rightPad = padding - leftPad;
        return ' '.repeat(leftPad) + text + ' '.repeat(rightPad);
      case 'right':
        return ' '.repeat(padding) + text;
      case 'left':
      default:
        return text + ' '.repeat(padding);
    }
  }
}
