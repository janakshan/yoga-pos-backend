import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PrinterRoutingService } from './printer-routing.service';
import { PrinterConfig } from '../entities/printer-config.entity';
import { PrinterQueueService } from './printer-queue.service';
import {
  PrinterRoutingStrategy,
  PrinterStatus,
} from '../common/hardware.constants';
import { KitchenStation } from '../common/restaurant.constants';

describe('PrinterRoutingService', () => {
  let service: PrinterRoutingService;
  let printerConfigRepository: jest.Mocked<Repository<PrinterConfig>>;
  let printerQueueService: jest.Mocked<PrinterQueueService>;

  const mockPrinters = [
    {
      id: 'printer-1',
      branchId: 'branch-1',
      name: 'Grill Printer',
      isActive: true,
      status: PrinterStatus.ONLINE,
      stationMappings: [
        { stationId: 'station-1', stationType: KitchenStation.GRILL, isPrimary: true },
      ],
      totalJobs: 10,
      successfulJobs: 9,
      failedJobs: 1,
    },
    {
      id: 'printer-2',
      branchId: 'branch-1',
      name: 'Fryer Printer',
      isActive: true,
      status: PrinterStatus.ONLINE,
      stationMappings: [
        { stationId: 'station-2', stationType: KitchenStation.FRYER, isPrimary: true },
      ],
      totalJobs: 5,
      successfulJobs: 5,
      failedJobs: 0,
    },
  ];

  const mockOrder = {
    id: 'order-1',
    branchId: 'branch-1',
    orderNumber: 'ORD-001',
    items: [
      {
        id: 'item-1',
        productName: 'Burger',
        quantity: 1,
        kitchenStation: KitchenStation.GRILL,
      },
      {
        id: 'item-2',
        productName: 'Fries',
        quantity: 1,
        kitchenStation: KitchenStation.FRYER,
      },
    ],
    serviceType: 'dine_in',
    priority: 'normal',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrinterRoutingService,
        {
          provide: getRepositoryToken(PrinterConfig),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: PrinterQueueService,
          useValue: {
            createJob: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PrinterRoutingService>(PrinterRoutingService);
    printerConfigRepository = module.get(getRepositoryToken(PrinterConfig));
    printerQueueService = module.get(PrinterQueueService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('routeByStation', () => {
    it('should route items to printers based on kitchen station', async () => {
      printerConfigRepository.find.mockResolvedValue(mockPrinters as any);
      printerQueueService.createJob.mockResolvedValue({
        id: 'job-1',
      } as any);

      const result = await service.routeOrderToPrinters(
        mockOrder as any,
        PrinterRoutingStrategy.STATION_BASED,
      );

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(printerQueueService.createJob).toHaveBeenCalled();
    });
  });

  describe('routeRoundRobin', () => {
    it('should distribute orders evenly across printers', async () => {
      printerConfigRepository.find.mockResolvedValue(mockPrinters as any);
      printerQueueService.createJob.mockResolvedValue({
        id: 'job-1',
      } as any);

      const result = await service.routeOrderToPrinters(
        mockOrder as any,
        PrinterRoutingStrategy.ROUND_ROBIN,
      );

      expect(result).toBeDefined();
      expect(result.length).toBe(1);
    });
  });

  describe('routeLoadBalanced', () => {
    it('should route to printer with best success rate', async () => {
      printerConfigRepository.find.mockResolvedValue(mockPrinters as any);
      printerQueueService.createJob.mockResolvedValue({
        id: 'job-1',
      } as any);

      const result = await service.routeOrderToPrinters(
        mockOrder as any,
        PrinterRoutingStrategy.LOAD_BALANCED,
      );

      expect(result).toBeDefined();
      expect(result.length).toBe(1);
    });
  });
});
