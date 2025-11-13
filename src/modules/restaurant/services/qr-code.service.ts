import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { TableQRCode, QRCodeStatus, QRCodeType } from '../entities/table-qr-code.entity';
import { Table } from '../entities/table.entity';
import { ConfigService } from '@nestjs/config';

export interface QRCodeOptions {
  width?: number;
  height?: number;
  margin?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  color?: {
    dark?: string;
    light?: string;
  };
}

@Injectable()
export class QrCodeService {
  constructor(
    @InjectRepository(TableQRCode)
    private readonly qrCodeRepository: Repository<TableQRCode>,
    @InjectRepository(Table)
    private readonly tableRepository: Repository<Table>,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Generate a QR code for a table
   */
  async generateQRCodeForTable(
    branchId: string,
    tableId: string,
    type: QRCodeType = QRCodeType.FULL_SERVICE,
    options?: QRCodeOptions,
  ): Promise<TableQRCode> {
    // Verify table exists
    const table = await this.tableRepository.findOne({
      where: { id: tableId, branchId },
    });

    if (!table) {
      throw new NotFoundException(`Table with ID ${tableId} not found in branch ${branchId}`);
    }

    // Check if QR code already exists for this table
    let qrCodeEntity = await this.qrCodeRepository.findOne({
      where: { branchId, tableId },
    });

    // Generate unique QR code identifier
    const qrCodeId = qrCodeEntity?.qrCode || uuidv4();

    // Generate deep link
    const baseUrl = this.configService.get<string>('APP_URL') || 'http://localhost:3000';
    const deepLink = `${baseUrl}/qr/menu?code=${qrCodeId}&table=${tableId}&branch=${branchId}`;

    // Generate QR code image
    const qrCodeImage = await this.generateQRCodeImage(deepLink, options);

    if (qrCodeEntity) {
      // Update existing QR code
      qrCodeEntity.deepLink = deepLink;
      qrCodeEntity.qrCodeImage = qrCodeImage;
      qrCodeEntity.type = type;
      qrCodeEntity.status = QRCodeStatus.ACTIVE;
      qrCodeEntity.isActive = true;
    } else {
      // Create new QR code
      qrCodeEntity = this.qrCodeRepository.create({
        branchId,
        tableId,
        qrCode: qrCodeId,
        deepLink,
        qrCodeImage,
        type,
        status: QRCodeStatus.ACTIVE,
        isActive: true,
        scanCount: 0,
      });
    }

    return await this.qrCodeRepository.save(qrCodeEntity);
  }

  /**
   * Generate QR codes for all tables in a branch
   */
  async generateQRCodesForBranch(
    branchId: string,
    type: QRCodeType = QRCodeType.FULL_SERVICE,
    options?: QRCodeOptions,
  ): Promise<TableQRCode[]> {
    const tables = await this.tableRepository.find({
      where: { branchId, isActive: true },
    });

    if (tables.length === 0) {
      throw new NotFoundException(`No active tables found in branch ${branchId}`);
    }

    const qrCodes: TableQRCode[] = [];

    for (const table of tables) {
      try {
        const qrCode = await this.generateQRCodeForTable(branchId, table.id, type, options);
        qrCodes.push(qrCode);
      } catch (error) {
        console.error(`Error generating QR code for table ${table.tableNumber}:`, error);
      }
    }

    return qrCodes;
  }

  /**
   * Generate QR code image as base64 string
   */
  async generateQRCodeImage(data: string, options?: QRCodeOptions): Promise<string> {
    try {
      const qrOptions = {
        width: options?.width || 300,
        margin: options?.margin || 2,
        errorCorrectionLevel: options?.errorCorrectionLevel || 'H',
        color: {
          dark: options?.color?.dark || '#000000',
          light: options?.color?.light || '#FFFFFF',
        },
      };

      // Generate as base64 data URL
      const qrCodeDataUrl = await QRCode.toDataURL(data, qrOptions);
      return qrCodeDataUrl;
    } catch (error) {
      throw new BadRequestException(`Failed to generate QR code: ${error.message}`);
    }
  }

  /**
   * Get QR code by ID
   */
  async getQRCode(id: string): Promise<TableQRCode> {
    const qrCode = await this.qrCodeRepository.findOne({
      where: { id },
      relations: ['table', 'branch'],
    });

    if (!qrCode) {
      throw new NotFoundException(`QR code with ID ${id} not found`);
    }

    return qrCode;
  }

  /**
   * Get QR code by table ID
   */
  async getQRCodeByTable(branchId: string, tableId: string): Promise<TableQRCode> {
    const qrCode = await this.qrCodeRepository.findOne({
      where: { branchId, tableId },
      relations: ['table', 'branch'],
    });

    if (!qrCode) {
      throw new NotFoundException(
        `QR code not found for table ${tableId} in branch ${branchId}`,
      );
    }

    return qrCode;
  }

  /**
   * Get QR code by code string
   */
  async getQRCodeByCode(qrCode: string): Promise<TableQRCode> {
    const qrCodeEntity = await this.qrCodeRepository.findOne({
      where: { qrCode },
      relations: ['table', 'branch'],
    });

    if (!qrCodeEntity) {
      throw new NotFoundException(`QR code ${qrCode} not found`);
    }

    return qrCodeEntity;
  }

  /**
   * Get all QR codes for a branch
   */
  async getQRCodesByBranch(branchId: string): Promise<TableQRCode[]> {
    return await this.qrCodeRepository.find({
      where: { branchId },
      relations: ['table'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Record a scan event
   */
  async recordScan(qrCodeId: string): Promise<TableQRCode> {
    const qrCode = await this.getQRCode(qrCodeId);

    qrCode.scanCount += 1;
    qrCode.lastScannedAt = new Date();

    return await this.qrCodeRepository.save(qrCode);
  }

  /**
   * Update QR code status
   */
  async updateStatus(qrCodeId: string, status: QRCodeStatus): Promise<TableQRCode> {
    const qrCode = await this.getQRCode(qrCodeId);
    qrCode.status = status;

    if (status === QRCodeStatus.INACTIVE || status === QRCodeStatus.DISABLED) {
      qrCode.isActive = false;
    } else {
      qrCode.isActive = true;
    }

    return await this.qrCodeRepository.save(qrCode);
  }

  /**
   * Deactivate QR code
   */
  async deactivateQRCode(qrCodeId: string): Promise<TableQRCode> {
    return await this.updateStatus(qrCodeId, QRCodeStatus.INACTIVE);
  }

  /**
   * Activate QR code
   */
  async activateQRCode(qrCodeId: string): Promise<TableQRCode> {
    return await this.updateStatus(qrCodeId, QRCodeStatus.ACTIVE);
  }

  /**
   * Delete QR code
   */
  async deleteQRCode(qrCodeId: string): Promise<void> {
    const qrCode = await this.getQRCode(qrCodeId);
    await this.qrCodeRepository.remove(qrCode);
  }

  /**
   * Regenerate QR code (new code string and image)
   */
  async regenerateQRCode(qrCodeId: string, options?: QRCodeOptions): Promise<TableQRCode> {
    const qrCode = await this.getQRCode(qrCodeId);

    // Generate new unique identifier
    const newQrCodeId = uuidv4();

    // Generate new deep link
    const baseUrl = this.configService.get<string>('APP_URL') || 'http://localhost:3000';
    const deepLink = `${baseUrl}/qr/menu?code=${newQrCodeId}&table=${qrCode.tableId}&branch=${qrCode.branchId}`;

    // Generate new QR code image
    const qrCodeImage = await this.generateQRCodeImage(deepLink, options);

    // Update entity
    qrCode.qrCode = newQrCodeId;
    qrCode.deepLink = deepLink;
    qrCode.qrCodeImage = qrCodeImage;
    qrCode.scanCount = 0;
    qrCode.lastScannedAt = null;

    return await this.qrCodeRepository.save(qrCode);
  }

  /**
   * Update QR code metadata
   */
  async updateMetadata(qrCodeId: string, metadata: any): Promise<TableQRCode> {
    const qrCode = await this.getQRCode(qrCodeId);
    qrCode.metadata = { ...qrCode.metadata, ...metadata };
    return await this.qrCodeRepository.save(qrCode);
  }

  /**
   * Get QR code statistics
   */
  async getStatistics(branchId: string): Promise<{
    totalQRCodes: number;
    activeQRCodes: number;
    inactiveQRCodes: number;
    totalScans: number;
    averageScansPerQRCode: number;
    mostScannedQRCode: TableQRCode | null;
  }> {
    const qrCodes = await this.getQRCodesByBranch(branchId);

    const totalQRCodes = qrCodes.length;
    const activeQRCodes = qrCodes.filter((qr) => qr.status === QRCodeStatus.ACTIVE).length;
    const inactiveQRCodes = totalQRCodes - activeQRCodes;
    const totalScans = qrCodes.reduce((sum, qr) => sum + qr.scanCount, 0);
    const averageScansPerQRCode = totalQRCodes > 0 ? totalScans / totalQRCodes : 0;

    // Find most scanned QR code
    const mostScannedQRCode =
      qrCodes.length > 0
        ? qrCodes.reduce((prev, current) => (prev.scanCount > current.scanCount ? prev : current))
        : null;

    return {
      totalQRCodes,
      activeQRCodes,
      inactiveQRCodes,
      totalScans,
      averageScansPerQRCode: Math.round(averageScansPerQRCode * 100) / 100,
      mostScannedQRCode,
    };
  }
}
