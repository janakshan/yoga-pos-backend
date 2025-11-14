import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrinterJob } from '../entities/printer-job.entity';
import { PrinterConfig } from '../entities/printer-config.entity';
import {
  PrintJobStatus,
  PrintJobPriority,
  PRINT_JOB_RETRY_CONFIG,
  PRINT_QUEUE_LIMITS,
} from '../common/hardware.constants';
import { CreatePrintJobDto, FilterPrintJobsDto } from '../dto/hardware.dto';

/**
 * Printer Queue Service
 *
 * Manages the print job queue with retry logic and prioritization
 * Handles job lifecycle, automatic retries, and queue cleanup
 */
@Injectable()
export class PrinterQueueService {
  private readonly logger = new Logger(PrinterQueueService.name);

  constructor(
    @InjectRepository(PrinterJob)
    private readonly printerJobRepository: Repository<PrinterJob>,
    @InjectRepository(PrinterConfig)
    private readonly printerConfigRepository: Repository<PrinterConfig>,
  ) {}

  /**
   * Create a new print job
   */
  async createJob(
    branchId: string,
    printerId: string,
    orderNumber: string,
    content: string,
    options: {
      orderId?: string;
      copies?: number;
      priority?: PrintJobPriority;
      metadata?: Record<string, any>;
    } = {},
  ): Promise<PrinterJob> {
    const printer = await this.printerConfigRepository.findOne({
      where: { id: printerId, branchId },
    });

    if (!printer) {
      throw new NotFoundException(`Printer ${printerId} not found`);
    }

    const job = this.printerJobRepository.create({
      branchId,
      orderId: options.orderId,
      orderNumber,
      printerId,
      printerName: printer.name,
      content,
      copies: options.copies || 1,
      priority: options.priority || PrintJobPriority.NORMAL,
      status: PrintJobStatus.PENDING,
      metadata: options.metadata,
    });

    const savedJob = await this.printerJobRepository.save(job);
    this.logger.log(`Created print job ${savedJob.id} for order ${orderNumber}`);

    return savedJob;
  }

  /**
   * Get next job to process (respects priority)
   */
  async getNextJob(printerId: string): Promise<PrinterJob | null> {
    const now = new Date();

    // Get pending jobs or jobs ready for retry
    const job = await this.printerJobRepository.findOne({
      where: [
        {
          printerId,
          status: PrintJobStatus.PENDING,
        },
        {
          printerId,
          status: PrintJobStatus.RETRY,
          nextRetryAt: LessThan(now),
        },
      ],
      order: {
        priority: 'DESC', // URGENT > HIGH > NORMAL > LOW
        createdAt: 'ASC', // FIFO within same priority
      },
    });

    return job;
  }

  /**
   * Mark job as started
   */
  async markJobStarted(jobId: string): Promise<PrinterJob> {
    const job = await this.findJobById(jobId);

    job.status = PrintJobStatus.PRINTING;
    job.startedAt = new Date();

    return this.printerJobRepository.save(job);
  }

  /**
   * Mark job as completed
   */
  async markJobCompleted(jobId: string, printDurationMs?: number): Promise<PrinterJob> {
    const job = await this.findJobById(jobId);

    job.status = PrintJobStatus.COMPLETED;
    job.completedAt = new Date();
    job.printDurationMs = printDurationMs;

    // Update printer statistics
    await this.updatePrinterStatistics(job.printerId, true);

    return this.printerJobRepository.save(job);
  }

  /**
   * Mark job as failed and schedule retry if applicable
   */
  async markJobFailed(
    jobId: string,
    errorMessage: string,
    errorCode?: string,
  ): Promise<PrinterJob> {
    const job = await this.findJobById(jobId);

    job.retryCount++;
    job.errorMessage = errorMessage;
    job.errorCode = errorCode;
    job.failedAt = new Date();

    // Update printer statistics
    await this.updatePrinterStatistics(job.printerId, false);

    // Check if we should retry
    if (job.retryCount < job.maxRetries) {
      job.status = PrintJobStatus.RETRY;
      job.nextRetryAt = this.calculateNextRetryTime(job.retryCount);
      this.logger.log(
        `Print job ${jobId} failed, scheduling retry ${job.retryCount}/${job.maxRetries} at ${job.nextRetryAt}`,
      );
    } else {
      job.status = PrintJobStatus.FAILED;
      this.logger.error(
        `Print job ${jobId} permanently failed after ${job.retryCount} attempts: ${errorMessage}`,
      );
    }

    return this.printerJobRepository.save(job);
  }

