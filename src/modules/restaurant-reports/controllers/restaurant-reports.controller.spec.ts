import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { RestaurantReportsController } from './restaurant-reports.controller';
import { RestaurantReportsService } from '../services/restaurant-reports.service';
import { ReportExportService } from '../services/report-export.service';
import { ReportPeriod } from '../dto/date-range-filter.dto';
import { ReportType, ExportFormat } from '../dto/export-report.dto';

describe('RestaurantReportsController', () => {
  let controller: RestaurantReportsController;
  let reportsService: RestaurantReportsService;
  let exportService: ReportExportService;

  const mockReportsService = {
    getTablePerformanceReport: jest.fn(),
    getMenuAnalyticsReport: jest.fn(),
    getServerPerformanceReport: jest.fn(),
    getKitchenMetricsReport: jest.fn(),
    getServiceTypeAnalysisReport: jest.fn(),
    getFoodCostAnalysisReport: jest.fn(),
    getTableTurnoverReport: jest.fn(),
    getPeakHoursAnalysisReport: jest.fn(),
    getProfitMarginAnalysisReport: jest.fn(),
    getQROrderingAnalyticsReport: jest.fn(),
  };

  const mockExportService = {
    exportTablePerformanceReport: jest.fn(),
    exportMenuAnalyticsReport: jest.fn(),
    exportServerPerformanceReport: jest.fn(),
    exportKitchenMetricsReport: jest.fn(),
    exportServiceTypeReport: jest.fn(),
    exportFoodCostReport: jest.fn(),
    exportTableTurnoverReport: jest.fn(),
    exportPeakHoursReport: jest.fn(),
    exportProfitMarginReport: jest.fn(),
    exportQROrderingReport: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    reset: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RestaurantReportsController],
      providers: [
        {
          provide: RestaurantReportsService,
          useValue: mockReportsService,
        },
        {
          provide: ReportExportService,
          useValue: mockExportService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    controller = module.get<RestaurantReportsController>(
      RestaurantReportsController,
    );
    reportsService = module.get<RestaurantReportsService>(
      RestaurantReportsService,
    );
    exportService = module.get<ReportExportService>(ReportExportService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getTablePerformance', () => {
    it('should return table performance report', async () => {
      const mockReport = {
        period: { startDate: new Date(), endDate: new Date() },
        summary: {},
        tables: [],
      };

      mockReportsService.getTablePerformanceReport.mockResolvedValue(
        mockReport,
      );

      const result = await controller.getTablePerformance({
        period: ReportPeriod.THIS_MONTH,
      });

      expect(result).toEqual(mockReport);
      expect(reportsService.getTablePerformanceReport).toHaveBeenCalledWith({
        period: ReportPeriod.THIS_MONTH,
      });
    });
  });

  describe('getMenuAnalytics', () => {
    it('should return menu analytics report', async () => {
      const mockReport = {
        period: { startDate: new Date(), endDate: new Date() },
        summary: {},
        items: [],
      };

      mockReportsService.getMenuAnalyticsReport.mockResolvedValue(mockReport);

      const result = await controller.getMenuAnalytics({
        period: ReportPeriod.THIS_MONTH,
      });

      expect(result).toEqual(mockReport);
      expect(reportsService.getMenuAnalyticsReport).toHaveBeenCalledWith({
        period: ReportPeriod.THIS_MONTH,
      });
    });
  });

  describe('getServerPerformance', () => {
    it('should return server performance report', async () => {
      const mockReport = {
        period: { startDate: new Date(), endDate: new Date() },
        summary: {},
        servers: [],
      };

      mockReportsService.getServerPerformanceReport.mockResolvedValue(
        mockReport,
      );

      const result = await controller.getServerPerformance({
        period: ReportPeriod.THIS_MONTH,
      });

      expect(result).toEqual(mockReport);
      expect(reportsService.getServerPerformanceReport).toHaveBeenCalledWith({
        period: ReportPeriod.THIS_MONTH,
      });
    });
  });

  describe('getKitchenMetrics', () => {
    it('should return kitchen metrics report', async () => {
      const mockReport = {
        period: { startDate: new Date(), endDate: new Date() },
        summary: {},
        stations: [],
      };

      mockReportsService.getKitchenMetricsReport.mockResolvedValue(mockReport);

      const result = await controller.getKitchenMetrics({
        period: ReportPeriod.THIS_MONTH,
      });

      expect(result).toEqual(mockReport);
      expect(reportsService.getKitchenMetricsReport).toHaveBeenCalledWith({
        period: ReportPeriod.THIS_MONTH,
      });
    });
  });

  describe('getServiceTypeAnalysis', () => {
    it('should return service type analysis report', async () => {
      const mockReport = {
        period: { startDate: new Date(), endDate: new Date() },
        summary: {},
        serviceTypes: [],
      };

      mockReportsService.getServiceTypeAnalysisReport.mockResolvedValue(
        mockReport,
      );

      const result = await controller.getServiceTypeAnalysis({
        period: ReportPeriod.THIS_MONTH,
      });

      expect(result).toEqual(mockReport);
      expect(reportsService.getServiceTypeAnalysisReport).toHaveBeenCalledWith(
        {
          period: ReportPeriod.THIS_MONTH,
        },
      );
    });
  });

  describe('getFoodCostAnalysis', () => {
    it('should return food cost analysis report', async () => {
      const mockReport = {
        period: { startDate: new Date(), endDate: new Date() },
        summary: {},
        categories: [],
      };

      mockReportsService.getFoodCostAnalysisReport.mockResolvedValue(
        mockReport,
      );

      const result = await controller.getFoodCostAnalysis({
        period: ReportPeriod.THIS_MONTH,
      });

      expect(result).toEqual(mockReport);
      expect(reportsService.getFoodCostAnalysisReport).toHaveBeenCalledWith({
        period: ReportPeriod.THIS_MONTH,
      });
    });
  });

  describe('getTableTurnover', () => {
    it('should return table turnover report', async () => {
      const mockReport = {
        period: { startDate: new Date(), endDate: new Date() },
        summary: {},
        daily: [],
        byTable: [],
      };

      mockReportsService.getTableTurnoverReport.mockResolvedValue(mockReport);

      const result = await controller.getTableTurnover({
        period: ReportPeriod.THIS_MONTH,
      });

      expect(result).toEqual(mockReport);
      expect(reportsService.getTableTurnoverReport).toHaveBeenCalledWith({
        period: ReportPeriod.THIS_MONTH,
      });
    });
  });

  describe('getPeakHours', () => {
    it('should return peak hours analysis report', async () => {
      const mockReport = {
        period: { startDate: new Date(), endDate: new Date() },
        summary: {},
        hourly: [],
        daily: [],
      };

      mockReportsService.getPeakHoursAnalysisReport.mockResolvedValue(
        mockReport,
      );

      const result = await controller.getPeakHours({
        period: ReportPeriod.THIS_MONTH,
      });

      expect(result).toEqual(mockReport);
      expect(reportsService.getPeakHoursAnalysisReport).toHaveBeenCalledWith({
        period: ReportPeriod.THIS_MONTH,
      });
    });
  });

  describe('getProfitMargin', () => {
    it('should return profit margin analysis report', async () => {
      const mockReport = {
        period: { startDate: new Date(), endDate: new Date() },
        analysis: {},
      };

      mockReportsService.getProfitMarginAnalysisReport.mockResolvedValue(
        mockReport,
      );

      const result = await controller.getProfitMargin({
        period: ReportPeriod.THIS_MONTH,
      });

      expect(result).toEqual(mockReport);
      expect(reportsService.getProfitMarginAnalysisReport).toHaveBeenCalledWith(
        {
          period: ReportPeriod.THIS_MONTH,
        },
      );
    });
  });

  describe('getQROrdering', () => {
    it('should return QR ordering analytics report', async () => {
      const mockReport = {
        period: { startDate: new Date(), endDate: new Date() },
        analytics: {},
      };

      mockReportsService.getQROrderingAnalyticsReport.mockResolvedValue(
        mockReport,
      );

      const result = await controller.getQROrdering({
        period: ReportPeriod.THIS_MONTH,
      });

      expect(result).toEqual(mockReport);
      expect(reportsService.getQROrderingAnalyticsReport).toHaveBeenCalledWith(
        {
          period: ReportPeriod.THIS_MONTH,
        },
      );
    });
  });

  describe('exportReport', () => {
    it('should export table performance report to CSV', async () => {
      const mockReport = {
        summary: {},
        tables: [],
      };

      const mockBuffer = Buffer.from('csv data');

      mockReportsService.getTablePerformanceReport.mockResolvedValue(
        mockReport,
      );
      mockExportService.exportTablePerformanceReport.mockResolvedValue(
        mockBuffer,
      );

      const mockResponse = {
        setHeader: jest.fn(),
        send: jest.fn(),
      };

      await controller.exportReport(
        {
          reportType: ReportType.TABLE_PERFORMANCE,
          format: ExportFormat.CSV,
        },
        { period: ReportPeriod.THIS_MONTH },
        mockResponse as any,
      );

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'text/csv',
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="table-performance.csv"',
      );
      expect(mockResponse.send).toHaveBeenCalledWith(mockBuffer);
    });

    it('should export menu analytics report to PDF', async () => {
      const mockReport = {
        summary: {},
        items: [],
      };

      const mockBuffer = Buffer.from('pdf data');

      mockReportsService.getMenuAnalyticsReport.mockResolvedValue(mockReport);
      mockExportService.exportMenuAnalyticsReport.mockResolvedValue(
        mockBuffer,
      );

      const mockResponse = {
        setHeader: jest.fn(),
        send: jest.fn(),
      };

      await controller.exportReport(
        {
          reportType: ReportType.MENU_ANALYTICS,
          format: ExportFormat.PDF,
        },
        { period: ReportPeriod.THIS_MONTH },
        mockResponse as any,
      );

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/pdf',
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="menu-analytics.pdf"',
      );
      expect(mockResponse.send).toHaveBeenCalledWith(mockBuffer);
    });
  });

  describe('getComprehensiveSummary', () => {
    it('should return comprehensive summary combining all reports', async () => {
      const mockPeriod = { startDate: new Date(), endDate: new Date() };

      mockReportsService.getTablePerformanceReport.mockResolvedValue({
        period: mockPeriod,
        summary: {},
      });
      mockReportsService.getMenuAnalyticsReport.mockResolvedValue({
        summary: {},
      });
      mockReportsService.getServerPerformanceReport.mockResolvedValue({
        summary: {},
      });
      mockReportsService.getKitchenMetricsReport.mockResolvedValue({
        summary: {},
      });
      mockReportsService.getServiceTypeAnalysisReport.mockResolvedValue({
        summary: {},
      });
      mockReportsService.getFoodCostAnalysisReport.mockResolvedValue({
        summary: {},
      });
      mockReportsService.getPeakHoursAnalysisReport.mockResolvedValue({
        summary: {},
      });
      mockReportsService.getProfitMarginAnalysisReport.mockResolvedValue({
        analysis: {
          profitability: {},
          revenue: {},
          costs: {},
        },
      });
      mockReportsService.getQROrderingAnalyticsReport.mockResolvedValue({
        analytics: {},
      });

      const result = await controller.getComprehensiveSummary({
        period: ReportPeriod.THIS_MONTH,
      });

      expect(result).toBeDefined();
      expect(result.period).toEqual(mockPeriod);
      expect(result.overview).toBeDefined();
      expect(result.performance).toBeDefined();
      expect(result.menu).toBeDefined();
      expect(result.serviceTypes).toBeDefined();
      expect(result.foodCost).toBeDefined();
      expect(result.peakHours).toBeDefined();
      expect(result.qrOrdering).toBeDefined();

      // Verify all services were called
      expect(reportsService.getTablePerformanceReport).toHaveBeenCalled();
      expect(reportsService.getMenuAnalyticsReport).toHaveBeenCalled();
      expect(reportsService.getServerPerformanceReport).toHaveBeenCalled();
      expect(reportsService.getKitchenMetricsReport).toHaveBeenCalled();
      expect(reportsService.getServiceTypeAnalysisReport).toHaveBeenCalled();
      expect(reportsService.getFoodCostAnalysisReport).toHaveBeenCalled();
      expect(reportsService.getPeakHoursAnalysisReport).toHaveBeenCalled();
      expect(reportsService.getProfitMarginAnalysisReport).toHaveBeenCalled();
      expect(reportsService.getQROrderingAnalyticsReport).toHaveBeenCalled();
    });
  });
});
