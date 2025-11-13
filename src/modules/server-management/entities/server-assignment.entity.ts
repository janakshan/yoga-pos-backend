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
import { TableSection } from '../../restaurant/entities/table-section.entity';

export enum AssignmentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ON_BREAK = 'on_break',
  COMPLETED = 'completed',
}

@Entity('server_assignments')
@Index(['serverId', 'assignmentDate'])
@Index(['branchId', 'assignmentDate'])
@Index(['sectionId', 'status'])
export class ServerAssignment {
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

  @ManyToOne(() => TableSection, { nullable: true })
  @JoinColumn({ name: 'section_id' })
  section: TableSection;

  @Column({ name: 'section_id', nullable: true })
  sectionId: string;

  @Column({
    type: 'enum',
    enum: AssignmentStatus,
    default: AssignmentStatus.ACTIVE,
  })
  status: AssignmentStatus;

  @Column({ type: 'date', name: 'assignment_date' })
  assignmentDate: Date;

  @Column({ type: 'time', nullable: true, name: 'start_time' })
  startTime: string;

  @Column({ type: 'time', nullable: true, name: 'end_time' })
  endTime: string;

  @Column({ type: 'int', nullable: true, name: 'table_limit' })
  tableLimit: number;

  @Column({ type: 'int', default: 0, name: 'current_table_count' })
  currentTableCount: number;

  @Column({ type: 'int', default: 0, name: 'priority_order' })
  priorityOrder: number; // Rotation order for seating

  @Column({ type: 'jsonb', nullable: true })
  settings: {
    autoAssign?: boolean;
    preferredTables?: string[];
    skillLevel?: 'junior' | 'intermediate' | 'senior' | 'expert';
    maxGuestCount?: number;
    canHandleVIP?: boolean;
    [key: string]: any;
  };

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
