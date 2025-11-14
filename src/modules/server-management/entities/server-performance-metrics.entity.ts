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
import { User } from '../../users/entities/user.entity';
import { Branch } from '../../branches/entities/branch.entity';

export enum MetricPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

@Entity('server_performance_metrics')
@Index(['serverId', 'periodType', 'periodStart'])
@Index(['branchId', 'periodType', 'periodStart'])
@Index(['periodType', 'periodStart', 'periodEnd'])
export class ServerPerformanceMetrics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'server_id' })
  server: User;

  @Column({ name: 'server_id' })
  serverId: string;

  @ManyToOne(() => Branch, { nullable: false })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({ name: 'branch_id' })
  branchId: string;

  @Column({
    type: 'enum',
    enum: MetricPeriod,
    name: 'period_type',
  })
  periodType: MetricPeriod;

  @Column({ type: 'date', name: 'period_start' })
  periodStart: Date;

  @Column({ type: 'date', name: 'period_end' })
  periodEnd: Date;

  // Order metrics
  @Column({ type: 'int', default: 0, name: 'total_orders' })
  totalOrders: number;

  @Column({ type: 'int', default: 0, name: 'completed_orders' })
  completedOrders: number;

  @Column({ type: 'int', default: 0, name: 'cancelled_orders' })
  cancelledOrders: number;

  @Column({ type: 'int', default: 0, name: 'tables_served' })
  tablesServed: number;

  @Column({ type: 'int', default: 0, name: 'guests_served' })
  guestsServed: number;

  // Financial metrics
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, name: 'total_sales' })
  totalSales: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'average_order_value' })
  averageOrderValue: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'total_tips' })
  totalTips: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'average_tip_amount' })
  averageTipAmount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0, name: 'average_tip_percentage' })
  averageTipPercentage: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'tips_from_pool' })
  tipsFromPool: number;

  // Time metrics
  @Column({ type: 'int', default: 0, name: 'total_hours_worked' })
  totalHoursWorked: number; // in minutes

  @Column({ type: 'int', default: 0, name: 'number_of_shifts' })
  numberOfShifts: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'average_shift_duration' })
  averageShiftDuration: number; // in hours

  @Column({ type: 'int', default: 0, name: 'overtime_minutes' })
  overtimeMinutes: number;

  @Column({ type: 'int', default: 0, name: 'late_clock_ins' })
  lateClockIns: number;

  // Service quality metrics
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'average_table_turn_time' })
  averageTableTurnTime: number; // in minutes

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'average_service_time' })
  averageServiceTime: number; // Time from order to serve (minutes)

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'customer_satisfaction_score' })
  customerSatisfactionScore: number; // 1-5 scale

  @Column({ type: 'int', default: 0, name: 'customer_complaints' })
  customerComplaints: number;

  @Column({ type: 'int', default: 0, name: 'customer_compliments' })
  customerCompliments: number;

  // Efficiency metrics
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'sales_per_hour' })
  salesPerHour: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'tips_per_hour' })
  tipsPerHour: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0, name: 'orders_per_hour' })
  ordersPerHour: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0, name: 'average_guests_per_table' })
  averageGuestsPerTable: number;

  // Upselling metrics
  @Column({ type: 'int', default: 0, name: 'upsell_count' })
  upsellCount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'upsell_revenue' })
  upsellRevenue: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0, name: 'addon_attachment_rate' })
  addonAttachmentRate: number; // Percentage

  // Detailed breakdown
  @Column({ type: 'jsonb', nullable: true })
  detailedMetrics: {
    ordersByDiningType?: {
      dineIn?: number;
      takeout?: number;
      delivery?: number;
    };
    salesByCategory?: Record<string, number>;
    peakHours?: {
      hour: number;
      orderCount: number;
      sales: number;
    }[];
    topItems?: {
      productId: string;
      productName: string;
      quantity: number;
      revenue: number;
    }[];
    [key: string]: any;
  };

  @Column({ type: 'jsonb', nullable: true })
  rankings: {
    salesRank?: number;
    tipsRank?: number;
    efficiencyRank?: number;
    satisfactionRank?: number;
    totalServersInPeriod?: number;
    [key: string]: any;
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
