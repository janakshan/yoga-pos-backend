import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RestaurantOrder } from '../entities/restaurant-order.entity';
import { CalculateTipDto } from '../dto/calculate-tip.dto';

export interface TipCalculationResult {
  subtotal: number;
  tipAmount: number;
  tipPercentage?: number;
  tipMethod: 'percentage' | 'fixed' | 'custom' | 'none';
  total: number;
  grandTotal: number; // total + tip
}

export interface TipConfiguration {
  enabled: boolean;
  defaultPercentage?: number;
  suggestions: number[]; // suggested tip percentages
  minAmount?: number;
  maxAmount?: number;
  allowCustomTip: boolean;
  tipOnPreTax?: boolean; // Calculate tip on subtotal before tax
}

@Injectable()
export class TipService {
  // Default tip configuration
  private readonly defaultConfig: TipConfiguration = {
    enabled: true,
    defaultPercentage: 15,
    suggestions: [10, 15, 18, 20, 25],
    allowCustomTip: true,
    tipOnPreTax: true,
  };

  constructor(
    @InjectRepository(RestaurantOrder)
    private readonly orderRepository: Repository<RestaurantOrder>,
  ) {}

  /**
   * Calculate tip based on order amount and tip parameters
   */
  calculateTip(dto: CalculateTipDto): TipCalculationResult {
    const { orderTotal, subtotal, tipPercentage, tipAmount, tipMethod, tax } = dto;

    let calculatedTipAmount = 0;
    let calculatedTipPercentage: number | undefined;
    let method: 'percentage' | 'fixed' | 'custom' | 'none' = 'none';

    // Determine the base amount for tip calculation
    const baseAmount = this.defaultConfig.tipOnPreTax ? subtotal : orderTotal;

    if (tipMethod === 'percentage' && tipPercentage !== undefined) {
      // Calculate tip as percentage
      if (tipPercentage < 0 || tipPercentage > 100) {
        throw new BadRequestException('Tip percentage must be between 0 and 100');
      }
      calculatedTipAmount = this.roundToTwo((baseAmount * tipPercentage) / 100);
      calculatedTipPercentage = tipPercentage;
      method = 'percentage';
    } else if (tipMethod === 'fixed' && tipAmount !== undefined) {
      // Fixed tip amount
      if (tipAmount < 0) {
        throw new BadRequestException('Tip amount cannot be negative');
      }
      calculatedTipAmount = this.roundToTwo(tipAmount);
      calculatedTipPercentage = this.roundToTwo((tipAmount / baseAmount) * 100);
      method = 'fixed';
    } else if (tipMethod === 'custom' && tipAmount !== undefined) {
      // Custom tip amount (user-defined)
      if (tipAmount < 0) {
        throw new BadRequestException('Tip amount cannot be negative');
      }
      calculatedTipAmount = this.roundToTwo(tipAmount);
      calculatedTipPercentage = this.roundToTwo((tipAmount / baseAmount) * 100);
      method = 'custom';
    }

    // Apply min/max constraints if configured
    if (this.defaultConfig.minAmount && calculatedTipAmount < this.defaultConfig.minAmount) {
      calculatedTipAmount = this.defaultConfig.minAmount;
    }
    if (this.defaultConfig.maxAmount && calculatedTipAmount > this.defaultConfig.maxAmount) {
      calculatedTipAmount = this.defaultConfig.maxAmount;
    }

    const grandTotal = this.roundToTwo(orderTotal + calculatedTipAmount);

    return {
      subtotal,
      tipAmount: calculatedTipAmount,
      tipPercentage: calculatedTipPercentage,
      tipMethod: method,
      total: orderTotal,
      grandTotal,
    };
  }

