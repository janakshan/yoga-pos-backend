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

export enum ShiftStatus {
  SCHEDULED = 'scheduled',
  CLOCKED_IN = 'clocked_in',
  ON_BREAK = 'on_break',
  CLOCKED_OUT = 'clocked_out',
  MISSED = 'missed',
  CANCELLED = 'cancelled',
}

export enum ShiftType {
  MORNING = 'morning',
  AFTERNOON = 'afternoon',
  EVENING = 'evening',
  NIGHT = 'night',
  DOUBLE = 'double',
  SPLIT = 'split',
}

@Entity('server_shifts')
@Index(['serverId', 'shiftDate'])
@Index(['branchId', 'shiftDate', 'status'])
@Index(['status', 'shiftDate'])
export class ServerShift {
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

  @Column({ type: 'date', name: 'shift_date' })
  shiftDate: Date;

  @Column({
    type: 'enum',
    enum: ShiftType,
    name: 'shift_type',
  })
  shiftType: ShiftType;

  @Column({
    type: 'enum',
    enum: ShiftStatus,
    default: ShiftStatus.SCHEDULED,
  })
  status: ShiftStatus;

  // Scheduled times
  @Column({ type: 'timestamp', name: 'scheduled_start' })
  scheduledStart: Date;

  @Column({ type: 'timestamp', name: 'scheduled_end' })
  scheduledEnd: Date;

  // Actual times
  @Column({ type: 'timestamp', nullable: true, name: 'actual_clock_in' })
  actualClockIn: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'actual_clock_out' })
  actualClockOut: Date;

  // Break tracking
  @Column({ type: 'jsonb', nullable: true })
  breaks: Array<{
    startTime: Date;
    endTime: Date;
    duration: number; // in minutes
    type: 'meal' | 'rest' | 'other';
    notes?: string;
  }>;

  @Column({ type: 'int', default: 0, name: 'total_break_minutes' })
  totalBreakMinutes: number;

  // Calculated fields
  @Column({ type: 'int', nullable: true, name: 'scheduled_duration_minutes' })
  scheduledDurationMinutes: number;

  @Column({ type: 'int', nullable: true, name: 'actual_duration_minutes' })
  actualDurationMinutes: number;

  @Column({ type: 'int', nullable: true, name: 'overtime_minutes' })
  overtimeMinutes: number;

  // Performance tracking
  @Column({ type: 'int', default: 0, name: 'orders_served' })
  ordersServed: number;

  @Column({ type: 'int', default: 0, name: 'tables_served' })
  tablesServed: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'total_sales' })
  totalSales: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'total_tips' })
  totalTips: number;

  // Additional info
  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    clockInLocation?: { lat: number; lng: number };
    clockOutLocation?: { lat: number; lng: number };
    clockInDevice?: string;
    clockOutDevice?: string;
    managerOverride?: {
      by: string;
      reason: string;
      timestamp: Date;
    };
    [key: string]: any;
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
