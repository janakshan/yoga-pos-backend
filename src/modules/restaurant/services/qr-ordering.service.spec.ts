import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { QrOrderingService } from './qr-ordering.service';
import { QROrderSession, SessionStatus, SessionAction } from '../entities/qr-order-session.entity';
import { Table } from '../entities/table.entity';
import { QrCodeService } from './qr-code.service';

describe('QrOrderingService', () => {
  let service: QrOrderingService;
  let sessionRepository: Repository<QROrderSession>;
  let qrCodeService: QrCodeService;

  const mockQRCode = {
    id: 'qr-1',
    branchId: 'branch-1',
    tableId: 'table-1',
    qrCode: 'unique-qr-code',
    status: 'ACTIVE',
  };

  const mockSession = {
    id: 'session-1',
    branchId: 'branch-1',
    tableId: 'table-1',
    qrCodeId: 'qr-1',
    sessionToken: 'test-token-123',
    status: SessionStatus.ACTIVE,
    expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
    firstAccessAt: new Date(),
    lastAccessAt: new Date(),
    accessCount: 1,
    actions: [],
    callServerCount: 0,
    billRequested: false,
    paymentCompleted: false,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QrOrderingService,
        {
          provide: getRepositoryToken(QROrderSession),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              update: jest.fn().mockReturnThis(),
              set: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              execute: jest.fn().mockResolvedValue({ affected: 1 }),
              getMany: jest.fn().mockResolvedValue([]),
            })),
          },
        },
        {
          provide: getRepositoryToken(Table),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: QrCodeService,
          useValue: {
            getQRCodeByCode: jest.fn(),
            recordScan: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'QR_SESSION_DURATION_HOURS') return 4;
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<QrOrderingService>(QrOrderingService);
    sessionRepository = module.get<Repository<QROrderSession>>(
      getRepositoryToken(QROrderSession),
    );
    qrCodeService = module.get<QrCodeService>(QrCodeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSession', () => {
    it('should create a new session when scanning a valid QR code', async () => {
      jest.spyOn(qrCodeService, 'getQRCodeByCode').mockResolvedValue(mockQRCode as any);
      jest.spyOn(qrCodeService, 'recordScan').mockResolvedValue(mockQRCode as any);
      jest.spyOn(sessionRepository, 'create').mockReturnValue(mockSession as any);
      jest.spyOn(sessionRepository, 'save').mockResolvedValue(mockSession as any);

      const result = await service.createSession('unique-qr-code', {
        deviceId: 'device-1',
        userAgent: 'Mozilla/5.0',
        ipAddress: '127.0.0.1',
      });

      expect(result).toBeDefined();
      expect(result.sessionToken).toBeDefined();
      expect(result.status).toBe(SessionStatus.ACTIVE);
      expect(qrCodeService.recordScan).toHaveBeenCalled();
    });

    it('should throw error if QR code is not active', async () => {
      jest.spyOn(qrCodeService, 'getQRCodeByCode').mockResolvedValue({
        ...mockQRCode,
        status: 'INACTIVE',
      } as any);

      await expect(service.createSession('unique-qr-code')).rejects.toThrow(
        'QR code is not active',
      );
    });
  });

  describe('getSessionByToken', () => {
    it('should return session and update access info', async () => {
      jest.spyOn(sessionRepository, 'findOne').mockResolvedValue(mockSession as any);
      jest.spyOn(sessionRepository, 'save').mockResolvedValue({
        ...mockSession,
        accessCount: 2,
      } as any);

      const result = await service.getSessionByToken('test-token-123');

      expect(result).toBeDefined();
      expect(sessionRepository.save).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if session does not exist', async () => {
      jest.spyOn(sessionRepository, 'findOne').mockResolvedValue(null);

      await expect(service.getSessionByToken('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if session is expired', async () => {
      const expiredSession = {
        ...mockSession,
        expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
      };
      jest.spyOn(sessionRepository, 'findOne').mockResolvedValue(expiredSession as any);
      jest.spyOn(sessionRepository, 'save').mockResolvedValue(expiredSession as any);

      await expect(service.getSessionByToken('test-token-123')).rejects.toThrow(
        'Session has expired',
      );
    });
  });

  describe('callServer', () => {
    it('should increment call server count', async () => {
      jest.spyOn(sessionRepository, 'findOne').mockResolvedValue(mockSession as any);
      jest.spyOn(sessionRepository, 'save').mockResolvedValue({
        ...mockSession,
        callServerCount: 1,
        lastCallServerAt: new Date(),
      } as any);

      const result = await service.callServer('test-token-123', 'Need water');

      expect(result.callServerCount).toBe(1);
      expect(result.lastCallServerAt).toBeDefined();
    });
  });

  describe('requestBill', () => {
    it('should mark bill as requested', async () => {
      jest.spyOn(sessionRepository, 'findOne').mockResolvedValue(mockSession as any);
      jest.spyOn(sessionRepository, 'save').mockResolvedValue({
        ...mockSession,
        billRequested: true,
        billRequestedAt: new Date(),
      } as any);

      const result = await service.requestBill('test-token-123');

      expect(result.billRequested).toBe(true);
      expect(result.billRequestedAt).toBeDefined();
    });
  });

  describe('recordPayment', () => {
    it('should record payment and mark as completed', async () => {
      jest.spyOn(sessionRepository, 'findOne').mockResolvedValue(mockSession as any);
      jest.spyOn(sessionRepository, 'save').mockResolvedValue({
        ...mockSession,
        paymentCompleted: true,
        paymentCompletedAt: new Date(),
        paymentMethod: 'CARD',
        totalSpent: 5000,
      } as any);

      const result = await service.recordPayment('test-token-123', 'CARD', 5000);

      expect(result.paymentCompleted).toBe(true);
      expect(result.paymentMethod).toBe('CARD');
      expect(result.totalSpent).toBe(5000);
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('should clean up expired sessions', async () => {
      const result = await service.cleanupExpiredSessions();
      expect(result).toBe(1);
    });
  });
});