  /**
   * Apply tip to an order
   */
  async applyTipToOrder(
    orderId: string,
    dto: CalculateTipDto,
  ): Promise<RestaurantOrder> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new BadRequestException('Order not found');
    }

    const tipResult = this.calculateTip(dto);

    // Update order with tip information
    order.tipAmount = tipResult.tipAmount;
    order.tipPercentage = tipResult.tipPercentage || null;
    order.tipMethod = tipResult.tipMethod;

    // Update the order total to include tip
    // Note: This might be handled differently based on business logic
    // Some systems keep tip separate, others include it in total

    return await this.orderRepository.save(order);
  }

  /**
   * Get tip suggestions based on order amount
   */
  getTipSuggestions(orderAmount: number): Array<{
    percentage: number;
    amount: number;
  }> {
    return this.defaultConfig.suggestions.map((percentage) => ({
      percentage,
      amount: this.roundToTwo((orderAmount * percentage) / 100),
    }));
  }

  /**
   * Get tip configuration
   */
  getTipConfiguration(): TipConfiguration {
    return { ...this.defaultConfig };
  }

  /**
   * Update tip configuration
   */
  updateTipConfiguration(config: Partial<TipConfiguration>): TipConfiguration {
    Object.assign(this.defaultConfig, config);
    return { ...this.defaultConfig };
  }

  /**
   * Distribute tips among servers (for pooled tips)
   * This is a basic implementation - can be enhanced based on business rules
   */
  distributeTips(
    totalTipAmount: number,
    serverIds: string[],
    distributionMethod: 'equal' | 'weighted' = 'equal',
    weights?: Record<string, number>,
  ): Record<string, number> {
    if (serverIds.length === 0) {
      throw new BadRequestException('No servers to distribute tips to');
    }

    const distribution: Record<string, number> = {};

    if (distributionMethod === 'equal') {
      // Equal distribution
      const amountPerServer = this.roundToTwo(totalTipAmount / serverIds.length);
      serverIds.forEach((serverId) => {
        distribution[serverId] = amountPerServer;
      });

      // Handle rounding differences
      const totalDistributed = Object.values(distribution).reduce((a, b) => a + b, 0);
      const difference = this.roundToTwo(totalTipAmount - totalDistributed);
      if (difference !== 0) {
        distribution[serverIds[0]] = this.roundToTwo(distribution[serverIds[0]] + difference);
      }
    } else if (distributionMethod === 'weighted' && weights) {
      // Weighted distribution based on provided weights
      const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

      serverIds.forEach((serverId) => {
        const weight = weights[serverId] || 1;
        distribution[serverId] = this.roundToTwo((totalTipAmount * weight) / totalWeight);
      });

      // Handle rounding differences
      const totalDistributed = Object.values(distribution).reduce((a, b) => a + b, 0);
      const difference = this.roundToTwo(totalTipAmount - totalDistributed);
      if (difference !== 0) {
        distribution[serverIds[0]] = this.roundToTwo(distribution[serverIds[0]] + difference);
      }
    }

    return distribution;
  }

  /**
   * Calculate average tip percentage for a server over a date range
   */
  async getServerAverageTip(
    serverId: string,
    branchId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    averageTipPercentage: number;
    totalTips: number;
    orderCount: number;
  }> {
    const orders = await this.orderRepository.find({
      where: {
        serverId,
        branchId,
        // Note: You'll need to add date filtering here
        // This is a simplified version
      },
    });

    const ordersWithTips = orders.filter((order) => order.tipAmount > 0);
    const totalTips = ordersWithTips.reduce((sum, order) => sum + Number(order.tipAmount), 0);
    const totalPercentages = ordersWithTips.reduce(
      (sum, order) => sum + (order.tipPercentage || 0),
      0,
    );

    return {
      averageTipPercentage: ordersWithTips.length > 0
        ? this.roundToTwo(totalPercentages / ordersWithTips.length)
        : 0,
      totalTips: this.roundToTwo(totalTips),
      orderCount: ordersWithTips.length,
    };
  }

  /**
   * Helper method to round to 2 decimal places
   */
  private roundToTwo(num: number): number {
    return Math.round((num + Number.EPSILON) * 100) / 100;
  }
}
