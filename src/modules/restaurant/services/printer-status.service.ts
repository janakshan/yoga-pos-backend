import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrinterConfig } from '../entities/printer-config.entity';
import {
  PrinterStatus,
  PrinterConnectionType,
  HARDWARE_MONITORING,
  HardwareErrorCode,
} from '../common/hardware.constants';

/**
 * Printer Status Service
 *
 * Monitors printer health, connectivity, and status
 * Provides real-time status updates and health checks
 */
@Injectable()
export class PrinterStatusService {
  private readonly logger = new Logger(PrinterStatusService.name);

  constructor(
    @InjectRepository(PrinterConfig)
    private readonly printerConfigRepository: Repository<PrinterConfig>,
  ) {}

  /**
   * Check printer health and update status
   */
  async checkPrinterHealth(printerId: string): Promise<{
    printerId: string;
    status: PrinterStatus;
    online: boolean;
    lastCheck: Date;
    errorMessage?: string;
  }> {
    const printer = await this.printerConfigRepository.findOne({
      where: { id: printerId },
    });

    if (!printer) {
      return {
        printerId,
        status: PrinterStatus.UNKNOWN,
        online: false,
        lastCheck: new Date(),
        errorMessage: 'Printer not found',
      };
    }

    try {
      const status = await this.performHealthCheck(printer);

      // Update printer record
      printer.status = status.status;
      printer.lastCheckAt = new Date();
      if (status.errorMessage) {
        printer.lastError = status.errorMessage;
      }

      await this.printerConfigRepository.save(printer);

      return {
        printerId: printer.id,
        status: status.status,
        online: status.online,
        lastCheck: printer.lastCheckAt,
        errorMessage: status.errorMessage,
      };
    } catch (error) {
      this.logger.error(
        `Health check failed for printer ${printerId}: ${error.message}`,
        error.stack,
      );

      printer.status = PrinterStatus.ERROR;
      printer.lastCheckAt = new Date();
      printer.lastError = error.message;
      await this.printerConfigRepository.save(printer);

      return {
        printerId: printer.id,
        status: PrinterStatus.ERROR,
        online: false,
        lastCheck: printer.lastCheckAt,
        errorMessage: error.message,
      };
    }
  }

  /**
   * Get printer statistics
   */
  async getPrinterStatistics(printerId: string): Promise<{
    printerId: string;
    printerName: string;
    totalJobs: number;
    successfulJobs: number;
    failedJobs: number;
    successRate: number;
    lastPrintAt: Date | null;
    status: PrinterStatus;
    uptime: number;
  }> {
    const printer = await this.printerConfigRepository.findOne({
      where: { id: printerId },
    });

    if (!printer) {
      throw new Error(`Printer ${printerId} not found`);
    }

    const successRate =
      printer.totalJobs > 0
        ? (printer.successfulJobs / printer.totalJobs) * 100
        : 0;

    // Calculate uptime based on status checks
    const uptime = this.calculateUptime(printer);

    return {
      printerId: printer.id,
      printerName: printer.name,
      totalJobs: printer.totalJobs,
      successfulJobs: printer.successfulJobs,
      failedJobs: printer.failedJobs,
      successRate: Math.round(successRate * 100) / 100,
      lastPrintAt: printer.lastPrintAt,
      status: printer.status,
      uptime,
    };
  }

  /**
   * Get health status for all printers in a branch
   */
  async getBranchPrintersHealth(branchId: string): Promise<{
    overallStatus: 'healthy' | 'degraded' | 'critical';
    printers: Array<{
      id: string;
      name: string;
      status: PrinterStatus;
      online: boolean;
      lastCheck: Date;
      errorMessage?: string;
    }>;
    issues: string[];
  }> {
    const printers = await this.printerConfigRepository.find({
      where: { branchId },
    });

    const results = await Promise.all(
      printers.map((p) => this.checkPrinterHealth(p.id)),
    );

    const onlineCount = results.filter((r) => r.online).length;
    const totalCount = results.length;
    const issues: string[] = [];

    // Determine overall status
    let overallStatus: 'healthy' | 'degraded' | 'critical';
    if (totalCount === 0) {
      overallStatus = 'critical';
      issues.push('No printers configured');
    } else if (onlineCount === 0) {
      overallStatus = 'critical';
      issues.push('All printers are offline');
    } else if (onlineCount < totalCount * 0.5) {
      overallStatus = 'degraded';
      issues.push(`Only ${onlineCount}/${totalCount} printers are online`);
    } else if (onlineCount < totalCount) {
      overallStatus = 'degraded';
      issues.push(`${totalCount - onlineCount} printer(s) offline`);
    } else {
      overallStatus = 'healthy';
    }

    return {
      overallStatus,
      printers: results.map((r) => ({
        id: r.printerId,
        name: printers.find((p) => p.id === r.printerId)?.name || 'Unknown',
        status: r.status,
        online: r.online,
        lastCheck: r.lastCheck,
        errorMessage: r.errorMessage,
      })),
      issues,
    };
  }

  /**
   * Test printer connectivity
   */
  async testPrinter(printerId: string): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    const printer = await this.printerConfigRepository.findOne({
      where: { id: printerId },
    });

    if (!printer) {
      return {
        success: false,
        message: 'Printer not found',
      };
    }

