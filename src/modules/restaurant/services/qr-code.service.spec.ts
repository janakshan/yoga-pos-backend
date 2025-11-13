import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { QrCodeService } from './qr-code.service';
import { TableQRCode, QRCodeStatus, QRCodeType } from '../entities/table-qr-code.entity';
import { Table } from '../entities/table.entity';

describe('QrCodeService', () => {
  let service: QrCodeService;
  let qrCodeRepository: Repository<TableQRCode>;
  let tableRepository: Repository<Table>;
  let configService: ConfigService;

  const mockTable = {
    id: 'table-1',
    branchId: 'branch-1',
    tableNumber: 'T1',
    isActive: true,
  };

  const mockQRCode = {
    id: 'qr-1',
    branchId: 'branch-1',
    tableId: 'table-1',
    qrCode: 'unique-qr-code',
    deepLink: 'http://localhost:3000/qr/menu?code=unique-qr-code&table=table-1&branch=branch-1',
    qrCodeImage: 'data:image/png;base64,...',
    type: QRCodeType.FULL_SERVICE,
    status: QRCodeStatus.ACTIVE,
    scanCount: 0,
    isActive: true,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QrCodeService,
        {
          provide: getRepositoryToken(TableQRCode),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Table),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'APP_URL') return 'http://localhost:3000';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<QrCodeService>(QrCodeService);
    qrCodeRepository = module.get<Repository<TableQRCode>>(
      getRepositoryToken(TableQRCode),
    );
    tableRepository = module.get<Repository<Table>>(getRepositoryToken(Table));
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateQRCodeForTable', () => {
    it('should generate a new QR code for a table', async () => {
      jest.spyOn(tableRepository, 'findOne').mockResolvedValue(mockTable as any);
      jest.spyOn(qrCodeRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(qrCodeRepository, 'create').mockReturnValue(mockQRCode as any);
      jest.spyOn(qrCodeRepository, 'save').mockResolvedValue(mockQRCode as any);

      const result = await service.generateQRCodeForTable(
        'branch-1',
        'table-1',
        QRCodeType.FULL_SERVICE,
      );

      expect(result).toBeDefined();
      expect(tableRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'table-1', branchId: 'branch-1' },
      });
    });

    it('should throw NotFoundException if table does not exist', async () => {
      jest.spyOn(tableRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.generateQRCodeForTable('branch-1', 'invalid-table', QRCodeType.FULL_SERVICE),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update existing QR code if one already exists', async () => {
      jest.spyOn(tableRepository, 'findOne').mockResolvedValue(mockTable as any);
      jest.spyOn(qrCodeRepository, 'findOne').mockResolvedValue(mockQRCode as any);
      jest.spyOn(qrCodeRepository, 'save').mockResolvedValue(mockQRCode as any);

      const result = await service.generateQRCodeForTable(
        'branch-1',
        'table-1',
        QRCodeType.FULL_SERVICE,
      );

      expect(result).toBeDefined();
      expect(qrCodeRepository.save).toHaveBeenCalled();
    });
  });

  describe('getQRCode', () => {
    it('should return a QR code by ID', async () => {
      jest.spyOn(qrCodeRepository, 'findOne').mockResolvedValue(mockQRCode as any);

      const result = await service.getQRCode('qr-1');

      expect(result).toEqual(mockQRCode);
      expect(qrCodeRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'qr-1' },
        relations: ['table', 'branch'],
      });
    });

    it('should throw NotFoundException if QR code does not exist', async () => {
      jest.spyOn(qrCodeRepository, 'findOne').mockResolvedValue(null);

      await expect(service.getQRCode('invalid-qr')).rejects.toThrow(NotFoundException);
    });
  });

  describe('recordScan', () => {
    it('should increment scan count and update lastScannedAt', async () => {
      const qrCode = { ...mockQRCode, scanCount: 5 };
      jest.spyOn(qrCodeRepository, 'findOne').mockResolvedValue(qrCode as any);
      jest.spyOn(qrCodeRepository, 'save').mockResolvedValue({
        ...qrCode,
        scanCount: 6,
        lastScannedAt: new Date(),
      } as any);

      const result = await service.recordScan('qr-1');

      expect(result.scanCount).toBeGreaterThan(qrCode.scanCount);
      expect(result.lastScannedAt).toBeDefined();
    });
  });

  describe('updateStatus', () => {
    it('should update QR code status', async () => {
      jest.spyOn(qrCodeRepository, 'findOne').mockResolvedValue(mockQRCode as any);
      jest.spyOn(qrCodeRepository, 'save').mockResolvedValue({
        ...mockQRCode,
        status: QRCodeStatus.INACTIVE,
        isActive: false,
      } as any);

      const result = await service.updateStatus('qr-1', QRCodeStatus.INACTIVE);

      expect(result.status).toBe(QRCodeStatus.INACTIVE);
      expect(result.isActive).toBe(false);
    });
  });

  describe('getStatistics', () => {
    it('should return QR code statistics for a branch', async () => {
      const qrCodes = [
        { ...mockQRCode, scanCount: 10, status: QRCodeStatus.ACTIVE },
        { ...mockQRCode, id: 'qr-2', scanCount: 20, status: QRCodeStatus.ACTIVE },
        { ...mockQRCode, id: 'qr-3', scanCount: 5, status: QRCodeStatus.INACTIVE },
      ];

      jest.spyOn(qrCodeRepository, 'find').mockResolvedValue(qrCodes as any);

      const result = await service.getStatistics('branch-1');

      expect(result.totalQRCodes).toBe(3);
      expect(result.activeQRCodes).toBe(2);
      expect(result.inactiveQRCodes).toBe(1);
      expect(result.totalScans).toBe(35);
      expect(result.mostScannedQRCode).toBeDefined();
    });
  });
});
