import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { RestaurantOrder } from '../entities/restaurant-order.entity';
import { RestaurantOrderStatus } from '../common/restaurant.constants';

export interface ServerPerformanceMetrics {
  serverId: string;
  serverName?: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  orders: {
    total: number;
    completed: number;
    cancelled: number;
    averageOrderValue: number;
    totalRevenue: number;
  };
  tips: {
    total: number;
    average: number;
    averagePercentage: number;
    ordersWithTips: number;
  };
  performance: {
    averageServiceTime: number; // minutes from order creation to completion
    tablesTurned: number; // number of unique tables served
    guestCount: number; // total guests served
    averageGuestsPerOrder: number;
  };
  topItems?: Array<{
    productId: string;
    productName: string;
    quantity: number;
    revenue: number;
  }>;
}

export interface ServerComparisonMetrics {
  servers: Array<{
    serverId: string;
    serverName?: string;
    orderCount: number;
    revenue: number;
    tips: number;
    averageOrderValue: number;
    averageTipPercentage: number;
  }>;
  period: {
    startDate: Date;
    endDate: Date;
  };
}

@Injectable()
export class ServerPerformanceService {
  constructor(
    @InjectRepository(RestaurantOrder)
    private readonly orderRepository: Repository<RestaurantOrder>,
  ) {}

