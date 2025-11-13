import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RestaurantOrder } from '../entities/restaurant-order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { Payment } from '../../payments/entities/payment.entity';
import { SplitPaymentDto, SplitByItemDto } from '../dto/split-payment.dto';

export interface SplitPaymentResult {
  orderId: string;
  splitMethod: 'equal' | 'custom' | 'by_item' | 'by_seat';
  splits: Array<{
    splitNumber: number;
    amount: number;
    items?: string[]; // item IDs
    seats?: number[];
    tipAmount?: number;
    totalWithTip?: number;
  }>;
  totalAmount: number;
  remainingAmount: number;
}

@Injectable()
export class SplitPaymentService {
  constructor(
    @InjectRepository(RestaurantOrder)
    private readonly orderRepository: Repository<RestaurantOrder>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  /**
   * Split payment equally among N people
   */
  async splitEqually(
    orderId: string,
    splitCount: number,
  ): Promise<SplitPaymentResult> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['items'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (splitCount < 2) {
      throw new BadRequestException('Split count must be at least 2');
    }

    const totalWithTip = Number(order.total) + Number(order.tipAmount || 0);
    const amountPerSplit = this.roundToTwo(totalWithTip / splitCount);

    const splits = Array.from({ length: splitCount }, (_, index) => ({
      splitNumber: index + 1,
      amount: amountPerSplit,
      tipAmount: this.roundToTwo((Number(order.tipAmount || 0)) / splitCount),
      totalWithTip: amountPerSplit,
    }));

    // Handle rounding differences
    const totalSplit = splits.reduce((sum, split) => sum + split.amount, 0);
    const difference = this.roundToTwo(totalWithTip - totalSplit);
    if (difference !== 0) {
      splits[0].amount = this.roundToTwo(splits[0].amount + difference);
      splits[0].totalWithTip = splits[0].amount;
    }

    // Update order metadata
    await this.updateOrderSplitMetadata(order, {
      isSplit: true,
      splitCount,
      splitMethod: 'equal',
    });

    return {
      orderId: order.id,
      splitMethod: 'equal',
      splits,
      totalAmount: totalWithTip,
      remainingAmount: totalWithTip,
    };
  }

  /**
   * Split payment with custom amounts
   */
  async splitCustom(
    orderId: string,
    customAmounts: number[],
  ): Promise<SplitPaymentResult> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['items'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const totalWithTip = Number(order.total) + Number(order.tipAmount || 0);
    const totalCustom = customAmounts.reduce((sum, amount) => sum + amount, 0);

    if (Math.abs(totalCustom - totalWithTip) > 0.01) {
      throw new BadRequestException(
        `Custom split amounts (${totalCustom}) must equal order total (${totalWithTip})`,
      );
    }

    const splits = customAmounts.map((amount, index) => ({
      splitNumber: index + 1,
      amount: this.roundToTwo(amount),
      totalWithTip: this.roundToTwo(amount),
    }));

    // Update order metadata
    await this.updateOrderSplitMetadata(order, {
      isSplit: true,
      splitCount: customAmounts.length,
      splitMethod: 'custom',
    });

    return {
      orderId: order.id,
      splitMethod: 'custom',
      splits,
      totalAmount: totalWithTip,
      remainingAmount: totalWithTip,
    };
  }

  /**
   * Split payment by specific items
   */
  async splitByItems(
    orderId: string,
    itemSplits: SplitByItemDto[],
  ): Promise<SplitPaymentResult> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['items'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Verify all items are accounted for
    const allItemIds = order.items.map(item => item.id);
    const splitItemIds = itemSplits.flatMap(split => split.itemIds);

    const missingItems = allItemIds.filter(id => !splitItemIds.includes(id));
    if (missingItems.length > 0) {
      throw new BadRequestException(
        'All order items must be assigned to a split',
      );
    }

    const splits = await Promise.all(
      itemSplits.map(async (split, index) => {
        const items = order.items.filter(item =>
          split.itemIds.includes(item.id),
        );

        const subtotal = items.reduce(
          (sum, item) => sum + Number(item.total),
          0,
        );

        // Proportional tip calculation
        const tipPortion = order.tipAmount
          ? this.roundToTwo((subtotal / Number(order.total)) * Number(order.tipAmount))
          : 0;

        return {
          splitNumber: index + 1,
          amount: this.roundToTwo(subtotal),
          items: split.itemIds,
          tipAmount: tipPortion,
          totalWithTip: this.roundToTwo(subtotal + tipPortion),
        };
      }),
    );

    // Update order metadata
    await this.updateOrderSplitMetadata(order, {
      isSplit: true,
      splitCount: itemSplits.length,
      splitMethod: 'by_item',
    });

    const totalAmount = Number(order.total) + Number(order.tipAmount || 0);

    return {
      orderId: order.id,
      splitMethod: 'by_item',
      splits,
      totalAmount,
      remainingAmount: totalAmount,
    };
  }

  /**
   * Split payment by seat numbers
   */
  async splitBySeats(orderId: string): Promise<SplitPaymentResult> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['items'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Group items by seat number
    const itemsBySeat = order.items.reduce((acc, item) => {
      const seat = item.seatNumber || 0; // 0 for unassigned
      if (!acc[seat]) {
        acc[seat] = [];
      }
      acc[seat].push(item);
      return acc;
    }, {} as Record<number, OrderItem[]>);

    const seatNumbers = Object.keys(itemsBySeat)
      .map(Number)
      .filter(seat => seat > 0); // Exclude unassigned items

    if (seatNumbers.length === 0) {
      throw new BadRequestException('No items have seat assignments');
    }

    const splits = seatNumbers.map((seatNumber, index) => {
      const items = itemsBySeat[seatNumber];
      const subtotal = items.reduce(
        (sum, item) => sum + Number(item.total),
        0,
      );

      // Proportional tip calculation
      const tipPortion = order.tipAmount
        ? this.roundToTwo((subtotal / Number(order.total)) * Number(order.tipAmount))
        : 0;

      return {
        splitNumber: index + 1,
        amount: this.roundToTwo(subtotal),
        items: items.map(item => item.id),
        seats: [seatNumber],
        tipAmount: tipPortion,
        totalWithTip: this.roundToTwo(subtotal + tipPortion),
      };
    });

    // Update order metadata
    await this.updateOrderSplitMetadata(order, {
      isSplit: true,
      splitCount: splits.length,
      splitMethod: 'by_seat',
    });

    const totalAmount = Number(order.total) + Number(order.tipAmount || 0);

    return {
      orderId: order.id,
      splitMethod: 'by_seat',
      splits,
      totalAmount,
      remainingAmount: totalAmount,
    };
  }

  /**
   * Process a split payment
   */
  async processSplitPayment(
    orderId: string,
    dto: SplitPaymentDto,
  ): Promise<SplitPaymentResult> {
    switch (dto.splitMethod) {
      case 'equal':
        return this.splitEqually(orderId, dto.splitCount!);

      case 'custom':
        return this.splitCustom(orderId, dto.customAmounts!);

      case 'by_item':
        return this.splitByItems(orderId, dto.itemSplits!);

      case 'by_seat':
        return this.splitBySeats(orderId);

      default:
        throw new BadRequestException('Invalid split method');
    }
  }

  /**
   * Update order metadata with split information
   */
  private async updateOrderSplitMetadata(
    order: RestaurantOrder,
    splitInfo: {
      isSplit: boolean;
      splitCount: number;
      splitMethod: 'equal' | 'custom' | 'by_item' | 'by_seat';
    },
  ): Promise<void> {
    const metadata = order.metadata || {};
    metadata.splitBillInfo = {
      isSplit: splitInfo.isSplit,
      splitCount: splitInfo.splitCount,
      splitMethod: splitInfo.splitMethod as 'equal' | 'custom' | 'by_item',
    };
    order.metadata = metadata;
    await this.orderRepository.save(order);
  }

  /**
   * Helper method to round to 2 decimal places
   */
  private roundToTwo(num: number): number {
    return Math.round((num + Number.EPSILON) * 100) / 100;
  }
}
