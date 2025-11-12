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
import { ServerSection } from './server-section.entity';
import { ServerShift } from './server-shift.entity';

export enum AssignmentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  TEMPORARY = 'temporary',
}

@Entity('server_assignments')
export class ServerAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: false, eager: true })
  @JoinColumn({ name: 'server_id' })
  server: User;

  @Column({ name: 'server_id' })
  serverId: string;

  @ManyToOne(() => ServerSection, { nullable: false, eager: true })
  @JoinColumn({ name: 'section_id' })
  section: ServerSection;

  @Column({ name: 'section_id' })
  sectionId: string;

  @ManyToOne(() => ServerShift, { nullable: true, eager: true })
  @JoinColumn({ name: 'shift_id' })
  shift: ServerShift;

  @Column({ name: 'shift_id', nullable: true })
  shiftId: string;

  @Column({ type: 'timestamp' })
  startTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  endTime: Date;

  @Column({
    type: 'enum',
    enum: AssignmentStatus,
    default: AssignmentStatus.ACTIVE,
  })
  status: AssignmentStatus;

  @Column({ type: 'boolean', default: false })
  isPrimary: boolean; // Primary vs backup server for a section

  @Column({ type: 'jsonb', nullable: true })
  assignedTables: string[]; // Specific tables within the section

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
