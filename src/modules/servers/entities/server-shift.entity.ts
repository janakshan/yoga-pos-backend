import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Branch } from '../../branches/entities/branch.entity';

export enum ShiftStatus {
  SCHEDULED = 'scheduled',
  STARTED = 'started',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('server_shifts')
export class ServerShift {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: false, eager: true })
  @JoinColumn({ name: 'server_id' })
  server: User;

  @Column({ name: 'server_id' })
  serverId: string;

  @ManyToOne(() => Branch, { nullable: false, eager: true })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({ name: 'branch_id' })
  branchId: string;

  @Column({ type: 'timestamp' })
  scheduledStart: Date;

  @Column({ type: 'timestamp' })
  scheduledEnd: Date;

  @Column({ type: 'timestamp', nullable: true })
  actualStart: Date;

  @Column({ type: 'timestamp', nullable: true })
  actualEnd: Date;

  @Column({
    type: 'enum',
    enum: ShiftStatus,
    default: ShiftStatus.SCHEDULED,
  })
  status: ShiftStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalSales: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalTips: number;

  @Column({ type: 'int', default: 0 })
  orderCount: number;

  @Column({ type: 'int', default: 0 })
  customerCount: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'jsonb', nullable: true })
  breakTimes: Array<{
    start: Date;
    end: Date;
    duration: number; // in minutes
  }>;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
