import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan, LessThan } from 'typeorm';
import { Sale, PaymentStatus, SaleType } from '../pos/entities/sale.entity';
import { SaleItem } from '../pos/entities/sale-item.entity';
import { Product } from '../products/entities/product.entity';
import { Customer } from '../customers/entities/customer.entity';
import {
  DashboardAnalytics,
  TrendAnalysis,
  ComparativeAnalysis,
  ProductPerformanceAnalytics,
  CustomerBehaviorAnalytics,
  TimeSeriesData,
  ProductMetric,
  CategoryMetric,
  ActivityItem,
  Alert,
  TrendMetric,
  PeriodComparison,
  ProductAnalytics,
  FrequencyDistribution,
  SpendingSegment,
} from './interfaces/analytics-data.interface';
import { AnalyticsQueryDto, TimeGranularity } from './dto/analytics-query.dto';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Sale)
    private salesRepository: Repository<Sale>,
    @InjectRepository(SaleItem)
    private saleItemsRepository: Repository<SaleItem>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(Customer)
    private customersRepository: Repository<Customer>,
  ) {}

  private getDefaultDateRange(): { startDate: Date; endDate: Date } {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    return { startDate, endDate };
  }

  async getDashboardAnalytics(dto: AnalyticsQueryDto): Promise<DashboardAnalytics> {
    const { startDate, endDate } = dto.startDate && dto.endDate
      ? { startDate: new Date(dto.startDate), endDate: new Date(dto.endDate) }
      : this.getDefaultDateRange();

    const where: any = {
      createdAt: Between(startDate, endDate),
      saleType: SaleType.SALE,
      paymentStatus: PaymentStatus.PAID,
      isHeld: false,
    };

    if (dto.branchId) {
      where.branchId = dto.branchId;
    }

    const sales = await this.salesRepository.find({
      where,
      relations: ['items', 'items.product', 'items.product.category', 'customer'],
    });

    // Calculate overview metrics
    const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
    const totalSales = sales.length;
    const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Get unique customers
    const uniqueCustomers = new Set(
      sales.filter((s) => s.customerId).map((s) => s.customerId),
    );
    const totalCustomers = uniqueCustomers.size;

    // Calculate growth rates (compare with previous period)
    const periodLength = endDate.getTime() - startDate.getTime();
    const previousStartDate = new Date(startDate.getTime() - periodLength);
    const previousEndDate = new Date(startDate);

    const previousWhere = { ...where, createdAt: Between(previousStartDate, previousEndDate) };
    const previousSales = await this.salesRepository.find({ where: previousWhere });

    const previousRevenue = previousSales.reduce((sum, sale) => sum + Number(sale.total), 0);
    const previousSalesCount = previousSales.length;

    const revenueGrowth =
      previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;
    const salesGrowth =
      previousSalesCount > 0
        ? ((totalSales - previousSalesCount) / previousSalesCount) * 100
        : 0;

    // Generate time series data for charts
    const revenueChart = this.generateTimeSeriesData(sales, 'revenue', dto.granularity);
    const salesChart = this.generateTimeSeriesData(sales, 'count', dto.granularity);

    // Top products
    const productMap = new Map<string, ProductMetric>();
    for (const sale of sales) {
      for (const item of sale.items) {
        if (item.product) {
          const existing = productMap.get(item.product.id) || {
            productId: item.product.id,
            productName: item.product.name,
            value: 0,
          };
          existing.value += Number(item.total);
          productMap.set(item.product.id, existing);
        }
      }
    }

    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Top categories
    const categoryMap = new Map<string, CategoryMetric>();
    let totalCategoryRevenue = 0;

    for (const sale of sales) {
      for (const item of sale.items) {
        if (item.product && item.product.category) {
          const category = item.product.category;
          const existing = categoryMap.get(category.id) || {
            categoryId: category.id,
            categoryName: category.name,
            value: 0,
            percentage: 0,
          };
          existing.value += Number(item.total);
          totalCategoryRevenue += Number(item.total);
          categoryMap.set(category.id, existing);
        }
      }
    }

    const topCategories = Array.from(categoryMap.values())
      .map((cat) => ({
        ...cat,
        percentage: totalCategoryRevenue > 0 ? (cat.value / totalCategoryRevenue) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Recent activity
    const recentSales = sales
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10);

    const recentActivity: ActivityItem[] = recentSales.map((sale) => ({
      id: sale.id,
      type: 'sale' as const,
      description: `Sale ${sale.saleNumber} - $${Number(sale.total).toFixed(2)}`,
      timestamp: sale.createdAt,
      metadata: { saleNumber: sale.saleNumber, total: sale.total },
    }));

    // Generate alerts
    const alerts: Alert[] = [];

    // Check for low stock items
    const lowStockProducts = await this.productsRepository.find({
      where: { isActive: true, trackInventory: true },
    });

    let lowStockCount = 0;
    for (const product of lowStockProducts) {
      if (product.stockQuantity <= product.reorderLevel && product.stockQuantity > 0) {
        lowStockCount++;
      }
    }

    if (lowStockCount > 0) {
      alerts.push({
        id: `low-stock-${Date.now()}`,
        type: 'warning',
        message: `${lowStockCount} products are below reorder level`,
        severity: 'medium',
        timestamp: new Date(),
      });
    }

    // Check for significant revenue drop
    if (revenueGrowth < -10) {
      alerts.push({
        id: `revenue-drop-${Date.now()}`,
        type: 'error',
        message: `Revenue decreased by ${Math.abs(revenueGrowth).toFixed(1)}%`,
        severity: 'high',
        timestamp: new Date(),
      });
    }

    return {
      overview: {
        totalRevenue,
        totalSales,
        averageOrderValue,
        totalCustomers,
        revenueGrowth,
        salesGrowth,
      },
      revenueChart,
      salesChart,
      topProducts,
      topCategories,
      recentActivity,
      alerts,
    };
  }

  async getTrendAnalysis(dto: AnalyticsQueryDto): Promise<TrendAnalysis> {
    const { startDate, endDate } = dto.startDate && dto.endDate
      ? { startDate: new Date(dto.startDate), endDate: new Date(dto.endDate) }
      : this.getDefaultDateRange();

    const where: any = {
      createdAt: Between(startDate, endDate),
      saleType: SaleType.SALE,
      paymentStatus: PaymentStatus.PAID,
      isHeld: false,
    };

    if (dto.branchId) {
      where.branchId = dto.branchId;
    }

    const sales = await this.salesRepository.find({
      where,
      relations: ['customer'],
    });

    // Current period metrics
    const currentRevenue = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
    const currentSales = sales.length;
    const currentAOV = currentSales > 0 ? currentRevenue / currentSales : 0;
    const currentCustomers = new Set(sales.filter((s) => s.customerId).map((s) => s.customerId))
      .size;

    // Previous period metrics
    const periodLength = endDate.getTime() - startDate.getTime();
    const previousStartDate = new Date(startDate.getTime() - periodLength);
    const previousEndDate = new Date(startDate);

    const previousWhere = { ...where, createdAt: Between(previousStartDate, previousEndDate) };
    const previousSales = await this.salesRepository.find({
      where: previousWhere,
      relations: ['customer'],
    });

    const previousRevenue = previousSales.reduce((sum, sale) => sum + Number(sale.total), 0);
    const previousSalesCount = previousSales.length;
    const previousAOV = previousSalesCount > 0 ? previousRevenue / previousSalesCount : 0;
    const previousCustomers = new Set(
      previousSales.filter((s) => s.customerId).map((s) => s.customerId),
    ).size;

    // Calculate trend metrics
    const revenueTrend = this.calculateTrendMetric(currentRevenue, previousRevenue);
    const salesTrend = this.calculateTrendMetric(currentSales, previousSalesCount);
    const aovTrend = this.calculateTrendMetric(currentAOV, previousAOV);
    const customersTrend = this.calculateTrendMetric(currentCustomers, previousCustomers);

    // Generate time series data
    const timeSeries = this.generateTimeSeriesData(sales, 'revenue', dto.granularity);

    return {
      period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
      metrics: {
        revenue: revenueTrend,
        sales: salesTrend,
        averageOrderValue: aovTrend,
        customers: customersTrend,
      },
      timeSeries,
    };
  }

  async getComparativeAnalysis(dto: AnalyticsQueryDto): Promise<ComparativeAnalysis> {
    const periodsCount = dto.comparePeriodsCount || 4;
    const { startDate, endDate } = dto.startDate && dto.endDate
      ? { startDate: new Date(dto.startDate), endDate: new Date(dto.endDate) }
      : this.getDefaultDateRange();

    const periodLength = endDate.getTime() - startDate.getTime();
    const comparisons: PeriodComparison[] = [];

    for (let i = 0; i < periodsCount; i++) {
      const periodStart = new Date(startDate.getTime() - periodLength * i);
      const periodEnd = new Date(endDate.getTime() - periodLength * i);

      const where: any = {
        createdAt: Between(periodStart, periodEnd),
        saleType: SaleType.SALE,
        paymentStatus: PaymentStatus.PAID,
        isHeld: false,
      };

      if (dto.branchId) {
        where.branchId = dto.branchId;
      }

      const sales = await this.salesRepository.find({ where });

      const revenue = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
      const salesCount = sales.length;
      const averageOrderValue = salesCount > 0 ? revenue / salesCount : 0;

      // Calculate growth from next period (if not the most recent)
      let growth = 0;
      if (i > 0 && comparisons[i - 1]) {
        const previousRevenue = comparisons[i - 1].revenue;
        growth = previousRevenue > 0 ? ((revenue - previousRevenue) / previousRevenue) * 100 : 0;
      }

      comparisons.push({
        period: `${periodStart.toISOString().split('T')[0]} to ${periodEnd.toISOString().split('T')[0]}`,
        revenue,
        sales: salesCount,
        averageOrderValue,
        growth,
      });
    }

    // Reverse to show oldest to newest
    comparisons.reverse();

    // Calculate summary
    const revenues = comparisons.map((c) => c.revenue);
    const bestPeriod = comparisons.reduce((max, c) => (c.revenue > max.revenue ? c : max))
      .period;
    const worstPeriod = comparisons.reduce((min, c) => (c.revenue < min.revenue ? c : min))
      .period;

    const growthRates = comparisons.slice(1).map((c) => c.growth);
    const averageGrowthRate =
      growthRates.length > 0
        ? growthRates.reduce((sum, g) => sum + g, 0) / growthRates.length
        : 0;

    // Calculate volatility (standard deviation of revenues)
    const meanRevenue = revenues.reduce((sum, r) => sum + r, 0) / revenues.length;
    const variance =
      revenues.reduce((sum, r) => sum + Math.pow(r - meanRevenue, 2), 0) / revenues.length;
    const volatility = Math.sqrt(variance);

    return {
      period: `Last ${periodsCount} periods`,
      comparisons,
      summary: {
        bestPeriod,
        worstPeriod,
        averageGrowthRate,
        volatility,
      },
    };
  }

  async getProductPerformanceAnalytics(
    dto: AnalyticsQueryDto,
  ): Promise<ProductPerformanceAnalytics> {
    const { startDate, endDate } = dto.startDate && dto.endDate
      ? { startDate: new Date(dto.startDate), endDate: new Date(dto.endDate) }
      : this.getDefaultDateRange();

    const where: any = {
      createdAt: Between(startDate, endDate),
      saleType: SaleType.SALE,
      paymentStatus: PaymentStatus.PAID,
      isHeld: false,
    };

    if (dto.branchId) {
      where.branchId = dto.branchId;
    }

    const sales = await this.salesRepository.find({
      where,
      relations: ['items', 'items.product', 'items.product.category'],
    });

    // Aggregate product data
    const productMap = new Map<string, any>();

    for (const sale of sales) {
      for (const item of sale.items) {
        if (item.product) {
          const product = item.product;
          const existing = productMap.get(product.id) || {
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            category: product.category?.name || 'Uncategorized',
            totalRevenue: 0,
            totalQuantitySold: 0,
            totalCost: 0,
            prices: [],
          };

          existing.totalRevenue += Number(item.total);
          existing.totalQuantitySold += Number(item.quantity);
          existing.totalCost += Number(product.cost || 0) * Number(item.quantity);
          existing.prices.push(Number(item.unitPrice));

          productMap.set(product.id, existing);
        }
      }
    }

    // Calculate analytics for each product
    const products: ProductAnalytics[] = Array.from(productMap.values()).map((data) => {
      const averagePrice =
        data.prices.length > 0
          ? data.prices.reduce((sum: number, p: number) => sum + p, 0) / data.prices.length
          : 0;
      const profitMargin =
        data.totalRevenue > 0
          ? ((data.totalRevenue - data.totalCost) / data.totalRevenue) * 100
          : 0;

      // Simple performance rating
      let performance: 'excellent' | 'good' | 'average' | 'poor' = 'average';
      if (data.totalRevenue >= 1000 && profitMargin >= 30) {
        performance = 'excellent';
      } else if (data.totalRevenue >= 500 && profitMargin >= 20) {
        performance = 'good';
      } else if (data.totalRevenue < 100 || profitMargin < 10) {
        performance = 'poor';
      }

      return {
        productId: data.productId,
        productName: data.productName,
        sku: data.sku,
        category: data.category,
        totalRevenue: data.totalRevenue,
        totalQuantitySold: data.totalQuantitySold,
        averagePrice,
        profitMargin,
        stockTurnover: 0, // Would need inventory data
        performance,
        trend: 'stable' as const,
      };
    });

    // Sort by revenue
    products.sort((a, b) => b.totalRevenue - a.totalRevenue);

    const topPerformers = products.filter((p) => p.performance === 'excellent').length;
    const underperformers = products.filter((p) => p.performance === 'poor').length;
    const totalRevenue = products.reduce((sum, p) => sum + p.totalRevenue, 0);
    const averageSalesPerProduct =
      products.length > 0 ? totalRevenue / products.length : 0;

    return {
      products,
      summary: {
        totalProducts: products.length,
        topPerformers,
        underperformers,
        averageSalesPerProduct,
      },
    };
  }

  async getCustomerBehaviorAnalytics(
    dto: AnalyticsQueryDto,
  ): Promise<CustomerBehaviorAnalytics> {
    const { startDate, endDate } = dto.startDate && dto.endDate
      ? { startDate: new Date(dto.startDate), endDate: new Date(dto.endDate) }
      : this.getDefaultDateRange();

    const where: any = {
      createdAt: Between(startDate, endDate),
      saleType: SaleType.SALE,
      paymentStatus: PaymentStatus.PAID,
      isHeld: false,
    };

    if (dto.branchId) {
      where.branchId = dto.branchId;
    }

    const sales = await this.salesRepository.find({
      where,
      relations: ['customer'],
    });

    // Total and new customers
    const allCustomers = await this.customersRepository.find();
    const totalCustomers = allCustomers.length;

    const newCustomersInPeriod = await this.customersRepository.count({
      where: { createdAt: Between(startDate, endDate) },
    });

    // Active customers (made a purchase in period)
    const activeCustomerIds = new Set(
      sales.filter((s) => s.customerId).map((s) => s.customerId),
    );
    const activeCustomers = activeCustomerIds.size;

    // Customer purchase frequency
    const customerPurchases = new Map<string, number>();
    const customerSpending = new Map<string, number>();

    for (const sale of sales) {
      if (sale.customerId) {
        customerPurchases.set(
          sale.customerId,
          (customerPurchases.get(sale.customerId) || 0) + 1,
        );
        customerSpending.set(
          sale.customerId,
          (customerSpending.get(sale.customerId) || 0) + Number(sale.total),
        );
      }
    }

    // Purchase frequency distribution
    const frequencyBuckets = new Map<string, number>();
    for (const [_, count] of customerPurchases) {
      let bucket: string;
      if (count === 1) bucket = '1 purchase';
      else if (count <= 3) bucket = '2-3 purchases';
      else if (count <= 5) bucket = '4-5 purchases';
      else if (count <= 10) bucket = '6-10 purchases';
      else bucket = '10+ purchases';

      frequencyBuckets.set(bucket, (frequencyBuckets.get(bucket) || 0) + 1);
    }

    const totalPurchasingCustomers = customerPurchases.size;
    const purchaseFrequency: FrequencyDistribution[] = Array.from(frequencyBuckets.entries()).map(
      ([range, count]) => ({
        range,
        count,
        percentage: totalPurchasingCustomers > 0 ? (count / totalPurchasingCustomers) * 100 : 0,
      }),
    );

    // Spending distribution
    const spendingSegments: SpendingSegment[] = [
      { segment: 'Low (<$100)', minSpend: 0, maxSpend: 100, customerCount: 0, totalRevenue: 0, percentage: 0 },
      { segment: 'Medium ($100-$500)', minSpend: 100, maxSpend: 500, customerCount: 0, totalRevenue: 0, percentage: 0 },
      { segment: 'High ($500-$1000)', minSpend: 500, maxSpend: 1000, customerCount: 0, totalRevenue: 0, percentage: 0 },
      { segment: 'Premium ($1000+)', minSpend: 1000, maxSpend: Infinity, customerCount: 0, totalRevenue: 0, percentage: 0 },
    ];

    let totalSpending = 0;
    for (const [customerId, spending] of customerSpending) {
      totalSpending += spending;
      const segment = spendingSegments.find(
        (s) => spending >= s.minSpend && spending < s.maxSpend,
      );
      if (segment) {
        segment.customerCount++;
        segment.totalRevenue += spending;
      }
    }

    spendingSegments.forEach((segment) => {
      segment.percentage = totalSpending > 0 ? (segment.totalRevenue / totalSpending) * 100 : 0;
    });

    const averageLifetimeValue =
      customerSpending.size > 0
        ? Array.from(customerSpending.values()).reduce((sum, v) => sum + v, 0) /
          customerSpending.size
        : 0;

    // Simple churn and retention rates
    const retentionRate = totalCustomers > 0 ? (activeCustomers / totalCustomers) * 100 : 0;
    const churnRate = 100 - retentionRate;

    return {
      overview: {
        totalCustomers,
        activeCustomers,
        newCustomers: newCustomersInPeriod,
        churnRate,
        retentionRate,
        averageLifetimeValue,
      },
      purchaseFrequency,
      spendingDistribution: spendingSegments,
      cohortAnalysis: [], // Would require more complex cohort tracking
    };
  }

  private generateTimeSeriesData(
    sales: Sale[],
    type: 'revenue' | 'count',
    granularity: TimeGranularity = TimeGranularity.DAY,
  ): TimeSeriesData[] {
    const dataMap = new Map<string, number>();

    for (const sale of sales) {
      const timestamp = this.getTimestampKey(new Date(sale.createdAt), granularity);
      const value = type === 'revenue' ? Number(sale.total) : 1;
      dataMap.set(timestamp, (dataMap.get(timestamp) || 0) + value);
    }

    return Array.from(dataMap.entries())
      .map(([timestamp, value]) => ({ timestamp, value }))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  private getTimestampKey(date: Date, granularity: TimeGranularity): string {
    switch (granularity) {
      case TimeGranularity.HOUR:
        return date.toISOString().substring(0, 13);
      case TimeGranularity.DAY:
        return date.toISOString().substring(0, 10);
      case TimeGranularity.WEEK:
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        return weekStart.toISOString().substring(0, 10);
      case TimeGranularity.MONTH:
        return date.toISOString().substring(0, 7);
      case TimeGranularity.QUARTER:
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        return `${date.getFullYear()}-Q${quarter}`;
      case TimeGranularity.YEAR:
        return date.getFullYear().toString();
      default:
        return date.toISOString().substring(0, 10);
    }
  }

  private calculateTrendMetric(current: number, previous: number): TrendMetric {
    const change = current - previous;
    const changePercentage = previous > 0 ? (change / previous) * 100 : 0;
    let trend: 'up' | 'down' | 'stable' = 'stable';

    if (changePercentage > 5) {
      trend = 'up';
    } else if (changePercentage < -5) {
      trend = 'down';
    }

    return {
      current,
      previous,
      change,
      changePercentage,
      trend,
    };
  }
}
