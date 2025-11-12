import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Branch } from '../../branches/entities/branch.entity';

export enum SectionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('server_sections')
export class ServerSection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int', default: 0 })
  tableCount: number;

  @Column({ type: 'jsonb', nullable: true })
  tables: string[]; // Array of table identifiers

  @ManyToOne(() => Branch, { nullable: false })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({ name: 'branch_id' })
  branchId: string;

  @Column({
    type: 'enum',
    enum: SectionStatus,
    default: SectionStatus.ACTIVE,
  })
  status: SectionStatus;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    color?: string;
    floor?: string;
    capacity?: number;
    [key: string]: any;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
