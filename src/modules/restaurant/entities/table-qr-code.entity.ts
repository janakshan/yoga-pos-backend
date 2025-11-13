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
import { Table } from './table.entity';
import { Branch } from '../../branches/entities/branch.entity';

export enum QRCodeStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  EXPIRED = 'EXPIRED',
  DISABLED = 'DISABLED',
}

export enum QRCodeType {
  MENU_ONLY = 'MENU_ONLY', // View menu only
  ORDER_ENABLED = 'ORDER_ENABLED', // Can place orders
  FULL_SERVICE = 'FULL_SERVICE', // Orders + call server + request bill
}

@Entity('table_qr_codes')
@Index(['branchId', 'status'])
@Index(['branchId', 'tableId'], { unique: true })
export class TableQRCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  branchId: string;

  @ManyToOne(() => Branch)
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  tableId: string;

  @ManyToOne(() => Table, { nullable: true })
  @JoinColumn({ name: 'tableId' })
  table: Table;

  // QR Code Data
  @Column({ type: 'varchar', length: 500, unique: true })
  @Index()
  qrCode: string; // The actual QR code string (URL or unique identifier)

  @Column({ type: 'text', nullable: true })
  qrCodeImage: string; // Base64 encoded QR code image

  @Column({ type: 'varchar', length: 500 })
  deepLink: string; // Deep link URL for the QR code

  // Configuration
  @Column({
    type: 'enum',
    enum: QRCodeType,
    default: QRCodeType.FULL_SERVICE,
  })
  type: QRCodeType;

  @Column({
    type: 'enum',
    enum: QRCodeStatus,
    default: QRCodeStatus.ACTIVE,
  })
  @Index()
  status: QRCodeStatus;

  // Usage Statistics
  @Column({ type: 'int', default: 0 })
  scanCount: number;

  @Column({ type: 'timestamp', nullable: true })
  lastScannedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date; // Optional expiration date for temporary QR codes

  // Metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    // QR code styling
    foregroundColor?: string;
    backgroundColor?: string;
    logoUrl?: string;

    // Campaign tracking
    campaign?: string;
    source?: string;

    // Custom settings
    showTableNumber?: boolean;
    customMessage?: string;
    language?: string;

    // Analytics tags
    tags?: string[];

    // Custom attributes
    [key: string]: any;
  };

  // Security
  @Column({ type: 'varchar', length: 100, nullable: true })
  secretKey: string; // Optional secret key for QR code validation

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  // Timestamps
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
