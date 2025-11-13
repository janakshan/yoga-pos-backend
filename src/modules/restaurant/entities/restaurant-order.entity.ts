import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Branch } from '../../branches/entities/branch.entity';
import { User } from '../../users/entities/user.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { Table } from './table.entity';
import { OrderItem } from './order-item.entity';
import {
  RestaurantOrderStatus,
  DiningType,
  OrderPriority,
  OrderPaymentStatus,
} from '../common/restaurant.constants';

@Entity('restaurant_orders')
@Index(['branchId', 'orderNumber'], { unique: true })
@Index(['branchId', 'status'])
@Index(['branchId', 'serviceType'])
@Index(['createdAt'])
export class RestaurantOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_number', unique: true })
  orderNumber: string;

  // Relations
  @ManyToOne(() => Branch, { nullable: false })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({ name: 'branch_id' })
  branchId: string;

  @ManyToOne(() => Table, { nullable: true })
  @JoinColumn({ name: 'table_id' })
  table: Table;

  @Column({ name: 'table_id', nullable: true })
  tableId: string;

  @ManyToOne(() => import('./qr-order-session.entity').QROrderSession, { nullable: true })
  @JoinColumn({ name: 'qr_session_id' })
  qrSession: any; // Will be QROrderSession type

  @Column({ name: 'qr_session_id', nullable: true })
  qrSessionId: string;

  @ManyToOne(() => Customer, { nullable: true })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ name: 'customer_id', nullable: true })
  customerId: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'server_id' })
  server: User;

  @Column({ name: 'server_id' })
  serverId: string;

  @OneToMany(() => OrderItem, (item) => item.order, {
    cascade: true,
    eager: true,
  })
  items: OrderItem[];

  // Order details
  @Column({
    type: 'enum',
    enum: DiningType,
    name: 'service_type',
  })
  serviceType: DiningType;

  @Column({
    type: 'enum',
    enum: RestaurantOrderStatus,
    default: RestaurantOrderStatus.PENDING,
  })
  status: RestaurantOrderStatus;

  @Column({
    type: 'enum',
    enum: OrderPriority,
    default: OrderPriority.NORMAL,
  })
  priority: OrderPriority;

  @Column({
    type: 'enum',
    enum: OrderPaymentStatus,
    name: 'payment_status',
    default: OrderPaymentStatus.UNPAID,
  })
  paymentStatus: OrderPaymentStatus;

  // Financial fields
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tax: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'amount_paid' })
  amountPaid: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'tip_amount' })
  tipAmount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'tip_percentage' })
  tipPercentage: number | null;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    name: 'tip_method',
    comment: 'How tip was calculated: percentage, fixed, custom, none'
  })
  tipMethod: 'percentage' | 'fixed' | 'custom' | 'none';

  // Additional fields
  @Column({ type: 'text', nullable: true, name: 'special_instructions' })
  specialInstructions: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'int', nullable: true, name: 'guest_count' })
  guestCount: number;

  @Column({ type: 'int', nullable: true, name: 'estimated_prep_time' })
  estimatedPrepTime: number; // in minutes

  @Column({ type: 'timestamp', nullable: true, name: 'confirmed_at' })
  confirmedAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'preparing_at' })
  preparingAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'ready_at' })
  readyAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'served_at' })
  servedAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'completed_at' })
  completedAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'cancelled_at' })
  cancelledAt: Date;

  @Column({ type: 'text', nullable: true, name: 'cancellation_reason' })
  cancellationReason: string;

  // Delivery-specific fields
  @Column({ type: 'text', nullable: true, name: 'delivery_address' })
  deliveryAddress: string;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'delivery_phone' })
  deliveryPhone: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'delivery_fee' })
  deliveryFee: number;

  @Column({ type: 'varchar', nullable: true, name: 'delivery_driver_id' })
  deliveryDriverId: string;

  // Metadata and audit
  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    deviceId?: string;
    ipAddress?: string;
    userAgent?: string;
    splitBillInfo?: {
      isSplit: boolean;
      splitCount?: number;
      splitMethod?: 'equal' | 'custom' | 'by_item';
    };
    loyaltyPointsUsed?: number;
    promoCode?: string;
    [key: string]: any;
  };

  @Column({ type: 'jsonb', nullable: true, name: 'audit_log' })
  auditLog: Array<{
    timestamp: Date;
    userId: string;
    userName: string;
    action: string;
    previousValue?: any;
    newValue?: any;
    notes?: string;
  }>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
