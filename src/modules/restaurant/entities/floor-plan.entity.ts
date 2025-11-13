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
import { Table } from './table.entity';
import { TableSection } from './table-section.entity';

@Entity('floor_plans')
@Index(['branchId', 'name'], { unique: true })
export class FloorPlan {
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

  @OneToMany(() => Table, (table) => table.floorPlan)
  tables: Table[];

  @OneToMany(() => TableSection, (section) => section.floorPlan)
  sections: TableSection[];

  @Column({ name: 'display_order', type: 'int', default: 0 })
  displayOrder: number;

  @Column({ type: 'jsonb', nullable: true })
  layout: {
    width: number;
    height: number;
    gridSize?: number;
    backgroundImage?: string;
    backgroundColor?: string;
  };

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'is_default', default: false })
  isDefault: boolean;

  @Column({ type: 'jsonb', nullable: true })
  settings: {
    enableAutoLayout?: boolean;
    showGridLines?: boolean;
    snapToGrid?: boolean;
    customStyles?: Record<string, any>;
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
