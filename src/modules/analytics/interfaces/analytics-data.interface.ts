export interface DashboardAnalytics {
  overview: {
    totalRevenue: number;
    totalSales: number;
    averageOrderValue: number;
    totalCustomers: number;
    revenueGrowth: number;
    salesGrowth: number;
  };
  revenueChart: TimeSeriesData[];
  salesChart: TimeSeriesData[];
  topProducts: ProductMetric[];
  topCategories: CategoryMetric[];
  recentActivity: ActivityItem[];
  alerts: Alert[];
}

export interface TimeSeriesData {
  timestamp: string;
  value: number;
  label?: string;
}

export interface ProductMetric {
  productId: string;
  productName: string;
  value: number;
  change?: number;
}

export interface CategoryMetric {
  categoryId: string;
  categoryName: string;
  value: number;
  percentage: number;
}

export interface ActivityItem {
  id: string;
  type: 'sale' | 'refund' | 'stock_alert' | 'customer';
  description: string;
  timestamp: Date;
  metadata?: any;
}

export interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: Date;
}

export interface TrendAnalysis {
  period: string;
  metrics: {
    revenue: TrendMetric;
    sales: TrendMetric;
    averageOrderValue: TrendMetric;
    customers: TrendMetric;
  };
  timeSeries: TimeSeriesData[];
  forecast?: ForecastData[];
}

export interface TrendMetric {
  current: number;
  previous: number;
  change: number;
  changePercentage: number;
  trend: 'up' | 'down' | 'stable';
}

export interface ForecastData {
  timestamp: string;
  predicted: number;
  lowerBound: number;
  upperBound: number;
  confidence: number;
}

export interface ComparativeAnalysis {
  period: string;
  comparisons: PeriodComparison[];
  summary: {
    bestPeriod: string;
    worstPeriod: string;
    averageGrowthRate: number;
    volatility: number;
  };
}

export interface PeriodComparison {
  period: string;
  revenue: number;
  sales: number;
  averageOrderValue: number;
  growth: number;
}

export interface ProductPerformanceAnalytics {
  products: ProductAnalytics[];
  summary: {
    totalProducts: number;
    topPerformers: number;
    underperformers: number;
    averageSalesPerProduct: number;
  };
}

export interface ProductAnalytics {
  productId: string;
  productName: string;
  sku: string;
  category: string;
  totalRevenue: number;
  totalQuantitySold: number;
  averagePrice: number;
  profitMargin: number;
  stockTurnover: number;
  performance: 'excellent' | 'good' | 'average' | 'poor';
  trend: 'growing' | 'stable' | 'declining';
}

export interface CustomerBehaviorAnalytics {
  overview: {
    totalCustomers: number;
    activeCustomers: number;
    newCustomers: number;
    churnRate: number;
    retentionRate: number;
    averageLifetimeValue: number;
  };
  purchaseFrequency: FrequencyDistribution[];
  spendingDistribution: SpendingSegment[];
  cohortAnalysis: CohortData[];
}

export interface FrequencyDistribution {
  range: string;
  count: number;
  percentage: number;
}

export interface SpendingSegment {
  segment: string;
  minSpend: number;
  maxSpend: number;
  customerCount: number;
  totalRevenue: number;
  percentage: number;
}

export interface CohortData {
  cohort: string;
  customersCount: number;
  retentionRate: number;
  averageRevenue: number;
}

export interface SalesChannelAnalytics {
  channels: ChannelMetric[];
  summary: {
    totalChannels: number;
    bestPerformingChannel: string;
    channelDiversity: number;
  };
}

export interface ChannelMetric {
  channel: string;
  revenue: number;
  sales: number;
  customers: number;
  conversionRate: number;
  averageOrderValue: number;
  growth: number;
}
