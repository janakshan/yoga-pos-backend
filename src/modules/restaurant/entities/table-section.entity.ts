import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Branch } from '../../branches/entities/branch.entity';
import { FloorPlan } from './floor-plan.entity';
import { Table } from './table.entity';

@Entity('table_sections')
@Index(['branchId', 'name'], { unique: true })
export class TableSection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToOne(() => Branch, { nullable: false })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({ name: 'branch_id' })
  branchId: string;

  @ManyToOne(() => FloorPlan, (floorPlan) => floorPlan.sections, {
    nullable: true,
  })
  @JoinColumn({ name: 'floor_plan_id' })
  floorPlan: FloorPlan;

  @Column({ name: 'floor_plan_id', nullable: true })
  floorPlanId: string;

  @OneToMany(() => Table, (table) => table.section)
  tables: Table[];

  @Column({ type: 'varchar', nullable: true })
  color: string;

  @Column({ name: 'display_order', type: 'int', default: 0 })
  displayOrder: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  settings: {
    maxCapacity?: number;
    isSmokingArea?: boolean;
    isVipArea?: boolean;
    customAttributes?: Record<string, any>;
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
