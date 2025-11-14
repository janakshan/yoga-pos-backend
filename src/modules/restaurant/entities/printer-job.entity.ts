import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Branch } from '../../branches/entities/branch.entity';
import { RestaurantOrder } from './restaurant-order.entity';
import {
  PrintJobStatus,
  PrintJobPriority,
} from '../common/hardware.constants';

/**
 * PrinterJob Entity
 *
 * Tracks all print jobs in the queue system
 * Supports retry logic, job prioritization, and status tracking
 */
@Entity('printer_jobs')
@Index(['branchId', 'status', 'priority'])
@Index(['branchId', 'createdAt'])
@Index(['printerId', 'status'])
@Index(['orderId'])
export class PrinterJob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Branch, { nullable: false })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({ name: 'branch_id' })
  branchId: string;

  @ManyToOne(() => RestaurantOrder, { nullable: true })
  @JoinColumn({ name: 'order_id' })
  order: RestaurantOrder;

  @Column({ name: 'order_id', nullable: true })
  orderId: string;

  @Column({ type: 'varchar', length: 50, name: 'order_number', nullable: true })
  orderNumber: string;

  @Column({ type: 'uuid', name: 'printer_id' })
  printerId: string;

  @Column({ type: 'varchar', length: 100, name: 'printer_name' })
  printerName: string;

  @Column({
    type: 'enum',
    enum: PrintJobStatus,
    default: PrintJobStatus.PENDING,
  })
  status: PrintJobStatus;

  @Column({
    type: 'enum',
    enum: PrintJobPriority,
    default: PrintJobPriority.NORMAL,
  })
  priority: PrintJobPriority;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'int', default: 1 })
  copies: number;

  @Column({ type: 'int', default: 0, name: 'retry_count' })
  retryCount: number;

  @Column({ type: 'int', default: 3, name: 'max_retries' })
  maxRetries: number;

  @Column({ type: 'timestamp', nullable: true, name: 'started_at' })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'completed_at' })
  completedAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'failed_at' })
  failedAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'next_retry_at' })
  nextRetryAt: Date;

  @Column({ type: 'text', nullable: true, name: 'error_message' })
  errorMessage: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'error_code' })
  errorCode: string;

  @Column({ type: 'int', nullable: true, name: 'print_duration_ms' })
  printDurationMs: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    jobType?: 'order' | 'receipt' | 'report' | 'test';
    stationId?: string;
    stationName?: string;
    userId?: string;
    userName?: string;
    manualPrint?: boolean;
    reprintReason?: string;
    customSettings?: Record<string, any>;
    [key: string]: any;
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
