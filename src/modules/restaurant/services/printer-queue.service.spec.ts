import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PrinterQueueService } from './printer-queue.service';
import { PrinterJob } from '../entities/printer-job.entity';
import { PrinterConfig } from '../entities/printer-config.entity';
import {
  PrintJobStatus,
  PrintJobPriority,
} from '../common/hardware.constants';

describe('PrinterQueueService', () => {
  let service: PrinterQueueService;
  let printerJobRepository: jest.Mocked<Repository<PrinterJob>>;
  let printerConfigRepository: jest.Mocked<Repository<PrinterConfig>>;

  const mockPrinterConfig = {
    id: 'printer-1',
    branchId: 'branch-1',
    name: 'Kitchen Printer 1',
    isActive: true,
    totalJobs: 10,
    successfulJobs: 8,
    failedJobs: 2,
  };

  const mockPrinterJob = {
    id: 'job-1',
    branchId: 'branch-1',
    orderId: 'order-1',
    orderNumber: 'ORD-001',
    printerId: 'printer-1',
    printerName: 'Kitchen Printer 1',
    content: 'Test content',
    status: PrintJobStatus.PENDING,
    priority: PrintJobPriority.NORMAL,
    copies: 1,
    retryCount: 0,
    maxRetries: 3,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrinterQueueService,
        {
          provide: getRepositoryToken(PrinterJob),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            findAndCount: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(PrinterConfig),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PrinterQueueService>(PrinterQueueService);
    printerJobRepository = module.get(getRepositoryToken(PrinterJob));
    printerConfigRepository = module.get(getRepositoryToken(PrinterConfig));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createJob', () => {
    it('should create a print job successfully', async () => {
      printerConfigRepository.findOne.mockResolvedValue(mockPrinterConfig as any);
      printerJobRepository.create.mockReturnValue(mockPrinterJob as any);
      printerJobRepository.save.mockResolvedValue(mockPrinterJob as any);

      const result = await service.createJob(
        'branch-1',
        'printer-1',
        'ORD-001',
        'Test content',
        { orderId: 'order-1' },
      );

      expect(result).toBeDefined();
      expect(result.orderNumber).toBe('ORD-001');
      expect(printerConfigRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'printer-1', branchId: 'branch-1' },
      });
      expect(printerJobRepository.save).toHaveBeenCalled();
    });

    it('should throw error if printer not found', async () => {
      printerConfigRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createJob('branch-1', 'invalid-printer', 'ORD-001', 'Test content'),
      ).rejects.toThrow('Printer invalid-printer not found');
    });
  });

  describe('markJobCompleted', () => {
    it('should mark job as completed and update statistics', async () => {
      printerJobRepository.findOne.mockResolvedValue(mockPrinterJob as any);
      printerJobRepository.save.mockResolvedValue({
        ...mockPrinterJob,
        status: PrintJobStatus.COMPLETED,
      } as any);
      printerConfigRepository.findOne.mockResolvedValue(mockPrinterConfig as any);

      const result = await service.markJobCompleted('job-1', 1000);

      expect(result.status).toBe(PrintJobStatus.COMPLETED);
      expect(printerConfigRepository.save).toHaveBeenCalled();
    });
  });

  describe('markJobFailed', () => {
    it('should mark job for retry if retries remaining', async () => {
      printerJobRepository.findOne.mockResolvedValue(mockPrinterJob as any);
      printerJobRepository.save.mockResolvedValue({
        ...mockPrinterJob,
        status: PrintJobStatus.RETRY,
        retryCount: 1,
      } as any);
      printerConfigRepository.findOne.mockResolvedValue(mockPrinterConfig as any);

      const result = await service.markJobFailed('job-1', 'Test error');

      expect(result.status).toBe(PrintJobStatus.RETRY);
      expect(result.retryCount).toBe(1);
    });

    it('should mark job as failed if max retries exceeded', async () => {
      const jobWithMaxRetries = {
        ...mockPrinterJob,
        retryCount: 3,
        maxRetries: 3,
      };
      printerJobRepository.findOne.mockResolvedValue(jobWithMaxRetries as any);
      printerJobRepository.save.mockResolvedValue({
        ...jobWithMaxRetries,
        status: PrintJobStatus.FAILED,
        retryCount: 4,
      } as any);
      printerConfigRepository.findOne.mockResolvedValue(mockPrinterConfig as any);

      const result = await service.markJobFailed('job-1', 'Test error');

      expect(result.status).toBe(PrintJobStatus.FAILED);
    });
  });

  describe('getQueueStatistics', () => {
    it('should return queue statistics', async () => {
      const mockStats = [
        { status: PrintJobStatus.PENDING, count: '5' },
        { status: PrintJobStatus.COMPLETED, count: '10' },
        { status: PrintJobStatus.FAILED, count: '2' },
      ];

      printerJobRepository.createQueryBuilder = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(mockStats),
      });

      const result = await service.getQueueStatistics('branch-1');

      expect(result).toBeDefined();
      expect(result.totalJobs).toBe(17);
      expect(result.pendingJobs).toBe(5);
      expect(result.completedJobs).toBe(10);
      expect(result.failedJobs).toBe(2);
    });
  });
});
