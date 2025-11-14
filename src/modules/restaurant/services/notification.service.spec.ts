import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationService } from './notification.service';
import { NotificationLog } from '../entities/notification-log.entity';
import {
  NotificationDeviceType,
  NotificationStatus,
} from '../common/hardware.constants';

describe('NotificationService', () => {
  let service: NotificationService;
  let notificationLogRepository: jest.Mocked<Repository<NotificationLog>>;

  const mockDeviceConfig = {
    branchId: 'branch-1',
    name: 'Pager #42',
    deviceId: '42',
    deviceType: NotificationDeviceType.PAGER,
    vibrationPattern: [500, 200, 500],
    lightColor: '#FF0000',
    soundPattern: 'beep',
    timeout: 300,
  };

  const mockOrder = {
    id: 'order-1',
    branchId: 'branch-1',
    orderNumber: 'ORD-001',
    table: { tableNumber: 'T-5' },
  };

  const mockNotification = {
    id: 'notification-1',
    branchId: 'branch-1',
    orderId: 'order-1',
    orderNumber: 'ORD-001',
    deviceId: '42',
    deviceName: 'Pager #42',
    deviceType: NotificationDeviceType.PAGER,
    message: 'Order #ORD-001 is ready for pickup',
    status: NotificationStatus.PENDING,
    retryCount: 0,
    maxRetries: 3,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: getRepositoryToken(NotificationLog),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            findAndCount: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    notificationLogRepository = module.get(getRepositoryToken(NotificationLog));

    // Register a test device
    await service.registerDevice(mockDeviceConfig as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendOrderReadyNotification', () => {
    it('should send notification successfully', async () => {
      notificationLogRepository.create.mockReturnValue(mockNotification as any);
      notificationLogRepository.save.mockResolvedValue({
        ...mockNotification,
        status: NotificationStatus.SENT,
      } as any);

      const result = await service.sendOrderReadyNotification(
        mockOrder as any,
        '42',
      );

      expect(result).toBeDefined();
      expect(notificationLogRepository.create).toHaveBeenCalled();
      expect(notificationLogRepository.save).toHaveBeenCalled();
    });
  });

  describe('acknowledgeNotification', () => {
    it('should acknowledge notification', async () => {
      notificationLogRepository.findOne.mockResolvedValue(mockNotification as any);
      notificationLogRepository.save.mockResolvedValue({
        ...mockNotification,
        status: NotificationStatus.ACKNOWLEDGED,
        acknowledgedAt: new Date(),
      } as any);

      const result = await service.acknowledgeNotification('notification-1');

      expect(result.status).toBe(NotificationStatus.ACKNOWLEDGED);
      expect(notificationLogRepository.save).toHaveBeenCalled();
    });

    it('should throw error if notification not found', async () => {
      notificationLogRepository.findOne.mockResolvedValue(null);

      await expect(
        service.acknowledgeNotification('invalid-id'),
      ).rejects.toThrow('Notification invalid-id not found');
    });
  });

  describe('retryNotification', () => {
    it('should retry failed notification', async () => {
      const failedNotification = {
        ...mockNotification,
        status: NotificationStatus.FAILED,
        retryCount: 1,
        maxRetries: 3,
      };

      notificationLogRepository.findOne.mockResolvedValue(failedNotification as any);
      notificationLogRepository.save.mockResolvedValue({
        ...failedNotification,
        status: NotificationStatus.SENT,
        retryCount: 2,
      } as any);

      const result = await service.retryNotification('notification-1');

      expect(result).toBeDefined();
      expect(notificationLogRepository.save).toHaveBeenCalled();
    });

    it('should throw error if max retries exceeded', async () => {
      const maxRetriesNotification = {
        ...mockNotification,
        status: NotificationStatus.FAILED,
        retryCount: 3,
        maxRetries: 3,
      };

      notificationLogRepository.findOne.mockResolvedValue(
        maxRetriesNotification as any,
      );

      await expect(
        service.retryNotification('notification-1'),
      ).rejects.toThrow('Maximum retry attempts exceeded');
    });
  });
});