  /**
   * Cancel a print job
   */
  async cancelJob(jobId: string, reason?: string): Promise<PrinterJob> {
    const job = await this.findJobById(jobId);

    if (job.status === PrintJobStatus.COMPLETED) {
      throw new Error('Cannot cancel a completed job');
    }

    job.status = PrintJobStatus.CANCELLED;
    if (reason) {
      job.metadata = { ...job.metadata, cancellationReason: reason };
    }

    this.logger.log(`Cancelled print job ${jobId}. Reason: ${reason || 'Not specified'}`);
    return this.printerJobRepository.save(job);
  }

  /**
   * Manually retry a failed job
   */
  async retryJob(jobId: string, force: boolean = false): Promise<PrinterJob> {
    const job = await this.findJobById(jobId);

    if (job.status !== PrintJobStatus.FAILED && !force) {
      throw new Error('Only failed jobs can be retried');
    }

    job.status = PrintJobStatus.PENDING;
    job.errorMessage = null;
    job.errorCode = null;
    job.nextRetryAt = null;

    if (force) {
      job.retryCount = 0;
    }

    this.logger.log(`Manually retrying print job ${jobId}`);
    return this.printerJobRepository.save(job);
  }

  /**
   * Get jobs with filtering
   */
  async findJobs(filter: FilterPrintJobsDto): Promise<{
    jobs: PrinterJob[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filter.branchId) where.branchId = filter.branchId;
    if (filter.printerId) where.printerId = filter.printerId;
    if (filter.orderId) where.orderId = filter.orderId;
    if (filter.status?.length) where.status = In(filter.status);
    if (filter.priority?.length) where.priority = In(filter.priority);

    const [jobs, total] = await this.printerJobRepository.findAndCount({
      where,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      jobs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get queue statistics
   */
  async getQueueStatistics(branchId: string): Promise<{
    totalJobs: number;
    pendingJobs: number;
    printingJobs: number;
    completedJobs: number;
    failedJobs: number;
    queuedJobs: number;
    retryJobs: number;
  }> {
    const stats = await this.printerJobRepository
      .createQueryBuilder('job')
      .select('job.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('job.branch_id = :branchId', { branchId })
      .groupBy('job.status')
      .getRawMany();

    const result = {
      totalJobs: 0,
      pendingJobs: 0,
      printingJobs: 0,
      completedJobs: 0,
      failedJobs: 0,
      queuedJobs: 0,
      retryJobs: 0,
    };

    stats.forEach((stat) => {
      const count = parseInt(stat.count);
      result.totalJobs += count;

      switch (stat.status) {
        case PrintJobStatus.PENDING:
          result.pendingJobs = count;
          break;
        case PrintJobStatus.QUEUED:
          result.queuedJobs = count;
          break;
        case PrintJobStatus.PRINTING:
          result.printingJobs = count;
          break;
        case PrintJobStatus.COMPLETED:
          result.completedJobs = count;
          break;
        case PrintJobStatus.FAILED:
          result.failedJobs = count;
          break;
        case PrintJobStatus.RETRY:
          result.retryJobs = count;
          break;
      }
    });

    return result;
  }

  /**
   * Cleanup old completed and cancelled jobs (runs every hour)
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupOldJobs(): Promise<void> {
    const cutoffDate = new Date(Date.now() - PRINT_QUEUE_LIMITS.maxJobAge);

    const result = await this.printerJobRepository
      .createQueryBuilder()
      .delete()
      .where('status IN (:...statuses)', {
        statuses: [PrintJobStatus.COMPLETED, PrintJobStatus.CANCELLED],
      })
      .andWhere('created_at < :cutoffDate', { cutoffDate })
      .execute();

    if (result.affected && result.affected > 0) {
      this.logger.log(`Cleaned up ${result.affected} old print jobs`);
    }
  }

  /**
   * Private helper: Find job by ID
   */
  private async findJobById(jobId: string): Promise<PrinterJob> {
    const job = await this.printerJobRepository.findOne({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException(`Print job ${jobId} not found`);
    }
    return job;
  }

  /**
   * Private helper: Calculate next retry time with exponential backoff
   */
  private calculateNextRetryTime(retryCount: number): Date {
    const delay =
      PRINT_JOB_RETRY_CONFIG.retryDelay *
      Math.pow(PRINT_JOB_RETRY_CONFIG.backoffMultiplier, retryCount - 1);

    return new Date(Date.now() + delay);
  }

  /**
   * Private helper: Update printer statistics
   */
  private async updatePrinterStatistics(
    printerId: string,
    success: boolean,
  ): Promise<void> {
    const printer = await this.printerConfigRepository.findOne({
      where: { id: printerId },
    });

    if (printer) {
      printer.totalJobs++;
      if (success) {
        printer.successfulJobs++;
      } else {
        printer.failedJobs++;
      }
      printer.lastPrintAt = new Date();

      await this.printerConfigRepository.save(printer);
    }
  }
}
