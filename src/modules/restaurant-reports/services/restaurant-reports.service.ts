import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { RestaurantOrder } from '../../restaurant/entities/restaurant-order.entity';
import { OrderItem } from '../../restaurant/entities/order-item.entity';
import { Table } from '../../restaurant/entities/table.entity';
import { ServerShift } from '../../server-management/entities/server-shift.entity';
import { Product } from '../../products/entities/product.entity';
import { Recipe } from '../../recipes/entities/recipe.entity';
import {
  DateRangeFilterDto,
  ReportPeriod,
  ReportGranularity,
} from '../dto/date-range-filter.dto';
import {
  ServerPerformanceFilterDto,
  MenuAnalyticsFilterDto,
  TablePerformanceFilterDto,
  KitchenMetricsFilterDto,
} from '../dto/report-filters.dto';

@Injectable()
export class RestaurantReportsService {
  private readonly logger = new Logger(RestaurantReportsService.name);

  constructor(
    @InjectRepository(RestaurantOrder)
    private readonly orderRepository: Repository<RestaurantOrder>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Table)
    private readonly tableRepository: Repository<Table>,
    @InjectRepository(ServerShift)
    private readonly serverShiftRepository: Repository<ServerShift>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Recipe)
    private readonly recipeRepository: Repository<Recipe>,
  ) {}

  /**
   * Calculate date range from filter
   */
  private calculateDateRange(filter: DateRangeFilterDto): {
    startDate: Date;
    endDate: Date;
  } {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date();

    if (filter.period === ReportPeriod.CUSTOM) {
      if (!filter.startDate || !filter.endDate) {
        throw new Error(
          'Start date and end date are required for custom period',
        );
      }
      startDate = new Date(filter.startDate);
      endDate = new Date(filter.endDate);
    } else if (filter.startDate && filter.endDate) {
      startDate = new Date(filter.startDate);
      endDate = new Date(filter.endDate);
    } else {
      switch (filter.period) {
        case ReportPeriod.TODAY:
          startDate = new Date(now.setHours(0, 0, 0, 0));
          endDate = new Date(now.setHours(23, 59, 59, 999));
          break;
        case ReportPeriod.YESTERDAY:
          startDate = new Date(now.setDate(now.getDate() - 1));
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setHours(23, 59, 59, 999);
          break;
        case ReportPeriod.THIS_WEEK:
          startDate = new Date(now.setDate(now.getDate() - now.getDay()));
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date();
          break;
        case ReportPeriod.LAST_WEEK:
          endDate = new Date(now.setDate(now.getDate() - now.getDay() - 1));
          endDate.setHours(23, 59, 59, 999);
          startDate = new Date(endDate);
          startDate.setDate(startDate.getDate() - 6);
          startDate.setHours(0, 0, 0, 0);
          break;
        case ReportPeriod.THIS_MONTH:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date();
          break;
        case ReportPeriod.LAST_MONTH:
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
          break;
        case ReportPeriod.THIS_QUARTER:
          const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
          startDate = new Date(now.getFullYear(), quarterStartMonth, 1);
          endDate = new Date();
          break;
        case ReportPeriod.LAST_QUARTER:
          const lastQuarterStartMonth = Math.floor(now.getMonth() / 3) * 3 - 3;
          startDate = new Date(now.getFullYear(), lastQuarterStartMonth, 1);
          endDate = new Date(now.getFullYear(), lastQuarterStartMonth + 3, 0, 23, 59, 59, 999);
          break;
        case ReportPeriod.THIS_YEAR:
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date();
          break;
        case ReportPeriod.LAST_YEAR:
          startDate = new Date(now.getFullYear() - 1, 0, 1);
          endDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
          break;
        default:
          // Default to this month
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date();
      }
    }

    return { startDate, endDate };
  }

  /**
   * Calculate previous period date range for comparison
   */
  private calculatePreviousPeriod(startDate: Date, endDate: Date): {
    startDate: Date;
    endDate: Date;
  } {
    const duration = endDate.getTime() - startDate.getTime();
    const prevEndDate = new Date(startDate.getTime() - 1);
    const prevStartDate = new Date(prevEndDate.getTime() - duration);
    return { startDate: prevStartDate, endDate: prevEndDate };
  }

  /**
   * Build base where clause for orders
   */
  private buildOrderWhereClause(filter: DateRangeFilterDto) {
    const { startDate, endDate } = this.calculateDateRange(filter);
    const where: any = {
      createdAt: Between(startDate, endDate),
      status: In(['COMPLETED', 'SERVED']), // Only completed orders
    };

    if (filter.branchId) {
      where.branchId = filter.branchId;
    }

    return { where, startDate, endDate };
  }

  /**
   * TABLE PERFORMANCE ANALYTICS
   * Analyzes table utilization, revenue, and turnover
   */
  async getTablePerformanceReport(filter: TablePerformanceFilterDto) {
    this.logger.log('Generating table performance report');
    const { where, startDate, endDate } = this.buildOrderWhereClause(filter);

    // Additional filters for tables
    if (filter.tableIds?.length) {
      where.tableId = In(filter.tableIds);
    }

    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoin('order.table', 'table')
      .leftJoin('table.section', 'section')
      .select([
        'table.id AS "tableId"',
        'table.number AS "tableNumber"',
        'table.capacity AS "capacity"',
        'section.name AS "sectionName"',
        'COUNT(DISTINCT order.id) AS "ordersCount"',
        'SUM(order.total) AS "totalRevenue"',
        'AVG(order.total) AS "avgOrderValue"',
        'SUM(order.guestCount) AS "totalGuests"',
        'AVG(order.guestCount) AS "avgPartySize"',
        `AVG(EXTRACT(EPOCH FROM (order.completedAt - order.createdAt)) / 60) AS "avgDiningDuration"`,
        `AVG(EXTRACT(EPOCH FROM (order.servedAt - order.confirmedAt)) / 60) AS "avgServiceTime"`,
        'SUM(order.tipAmount) AS "totalTips"',
        'AVG(order.tipAmount) AS "avgTipAmount"',
      ])
      .where('order.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('order.status IN (:...statuses)', {
        statuses: ['COMPLETED', 'SERVED'],
      })
      .andWhere('order.tableId IS NOT NULL');

    if (filter.branchId) {
      queryBuilder.andWhere('order.branchId = :branchId', {
        branchId: filter.branchId,
      });
    }

    if (filter.tableIds?.length) {
      queryBuilder.andWhere('table.id IN (:...tableIds)', {
        tableIds: filter.tableIds,
      });
    }

    if (filter.sectionIds?.length) {
      queryBuilder.andWhere('table.sectionId IN (:...sectionIds)', {
        sectionIds: filter.sectionIds,
      });
    }

    queryBuilder
      .groupBy('table.id')
      .addGroupBy('table.number')
      .addGroupBy('table.capacity')
      .addGroupBy('section.name')
      .orderBy('"totalRevenue"', 'DESC');

    const tablePerformance = await queryBuilder.getRawMany();

    // Calculate table turnover rate (orders per day)
    const daysDuration =
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    const enhancedPerformance = tablePerformance.map((table) => ({
      ...table,
      totalRevenue: parseFloat(table.totalRevenue || 0),
      avgOrderValue: parseFloat(table.avgOrderValue || 0),
      avgDiningDuration: parseFloat(table.avgDiningDuration || 0),
      avgServiceTime: parseFloat(table.avgServiceTime || 0),
      totalTips: parseFloat(table.totalTips || 0),
      avgTipAmount: parseFloat(table.avgTipAmount || 0),
      ordersPerDay: parseFloat(table.ordersCount) / daysDuration,
      utilizationRate:
        (parseFloat(table.totalGuests) / parseFloat(table.capacity)) /
        daysDuration,
      revenuePerSeat: parseFloat(table.totalRevenue || 0) / parseFloat(table.capacity),
    }));

    // Summary statistics
    const summary = {
      totalTables: enhancedPerformance.length,
      totalRevenue: enhancedPerformance.reduce(
        (sum, t) => sum + t.totalRevenue,
        0,
      ),
      totalOrders: enhancedPerformance.reduce(
        (sum, t) => sum + parseInt(t.ordersCount),
        0,
      ),
      avgOrderValue:
        enhancedPerformance.reduce((sum, t) => sum + t.avgOrderValue, 0) /
        enhancedPerformance.length,
      avgDiningDuration:
        enhancedPerformance.reduce((sum, t) => sum + t.avgDiningDuration, 0) /
        enhancedPerformance.length,
      avgTurnoverRate:
        enhancedPerformance.reduce((sum, t) => sum + t.ordersPerDay, 0) /
        enhancedPerformance.length,
    };

    return {
      period: { startDate, endDate },
      summary,
      tables: enhancedPerformance,
    };
  }

  /**
   * MENU ANALYTICS
   * Analyzes menu item performance, popularity, and profitability
   */
  async getMenuAnalyticsReport(filter: MenuAnalyticsFilterDto) {
    this.logger.log('Generating menu analytics report');
    const { startDate, endDate } = this.calculateDateRange(filter);

    const queryBuilder = this.orderItemRepository
      .createQueryBuilder('orderItem')
      .leftJoin('orderItem.order', 'order')
      .leftJoin('orderItem.product', 'product')
      .leftJoin('product.category', 'category')
      .leftJoin('product.recipe', 'recipe')
      .select([
        'product.id AS "productId"',
        'product.name AS "productName"',
        'category.name AS "categoryName"',
        'product.restaurantCategory AS "restaurantCategory"',
        'product.kitchenStation AS "kitchenStation"',
        'COUNT(orderItem.id) AS "quantitySold"',
        'SUM(orderItem.price * orderItem.quantity) AS "totalRevenue"',
        'AVG(orderItem.price) AS "avgPrice"',
        'SUM(orderItem.quantity) AS "totalQuantity"',
        'recipe.costPerServing AS "costPerServing"',
        'AVG(orderItem.preparationTime) AS "avgPrepTime"',
      ])
      .where('order.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('order.status IN (:...statuses)', {
        statuses: ['COMPLETED', 'SERVED'],
      });

    if (filter.branchId) {
      queryBuilder.andWhere('order.branchId = :branchId', {
        branchId: filter.branchId,
      });
    }

    if (filter.categoryIds?.length) {
      queryBuilder.andWhere('product.categoryId IN (:...categoryIds)', {
        categoryIds: filter.categoryIds,
      });
    }

    if (filter.serviceType) {
      queryBuilder.andWhere('order.serviceType = :serviceType', {
        serviceType: filter.serviceType,
      });
    }

    queryBuilder
      .groupBy('product.id')
      .addGroupBy('product.name')
      .addGroupBy('category.name')
      .addGroupBy('product.restaurantCategory')
      .addGroupBy('product.kitchenStation')
      .addGroupBy('recipe.costPerServing')
      .orderBy('"totalRevenue"', 'DESC');

    const menuItems = await queryBuilder.getRawMany();

    // Calculate profitability metrics
    const enhancedMenuItems = menuItems.map((item) => {
      const revenue = parseFloat(item.totalRevenue || 0);
      const cost = parseFloat(item.costPerServing || 0) * parseFloat(item.totalQuantity || 0);
      const profit = revenue - cost;
      const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;

      return {
        ...item,
        totalRevenue: revenue,
        avgPrice: parseFloat(item.avgPrice || 0),
        costPerServing: parseFloat(item.costPerServing || 0),
        totalCost: cost,
        totalProfit: profit,
        profitMargin: profitMargin,
        avgPrepTime: parseFloat(item.avgPrepTime || 0),
        popularity: parseFloat(item.quantitySold),
      };
    });

    // Category aggregation
    const categoryStats = enhancedMenuItems.reduce((acc, item) => {
      const category = item.categoryName || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = {
          category,
          itemCount: 0,
          totalRevenue: 0,
          totalQuantity: 0,
          totalProfit: 0,
        };
      }
      acc[category].itemCount++;
      acc[category].totalRevenue += item.totalRevenue;
      acc[category].totalQuantity += parseInt(item.totalQuantity);
      acc[category].totalProfit += item.totalProfit;
      return acc;
    }, {});

    const summary = {
      totalItems: enhancedMenuItems.length,
      totalRevenue: enhancedMenuItems.reduce((sum, i) => sum + i.totalRevenue, 0),
      totalCost: enhancedMenuItems.reduce((sum, i) => sum + i.totalCost, 0),
      totalProfit: enhancedMenuItems.reduce((sum, i) => sum + i.totalProfit, 0),
      avgProfitMargin:
        enhancedMenuItems.reduce((sum, i) => sum + i.profitMargin, 0) /
        enhancedMenuItems.length,
      topSellingItems: enhancedMenuItems.slice(0, 10),
      categoryBreakdown: Object.values(categoryStats),
    };

    return {
      period: { startDate, endDate },
      summary,
      items: enhancedMenuItems,
    };
  }

  /**
   * SERVER PERFORMANCE ANALYTICS
   * Analyzes server efficiency, sales, and customer satisfaction
   */
  async getServerPerformanceReport(filter: ServerPerformanceFilterDto) {
    this.logger.log('Generating server performance report');
    const { startDate, endDate } = this.calculateDateRange(filter);

    const queryBuilder = this.serverShiftRepository
      .createQueryBuilder('shift')
      .leftJoin('shift.server', 'server')
      .leftJoin('shift.branch', 'branch')
      .select([
        'server.id AS "serverId"',
        'server.username AS "serverName"',
        'COUNT(DISTINCT shift.id) AS "shiftsWorked"',
        'SUM(shift.ordersServed) AS "totalOrders"',
        'SUM(shift.tablesServed) AS "totalTables"',
        'SUM(shift.totalSales) AS "totalSales"',
        'AVG(shift.totalSales) AS "avgSalesPerShift"',
        'SUM(shift.totalTips) AS "totalTips"',
        'AVG(shift.totalTips) AS "avgTipsPerShift"',
        'AVG(shift.avgTableTurnTime) AS "avgTableTurnTime"',
        'AVG(shift.avgServiceTime) AS "avgServiceTime"',
        'AVG(shift.customerSatisfactionScore) AS "avgSatisfactionScore"',
        'SUM(shift.actualDuration) AS "totalHoursWorked"',
        'AVG(shift.salesPerHour) AS "avgSalesPerHour"',
        'AVG(shift.tipsPerHour) AS "avgTipsPerHour"',
      ])
      .where('shift.clockInTime BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('shift.status = :status', { status: 'CLOCKED_OUT' });

    if (filter.branchId) {
      queryBuilder.andWhere('shift.branchId = :branchId', {
        branchId: filter.branchId,
      });
    }

    if (filter.serverIds?.length) {
      queryBuilder.andWhere('server.id IN (:...serverIds)', {
        serverIds: filter.serverIds,
      });
    }

    queryBuilder
      .groupBy('server.id')
      .addGroupBy('server.username')
      .orderBy('"totalSales"', 'DESC');

    const serverPerformance = await queryBuilder.getRawMany();

    const enhancedPerformance = serverPerformance.map((server) => ({
      ...server,
      totalSales: parseFloat(server.totalSales || 0),
      avgSalesPerShift: parseFloat(server.avgSalesPerShift || 0),
      totalTips: parseFloat(server.totalTips || 0),
      avgTipsPerShift: parseFloat(server.avgTipsPerShift || 0),
      avgTableTurnTime: parseFloat(server.avgTableTurnTime || 0),
      avgServiceTime: parseFloat(server.avgServiceTime || 0),
      avgSatisfactionScore: parseFloat(server.avgSatisfactionScore || 0),
      totalHoursWorked: parseFloat(server.totalHoursWorked || 0) / 60, // Convert to hours
      avgSalesPerHour: parseFloat(server.avgSalesPerHour || 0),
      avgTipsPerHour: parseFloat(server.avgTipsPerHour || 0),
      ordersPerShift:
        parseFloat(server.totalOrders || 0) / parseFloat(server.shiftsWorked || 1),
      tipPercentage:
        parseFloat(server.totalSales || 0) > 0
          ? (parseFloat(server.totalTips || 0) / parseFloat(server.totalSales || 0)) * 100
          : 0,
    }));

    const summary = {
      totalServers: enhancedPerformance.length,
      totalSales: enhancedPerformance.reduce((sum, s) => sum + s.totalSales, 0),
      totalTips: enhancedPerformance.reduce((sum, s) => sum + s.totalTips, 0),
      totalOrders: enhancedPerformance.reduce(
        (sum, s) => sum + parseInt(s.totalOrders || 0),
        0,
      ),
      avgSalesPerServer:
        enhancedPerformance.reduce((sum, s) => sum + s.totalSales, 0) /
        enhancedPerformance.length,
      avgTipsPerServer:
        enhancedPerformance.reduce((sum, s) => sum + s.totalTips, 0) /
        enhancedPerformance.length,
      topPerformers: enhancedPerformance.slice(0, 5),
    };

    return {
      period: { startDate, endDate },
      summary,
      servers: enhancedPerformance,
    };
  }

  /**
   * KITCHEN METRICS
   * Analyzes kitchen efficiency, preparation times, and station performance
   */
  async getKitchenMetricsReport(filter: KitchenMetricsFilterDto) {
    this.logger.log('Generating kitchen metrics report');
    const { startDate, endDate } = this.calculateDateRange(filter);

    const queryBuilder = this.orderItemRepository
      .createQueryBuilder('orderItem')
      .leftJoin('orderItem.order', 'order')
      .leftJoin('orderItem.product', 'product')
      .select([
        'orderItem.kitchenStation AS "kitchenStation"',
        'COUNT(orderItem.id) AS "totalItems"',
        'AVG(orderItem.preparationTime) AS "avgPrepTime"',
        `AVG(EXTRACT(EPOCH FROM (orderItem.kitchenStartedAt - orderItem.sentToKitchenAt)) / 60) AS "avgWaitTime"`,
        `AVG(EXTRACT(EPOCH FROM (orderItem.kitchenCompletedAt - orderItem.kitchenStartedAt)) / 60) AS "avgCookTime"`,
        `SUM(CASE WHEN orderItem.preparationTime > product.preparationTime THEN 1 ELSE 0 END) AS "lateItems"`,
        `SUM(CASE WHEN orderItem.preparationTime <= product.preparationTime THEN 1 ELSE 0 END) AS "onTimeItems"`,
      ])
      .where('order.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('order.status IN (:...statuses)', {
        statuses: ['COMPLETED', 'SERVED'],
      })
      .andWhere('orderItem.kitchenStation IS NOT NULL');

    if (filter.branchId) {
      queryBuilder.andWhere('order.branchId = :branchId', {
        branchId: filter.branchId,
      });
    }

    if (filter.stationIds?.length) {
      queryBuilder.andWhere('orderItem.kitchenStation IN (:...stationIds)', {
        stationIds: filter.stationIds,
      });
    }

    queryBuilder
      .groupBy('orderItem.kitchenStation')
      .orderBy('"totalItems"', 'DESC');

    const stationMetrics = await queryBuilder.getRawMany();

    const enhancedMetrics = stationMetrics.map((station) => {
      const total = parseInt(station.totalItems);
      const onTime = parseInt(station.onTimeItems || 0);
      const late = parseInt(station.lateItems || 0);

      return {
        ...station,
        avgPrepTime: parseFloat(station.avgPrepTime || 0),
        avgWaitTime: parseFloat(station.avgWaitTime || 0),
        avgCookTime: parseFloat(station.avgCookTime || 0),
        onTimePercentage: total > 0 ? (onTime / total) * 100 : 0,
        latePercentage: total > 0 ? (late / total) * 100 : 0,
        efficiency: total > 0 ? (onTime / total) * 100 : 0,
      };
    });

    const summary = {
      totalStations: enhancedMetrics.length,
      totalItemsProduced: enhancedMetrics.reduce(
        (sum, s) => sum + parseInt(s.totalItems),
        0,
      ),
      avgPrepTime:
        enhancedMetrics.reduce((sum, s) => sum + s.avgPrepTime, 0) /
        enhancedMetrics.length,
      overallEfficiency:
        enhancedMetrics.reduce((sum, s) => sum + s.efficiency, 0) /
        enhancedMetrics.length,
      bestPerformingStation: enhancedMetrics.reduce((best, current) =>
        current.efficiency > best.efficiency ? current : best,
      ),
      worstPerformingStation: enhancedMetrics.reduce((worst, current) =>
        current.efficiency < worst.efficiency ? current : worst,
      ),
    };

    return {
      period: { startDate, endDate },
      summary,
      stations: enhancedMetrics,
    };
  }

  /**
   * SERVICE TYPE ANALYSIS
   * Compares performance across DINE_IN, TAKEAWAY, and DELIVERY
   */
  async getServiceTypeAnalysisReport(filter: DateRangeFilterDto) {
    this.logger.log('Generating service type analysis report');
    const { startDate, endDate } = this.calculateDateRange(filter);

    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .select([
        'order.serviceType AS "serviceType"',
        'COUNT(order.id) AS "ordersCount"',
        'SUM(order.total) AS "totalRevenue"',
        'AVG(order.total) AS "avgOrderValue"',
        'SUM(order.guestCount) AS "totalGuests"',
        'AVG(order.guestCount) AS "avgPartySize"',
        'SUM(order.tipAmount) AS "totalTips"',
        'AVG(order.tipAmount) AS "avgTipAmount"',
        `AVG(EXTRACT(EPOCH FROM (order.completedAt - order.createdAt)) / 60) AS "avgFulfillmentTime"`,
      ])
      .where('order.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('order.status IN (:...statuses)', {
        statuses: ['COMPLETED', 'SERVED'],
      });

    if (filter.branchId) {
      queryBuilder.andWhere('order.branchId = :branchId', {
        branchId: filter.branchId,
      });
    }

    queryBuilder.groupBy('order.serviceType').orderBy('"totalRevenue"', 'DESC');

    const serviceTypeData = await queryBuilder.getRawMany();

    const enhancedData = serviceTypeData.map((type) => ({
      ...type,
      totalRevenue: parseFloat(type.totalRevenue || 0),
      avgOrderValue: parseFloat(type.avgOrderValue || 0),
      totalTips: parseFloat(type.totalTips || 0),
      avgTipAmount: parseFloat(type.avgTipAmount || 0),
      avgFulfillmentTime: parseFloat(type.avgFulfillmentTime || 0),
      revenuePercentage: 0, // Will be calculated below
    }));

    const totalRevenue = enhancedData.reduce((sum, t) => sum + t.totalRevenue, 0);
    enhancedData.forEach((type) => {
      type.revenuePercentage = totalRevenue > 0 ? (type.totalRevenue / totalRevenue) * 100 : 0;
    });

    const summary = {
      totalRevenue,
      totalOrders: enhancedData.reduce(
        (sum, t) => sum + parseInt(t.ordersCount),
        0,
      ),
      serviceTypeBreakdown: enhancedData,
      mostPopularType: enhancedData.reduce((popular, current) =>
        parseInt(current.ordersCount) > parseInt(popular.ordersCount)
          ? current
          : popular,
      ),
      highestRevenueType: enhancedData.reduce((highest, current) =>
        current.totalRevenue > highest.totalRevenue ? current : highest,
      ),
    };

    return {
      period: { startDate, endDate },
      summary,
      serviceTypes: enhancedData,
    };
  }

  /**
   * FOOD COST PERCENTAGE
   * Analyzes cost of goods sold and food cost percentages
   */
  async getFoodCostAnalysisReport(filter: DateRangeFilterDto) {
    this.logger.log('Generating food cost analysis report');
    const { startDate, endDate } = this.calculateDateRange(filter);

    const queryBuilder = this.orderItemRepository
      .createQueryBuilder('orderItem')
      .leftJoin('orderItem.order', 'order')
      .leftJoin('orderItem.product', 'product')
      .leftJoin('product.recipe', 'recipe')
      .leftJoin('product.category', 'category')
      .select([
        'category.name AS "categoryName"',
        'SUM(orderItem.price * orderItem.quantity) AS "revenue"',
        'SUM(recipe.costPerServing * orderItem.quantity) AS "cost"',
        'SUM(orderItem.quantity) AS "quantity"',
      ])
      .where('order.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('order.status IN (:...statuses)', {
        statuses: ['COMPLETED', 'SERVED'],
      })
      .andWhere('recipe.id IS NOT NULL'); // Only items with recipes

    if (filter.branchId) {
      queryBuilder.andWhere('order.branchId = :branchId', {
        branchId: filter.branchId,
      });
    }

    queryBuilder.groupBy('category.name').orderBy('"revenue"', 'DESC');

    const categoryData = await queryBuilder.getRawMany();

    const enhancedData = categoryData.map((cat) => {
      const revenue = parseFloat(cat.revenue || 0);
      const cost = parseFloat(cat.cost || 0);
      const profit = revenue - cost;

      return {
        ...cat,
        revenue,
        cost,
        profit,
        foodCostPercentage: revenue > 0 ? (cost / revenue) * 100 : 0,
        profitMargin: revenue > 0 ? (profit / revenue) * 100 : 0,
      };
    });

    const totalRevenue = enhancedData.reduce((sum, c) => sum + c.revenue, 0);
    const totalCost = enhancedData.reduce((sum, c) => sum + c.cost, 0);
    const totalProfit = totalRevenue - totalCost;

    const summary = {
      totalRevenue,
      totalCost,
      totalProfit,
      overallFoodCostPercentage:
        totalRevenue > 0 ? (totalCost / totalRevenue) * 100 : 0,
      overallProfitMargin:
        totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
      categoryBreakdown: enhancedData,
      bestMarginCategory: enhancedData.reduce((best, current) =>
        current.profitMargin > best.profitMargin ? current : best,
      ),
      worstMarginCategory: enhancedData.reduce((worst, current) =>
        current.profitMargin < worst.profitMargin ? current : worst,
      ),
    };

    return {
      period: { startDate, endDate },
      summary,
      categories: enhancedData,
    };
  }

  /**
   * Get table turnover calculations
   */
  async getTableTurnoverReport(filter: TablePerformanceFilterDto) {
    this.logger.log('Generating table turnover report');
    const { startDate, endDate } = this.calculateDateRange(filter);

    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoin('order.table', 'table')
      .select([
        'table.id AS "tableId"',
        'table.number AS "tableNumber"',
        'DATE(order.createdAt) AS "date"',
        'COUNT(order.id) AS "turnovers"',
        `AVG(EXTRACT(EPOCH FROM (order.completedAt - order.createdAt)) / 60) AS "avgDiningDuration"`,
        'SUM(order.total) AS "dailyRevenue"',
      ])
      .where('order.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('order.status IN (:...statuses)', {
        statuses: ['COMPLETED', 'SERVED'],
      })
      .andWhere('order.tableId IS NOT NULL');

    if (filter.branchId) {
      queryBuilder.andWhere('order.branchId = :branchId', {
        branchId: filter.branchId,
      });
    }

    if (filter.tableIds?.length) {
      queryBuilder.andWhere('table.id IN (:...tableIds)', {
        tableIds: filter.tableIds,
      });
    }

    queryBuilder
      .groupBy('table.id')
      .addGroupBy('table.number')
      .addGroupBy('DATE(order.createdAt)')
      .orderBy('DATE(order.createdAt)', 'DESC')
      .addOrderBy('"turnovers"', 'DESC');

    const turnoverData = await queryBuilder.getRawMany();

    const enhancedData = turnoverData.map((row) => ({
      ...row,
      avgDiningDuration: parseFloat(row.avgDiningDuration || 0),
      dailyRevenue: parseFloat(row.dailyRevenue || 0),
      revenuePerTurnover:
        parseFloat(row.dailyRevenue || 0) / parseInt(row.turnovers || 1),
    }));

    // Aggregate by table
    const tableAggregation = enhancedData.reduce((acc, row) => {
      const tableId = row.tableId;
      if (!acc[tableId]) {
        acc[tableId] = {
          tableId: row.tableId,
          tableNumber: row.tableNumber,
          totalTurnovers: 0,
          avgTurnoversPerDay: 0,
          avgDiningDuration: 0,
          totalRevenue: 0,
          days: 0,
        };
      }
      acc[tableId].totalTurnovers += parseInt(row.turnovers);
      acc[tableId].totalRevenue += row.dailyRevenue;
      acc[tableId].days++;
      return acc;
    }, {});

    const tableStats = Object.values(tableAggregation).map((table: any) => ({
      ...table,
      avgTurnoversPerDay: table.totalTurnovers / table.days,
      avgRevenuePerDay: table.totalRevenue / table.days,
    }));

    const summary = {
      avgTurnoversPerDay:
        tableStats.reduce((sum, t: any) => sum + t.avgTurnoversPerDay, 0) /
        tableStats.length,
      totalRevenue: tableStats.reduce((sum, t: any) => sum + t.totalRevenue, 0),
      topTurnoverTables: tableStats
        .sort((a: any, b: any) => b.avgTurnoversPerDay - a.avgTurnoversPerDay)
        .slice(0, 5),
    };

    return {
      period: { startDate, endDate },
      summary,
      daily: enhancedData,
      byTable: tableStats,
    };
  }

  /**
   * PEAK HOURS ANALYSIS
   * Identifies busiest hours and revenue patterns
   */
  async getPeakHoursAnalysisReport(filter: DateRangeFilterDto) {
    this.logger.log('Generating peak hours analysis report');
    const { startDate, endDate } = this.calculateDateRange(filter);

    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .select([
        'EXTRACT(HOUR FROM order.createdAt) AS "hour"',
        'EXTRACT(DOW FROM order.createdAt) AS "dayOfWeek"',
        'COUNT(order.id) AS "ordersCount"',
        'SUM(order.total) AS "revenue"',
        'AVG(order.total) AS "avgOrderValue"',
        'SUM(order.guestCount) AS "totalGuests"',
      ])
      .where('order.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('order.status IN (:...statuses)', {
        statuses: ['COMPLETED', 'SERVED'],
      });

    if (filter.branchId) {
      queryBuilder.andWhere('order.branchId = :branchId', {
        branchId: filter.branchId,
      });
    }

    queryBuilder
      .groupBy('EXTRACT(HOUR FROM order.createdAt)')
      .addGroupBy('EXTRACT(DOW FROM order.createdAt)')
      .orderBy('"revenue"', 'DESC');

    const hourlyData = await queryBuilder.getRawMany();

    const dayNames = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];

    const enhancedData = hourlyData.map((row) => ({
      hour: parseInt(row.hour),
      dayOfWeek: dayNames[parseInt(row.dayOfWeek)],
      ordersCount: parseInt(row.ordersCount),
      revenue: parseFloat(row.revenue || 0),
      avgOrderValue: parseFloat(row.avgOrderValue || 0),
      totalGuests: parseInt(row.totalGuests || 0),
    }));

    // Aggregate by hour
    const hourlyAggregation = enhancedData.reduce((acc, row) => {
      const hour = row.hour;
      if (!acc[hour]) {
        acc[hour] = {
          hour,
          totalOrders: 0,
          totalRevenue: 0,
          totalGuests: 0,
        };
      }
      acc[hour].totalOrders += row.ordersCount;
      acc[hour].totalRevenue += row.revenue;
      acc[hour].totalGuests += row.totalGuests;
      return acc;
    }, {});

    const hourlyStats = Object.values(hourlyAggregation).sort(
      (a: any, b: any) => b.totalRevenue - a.totalRevenue,
    );

    // Aggregate by day of week
    const dailyAggregation = enhancedData.reduce((acc, row) => {
      const day = row.dayOfWeek;
      if (!acc[day]) {
        acc[day] = {
          dayOfWeek: day,
          totalOrders: 0,
          totalRevenue: 0,
          totalGuests: 0,
        };
      }
      acc[day].totalOrders += row.ordersCount;
      acc[day].totalRevenue += row.revenue;
      acc[day].totalGuests += row.totalGuests;
      return acc;
    }, {});

    const dailyStats = Object.values(dailyAggregation).sort(
      (a: any, b: any) => b.totalRevenue - a.totalRevenue,
    );

    const summary = {
      peakHour: hourlyStats[0],
      peakDay: dailyStats[0],
      slowestHour: hourlyStats[hourlyStats.length - 1],
      slowestDay: dailyStats[dailyStats.length - 1],
    };

    return {
      period: { startDate, endDate },
      summary,
      hourly: hourlyStats,
      daily: dailyStats,
      detailed: enhancedData,
    };
  }

  /**
   * PROFIT MARGIN ANALYSIS
   * Overall profitability metrics
   */
  async getProfitMarginAnalysisReport(filter: DateRangeFilterDto) {
    this.logger.log('Generating profit margin analysis report');
    const { startDate, endDate } = this.calculateDateRange(filter);

    // Get total revenue from orders
    const revenueQuery = this.orderRepository
      .createQueryBuilder('order')
      .select([
        'SUM(order.total) AS "totalRevenue"',
        'SUM(order.subtotal) AS "subtotal"',
        'SUM(order.tax) AS "totalTax"',
        'SUM(order.discount) AS "totalDiscount"',
        'SUM(order.tipAmount) AS "totalTips"',
        'COUNT(order.id) AS "ordersCount"',
        'AVG(order.total) AS "avgOrderValue"',
      ])
      .where('order.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('order.status IN (:...statuses)', {
        statuses: ['COMPLETED', 'SERVED'],
      });

    if (filter.branchId) {
      revenueQuery.andWhere('order.branchId = :branchId', {
        branchId: filter.branchId,
      });
    }

    const revenueData = await revenueQuery.getRawOne();

    // Get cost from recipes
    const costQuery = this.orderItemRepository
      .createQueryBuilder('orderItem')
      .leftJoin('orderItem.order', 'order')
      .leftJoin('orderItem.product', 'product')
      .leftJoin('product.recipe', 'recipe')
      .select([
        'SUM(recipe.costPerServing * orderItem.quantity) AS "totalCost"',
        'SUM(recipe.ingredientCost * orderItem.quantity) AS "ingredientCost"',
        'SUM(recipe.laborCost * orderItem.quantity) AS "laborCost"',
        'SUM(recipe.overheadCost * orderItem.quantity) AS "overheadCost"',
      ])
      .where('order.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('order.status IN (:...statuses)', {
        statuses: ['COMPLETED', 'SERVED'],
      })
      .andWhere('recipe.id IS NOT NULL');

    if (filter.branchId) {
      costQuery.andWhere('order.branchId = :branchId', {
        branchId: filter.branchId,
      });
    }

    const costData = await costQuery.getRawOne();

    const totalRevenue = parseFloat(revenueData?.totalRevenue || 0);
    const totalCost = parseFloat(costData?.totalCost || 0);
    const grossProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    const analysis = {
      revenue: {
        total: totalRevenue,
        subtotal: parseFloat(revenueData?.subtotal || 0),
        tax: parseFloat(revenueData?.totalTax || 0),
        discount: parseFloat(revenueData?.totalDiscount || 0),
        tips: parseFloat(revenueData?.totalTips || 0),
      },
      costs: {
        total: totalCost,
        ingredients: parseFloat(costData?.ingredientCost || 0),
        labor: parseFloat(costData?.laborCost || 0),
        overhead: parseFloat(costData?.overheadCost || 0),
      },
      profitability: {
        grossProfit,
        profitMargin,
        costPercentage: totalRevenue > 0 ? (totalCost / totalRevenue) * 100 : 0,
      },
      orderMetrics: {
        totalOrders: parseInt(revenueData?.ordersCount || 0),
        avgOrderValue: parseFloat(revenueData?.avgOrderValue || 0),
        avgProfitPerOrder:
          parseInt(revenueData?.ordersCount || 0) > 0
            ? grossProfit / parseInt(revenueData?.ordersCount || 0)
            : 0,
      },
    };

    return {
      period: { startDate, endDate },
      analysis,
    };
  }

  /**
   * QR ORDERING ANALYTICS
   * Analyzes QR code ordering patterns and conversion
   */
  async getQROrderingAnalyticsReport(filter: DateRangeFilterDto) {
    this.logger.log('Generating QR ordering analytics report');
    const { startDate, endDate } = this.calculateDateRange(filter);

    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoin('order.qrOrderSession', 'qrSession')
      .select([
        'COUNT(DISTINCT order.id) AS "totalQROrders"',
        'COUNT(DISTINCT qrSession.id) AS "totalSessions"',
        'SUM(order.total) AS "totalRevenue"',
        'AVG(order.total) AS "avgOrderValue"',
        `AVG(EXTRACT(EPOCH FROM (order.createdAt - qrSession.createdAt)) / 60) AS "avgTimeToOrder"`,
        'COUNT(DISTINCT order.tableId) AS "tablesUsed"',
      ])
      .where('order.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('order.status IN (:...statuses)', {
        statuses: ['COMPLETED', 'SERVED'],
      })
      .andWhere('qrSession.id IS NOT NULL'); // Only QR orders

    if (filter.branchId) {
      queryBuilder.andWhere('order.branchId = :branchId', {
        branchId: filter.branchId,
      });
    }

    const qrData = await queryBuilder.getRawOne();

    // Get total orders for comparison
    const totalOrdersQuery = this.orderRepository
      .createQueryBuilder('order')
      .select('COUNT(order.id) AS "totalOrders"')
      .where('order.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('order.status IN (:...statuses)', {
        statuses: ['COMPLETED', 'SERVED'],
      });

    if (filter.branchId) {
      totalOrdersQuery.andWhere('order.branchId = :branchId', {
        branchId: filter.branchId,
      });
    }

    const totalOrders = await totalOrdersQuery.getRawOne();

    const qrOrders = parseInt(qrData?.totalQROrders || 0);
    const allOrders = parseInt(totalOrders?.totalOrders || 0);

    const analytics = {
      qrOrders: {
        total: qrOrders,
        sessions: parseInt(qrData?.totalSessions || 0),
        revenue: parseFloat(qrData?.totalRevenue || 0),
        avgOrderValue: parseFloat(qrData?.avgOrderValue || 0),
        avgTimeToOrder: parseFloat(qrData?.avgTimeToOrder || 0),
        tablesUsed: parseInt(qrData?.tablesUsed || 0),
      },
      adoption: {
        qrOrderPercentage: allOrders > 0 ? (qrOrders / allOrders) * 100 : 0,
        conversionRate:
          parseInt(qrData?.totalSessions || 0) > 0
            ? (qrOrders / parseInt(qrData?.totalSessions || 0)) * 100
            : 0,
      },
      comparison: {
        totalOrders: allOrders,
        traditionalOrders: allOrders - qrOrders,
      },
    };

    return {
      period: { startDate, endDate },
      analytics,
    };
  }
}
