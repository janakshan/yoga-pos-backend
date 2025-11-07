import { Injectable } from '@nestjs/common';
import { ReportsService } from '../reports/reports.service';
import { ExportOptionsDto, ExportReportType, ExportFormat } from './dto/export-options.dto';

@Injectable()
export class ExportService {
  constructor(private readonly reportsService: ReportsService) {}

  async exportReport(options: ExportOptionsDto): Promise<{ data: string; filename: string; mimeType: string }> {
    let reportData: any;
    const timestamp = new Date().toISOString().split('T')[0];

    // Get report data based on type
    switch (options.reportType) {
      case ExportReportType.SALES:
        reportData = await this.reportsService.generateSalesReport({
          startDate: options.startDate,
          endDate: options.endDate,
          branchId: options.branchId,
        });
        break;

      case ExportReportType.INVENTORY:
        reportData = await this.reportsService.generateInventoryValuationReport(
          options.branchId,
        );
        break;

      case ExportReportType.PROFIT_LOSS:
        reportData = await this.reportsService.generateProfitLossReport({
          startDate: options.startDate,
          endDate: options.endDate,
          branchId: options.branchId,
        });
        break;

      case ExportReportType.SLOW_MOVING:
        reportData = await this.reportsService.generateSlowMovingStockReport(
          90,
          options.branchId,
        );
        break;

      case ExportReportType.EMPLOYEE_PERFORMANCE:
        reportData = await this.reportsService.generateEmployeePerformanceReport({
          startDate: options.startDate,
          endDate: options.endDate,
          branchId: options.branchId,
        });
        break;

      case ExportReportType.CUSTOMER_ANALYTICS:
        reportData = await this.reportsService.generateCustomerAnalytics({
          startDate: options.startDate,
          endDate: options.endDate,
          branchId: options.branchId,
        });
        break;

      case ExportReportType.TAX:
        reportData = await this.reportsService.generateTaxReport({
          startDate: options.startDate,
          endDate: options.endDate,
          branchId: options.branchId,
        });
        break;

      default:
        throw new Error('Invalid report type');
    }

    // Export based on format
    if (options.format === 'csv') {
      const csv = this.convertToCSV(reportData, options.reportType);
      return {
        data: csv,
        filename: `${options.reportType}_report_${timestamp}.csv`,
        mimeType: 'text/csv',
      };
    } else {
      // JSON format
      return {
        data: JSON.stringify(reportData, null, 2),
        filename: `${options.reportType}_report_${timestamp}.json`,
        mimeType: 'application/json',
      };
    }
  }

