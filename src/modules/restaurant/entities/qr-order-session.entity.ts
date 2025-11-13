import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { Table } from './table.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { TableQRCode } from './table-qr-code.entity';
import { RestaurantOrder } from './restaurant-order.entity';

export enum SessionStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  COMPLETED = 'COMPLETED',
  ABANDONED = 'ABANDONED',
}

export enum SessionAction {
  SCAN = 'SCAN',
  VIEW_MENU = 'VIEW_MENU',
  ADD_TO_CART = 'ADD_TO_CART',
  PLACE_ORDER = 'PLACE_ORDER',
  CALL_SERVER = 'CALL_SERVER',
  REQUEST_BILL = 'REQUEST_BILL',
  MAKE_PAYMENT = 'MAKE_PAYMENT',
}

@Entity('qr_order_sessions')
@Index(['branchId', 'status'])
@Index(['tableId', 'status'])
@Index(['sessionToken'], { unique: true })
@Index(['expiresAt'])
export class QROrderSession {
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

  @Column({ type: 'uuid', nullable: true })
  qrCodeId: string;

  @ManyToOne(() => TableQRCode, { nullable: true })
  @JoinColumn({ name: 'qrCodeId' })
  qrCode: TableQRCode;

  // Session Management
  @Column({ type: 'varchar', length: 500, unique: true })
  @Index()
  sessionToken: string; // Unique token for guest session

  @Column({
    type: 'enum',
    enum: SessionStatus,
    default: SessionStatus.ACTIVE,
  })
  @Index()
  status: SessionStatus;

  @Column({ type: 'timestamp' })
  @Index()
  expiresAt: Date; // Session expiration time

  // Guest Information (Optional)
  @Column({ type: 'varchar', length: 255, nullable: true })
  guestName: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  guestPhone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  guestEmail: string;

  @Column({ type: 'int', nullable: true })
  guestCount: number; // Number of guests at the table

  // Device Information
  @Column({ type: 'varchar', length: 500, nullable: true })
  deviceId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  userAgent: string;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress: string;

  // Session Activity Tracking
  @Column({ type: 'timestamp' })
  firstAccessAt: Date;

  @Column({ type: 'timestamp' })
  lastAccessAt: Date;

  @Column({ type: 'int', default: 0 })
  accessCount: number; // Number of times session was accessed

  // Action Tracking
  @Column({ type: 'jsonb', nullable: true })
  actions: Array<{
    action: SessionAction;
    timestamp: Date;
    details?: any;
  }>;

  // Shopping Cart (before order is placed)
  @Column({ type: 'jsonb', nullable: true })
  cart: {
    items: Array<{
      productId: string;
      productName: string;
      quantity: number;
      unitPrice: number;
      modifiers?: Array<{
        modifierId: string;
        modifierName: string;
        priceAdjustment: number;
      }>;
      specialInstructions?: string;
      subtotal: number;
    }>;
    subtotal: number;
    tax: number;
    total: number;
  };

  // Orders placed in this session
  @OneToMany(() => RestaurantOrder, (order) => order.qrSession)
  orders: RestaurantOrder[];

  @Column({ type: 'simple-array', nullable: true })
  orderIds: string[]; // Array of order IDs placed in this session

  // Service Requests
  @Column({ type: 'int', default: 0 })
  callServerCount: number;

  @Column({ type: 'timestamp', nullable: true })
  lastCallServerAt: Date;

  @Column({ type: 'boolean', default: false })
  billRequested: boolean;

  @Column({ type: 'timestamp', nullable: true })
  billRequestedAt: Date;

  // Payment Information
  @Column({ type: 'boolean', default: false })
  paymentCompleted: boolean;

  @Column({ type: 'timestamp', nullable: true })
  paymentCompletedAt: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  paymentMethod: string; // 'CASH', 'CARD', 'ONLINE', etc.

  // Metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    // Browser/Device info
    browser?: string;
    os?: string;
    deviceType?: 'mobile' | 'tablet' | 'desktop';

    // Location info
    latitude?: number;
    longitude?: number;

    // Preferences
    language?: string;
    preferredPaymentMethod?: string;

    // Marketing
    referralSource?: string;
    campaign?: string;

    // Ratings & Feedback
    rating?: number;
    feedback?: string;

    // Custom attributes
    [key: string]: any;
  };

  // Analytics
  @Column({ type: 'int', nullable: true })
  totalSpent: number; // Total amount spent in this session (in cents)

  @Column({ type: 'int', nullable: true })
  totalOrders: number; // Number of orders placed

  @Column({ type: 'int', nullable: true })
  sessionDuration: number; // Duration in seconds

  // Timestamps
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  abandonedAt: Date;
}
