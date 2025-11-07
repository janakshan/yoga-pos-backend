import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan, MoreThan, In } from 'typeorm';
import { Sale, PaymentStatus, SaleType } from '../pos/entities/sale.entity';
import { SaleItem } from '../pos/entities/sale-item.entity';
import { Product } from '../products/entities/product.entity';
import { Payment } from '../payments/entities/payment.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { Customer } from '../customers/entities/customer.entity';
import { User } from '../users/entities/user.entity';
import {
  SalesReportData,
  InventoryValuationData,
  ProfitLossData,
  SlowMovingStockData,
  EmployeePerformanceData,
  CustomerAnalyticsData,
  TaxReportData,
  TopSellingProduct,
  PaymentMethodBreakdown,
  CategoryBreakdown,
  CashierPerformance,
  InventoryItem,
  ExpenseCategory,
  SlowMovingProduct,
  EmployeePerformance,
  TopCustomer,
  CustomerSegment,
  TaxRateBreakdown,
  TaxSaleDetail,
} from './interfaces/report-data.interface';
import { DateRangeDto, ReportPeriod } from './dto/date-range.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Sale)
    private salesRepository: Repository<Sale>,
    @InjectRepository(SaleItem)
    private saleItemsRepository: Repository<SaleItem>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
    @InjectRepository(Expense)
    private expensesRepository: Repository<Expense>,
    @InjectRepository(Customer)
    private customersRepository: Repository<Customer>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  private getDateRange(
    period: ReportPeriod,
    customStartDate?: string,
    customEndDate?: string,
  ): { startDate: Date; endDate: Date } {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now);

    switch (period) {
      case ReportPeriod.DAILY:
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;

      case ReportPeriod.WEEKLY:
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;

      case ReportPeriod.MONTHLY:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;

      case ReportPeriod.YEARLY:
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;

      case ReportPeriod.CUSTOM:
      default:
        startDate = customStartDate ? new Date(customStartDate) : new Date(now.getFullYear(), 0, 1);
        endDate = customEndDate ? new Date(customEndDate) : new Date(now);
        break;
    }

    return { startDate, endDate };
  }

  async generateSalesReport(dto: DateRangeDto): Promise<SalesReportData> {
    const { startDate, endDate } = this.getDateRange(
      dto.period || ReportPeriod.MONTHLY,
      dto.startDate,
      dto.endDate,
    );

    const where: any = {
      createdAt: Between(startDate, endDate),
      saleType: SaleType.SALE,
      isHeld: false,
    };

    if (dto.branchId) {
      where.branchId = dto.branchId;
    }

    const sales = await this.salesRepository.find({
      where,
      relations: ['items', 'items.product', 'items.product.category', 'cashier'],
    });

    const totalSales = sales.filter((s) => s.paymentStatus === PaymentStatus.PAID).length;
    const totalRevenue = sales
      .filter((s) => s.paymentStatus === PaymentStatus.PAID)
      .reduce((sum, sale) => sum + Number(sale.total), 0);
    const totalTax = sales
      .filter((s) => s.paymentStatus === PaymentStatus.PAID)
      .reduce((sum, sale) => sum + Number(sale.tax), 0);
    const totalDiscount = sales
      .filter((s) => s.paymentStatus === PaymentStatus.PAID)
      .reduce((sum, sale) => sum + Number(sale.discount), 0);

    // Calculate total cost
    let totalCost = 0;
    for (const sale of sales.filter((s) => s.paymentStatus === PaymentStatus.PAID)) {
      for (const item of sale.items) {
        const product = item.product;
        if (product && product.cost) {
          totalCost += Number(product.cost) * Number(item.quantity);
        }
      }
    }

    const grossProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Top selling products
    const productSales: Map<string, TopSellingProduct> = new Map();
    for (const sale of sales.filter((s) => s.paymentStatus === PaymentStatus.PAID)) {
      for (const item of sale.items) {
        const product = item.product;
        if (product) {
          const existing = productSales.get(product.id) || {
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            quantitySold: 0,
            revenue: 0,
            profit: 0,
          };

          existing.quantitySold += Number(item.quantity);
          existing.revenue += Number(item.total);
          existing.profit += Number(item.total) - Number(product.cost || 0) * Number(item.quantity);

          productSales.set(product.id, existing);
        }
      }
    }

    const topSellingProducts = Array.from(productSales.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Payment method breakdown
    const paymentWhere: any = {
      paymentDate: Between(startDate, endDate),
      status: 'completed',
    };

    if (dto.branchId) {
      const branchSaleIds = sales.map((s) => s.id);
      if (branchSaleIds.length > 0) {
        paymentWhere.saleId = In(branchSaleIds);
      }
    }

    const payments = await this.paymentsRepository.find({
      where: paymentWhere,
    });

    const paymentMethodMap: Map<string, { count: number; total: number }> = new Map();
    for (const payment of payments) {
      const method = payment.paymentMethod;
      const existing = paymentMethodMap.get(method) || { count: 0, total: 0 };
      existing.count++;
      existing.total += Number(payment.amount);
      paymentMethodMap.set(method, existing);
    }

    const totalPayments = Array.from(paymentMethodMap.values()).reduce(
      (sum, p) => sum + p.total,
      0,
    );

    const salesByPaymentMethod: PaymentMethodBreakdown[] = Array.from(
      paymentMethodMap.entries(),
    ).map(([method, data]) => ({
      paymentMethod: method,
      count: data.count,
      total: data.total,
      percentage: totalPayments > 0 ? (data.total / totalPayments) * 100 : 0,
    }));

    // Sales by category
    const categoryMap: Map<string, { revenue: number; quantitySold: number }> = new Map();
    for (const sale of sales.filter((s) => s.paymentStatus === PaymentStatus.PAID)) {
      for (const item of sale.items) {
        const product = item.product;
        if (product && product.category) {
          const categoryId = product.category.id;
          const categoryName = product.category.name;
          const key = `${categoryId}:${categoryName}`;
          const existing = categoryMap.get(key) || { revenue: 0, quantitySold: 0 };
          existing.revenue += Number(item.total);
          existing.quantitySold += Number(item.quantity);
          categoryMap.set(key, existing);
        }
      }
    }

    const salesByCategory: CategoryBreakdown[] = Array.from(categoryMap.entries()).map(
      ([key, data]) => {
        const [categoryId, categoryName] = key.split(':');
        return {
          categoryId,
          categoryName,
          revenue: data.revenue,
          quantitySold: data.quantitySold,
          percentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0,
        };
      },
    );

    // Sales by cashier
    const cashierMap: Map<string, CashierPerformance> = new Map();
    for (const sale of sales.filter((s) => s.paymentStatus === PaymentStatus.PAID)) {
      const cashier = sale.cashier;
      if (cashier) {
        const existing = cashierMap.get(cashier.id) || {
          cashierId: cashier.id,
          cashierName: `${cashier.firstName} ${cashier.lastName}`,
          numberOfSales: 0,
          totalRevenue: 0,
          averageSaleValue: 0,
        };

        existing.numberOfSales++;
        existing.totalRevenue += Number(sale.total);

        cashierMap.set(cashier.id, existing);
      }
    }

    const salesByCashier: CashierPerformance[] = Array.from(cashierMap.values()).map(
      (cashier) => ({
        ...cashier,
        averageSaleValue:
          cashier.numberOfSales > 0 ? cashier.totalRevenue / cashier.numberOfSales : 0,
      }),
    );

    return {
      period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
      totalSales,
      totalRevenue,
      totalCost,
      grossProfit,
      profitMargin,
      averageOrderValue,
      totalTax,
      totalDiscount,
      numberOfTransactions: sales.length,
      topSellingProducts,
      salesByPaymentMethod,
      salesByCategory,
      salesByCashier,
    };
  }

  async generateInventoryValuationReport(branchId?: string): Promise<InventoryValuationData> {
    const where: any = {
      isActive: true,
      trackInventory: true,
    };

    const products = await this.productsRepository.find({ where });

    let totalValue = 0;
    let totalCost = 0;
    let totalRetailValue = 0;
    let lowStockItems = 0;
    let outOfStockItems = 0;

    const inventoryItems: InventoryItem[] = products.map((product) => {
      const stockQuantity = Number(product.stockQuantity);
      const cost = Number(product.cost || 0);
      const price = Number(product.price);
      const itemTotalCost = stockQuantity * cost;
      const itemTotalRetailValue = stockQuantity * price;
      const itemPotentialProfit = itemTotalRetailValue - itemTotalCost;

      totalCost += itemTotalCost;
      totalRetailValue += itemTotalRetailValue;

      let status: 'in_stock' | 'low_stock' | 'out_of_stock' = 'in_stock';
      if (stockQuantity === 0) {
        status = 'out_of_stock';
        outOfStockItems++;
      } else if (stockQuantity <= product.reorderLevel) {
        status = 'low_stock';
        lowStockItems++;
      }

      return {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        category: product.category?.name || 'Uncategorized',
        stockQuantity,
        cost,
        price,
        totalCost: itemTotalCost,
        totalRetailValue: itemTotalRetailValue,
        potentialProfit: itemPotentialProfit,
        reorderLevel: product.reorderLevel,
        status,
      };
    });

    totalValue = totalCost;
    const potentialProfit = totalRetailValue - totalCost;
    const profitMargin = totalRetailValue > 0 ? (potentialProfit / totalRetailValue) * 100 : 0;

    return {
      totalValue,
      totalCost,
      totalRetailValue,
      potentialProfit,
      profitMargin,
      totalProducts: products.length,
      lowStockItems,
      outOfStockItems,
      products: inventoryItems,
    };
  }

  async generateProfitLossReport(dto: DateRangeDto): Promise<ProfitLossData> {
    const { startDate, endDate } = this.getDateRange(
      dto.period || ReportPeriod.MONTHLY,
      dto.startDate,
      dto.endDate,
    );

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
      relations: ['items', 'items.product'],
    });

    const revenue = sales.reduce((sum, sale) => sum + Number(sale.total), 0);

    // Calculate COGS
    let costOfGoodsSold = 0;
    for (const sale of sales) {
      for (const item of sale.items) {
        const product = item.product;
        if (product && product.cost) {
          costOfGoodsSold += Number(product.cost) * Number(item.quantity);
        }
      }
    }

    const grossProfit = revenue - costOfGoodsSold;
    const grossProfitMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

    // Get expenses
    const expenseWhere: any = {
      date: Between(startDate, endDate),
      status: 'approved',
    };

    if (dto.branchId) {
      expenseWhere.branchId = dto.branchId;
    }

    const expenses = await this.expensesRepository.find({ where: expenseWhere });

    const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);

    // Group expenses by category
    const expenseCategoryMap: Map<string, number> = new Map();
    for (const expense of expenses) {
      const category = expense.category || 'Other';
      const existing = expenseCategoryMap.get(category) || 0;
      expenseCategoryMap.set(category, existing + Number(expense.amount));
    }

    const expenseBreakdown: ExpenseCategory[] = Array.from(expenseCategoryMap.entries()).map(
      ([category, amount]) => ({
        category,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
      }),
    );

    const netProfit = grossProfit - totalExpenses;
    const netProfitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    return {
      period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
      revenue,
      costOfGoodsSold,
      grossProfit,
      expenses: totalExpenses,
      netProfit,
      grossProfitMargin,
      netProfitMargin,
      expenseBreakdown,
    };
  }

  async generateSlowMovingStockReport(
    daysThreshold: number = 90,
    branchId?: string,
  ): Promise<SlowMovingStockData> {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);

    const products = await this.productsRepository.find({
      where: { isActive: true, trackInventory: true },
    });

    const slowMovingProducts: SlowMovingProduct[] = [];
    let totalValue = 0;
    let totalQuantity = 0;

    for (const product of products) {
      // Get last sale date for this product
      const lastSale = await this.saleItemsRepository
        .createQueryBuilder('saleItem')
        .leftJoinAndSelect('saleItem.sale', 'sale')
        .where('saleItem.productId = :productId', { productId: product.id })
        .andWhere('sale.saleType = :saleType', { saleType: SaleType.SALE })
        .andWhere('sale.paymentStatus = :paymentStatus', { paymentStatus: PaymentStatus.PAID })
        .orderBy('sale.createdAt', 'DESC')
        .getOne();

      const lastSaleDate = lastSale?.sale?.createdAt || null;
      const daysSinceLastSale = lastSaleDate
        ? Math.floor((new Date().getTime() - new Date(lastSaleDate).getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      // Only include products with no sales or sales older than threshold
      if (!lastSaleDate || daysSinceLastSale >= daysThreshold) {
        // Get total sales for this product
        const salesQuery = this.saleItemsRepository
          .createQueryBuilder('saleItem')
          .leftJoinAndSelect('saleItem.sale', 'sale')
          .where('saleItem.productId = :productId', { productId: product.id })
          .andWhere('sale.saleType = :saleType', { saleType: SaleType.SALE })
          .andWhere('sale.paymentStatus = :paymentStatus', { paymentStatus: PaymentStatus.PAID });

        const totalSalesItems = await salesQuery.getMany();
        const totalSales = totalSalesItems.reduce(
          (sum, item) => sum + Number(item.quantity),
          0,
        );

        const stockQuantity = Number(product.stockQuantity);
        const cost = Number(product.cost || 0);
        const itemValue = stockQuantity * cost;

        // Calculate turnover rate (sales per month)
        const turnoverRate = lastSaleDate
          ? totalSales / (daysSinceLastSale / 30)
          : 0;

        if (stockQuantity > 0) {
          slowMovingProducts.push({
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            category: product.category?.name || 'Uncategorized',
            stockQuantity,
            cost,
            totalValue: itemValue,
            lastSaleDate,
            daysSinceLastSale,
            totalSales,
            turnoverRate,
          });

          totalValue += itemValue;
          totalQuantity += stockQuantity;
        }
      }
    }

    // Sort by days since last sale (descending)
    slowMovingProducts.sort((a, b) => b.daysSinceLastSale - a.daysSinceLastSale);

    return {
      products: slowMovingProducts,
      totalValue,
      totalQuantity,
    };
  }

  async generateEmployeePerformanceReport(
    dto: DateRangeDto,
  ): Promise<EmployeePerformanceData> {
    const { startDate, endDate } = this.getDateRange(
      dto.period || ReportPeriod.MONTHLY,
      dto.startDate,
      dto.endDate,
    );

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
      relations: ['cashier', 'customer'],
    });

    const refundsWhere: any = {
      createdAt: Between(startDate, endDate),
      saleType: SaleType.RETURN,
    };

    if (dto.branchId) {
      refundsWhere.branchId = dto.branchId;
    }

    const refunds = await this.salesRepository.find({ where: refundsWhere, relations: ['cashier'] });

    // Group by employee
    const employeeMap: Map<string, any> = new Map();

    for (const sale of sales) {
      const cashier = sale.cashier;
      if (cashier) {
        const roleNames = cashier.roles ? cashier.roles.map((r: any) => r.name).join(', ') : 'cashier';
        const existing = employeeMap.get(cashier.id) || {
          employeeId: cashier.id,
          employeeName: `${cashier.firstName} ${cashier.lastName}`,
          role: roleNames,
          numberOfSales: 0,
          totalRevenue: 0,
          customers: new Set(),
          refunds: 0,
        };

        existing.numberOfSales++;
        existing.totalRevenue += Number(sale.total);
        if (sale.customer) {
          existing.customers.add(sale.customer.id);
        }

        employeeMap.set(cashier.id, existing);
      }
    }

    // Add refunds
    for (const refund of refunds) {
      const cashier = refund.cashier;
      if (cashier && employeeMap.has(cashier.id)) {
        const existing = employeeMap.get(cashier.id);
        existing.refunds++;
      }
    }

    // Calculate performance ratings
    const employees: EmployeePerformance[] = Array.from(employeeMap.values()).map((emp) => {
      const averageSaleValue = emp.numberOfSales > 0 ? emp.totalRevenue / emp.numberOfSales : 0;
      const customersServed = emp.customers.size;
      const refundRate = emp.numberOfSales > 0 ? (emp.refunds / emp.numberOfSales) * 100 : 0;

      // Simple performance rating based on metrics
      let performance: 'excellent' | 'good' | 'average' | 'needs_improvement' = 'average';
      if (emp.numberOfSales >= 50 && averageSaleValue >= 100 && refundRate < 5) {
        performance = 'excellent';
      } else if (emp.numberOfSales >= 30 && averageSaleValue >= 50 && refundRate < 10) {
        performance = 'good';
      } else if (emp.numberOfSales < 10 || refundRate > 20) {
        performance = 'needs_improvement';
      }

      return {
        employeeId: emp.employeeId,
        employeeName: emp.employeeName,
        role: emp.role,
        numberOfSales: emp.numberOfSales,
        totalRevenue: emp.totalRevenue,
        averageSaleValue,
        customersServed,
        refunds: emp.refunds,
        performance,
      };
    });

    // Sort by total revenue
    employees.sort((a, b) => b.totalRevenue - a.totalRevenue);

    return {
      employees,
      period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
    };
  }

  async generateCustomerAnalytics(dto: DateRangeDto): Promise<CustomerAnalyticsData> {
    const { startDate, endDate } = this.getDateRange(
      dto.period || ReportPeriod.MONTHLY,
      dto.startDate,
      dto.endDate,
    );

    const allCustomers = await this.customersRepository.find();
    const totalCustomers = allCustomers.length;

    // New customers in period
    const newCustomers = await this.customersRepository.count({
      where: { createdAt: Between(startDate, endDate) },
    });

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

    // Track returning customers
    const customerPurchases: Map<string, any> = new Map();
    for (const sale of sales) {
      if (sale.customer) {
        const existing = customerPurchases.get(sale.customer.id) || {
          customerId: sale.customer.id,
          customerName: `${sale.customer.firstName} ${sale.customer.lastName}`,
          email: sale.customer.email,
          phone: sale.customer.phone,
          totalPurchases: 0,
          totalSpent: 0,
          lastPurchaseDate: sale.createdAt,
        };

        existing.totalPurchases++;
        existing.totalSpent += Number(sale.total);
        if (new Date(sale.createdAt) > new Date(existing.lastPurchaseDate)) {
          existing.lastPurchaseDate = sale.createdAt;
        }

        customerPurchases.set(sale.customer.id, existing);
      }
    }

    const returningCustomers = Array.from(customerPurchases.values()).filter(
      (c) => c.totalPurchases > 1,
    ).length;

    // Top customers
    const topCustomers: TopCustomer[] = Array.from(customerPurchases.values())
      .map((c) => ({
        ...c,
        averageOrderValue: c.totalPurchases > 0 ? c.totalSpent / c.totalPurchases : 0,
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    // Calculate average lifetime value
    const totalSpent = Array.from(customerPurchases.values()).reduce(
      (sum, c) => sum + c.totalSpent,
      0,
    );
    const averageLifetimeValue =
      customerPurchases.size > 0 ? totalSpent / customerPurchases.size : 0;

    // Customer segments
    const segments = {
      vip: 0,
      regular: 0,
      occasional: 0,
      new: 0,
    };

    const segmentRevenue = {
      vip: 0,
      regular: 0,
      occasional: 0,
      new: 0,
    };

    for (const [_, customer] of customerPurchases) {
      if (customer.totalSpent >= 1000) {
        segments.vip++;
        segmentRevenue.vip += customer.totalSpent;
      } else if (customer.totalPurchases >= 5) {
        segments.regular++;
        segmentRevenue.regular += customer.totalSpent;
      } else if (customer.totalPurchases > 1) {
        segments.occasional++;
        segmentRevenue.occasional += customer.totalSpent;
      } else {
        segments.new++;
        segmentRevenue.new += customer.totalSpent;
      }
    }

    const totalRevenue = Object.values(segmentRevenue).reduce((sum, v) => sum + v, 0);

    const customerSegments: CustomerSegment[] = [
      {
        segment: 'VIP (>$1000)',
        count: segments.vip,
        totalRevenue: segmentRevenue.vip,
        percentage: totalRevenue > 0 ? (segmentRevenue.vip / totalRevenue) * 100 : 0,
      },
      {
        segment: 'Regular (5+ purchases)',
        count: segments.regular,
        totalRevenue: segmentRevenue.regular,
        percentage: totalRevenue > 0 ? (segmentRevenue.regular / totalRevenue) * 100 : 0,
      },
      {
        segment: 'Occasional (2-4 purchases)',
        count: segments.occasional,
        totalRevenue: segmentRevenue.occasional,
        percentage: totalRevenue > 0 ? (segmentRevenue.occasional / totalRevenue) * 100 : 0,
      },
      {
        segment: 'New (1 purchase)',
        count: segments.new,
        totalRevenue: segmentRevenue.new,
        percentage: totalRevenue > 0 ? (segmentRevenue.new / totalRevenue) * 100 : 0,
      },
    ];

    return {
      totalCustomers,
      newCustomers,
      returningCustomers,
      averageLifetimeValue,
      topCustomers,
      customerSegments,
    };
  }

  async generateTaxReport(dto: DateRangeDto): Promise<TaxReportData> {
    const { startDate, endDate } = this.getDateRange(
      dto.period || ReportPeriod.MONTHLY,
      dto.startDate,
      dto.endDate,
    );

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
      relations: ['items', 'items.product'],
      order: { createdAt: 'ASC' },
    });

    const totalSales = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
    const taxableAmount = sales.reduce((sum, sale) => sum + Number(sale.subtotal), 0);
    const totalTaxCollected = sales.reduce((sum, sale) => sum + Number(sale.tax), 0);

    // Group by tax rate
    const taxRateMap: Map<number, { count: number; taxableAmount: number; taxCollected: number }> =
      new Map();

    for (const sale of sales) {
      // Calculate average tax rate for the sale
      const taxRate =
        Number(sale.subtotal) > 0 ? (Number(sale.tax) / Number(sale.subtotal)) * 100 : 0;

      const existing = taxRateMap.get(taxRate) || {
        count: 0,
        taxableAmount: 0,
        taxCollected: 0,
      };

      existing.count++;
      existing.taxableAmount += Number(sale.subtotal);
      existing.taxCollected += Number(sale.tax);

      taxRateMap.set(taxRate, existing);
    }

    const taxByRate: TaxRateBreakdown[] = Array.from(taxRateMap.entries()).map(
      ([rate, data]) => ({
        taxRate: rate,
        count: data.count,
        taxableAmount: data.taxableAmount,
        taxCollected: data.taxCollected,
      }),
    );

    // Detailed tax by sale
    const taxBySale: TaxSaleDetail[] = sales.map((sale) => {
      const taxRate =
        Number(sale.subtotal) > 0 ? (Number(sale.tax) / Number(sale.subtotal)) * 100 : 0;

      return {
        saleNumber: sale.saleNumber,
        date: sale.createdAt,
        subtotal: Number(sale.subtotal),
        tax: Number(sale.tax),
        total: Number(sale.total),
        taxRate,
      };
    });

    return {
      period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
      totalSales,
      taxableAmount,
      totalTaxCollected,
      taxByRate,
      taxBySale,
    };
  }
}
