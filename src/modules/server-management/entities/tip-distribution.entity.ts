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
import { RestaurantOrder } from '../../restaurant/entities/restaurant-order.entity';
import { ServerShift } from './server-shift.entity';

export enum TipDistributionMethod {
  INDIVIDUAL = 'individual', // Server keeps all their tips
  POOLED_EQUAL = 'pooled_equal', // All tips split equally
  POOLED_WEIGHTED = 'pooled_weighted', // Split by hours worked or sales
  POOLED_POINTS = 'pooled_points', // Point-based system
  HYBRID = 'hybrid', // Combination of methods
}

export enum TipDistributionStatus {
  PENDING = 'pending',
  CALCULATED = 'calculated',
  DISTRIBUTED = 'distributed',
  DISPUTED = 'disputed',
  FINALIZED = 'finalized',
}

@Entity('tip_distributions')
@Index(['branchId', 'distributionDate'])
@Index(['serverId', 'distributionDate'])
@Index(['shiftId'])
@Index(['status', 'distributionDate'])
export class TipDistribution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Branch, { nullable: false })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({ name: 'branch_id' })
  branchId: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'server_id' })
  server: User;

  @Column({ name: 'server_id' })
  serverId: string;

  @ManyToOne(() => ServerShift, { nullable: true })
  @JoinColumn({ name: 'shift_id' })
  shift: ServerShift;

  @Column({ name: 'shift_id', nullable: true })
  shiftId: string;

  @ManyToOne(() => RestaurantOrder, { nullable: true })
  @JoinColumn({ name: 'order_id' })
  order: RestaurantOrder;

  @Column({ name: 'order_id', nullable: true })
  orderId: string;

  @Column({ type: 'date', name: 'distribution_date' })
  distributionDate: Date;

  @Column({
    type: 'enum',
    enum: TipDistributionMethod,
    name: 'distribution_method',
  })
  distributionMethod: TipDistributionMethod;

  @Column({
    type: 'enum',
    enum: TipDistributionStatus,
    default: TipDistributionStatus.PENDING,
  })
  status: TipDistributionStatus;

  // Tip amounts
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'original_tip_amount' })
  originalTipAmount: number; // Tip from the order

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'pooled_tip_contribution' })
  pooledTipContribution: number; // Amount contributed to pool

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'pooled_tip_received' })
  pooledTipReceived: number; // Amount received from pool

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'final_tip_amount' })
  finalTipAmount: number; // Final amount server receives

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'tip_out_amount' })
  tipOutAmount: number; // Amount tipped out to support staff (busser, host, etc.)

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'house_fee' })
  houseFee: number; // Optional house fee deduction

  // Calculation details
  @Column({ type: 'jsonb', nullable: true, name: 'calculation_details' })
  calculationDetails: {
    hoursWorked?: number;
    salesAmount?: number;
    orderCount?: number;
    poolPoints?: number;
    weightingFactor?: number;
    totalPoolAmount?: number;
    numberOfParticipants?: number;
    percentageShare?: number;
    [key: string]: any;
  };

  // Tip-out breakdown
  @Column({ type: 'jsonb', nullable: true, name: 'tip_out_breakdown' })
  tipOutBreakdown: Array<{
    recipientId: string;
    recipientName: string;
    role: string;
    amount: number;
    percentage?: number;
    calculationMethod?: string;
  }>;

  // Pool details
  @Column({ type: 'varchar', length: 100, nullable: true, name: 'pool_id' })
  poolId: string; // Identifier for the tip pool this belongs to

  @Column({ type: 'jsonb', nullable: true, name: 'pool_metadata' })
  poolMetadata: {
    poolName?: string;
    poolPeriod?: string;
    totalPoolAmount?: number;
    participantCount?: number;
    distributionFormula?: string;
    [key: string]: any;
  };

  // Adjustments
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'manual_adjustment' })
  manualAdjustment: number;

  @Column({ type: 'text', nullable: true, name: 'adjustment_reason' })
  adjustmentReason: string;

  @Column({ type: 'varchar', nullable: true, name: 'adjusted_by' })
  adjustedBy: string; // User ID who made adjustment

  // Dispute tracking
  @Column({ type: 'boolean', default: false, name: 'is_disputed' })
  isDisputed: boolean;

  @Column({ type: 'text', nullable: true, name: 'dispute_reason' })
  disputeReason: string;

  @Column({ type: 'timestamp', nullable: true, name: 'dispute_filed_at' })
  disputeFiledAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'dispute_resolved_at' })
  disputeResolvedAt: Date;

  // Payment tracking
  @Column({ type: 'timestamp', nullable: true, name: 'paid_at' })
  paidAt: Date;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'payment_method' })
  paymentMethod: string; // cash, check, direct_deposit, etc.

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'payment_reference' })
  paymentReference: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
