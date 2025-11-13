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
import { User } from '../../users/entities/user.entity';
import { TableStatus } from '../common/restaurant.constants';
import { FloorPlan } from './floor-plan.entity';
import { TableSection } from './table-section.entity';

@Entity('tables')
@Index(['branchId', 'tableNumber'], { unique: true })
export class Table {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'table_number' })
  tableNumber: string;

  @Column({ type: 'int' })
  capacity: number;

  @Column({
    type: 'enum',
    enum: TableStatus,
    default: TableStatus.AVAILABLE,
  })
  status: TableStatus;

  @ManyToOne(() => Branch, { nullable: false })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({ name: 'branch_id' })
  branchId: string;

  @ManyToOne(() => FloorPlan, (floorPlan) => floorPlan.tables, {
    nullable: true,
  })
  @JoinColumn({ name: 'floor_plan_id' })
  floorPlan: FloorPlan;

  @Column({ name: 'floor_plan_id', nullable: true })
  floorPlanId: string;

  @ManyToOne(() => TableSection, (section) => section.tables, {
    nullable: true,
  })
  @JoinColumn({ name: 'section_id' })
  section: TableSection;

  @Column({ name: 'section_id', nullable: true })
  sectionId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assigned_server_id' })
  assignedServer: User;

  @Column({ name: 'assigned_server_id', nullable: true })
  assignedServerId: string;

  @Column({ name: 'current_order_id', nullable: true })
  currentOrderId: string;

  @Column({ name: 'reservation_id', nullable: true })
  reservationId: string;

  @Column({ type: 'jsonb', nullable: true })
  position: {
    x: number;
    y: number;
  };

  @Column({ type: 'jsonb', nullable: true })
  shape: {
    type: 'rectangle' | 'circle' | 'custom';
    width?: number;
    height?: number;
    radius?: number;
  };

  @Column({ name: 'min_capacity', type: 'int', default: 1 })
  minCapacity: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'qr_code', nullable: true })
  qrCode: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    hasHighChair?: boolean;
    isWheelchairAccessible?: boolean;
    isWindowSeat?: boolean;
    isOutdoor?: boolean;
    customAttributes?: Record<string, any>;
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'last_occupied_at', nullable: true })
  lastOccupiedAt: Date;

  @Column({ name: 'last_cleaned_at', nullable: true })
  lastCleanedAt: Date;
}
