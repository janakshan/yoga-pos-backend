import { Test, TestingModule } from '@nestjs/testing';
import { ReportExportService } from './report-export.service';

describe('ReportExportService', () => {
  let service: ReportExportService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportExportService],
    }).compile();

    service = module.get<ReportExportService>(ReportExportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('exportToCSV', () => {
    it('should export data to CSV format', async () => {
      const data = [
        { name: 'Item 1', value: 100, category: 'A' },
        { name: 'Item 2', value: 200, category: 'B' },
      ];

      const result = await service.exportToCSV(data);

      expect(result).toBeInstanceOf(Buffer);
      const csvContent = result.toString('utf-8');
      expect(csvContent).toContain('name');
      expect(csvContent).toContain('value');
      expect(csvContent).toContain('category');
      expect(csvContent).toContain('Item 1');
      expect(csvContent).toContain('Item 2');
    });

    it('should handle empty data array', async () => {
      const data = [];
      const result = await service.exportToCSV(data);
      expect(result).toBeInstanceOf(Buffer);
    });

    it('should use specified fields if provided', async () => {
      const data = [
        { name: 'Item 1', value: 100, category: 'A' },
        { name: 'Item 2', value: 200, category: 'B' },
      ];

      const result = await service.exportToCSV(data, ['name', 'value']);

      const csvContent = result.toString('utf-8');
      expect(csvContent).toContain('name');
      expect(csvContent).toContain('value');
      expect(csvContent).not.toContain('category');
    });
  });

  describe('exportToPDF', () => {
    it('should export data to PDF format', async () => {
      const title = 'Test Report';
      const data = { summary: 'Test summary' };

      const result = await service.exportToPDF(title, data);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle sections in PDF', async () => {
      const title = 'Test Report';
      const data = {};
      const options = {
        sections: [
          {
            title: 'Summary',
            data: { total: 100, count: 10 },
            type: 'summary' as const,
          },
          {
            title: 'Details',
            data: [
              { item: 'Item 1', value: 50 },
              { item: 'Item 2', value: 50 },
            ],
            type: 'table' as const,
          },
        ],
      };

      const result = await service.exportToPDF(title, data, options);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('exportTablePerformanceReport', () => {
    it('should export table performance to CSV', async () => {
      const reportData = {
        summary: {},
        tables: [
          {
            tableId: '1',
            tableNumber: 'T1',
            totalRevenue: 1000,
            ordersCount: 10,
          },
        ],
      };

      const result = await service.exportTablePerformanceReport(
        reportData,
        'csv',
      );

      expect(result).toBeInstanceOf(Buffer);
      const csvContent = result.toString('utf-8');
      expect(csvContent).toContain('tableId');
      expect(csvContent).toContain('tableNumber');
    });

    it('should export table performance to PDF', async () => {
      const reportData = {
        summary: {
          totalTables: 10,
          totalRevenue: 10000,
        },
        tables: [
          {
            tableId: '1',
            tableNumber: 'T1',
            totalRevenue: 1000,
            ordersCount: 10,
          },
        ],
      };

      const result = await service.exportTablePerformanceReport(
        reportData,
        'pdf',
      );

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('exportMenuAnalyticsReport', () => {
    it('should export menu analytics to CSV', async () => {
      const reportData = {
        summary: {
          topSellingItems: [],
          categoryBreakdown: [],
        },
        items: [
          {
            productId: '1',
            productName: 'Burger',
            totalRevenue: 500,
          },
        ],
      };

      const result = await service.exportMenuAnalyticsReport(reportData, 'csv');

      expect(result).toBeInstanceOf(Buffer);
      const csvContent = result.toString('utf-8');
      expect(csvContent).toContain('productId');
    });

    it('should export menu analytics to PDF', async () => {
      const reportData = {
        summary: {
          totalItems: 10,
          totalRevenue: 5000,
          topSellingItems: [
            { productName: 'Burger', totalRevenue: 500 },
          ],
          categoryBreakdown: [
            { category: 'Main Course', totalRevenue: 3000 },
          ],
        },
        items: [
          {
            productId: '1',
            productName: 'Burger',
            totalRevenue: 500,
          },
        ],
      };

      const result = await service.exportMenuAnalyticsReport(reportData, 'pdf');

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('exportServerPerformanceReport', () => {
    it('should export server performance to CSV', async () => {
      const reportData = {
        summary: {
          topPerformers: [],
        },
        servers: [
          {
            serverId: '1',
            serverName: 'John Doe',
            totalSales: 5000,
          },
        ],
      };

      const result = await service.exportServerPerformanceReport(
        reportData,
        'csv',
      );

      expect(result).toBeInstanceOf(Buffer);
      const csvContent = result.toString('utf-8');
      expect(csvContent).toContain('serverId');
    });
  });

  describe('exportKitchenMetricsReport', () => {
    it('should export kitchen metrics to CSV', async () => {
      const reportData = {
        summary: {},
        stations: [
          {
            kitchenStation: 'GRILL',
            totalItems: 100,
            efficiency: 90,
          },
        ],
      };

      const result = await service.exportKitchenMetricsReport(
        reportData,
        'csv',
      );

      expect(result).toBeInstanceOf(Buffer);
      const csvContent = result.toString('utf-8');
      expect(csvContent).toContain('kitchenStation');
    });
  });

  describe('exportServiceTypeReport', () => {
    it('should export service type analysis to CSV', async () => {
      const reportData = {
        summary: {},
        serviceTypes: [
          {
            serviceType: 'DINE_IN',
            totalRevenue: 10000,
            ordersCount: 100,
          },
        ],
      };

      const result = await service.exportServiceTypeReport(reportData, 'csv');

      expect(result).toBeInstanceOf(Buffer);
      const csvContent = result.toString('utf-8');
      expect(csvContent).toContain('serviceType');
    });
  });

  describe('exportFoodCostReport', () => {
    it('should export food cost analysis to CSV', async () => {
      const reportData = {
        summary: {},
        categories: [
          {
            categoryName: 'Main Course',
            revenue: 10000,
            cost: 3000,
            profitMargin: 70,
          },
        ],
      };

      const result = await service.exportFoodCostReport(reportData, 'csv');

      expect(result).toBeInstanceOf(Buffer);
      const csvContent = result.toString('utf-8');
      expect(csvContent).toContain('categoryName');
    });
  });

  describe('exportTableTurnoverReport', () => {
    it('should export table turnover to CSV', async () => {
      const reportData = {
        summary: {},
        byTable: [
          {
            tableId: '1',
            tableNumber: 'T1',
            totalTurnovers: 50,
          },
        ],
      };

      const result = await service.exportTableTurnoverReport(reportData, 'csv');

      expect(result).toBeInstanceOf(Buffer);
      const csvContent = result.toString('utf-8');
      expect(csvContent).toContain('tableId');
    });
  });

  describe('exportPeakHoursReport', () => {
    it('should export peak hours to CSV', async () => {
      const reportData = {
        summary: {},
        detailed: [
          {
            hour: 12,
            dayOfWeek: 'Monday',
            ordersCount: 50,
            revenue: 5000,
          },
        ],
      };

      const result = await service.exportPeakHoursReport(reportData, 'csv');

      expect(result).toBeInstanceOf(Buffer);
      const csvContent = result.toString('utf-8');
      expect(csvContent).toContain('hour');
    });
  });

  describe('exportProfitMarginReport', () => {
    it('should export profit margin to CSV', async () => {
      const reportData = {
        analysis: {
          revenue: {
            total: 10000,
            subtotal: 9000,
          },
          costs: {
            total: 3000,
            ingredients: 2000,
          },
          profitability: {
            grossProfit: 7000,
            profitMargin: 70,
          },
          orderMetrics: {
            totalOrders: 100,
            avgOrderValue: 100,
          },
        },
      };

      const result = await service.exportProfitMarginReport(reportData, 'csv');

      expect(result).toBeInstanceOf(Buffer);
    });
  });

  describe('exportQROrderingReport', () => {
    it('should export QR ordering analytics to CSV', async () => {
      const reportData = {
        analytics: {
          qrOrders: {
            total: 50,
            revenue: 5000,
          },
          adoption: {
            qrOrderPercentage: 50,
            conversionRate: 83.33,
          },
          comparison: {
            totalOrders: 100,
            traditionalOrders: 50,
          },
        },
      };

      const result = await service.exportQROrderingReport(reportData, 'csv');

      expect(result).toBeInstanceOf(Buffer);
    });
  });
});