  private convertToCSV(data: any, reportType: ExportReportType): string {
    let rows: any[] = [];
    let headers: string[] = [];

    switch (reportType) {
      case ExportReportType.SALES:
        headers = [
          'Period',
          'Total Sales',
          'Total Revenue',
          'Total Cost',
          'Gross Profit',
          'Profit Margin (%)',
          'Average Order Value',
          'Total Tax',
          'Total Discount',
        ];

        rows.push([
          data.period,
          data.totalSales,
          data.totalRevenue.toFixed(2),
          data.totalCost.toFixed(2),
          data.grossProfit.toFixed(2),
          data.profitMargin.toFixed(2),
          data.averageOrderValue.toFixed(2),
          data.totalTax.toFixed(2),
          data.totalDiscount.toFixed(2),
        ]);

        // Add top selling products
        if (data.topSellingProducts && data.topSellingProducts.length > 0) {
          rows.push([]);
          rows.push(['Top Selling Products']);
          rows.push(['Product', 'SKU', 'Quantity Sold', 'Revenue', 'Profit']);
          data.topSellingProducts.forEach((product: any) => {
            rows.push([
              product.productName,
              product.sku,
              product.quantitySold,
              product.revenue.toFixed(2),
              product.profit.toFixed(2),
            ]);
          });
        }
        break;

      case ExportReportType.INVENTORY:
        headers = [
          'Product',
          'SKU',
          'Category',
          'Stock Quantity',
          'Cost',
          'Price',
          'Total Cost',
          'Total Retail Value',
          'Potential Profit',
          'Status',
        ];

        data.products.forEach((product: any) => {
          rows.push([
            product.productName,
            product.sku,
            product.category,
            product.stockQuantity,
            product.cost.toFixed(2),
            product.price.toFixed(2),
            product.totalCost.toFixed(2),
            product.totalRetailValue.toFixed(2),
            product.potentialProfit.toFixed(2),
            product.status,
          ]);
        });

        // Add summary
        rows.push([]);
        rows.push(['Summary']);
        rows.push(['Total Products', data.totalProducts]);
        rows.push(['Total Value', data.totalValue.toFixed(2)]);
        rows.push(['Total Retail Value', data.totalRetailValue.toFixed(2)]);
        rows.push(['Potential Profit', data.potentialProfit.toFixed(2)]);
        rows.push(['Profit Margin (%)', data.profitMargin.toFixed(2)]);
        break;

      case ExportReportType.PROFIT_LOSS:
        headers = ['Metric', 'Amount'];
        rows.push(['Period', data.period]);
        rows.push(['Revenue', data.revenue.toFixed(2)]);
        rows.push(['Cost of Goods Sold', data.costOfGoodsSold.toFixed(2)]);
        rows.push(['Gross Profit', data.grossProfit.toFixed(2)]);
        rows.push(['Gross Profit Margin (%)', data.grossProfitMargin.toFixed(2)]);
        rows.push(['Expenses', data.expenses.toFixed(2)]);
        rows.push(['Net Profit', data.netProfit.toFixed(2)]);
        rows.push(['Net Profit Margin (%)', data.netProfitMargin.toFixed(2)]);

        // Add expense breakdown
        if (data.expenseBreakdown && data.expenseBreakdown.length > 0) {
          rows.push([]);
          rows.push(['Expense Breakdown']);
          rows.push(['Category', 'Amount', 'Percentage']);
          data.expenseBreakdown.forEach((expense: any) => {
            rows.push([
              expense.category,
              expense.amount.toFixed(2),
              expense.percentage.toFixed(2),
            ]);
          });
        }
        break;

      case ExportReportType.SLOW_MOVING:
        headers = [
          'Product',
          'SKU',
          'Category',
          'Stock Quantity',
          'Cost',
          'Total Value',
          'Last Sale Date',
          'Days Since Last Sale',
          'Total Sales',
          'Turnover Rate',
        ];

        data.products.forEach((product: any) => {
          rows.push([
            product.productName,
            product.sku,
            product.category,
            product.stockQuantity,
            product.cost.toFixed(2),
            product.totalValue.toFixed(2),
            product.lastSaleDate ? new Date(product.lastSaleDate).toISOString().split('T')[0] : 'Never',
            product.daysSinceLastSale,
            product.totalSales,
            product.turnoverRate.toFixed(2),
          ]);
        });
        break;

      case ExportReportType.EMPLOYEE_PERFORMANCE:
        headers = [
          'Employee',
          'Role',
          'Number of Sales',
          'Total Revenue',
          'Average Sale Value',
          'Customers Served',
          'Refunds',
          'Performance',
        ];

        data.employees.forEach((employee: any) => {
          rows.push([
            employee.employeeName,
            employee.role,
            employee.numberOfSales,
            employee.totalRevenue.toFixed(2),
            employee.averageSaleValue.toFixed(2),
            employee.customersServed,
            employee.refunds,
            employee.performance,
          ]);
        });
        break;

      case ExportReportType.CUSTOMER_ANALYTICS:
        headers = ['Customer', 'Email', 'Phone', 'Total Purchases', 'Total Spent', 'Average Order Value', 'Last Purchase'];

        if (data.topCustomers && data.topCustomers.length > 0) {
          data.topCustomers.forEach((customer: any) => {
            rows.push([
              customer.customerName,
              customer.email,
              customer.phone,
              customer.totalPurchases,
              customer.totalSpent.toFixed(2),
              customer.averageOrderValue.toFixed(2),
              new Date(customer.lastPurchaseDate).toISOString().split('T')[0],
            ]);
          });
        }

        // Add summary
        rows.push([]);
        rows.push(['Summary']);
        rows.push(['Total Customers', data.totalCustomers]);
        rows.push(['New Customers', data.newCustomers]);
        rows.push(['Returning Customers', data.returningCustomers]);
        rows.push(['Average Lifetime Value', data.averageLifetimeValue.toFixed(2)]);
        break;

      case ExportReportType.TAX:
        headers = ['Sale Number', 'Date', 'Subtotal', 'Tax', 'Total', 'Tax Rate (%)'];

        if (data.taxBySale && data.taxBySale.length > 0) {
          data.taxBySale.forEach((sale: any) => {
            rows.push([
              sale.saleNumber,
              new Date(sale.date).toISOString().split('T')[0],
              sale.subtotal.toFixed(2),
              sale.tax.toFixed(2),
              sale.total.toFixed(2),
              sale.taxRate.toFixed(2),
            ]);
          });
        }

        // Add summary
        rows.push([]);
        rows.push(['Summary']);
        rows.push(['Period', data.period]);
        rows.push(['Total Sales', data.totalSales.toFixed(2)]);
        rows.push(['Taxable Amount', data.taxableAmount.toFixed(2)]);
        rows.push(['Total Tax Collected', data.totalTaxCollected.toFixed(2)]);
        break;
    }

    // Convert to CSV format
    const csvRows = [headers, ...rows];
    return csvRows.map((row) => row.map(this.escapeCSVValue).join(',')).join('\n');
  }

  private escapeCSVValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }

    const stringValue = String(value);

    // If the value contains comma, newline, or double quote, wrap it in double quotes
    if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
  }

  async exportSalesData(options: {
    startDate?: string;
    endDate?: string;
    branchId?: string;
    format: ExportFormat;
  }): Promise<{ data: string; filename: string; mimeType: string }> {
    return this.exportReport({
      format: options.format,
      reportType: ExportReportType.SALES,
      startDate: options.startDate,
      endDate: options.endDate,
      branchId: options.branchId,
    });
  }

  async exportInventoryData(options: {
    branchId?: string;
    format: ExportFormat;
  }): Promise<{ data: string; filename: string; mimeType: string }> {
    return this.exportReport({
      format: options.format,
      reportType: ExportReportType.INVENTORY,
      branchId: options.branchId,
    });
  }

  async exportCustomerData(options: {
    startDate?: string;
    endDate?: string;
    branchId?: string;
    format: ExportFormat;
  }): Promise<{ data: string; filename: string; mimeType: string }> {
    return this.exportReport({
      format: options.format,
      reportType: ExportReportType.CUSTOMER_ANALYTICS,
      startDate: options.startDate,
      endDate: options.endDate,
      branchId: options.branchId,
    });
  }
}
