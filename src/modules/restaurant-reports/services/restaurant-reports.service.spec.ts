import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RestaurantReportsService } from './restaurant-reports.service';
import { RestaurantOrder } from '../../restaurant/entities/restaurant-order.entity';
import { OrderItem } from '../../restaurant/entities/order-item.entity';
import { Table } from '../../restaurant/entities/table.entity';
import { ServerShift } from '../../server-management/entities/server-shift.entity';
import { Product } from '../../products/entities/product.entity';
import { Recipe } from '../../recipes/entities/recipe.entity';
import { ReportPeriod } from '../dto/date-range-filter.dto';

describe('RestaurantReportsService', () => {
  let service: RestaurantReportsService;
  let orderRepository: Repository<RestaurantOrder>;
  let orderItemRepository: Repository<OrderItem>;
  let tableRepository: Repository<Table>;
  let serverShiftRepository: Repository<ServerShift>;
  let productRepository: Repository<Product>;
  let recipeRepository: Repository<Recipe>;

  const mockQueryBuilder = {
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
    leftJoin: jest.fn(() => mockQueryBuilder),
    select: jest.fn(() => mockQueryBuilder),
    where: jest.fn(() => mockQueryBuilder),
    andWhere: jest.fn(() => mockQueryBuilder),
    groupBy: jest.fn(() => mockQueryBuilder),
    addGroupBy: jest.fn(() => mockQueryBuilder),
    orderBy: jest.fn(() => mockQueryBuilder),
    addOrderBy: jest.fn(() => mockQueryBuilder),
    getRawMany: jest.fn(),
    getRawOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestaurantReportsService,
        {
          provide: getRepositoryToken(RestaurantOrder),
          useValue: {
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
          },
        },
        {
          provide: getRepositoryToken(OrderItem),
          useValue: {
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
          },
        },
        {
          provide: getRepositoryToken(Table),
          useValue: {
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
          },
        },
        {
          provide: getRepositoryToken(ServerShift),
          useValue: {
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
          },
        },
        {
          provide: getRepositoryToken(Product),
          useValue: {
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
          },
        },
        {
          provide: getRepositoryToken(Recipe),
          useValue: {
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
          },
        },
      ],
    }).compile();

    service = module.get<RestaurantReportsService>(RestaurantReportsService);
    orderRepository = module.get<Repository<RestaurantOrder>>(
      getRepositoryToken(RestaurantOrder),
    );
    orderItemRepository = module.get<Repository<OrderItem>>(
      getRepositoryToken(OrderItem),
    );
    tableRepository = module.get<Repository<Table>>(getRepositoryToken(Table));
    serverShiftRepository = module.get<Repository<ServerShift>>(
      getRepositoryToken(ServerShift),
    );
    productRepository = module.get<Repository<Product>>(
      getRepositoryToken(Product),
    );
    recipeRepository = module.get<Repository<Recipe>>(
      getRepositoryToken(Recipe),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTablePerformanceReport', () => {
    it('should return table performance data', async () => {
      const mockData = [
        {
          tableId: '1',
          tableNumber: 'T1',
          capacity: 4,
          sectionName: 'Main',
          ordersCount: '10',
          totalRevenue: '1000.00',
          avgOrderValue: '100.00',
          totalGuests: '40',
          avgPartySize: '4.00',
          avgDiningDuration: '60.00',
          avgServiceTime: '15.00',
          totalTips: '100.00',
          avgTipAmount: '10.00',
        },
      ];

      mockQueryBuilder.getRawMany.mockResolvedValue(mockData);

      const result = await service.getTablePerformanceReport({
        period: ReportPeriod.THIS_MONTH,
      });

      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.tables).toBeDefined();
      expect(result.tables.length).toBeGreaterThan(0);
    });

    it('should filter by branchId when provided', async () => {
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      await service.getTablePerformanceReport({
        period: ReportPeriod.THIS_MONTH,
        branchId: 'branch-123',
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
    });
  });

  describe('getMenuAnalyticsReport', () => {
    it('should return menu analytics data', async () => {
      const mockData = [
        {
          productId: '1',
          productName: 'Burger',
          categoryName: 'Main Course',
          restaurantCategory: 'main_course',
          kitchenStation: 'GRILL',
          quantitySold: '50',
          totalRevenue: '500.00',
          avgPrice: '10.00',
          totalQuantity: '50',
          costPerServing: '3.00',
          avgPrepTime: '15.00',
        },
      ];

      mockQueryBuilder.getRawMany.mockResolvedValue(mockData);

      const result = await service.getMenuAnalyticsReport({
        period: ReportPeriod.THIS_MONTH,
      });

      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.items).toBeDefined();
      expect(result.items.length).toBeGreaterThan(0);
    });

    it('should calculate profitability metrics correctly', async () => {
      const mockData = [
        {
          productId: '1',
          productName: 'Burger',
          categoryName: 'Main Course',
          restaurantCategory: 'main_course',
          kitchenStation: 'GRILL',
          quantitySold: '10',
          totalRevenue: '100.00',
          avgPrice: '10.00',
          totalQuantity: '10',
          costPerServing: '3.00',
          avgPrepTime: '15.00',
        },
      ];

      mockQueryBuilder.getRawMany.mockResolvedValue(mockData);

      const result = await service.getMenuAnalyticsReport({
        period: ReportPeriod.THIS_MONTH,
      });

      const item = result.items[0];
      expect(item.totalCost).toBe(30); // 3.00 * 10
      expect(item.totalProfit).toBe(70); // 100 - 30
      expect(item.profitMargin).toBe(70); // (70 / 100) * 100
    });
  });

  describe('getServerPerformanceReport', () => {
    it('should return server performance data', async () => {
      const mockData = [
        {
          serverId: '1',
          serverName: 'John Doe',
          shiftsWorked: '10',
          totalOrders: '100',
          totalTables: '50',
          totalSales: '5000.00',
          avgSalesPerShift: '500.00',
          totalTips: '500.00',
          avgTipsPerShift: '50.00',
          avgTableTurnTime: '60.00',
          avgServiceTime: '15.00',
          avgSatisfactionScore: '4.5',
          totalHoursWorked: '4800', // in minutes
          avgSalesPerHour: '62.50',
          avgTipsPerHour: '6.25',
        },
      ];

      mockQueryBuilder.getRawMany.mockResolvedValue(mockData);

      const result = await service.getServerPerformanceReport({
        period: ReportPeriod.THIS_MONTH,
      });

      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.servers).toBeDefined();
      expect(result.servers.length).toBeGreaterThan(0);
    });

    it('should calculate derived metrics correctly', async () => {
      const mockData = [
        {
          serverId: '1',
          serverName: 'John Doe',
          shiftsWorked: '10',
          totalOrders: '100',
          totalTables: '50',
          totalSales: '5000.00',
          avgSalesPerShift: '500.00',
          totalTips: '500.00',
          avgTipsPerShift: '50.00',
          avgTableTurnTime: '60.00',
          avgServiceTime: '15.00',
          avgSatisfactionScore: '4.5',
          totalHoursWorked: '4800',
          avgSalesPerHour: '62.50',
          avgTipsPerHour: '6.25',
        },
      ];

      mockQueryBuilder.getRawMany.mockResolvedValue(mockData);

      const result = await service.getServerPerformanceReport({
        period: ReportPeriod.THIS_MONTH,
      });

      const server = result.servers[0];
      expect(server.ordersPerShift).toBe(10); // 100 / 10
      expect(server.tipPercentage).toBe(10); // (500 / 5000) * 100
    });
  });

  describe('getKitchenMetricsReport', () => {
    it('should return kitchen metrics data', async () => {
      const mockData = [
        {
          kitchenStation: 'GRILL',
          totalItems: '100',
          avgPrepTime: '15.00',
          avgWaitTime: '5.00',
          avgCookTime: '10.00',
          lateItems: '10',
          onTimeItems: '90',
        },
      ];

      mockQueryBuilder.getRawMany.mockResolvedValue(mockData);

      const result = await service.getKitchenMetricsReport({
        period: ReportPeriod.THIS_MONTH,
      });

      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.stations).toBeDefined();
      expect(result.stations.length).toBeGreaterThan(0);
    });

    it('should calculate efficiency percentages correctly', async () => {
      const mockData = [
        {
          kitchenStation: 'GRILL',
          totalItems: '100',
          avgPrepTime: '15.00',
          avgWaitTime: '5.00',
          avgCookTime: '10.00',
          lateItems: '10',
          onTimeItems: '90',
        },
      ];

      mockQueryBuilder.getRawMany.mockResolvedValue(mockData);

      const result = await service.getKitchenMetricsReport({
        period: ReportPeriod.THIS_MONTH,
      });

      const station = result.stations[0];
      expect(station.onTimePercentage).toBe(90); // (90 / 100) * 100
      expect(station.latePercentage).toBe(10); // (10 / 100) * 100
      expect(station.efficiency).toBe(90);
    });
  });

  describe('getServiceTypeAnalysisReport', () => {
    it('should return service type analysis data', async () => {
      const mockData = [
        {
          serviceType: 'DINE_IN',
          ordersCount: '100',
          totalRevenue: '10000.00',
          avgOrderValue: '100.00',
          totalGuests: '400',
          avgPartySize: '4.00',
          totalTips: '1000.00',
          avgTipAmount: '10.00',
          avgFulfillmentTime: '60.00',
        },
      ];

      mockQueryBuilder.getRawMany.mockResolvedValue(mockData);

      const result = await service.getServiceTypeAnalysisReport({
        period: ReportPeriod.THIS_MONTH,
      });

      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.serviceTypes).toBeDefined();
      expect(result.serviceTypes.length).toBeGreaterThan(0);
    });
  });

  describe('getFoodCostAnalysisReport', () => {
    it('should return food cost analysis data', async () => {
      const mockData = [
        {
          categoryName: 'Main Course',
          revenue: '10000.00',
          cost: '3000.00',
          quantity: '100',
        },
      ];

      mockQueryBuilder.getRawMany.mockResolvedValue(mockData);

      const result = await service.getFoodCostAnalysisReport({
        period: ReportPeriod.THIS_MONTH,
      });

      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.categories).toBeDefined();
    });

    it('should calculate food cost percentages correctly', async () => {
      const mockData = [
        {
          categoryName: 'Main Course',
          revenue: '10000.00',
          cost: '3000.00',
          quantity: '100',
        },
      ];

      mockQueryBuilder.getRawMany.mockResolvedValue(mockData);

      const result = await service.getFoodCostAnalysisReport({
        period: ReportPeriod.THIS_MONTH,
      });

      const category = result.categories[0];
      expect(category.profit).toBe(7000); // 10000 - 3000
      expect(category.foodCostPercentage).toBe(30); // (3000 / 10000) * 100
      expect(category.profitMargin).toBe(70); // (7000 / 10000) * 100
    });
  });

  describe('getTableTurnoverReport', () => {
    it('should return table turnover data', async () => {
      const mockData = [
        {
          tableId: '1',
          tableNumber: 'T1',
          date: '2024-01-15',
          turnovers: '5',
          avgDiningDuration: '60.00',
          dailyRevenue: '500.00',
        },
      ];

      mockQueryBuilder.getRawMany.mockResolvedValue(mockData);

      const result = await service.getTableTurnoverReport({
        period: ReportPeriod.THIS_MONTH,
      });

      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.daily).toBeDefined();
      expect(result.byTable).toBeDefined();
    });
  });

  describe('getPeakHoursAnalysisReport', () => {
    it('should return peak hours data', async () => {
      const mockData = [
        {
          hour: '12',
          dayOfWeek: '1',
          ordersCount: '50',
          revenue: '5000.00',
          avgOrderValue: '100.00',
          totalGuests: '200',
        },
      ];

      mockQueryBuilder.getRawMany.mockResolvedValue(mockData);

      const result = await service.getPeakHoursAnalysisReport({
        period: ReportPeriod.THIS_MONTH,
      });

      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.hourly).toBeDefined();
      expect(result.daily).toBeDefined();
    });
  });

  describe('getProfitMarginAnalysisReport', () => {
    it('should return profit margin data', async () => {
      const revenueData = {
        totalRevenue: '10000.00',
        subtotal: '9000.00',
        totalTax: '900.00',
        totalDiscount: '100.00',
        totalTips: '1000.00',
        ordersCount: '100',
        avgOrderValue: '100.00',
      };

      const costData = {
        totalCost: '3000.00',
        ingredientCost: '2000.00',
        laborCost: '800.00',
        overheadCost: '200.00',
      };

      mockQueryBuilder.getRawOne
        .mockResolvedValueOnce(revenueData)
        .mockResolvedValueOnce(costData);

      const result = await service.getProfitMarginAnalysisReport({
        period: ReportPeriod.THIS_MONTH,
      });

      expect(result).toBeDefined();
      expect(result.analysis).toBeDefined();
      expect(result.analysis.profitability.grossProfit).toBe(7000);
      expect(result.analysis.profitability.profitMargin).toBe(70);
    });
  });

  describe('getQROrderingAnalyticsReport', () => {
    it('should return QR ordering analytics', async () => {
      const qrData = {
        totalQROrders: '50',
        totalSessions: '60',
        totalRevenue: '5000.00',
        avgOrderValue: '100.00',
        avgTimeToOrder: '5.00',
        tablesUsed: '10',
      };

      const totalOrders = {
        totalOrders: '100',
      };

      mockQueryBuilder.getRawOne
        .mockResolvedValueOnce(qrData)
        .mockResolvedValueOnce(totalOrders);

      const result = await service.getQROrderingAnalyticsReport({
        period: ReportPeriod.THIS_MONTH,
      });

      expect(result).toBeDefined();
      expect(result.analytics).toBeDefined();
      expect(result.analytics.adoption.qrOrderPercentage).toBe(50);
      expect(result.analytics.adoption.conversionRate).toBeCloseTo(83.33, 1);
    });
  });
});