    if (!printer.isActive) {
      return {
        success: false,
        message: 'Printer is disabled',
      };
    }

    try {
      const testResult = await this.performTestPrint(printer);
      return testResult;
    } catch (error) {
      return {
        success: false,
        message: `Test failed: ${error.message}`,
      };
    }
  }

  /**
   * Periodic health check for all printers (runs every minute)
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async periodicHealthCheck(): Promise<void> {
    const printers = await this.printerConfigRepository.find({
      where: { isActive: true },
    });

    this.logger.debug(`Running periodic health check for ${printers.length} printers`);

    for (const printer of printers) {
      try {
        await this.checkPrinterHealth(printer.id);
      } catch (error) {
        this.logger.error(
          `Periodic health check failed for printer ${printer.id}: ${error.message}`,
        );
      }
    }
  }

  /**
   * Private: Perform actual health check based on connection type
   */
  private async performHealthCheck(printer: PrinterConfig): Promise<{
    status: PrinterStatus;
    online: boolean;
    errorMessage?: string;
  }> {
    // This is a stub implementation. In production, you would:
    // 1. For network printers: Try to connect to IP:port
    // 2. For USB printers: Check device availability
    // 3. For Bluetooth printers: Check Bluetooth connection
    // 4. For cloud printers: Call cloud API

    switch (printer.connectionType) {
      case PrinterConnectionType.NETWORK:
        return this.checkNetworkPrinter(printer);
      case PrinterConnectionType.USB:
        return this.checkUSBPrinter(printer);
      case PrinterConnectionType.BLUETOOTH:
        return this.checkBluetoothPrinter(printer);
      case PrinterConnectionType.CLOUD:
        return this.checkCloudPrinter(printer);
      default:
        return {
          status: PrinterStatus.UNKNOWN,
          online: false,
          errorMessage: 'Unknown connection type',
        };
    }
  }

  /**
   * Private: Check network printer
   */
  private async checkNetworkPrinter(printer: PrinterConfig): Promise<{
    status: PrinterStatus;
    online: boolean;
    errorMessage?: string;
  }> {
    // TODO: Implement actual network check using net.Socket or similar
    // For now, return mock status
    if (!printer.ipAddress || !printer.port) {
      return {
        status: PrinterStatus.ERROR,
        online: false,
        errorMessage: 'Invalid network configuration',
      };
    }

    // Simulate network check
    this.logger.debug(
      `Checking network printer ${printer.name} at ${printer.ipAddress}:${printer.port}`,
    );

    return {
      status: PrinterStatus.ONLINE,
      online: true,
    };
  }

  /**
   * Private: Check USB printer
   */
  private async checkUSBPrinter(printer: PrinterConfig): Promise<{
    status: PrinterStatus;
    online: boolean;
    errorMessage?: string;
  }> {
    // TODO: Implement actual USB device check
    if (!printer.devicePath) {
      return {
        status: PrinterStatus.ERROR,
        online: false,
        errorMessage: 'Invalid USB configuration',
      };
    }

    this.logger.debug(`Checking USB printer ${printer.name} at ${printer.devicePath}`);

    return {
      status: PrinterStatus.ONLINE,
      online: true,
    };
  }

  /**
   * Private: Check Bluetooth printer
   */
  private async checkBluetoothPrinter(printer: PrinterConfig): Promise<{
    status: PrinterStatus;
    online: boolean;
    errorMessage?: string;
  }> {
    // TODO: Implement actual Bluetooth check
    if (!printer.macAddress) {
      return {
        status: PrinterStatus.ERROR,
        online: false,
        errorMessage: 'Invalid Bluetooth configuration',
      };
    }

    this.logger.debug(
      `Checking Bluetooth printer ${printer.name} at ${printer.macAddress}`,
    );

    return {
      status: PrinterStatus.ONLINE,
      online: true,
    };
  }

  /**
   * Private: Check cloud printer
   */
  private async checkCloudPrinter(printer: PrinterConfig): Promise<{
    status: PrinterStatus;
    online: boolean;
    errorMessage?: string;
  }> {
    // TODO: Implement cloud API check
    if (!printer.cloudConfig?.apiKey || !printer.cloudConfig?.printerId) {
      return {
        status: PrinterStatus.ERROR,
        online: false,
        errorMessage: 'Invalid cloud configuration',
      };
    }

    this.logger.debug(
      `Checking cloud printer ${printer.name} (${printer.cloudConfig.provider})`,
    );

    return {
      status: PrinterStatus.ONLINE,
      online: true,
    };
  }

  /**
   * Private: Perform test print
   */
  private async performTestPrint(printer: PrinterConfig): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    // TODO: Implement actual test print
    this.logger.log(`Sending test print to ${printer.name}`);

    // Simulate test print
    return {
      success: true,
      message: 'Test print sent successfully',
      details: {
        printerId: printer.id,
        printerName: printer.name,
        timestamp: new Date(),
      },
    };
  }

  /**
   * Private: Calculate printer uptime percentage
   */
  private calculateUptime(printer: PrinterConfig): number {
    // Simple uptime calculation based on current status
    // In production, you would track historical status data
    if (printer.status === PrinterStatus.ONLINE) {
      return 100;
    } else if (printer.status === PrinterStatus.OFFLINE) {
      return 0;
    } else {
      return 50; // Degraded state
    }
  }
}
