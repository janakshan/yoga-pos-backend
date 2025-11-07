export interface SalesReportData {
  period: string;
  totalSales: number;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  profitMargin: number;
  averageOrderValue: number;
  totalTax: number;
  totalDiscount: number;
  numberOfTransactions: number;
  topSellingProducts?: TopSellingProduct[];
  salesByPaymentMethod?: PaymentMethodBreakdown[];
  salesByCategory?: CategoryBreakdown[];
  salesByCashier?: CashierPerformance[];
}

export interface TopSellingProduct {
  productId: string;
  productName: string;
  sku: string;
  quantitySold: number;
  revenue: number;
  profit: number;
}

export interface PaymentMethodBreakdown {
  paymentMethod: string;
  count: number;
  total: number;
  percentage: number;
}

export interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  revenue: number;
  quantitySold: number;
  percentage: number;
}

export interface CashierPerformance {
  cashierId: string;
  cashierName: string;
  numberOfSales: number;
  totalRevenue: number;
  averageSaleValue: number;
}

export interface InventoryValuationData {
  totalValue: number;
  totalCost: number;
  totalRetailValue: number;
  potentialProfit: number;
  profitMargin: number;
  totalProducts: number;
  lowStockItems: number;
  outOfStockItems: number;
  products: InventoryItem[];
}

export interface InventoryItem {
  productId: string;
  productName: string;
  sku: string;
  category: string;
  stockQuantity: number;
  cost: number;
  price: number;
  totalCost: number;
  totalRetailValue: number;
  potentialProfit: number;
  reorderLevel: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
}

export interface ProfitLossData {
  period: string;
  revenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
  grossProfitMargin: number;
  netProfitMargin: number;
  expenseBreakdown: ExpenseCategory[];
}

export interface ExpenseCategory {
  category: string;
  amount: number;
  percentage: number;
}

export interface SlowMovingStockData {
  products: SlowMovingProduct[];
  totalValue: number;
  totalQuantity: number;
}

export interface SlowMovingProduct {
  productId: string;
  productName: string;
  sku: string;
  category: string;
  stockQuantity: number;
  cost: number;
  totalValue: number;
  lastSaleDate: Date | null;
  daysSinceLastSale: number;
  totalSales: number;
  turnoverRate: number;
}

export interface EmployeePerformanceData {
  employees: EmployeePerformance[];
  period: string;
}

export interface EmployeePerformance {
  employeeId: string;
  employeeName: string;
  role: string;
  numberOfSales: number;
  totalRevenue: number;
  averageSaleValue: number;
  customersServed: number;
  refunds: number;
  performance: 'excellent' | 'good' | 'average' | 'needs_improvement';
}

export interface CustomerAnalyticsData {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  averageLifetimeValue: number;
  topCustomers: TopCustomer[];
  customerSegments: CustomerSegment[];
}

export interface TopCustomer {
  customerId: string;
  customerName: string;
  email: string;
  phone: string;
  totalPurchases: number;
  totalSpent: number;
  averageOrderValue: number;
  lastPurchaseDate: Date;
}

export interface CustomerSegment {
  segment: string;
  count: number;
  totalRevenue: number;
  percentage: number;
}

export interface TaxReportData {
  period: string;
  totalSales: number;
  taxableAmount: number;
  totalTaxCollected: number;
  taxByRate: TaxRateBreakdown[];
  taxBySale: TaxSaleDetail[];
}

export interface TaxRateBreakdown {
  taxRate: number;
  count: number;
  taxableAmount: number;
  taxCollected: number;
}

export interface TaxSaleDetail {
  saleNumber: string;
  date: Date;
  subtotal: number;
  tax: number;
  total: number;
  taxRate: number;
}