  /**
   * Get comprehensive performance metrics for a server
   */
  async getServerPerformance(
    serverId: string,
    branchId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ServerPerformanceMetrics> {
    const orders = await this.orderRepository.find({
      where: {
        serverId,
        branchId,
        createdAt: Between(startDate, endDate),
      },
      relations: ['items', 'items.product', 'server'],
    });

    const completedOrders = orders.filter(
      (order) => order.status === RestaurantOrderStatus.COMPLETED,
    );
    const cancelledOrders = orders.filter(
      (order) => order.status === RestaurantOrderStatus.CANCELLED,
    );

    // Calculate revenue (completed orders only)
    const totalRevenue = completedOrders.reduce(
      (sum, order) => sum + Number(order.total),
      0,
    );

    const averageOrderValue = completedOrders.length > 0
      ? this.roundToTwo(totalRevenue / completedOrders.length)
      : 0;

    // Calculate tip metrics
    const ordersWithTips = completedOrders.filter(
      (order) => Number(order.tipAmount || 0) > 0,
    );
    const totalTips = ordersWithTips.reduce(
      (sum, order) => sum + Number(order.tipAmount || 0),
      0,
    );
    const averageTip = ordersWithTips.length > 0
      ? this.roundToTwo(totalTips / ordersWithTips.length)
      : 0;

    const totalTipPercentages = ordersWithTips.reduce(
      (sum, order) => sum + (Number(order.tipPercentage) || 0),
      0,
    );
    const averageTipPercentage = ordersWithTips.length > 0
      ? this.roundToTwo(totalTipPercentages / ordersWithTips.length)
      : 0;

    // Calculate service time
    const ordersWithTimestamps = completedOrders.filter(
      (order) => order.createdAt && order.completedAt,
    );
    const totalServiceTime = ordersWithTimestamps.reduce((sum, order) => {
      const serviceTime =
        (order.completedAt!.getTime() - order.createdAt.getTime()) / (1000 * 60);
      return sum + serviceTime;
    }, 0);
    const averageServiceTime = ordersWithTimestamps.length > 0
      ? this.roundToTwo(totalServiceTime / ordersWithTimestamps.length)
      : 0;

    // Count unique tables
    const uniqueTables = new Set(
      orders.filter((order) => order.tableId).map((order) => order.tableId),
    );

    // Calculate guest count
    const totalGuests = orders.reduce(
      (sum, order) => sum + (order.guestCount || 0),
      0,
    );
    const averageGuestsPerOrder = orders.length > 0
      ? this.roundToTwo(totalGuests / orders.length)
      : 0;

    // Get top items
    const itemMap = new Map<string, { name: string; quantity: number; revenue: number }>();
    completedOrders.forEach((order) => {
      order.items.forEach((item) => {
        const existing = itemMap.get(item.productId) || {
          name: item.productName,
          quantity: 0,
          revenue: 0,
        };
        existing.quantity += Number(item.quantity);
        existing.revenue += Number(item.total);
        itemMap.set(item.productId, existing);
      });
    });

    const topItems = Array.from(itemMap.entries())
      .map(([productId, data]) => ({
        productId,
        productName: data.name,
        quantity: data.quantity,
        revenue: this.roundToTwo(data.revenue),
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    const serverName = orders[0]?.server
      ? `${orders[0].server.firstName || ''} ${orders[0].server.lastName || ''}`.trim() || orders[0].server.username
      : undefined;

    return {
      serverId,
      serverName,
      period: { startDate, endDate },
      orders: {
        total: orders.length,
        completed: completedOrders.length,
        cancelled: cancelledOrders.length,
        averageOrderValue,
        totalRevenue: this.roundToTwo(totalRevenue),
      },
      tips: {
        total: this.roundToTwo(totalTips),
        average: averageTip,
        averagePercentage: averageTipPercentage,
        ordersWithTips: ordersWithTips.length,
      },
      performance: {
        averageServiceTime,
        tablesTurned: uniqueTables.size,
        guestCount: totalGuests,
        averageGuestsPerOrder,
      },
      topItems,
    };
  }

  /**
   * Compare performance of multiple servers
   */
  async compareServers(
    serverIds: string[],
    branchId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ServerComparisonMetrics> {
    const serverMetrics = await Promise.all(
      serverIds.map(async (serverId) => {
        const orders = await this.orderRepository.find({
          where: {
            serverId,
            branchId,
            createdAt: Between(startDate, endDate),
            status: RestaurantOrderStatus.COMPLETED,
          },
          relations: ['server'],
        });

        const revenue = orders.reduce(
          (sum, order) => sum + Number(order.total),
          0,
        );
        const tips = orders.reduce(
          (sum, order) => sum + Number(order.tipAmount || 0),
          0,
        );
        const ordersWithTips = orders.filter(
          (order) => Number(order.tipAmount || 0) > 0,
        );
        const avgTipPercentage = ordersWithTips.length > 0
          ? ordersWithTips.reduce(
              (sum, order) => sum + (Number(order.tipPercentage) || 0),
              0,
            ) / ordersWithTips.length
          : 0;

        const serverName = orders[0]?.server
          ? `${orders[0].server.firstName || ''} ${orders[0].server.lastName || ''}`.trim() || orders[0].server.username
          : undefined;

        return {
          serverId,
          serverName,
          orderCount: orders.length,
          revenue: this.roundToTwo(revenue),
          tips: this.roundToTwo(tips),
          averageOrderValue: orders.length > 0
            ? this.roundToTwo(revenue / orders.length)
            : 0,
          averageTipPercentage: this.roundToTwo(avgTipPercentage),
        };
      }),
    );

    return {
      servers: serverMetrics,
      period: { startDate, endDate },
    };
  }

  /**
   * Get server leaderboard based on various metrics
   */
  async getServerLeaderboard(
    branchId: string,
    startDate: Date,
    endDate: Date,
    metric: 'revenue' | 'tips' | 'orders' | 'averageOrderValue' = 'revenue',
  ): Promise<Array<{
    rank: number;
    serverId: string;
    serverName?: string;
    value: number;
    orderCount: number;
  }>> {
    const orders = await this.orderRepository.find({
      where: {
        branchId,
        createdAt: Between(startDate, endDate),
        status: RestaurantOrderStatus.COMPLETED,
      },
      relations: ['server'],
    });

    // Group by server
    const serverMap = new Map<string, {
      serverName?: string;
      revenue: number;
      tips: number;
      orderCount: number;
    }>();

    orders.forEach((order) => {
      const serverName = order.server
        ? `${order.server.firstName || ''} ${order.server.lastName || ''}`.trim() || order.server.username
        : undefined;

      const existing = serverMap.get(order.serverId) || {
        serverName,
        revenue: 0,
        tips: 0,
        orderCount: 0,
      };
      existing.revenue += Number(order.total);
      existing.tips += Number(order.tipAmount || 0);
      existing.orderCount += 1;
      serverMap.set(order.serverId, existing);
    });

    // Convert to array and sort
    const leaderboard = Array.from(serverMap.entries()).map(
      ([serverId, data]) => {
        let value = 0;
        switch (metric) {
          case 'revenue':
            value = data.revenue;
            break;
          case 'tips':
            value = data.tips;
            break;
          case 'orders':
            value = data.orderCount;
            break;
          case 'averageOrderValue':
            value = data.orderCount > 0 ? data.revenue / data.orderCount : 0;
            break;
        }

        return {
          serverId,
          serverName: data.serverName,
          value: this.roundToTwo(value),
          orderCount: data.orderCount,
        };
      },
    );

    // Sort and add ranks
    leaderboard.sort((a, b) => b.value - a.value);
    return leaderboard.map((entry, index) => ({
      rank: index + 1,
      ...entry,
    }));
  }

  /**
   * Get active servers for a branch with current table assignments
   */
  async getActiveServers(branchId: string): Promise<Array<{
    serverId: string;
    serverName?: string;
    activeOrders: number;
    activeTables: number;
  }>> {
    const activeOrders = await this.orderRepository.find({
      where: {
        branchId,
        status: In([
          RestaurantOrderStatus.PENDING,
          RestaurantOrderStatus.CONFIRMED,
          RestaurantOrderStatus.PREPARING,
          RestaurantOrderStatus.READY,
          RestaurantOrderStatus.SERVED,
        ]),
      },
      relations: ['server'],
    });

    // Group by server
    const serverMap = new Map<string, {
      serverName?: string;
      orderCount: number;
      tables: Set<string>;
    }>();

    activeOrders.forEach((order) => {
      const serverName = order.server
        ? `${order.server.firstName || ''} ${order.server.lastName || ''}`.trim() || order.server.username
        : undefined;

      const existing = serverMap.get(order.serverId) || {
        serverName,
        orderCount: 0,
        tables: new Set<string>(),
      };
      existing.orderCount += 1;
      if (order.tableId) {
        existing.tables.add(order.tableId);
      }
      serverMap.set(order.serverId, existing);
    });

    return Array.from(serverMap.entries()).map(([serverId, data]) => ({
      serverId,
      serverName: data.serverName,
      activeOrders: data.orderCount,
      activeTables: data.tables.size,
    }));
  }

  /**
   * Helper method to round to 2 decimal places
   */
  private roundToTwo(num: number): number {
    return Math.round((num + Number.EPSILON) * 100) / 100;
  }
}
