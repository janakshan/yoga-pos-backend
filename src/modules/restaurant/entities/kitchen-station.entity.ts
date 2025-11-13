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
import { KitchenStation as KitchenStationType } from '../common/restaurant.constants';

/**
 * KitchenStation Entity
 *
 * Configures kitchen stations for KDS (Kitchen Display System)
 * Each station can have its own settings for display, alerts, and routing
 */
@Entity('kitchen_stations')
@Index(['branchId', 'stationType'])
@Index(['branchId', 'isActive'])
export class KitchenStation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Branch, { nullable: false })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({ name: 'branch_id' })
  branchId: string;

  @Column({
    type: 'enum',
    enum: KitchenStationType,
    name: 'station_type',
  })
  stationType: KitchenStationType;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  // Display settings
  @Column({ type: 'int', default: 1, name: 'display_order' })
  displayOrder: number;

  @Column({ type: 'varchar', length: 7, nullable: true })
  color: string; // Hex color code for UI

  // Timing settings
  @Column({ type: 'int', default: 15, name: 'default_prep_time' })
  defaultPrepTime: number; // in minutes

  @Column({ type: 'int', default: 10, name: 'warning_threshold' })
  warningThreshold: number; // minutes before order becomes overdue

  @Column({ type: 'int', default: 5, name: 'critical_threshold' })
  criticalThreshold: number; // minutes after order becomes overdue

  // Alert settings
  @Column({ type: 'boolean', default: true, name: 'sound_alerts_enabled' })
  soundAlertsEnabled: boolean;

  @Column({ type: 'boolean', default: true, name: 'visual_alerts_enabled' })
  visualAlertsEnabled: boolean;

  @Column({ type: 'varchar', nullable: true, name: 'alert_sound_url' })
  alertSoundUrl: string;

  // Printer settings
  @Column({ type: 'boolean', default: false, name: 'auto_print_enabled' })
  autoPrintEnabled: boolean;

  @Column({ type: 'varchar', nullable: true, name: 'printer_name' })
  printerName: string;

  @Column({ type: 'varchar', nullable: true, name: 'printer_ip' })
  printerIp: string;

  @Column({ type: 'int', nullable: true, name: 'printer_port' })
  printerPort: number;

  // Performance settings
  @Column({ type: 'int', default: 20, name: 'target_completion_time' })
  targetCompletionTime: number; // Target time in minutes for performance metrics

  @Column({ type: 'boolean', default: true, name: 'track_performance' })
  trackPerformance: boolean;

  // Capacity settings
  @Column({ type: 'int', nullable: true, name: 'max_concurrent_orders' })
  maxConcurrentOrders: number;

  @Column({ type: 'int', nullable: true, name: 'max_items_per_order' })
  maxItemsPerOrder: number;

  // Course sequencing
  @Column({ type: 'boolean', default: false, name: 'enable_course_sequencing' })
  enableCourseSequencing: boolean;

  @Column({
    type: 'jsonb',
    nullable: true,
    name: 'course_delays',
  })
  courseDelays: {
    appetizer?: number; // delay in minutes
    main_course?: number;
    dessert?: number;
    beverage?: number;
  };

  // Staff assignment
  @Column({ type: 'jsonb', nullable: true, name: 'assigned_staff' })
  assignedStaff: Array<{
    userId: string;
    userName: string;
    role: string;
  }>;

  // Integration settings
  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    integrations?: {
      pos?: boolean;
      inventory?: boolean;
      analytics?: boolean;
    };
    customSettings?: Record<string, any>;
    [key: string]: any;
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
