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
  NotificationDeviceType,
  NotificationStatus,
} from '../common/hardware.constants';

/**
 * NotificationLog Entity
 *
 * Tracks notifications sent to pagers, buzzers, and other devices
 * Used for customer pickup notifications and staff alerts
 */
@Entity('notification_logs')
@Index(['branchId', 'createdAt'])
@Index(['branchId', 'status'])
@Index(['orderId'])
@Index(['deviceId', 'status'])
export class NotificationLog {
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

  @Column({ type: 'varchar', length: 100, name: 'device_id' })
  deviceId: string;

  @Column({ type: 'varchar', length: 100, name: 'device_name', nullable: true })
  deviceName: string;

  @Column({
    type: 'enum',
    enum: NotificationDeviceType,
    name: 'device_type',
  })
  deviceType: NotificationDeviceType;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.PENDING,
  })
  status: NotificationStatus;

  @Column({ type: 'varchar', length: 255 })
  message: string;

  @Column({ type: 'int', default: 0, name: 'retry_count' })
  retryCount: number;

  @Column({ type: 'int', default: 3, name: 'max_retries' })
  maxRetries: number;

  @Column({ type: 'timestamp', nullable: true, name: 'sent_at' })
  sentAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'delivered_at' })
  deliveredAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'acknowledged_at' })
  acknowledgedAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'expired_at' })
  expiredAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'expires_at' })
  expiresAt: Date;

  @Column({ type: 'text', nullable: true, name: 'error_message' })
  errorMessage: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'error_code' })
  errorCode: string;

  @Column({ type: 'jsonb', nullable: true, name: 'device_settings' })
  deviceSettings: {
    vibrationPattern?: number[];
    lightColor?: string;
    soundPattern?: string;
    duration?: number;
  };

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    notificationType?: 'order_ready' | 'table_ready' | 'staff_alert' | 'custom';
    customerId?: string;
    customerName?: string;
    tableNumber?: string;
    priority?: string;
    sentBy?: string;
    [key: string]: any;
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
