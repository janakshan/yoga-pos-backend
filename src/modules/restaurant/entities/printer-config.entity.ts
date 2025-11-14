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
import {
  PrinterConnectionType,
  PrinterProtocol,
  PrinterStatus,
} from '../common/hardware.constants';

/**
 * PrinterConfig Entity
 *
 * Stores printer configurations for each branch
 * Supports network, USB, Bluetooth, and cloud printers
 */
@Entity('printer_configs')
@Index(['branchId', 'isActive'])
@Index(['branchId', 'name'])
export class PrinterConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Branch, { nullable: false })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({ name: 'branch_id' })
  branchId: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: PrinterConnectionType,
    name: 'connection_type',
  })
  connectionType: PrinterConnectionType;

  @Column({
    type: 'enum',
    enum: PrinterProtocol,
    default: PrinterProtocol.ESC_POS,
  })
  protocol: PrinterProtocol;

  @Column({ type: 'varchar', length: 45, nullable: true, name: 'ip_address' })
  ipAddress: string;

  @Column({ type: 'int', nullable: true })
  port: number;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'device_path' })
  devicePath: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'mac_address' })
  macAddress: string;

  @Column({
    type: 'enum',
    enum: PrinterStatus,
    default: PrinterStatus.UNKNOWN,
  })
  status: PrinterStatus;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_default' })
  isDefault: boolean;

  @Column({ type: 'int', default: 80, name: 'paper_width' })
  paperWidth: number;

  @Column({ type: 'int', default: 48, name: 'characters_per_line' })
  charactersPerLine: number;

  @Column({ type: 'varchar', length: 20, default: 'UTF-8' })
  encoding: string;

  @Column({ type: 'int', default: 5000 })
  timeout: number;

  @Column({ type: 'int', default: 3, name: 'reconnect_attempts' })
  reconnectAttempts: number;

  @Column({ type: 'int', default: 2000, name: 'reconnect_delay' })
  reconnectDelay: number;

  @Column({ type: 'boolean', default: true, name: 'supports_cutting' })
  supportsCutting: boolean;

  @Column({ type: 'boolean', default: false, name: 'supports_cash_drawer' })
  supportsCashDrawer: boolean;

  @Column({ type: 'boolean', default: false, name: 'supports_barcode' })
  supportsBarcode: boolean;

  @Column({ type: 'boolean', default: false, name: 'supports_qr_code' })
  supportsQRCode: boolean;

  @Column({ type: 'boolean', default: false, name: 'supports_logo' })
  supportsLogo: boolean;

  @Column({ type: 'int', default: 5, name: 'max_copies' })
  maxCopies: number;

  @Column({ type: 'timestamp', nullable: true, name: 'last_check_at' })
  lastCheckAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'last_print_at' })
  lastPrintAt: Date;

  @Column({ type: 'text', nullable: true, name: 'last_error' })
  lastError: string;

  @Column({ type: 'int', default: 0, name: 'total_jobs' })
  totalJobs: number;

  @Column({ type: 'int', default: 0, name: 'successful_jobs' })
  successfulJobs: number;

  @Column({ type: 'int', default: 0, name: 'failed_jobs' })
  failedJobs: number;

  @Column({ type: 'jsonb', nullable: true, name: 'cloud_config' })
  cloudConfig: {
    apiKey?: string;
    printerId?: string;
    provider?: 'printnode' | 'google_cloud_print' | 'custom';
    endpoint?: string;
  };

  @Column({ type: 'jsonb', nullable: true, name: 'station_mappings' })
  stationMappings: Array<{
    stationId: string;
    stationType: string;
    isPrimary: boolean;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    location?: string;
    serialNumber?: string;
    model?: string;
    manufacturer?: string;
    firmwareVersion?: string;
    customSettings?: Record<string, any>;
    [key: string]: any;
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
