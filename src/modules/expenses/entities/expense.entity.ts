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

export enum ExpenseCategory {
  RENT = 'rent',
  UTILITIES = 'utilities',
  SALARIES = 'salaries',
  EQUIPMENT = 'equipment',
  SUPPLIES = 'supplies',
  MARKETING = 'marketing',
  INSURANCE = 'insurance',
  MAINTENANCE = 'maintenance',
  TRANSPORTATION = 'transportation',
  PROFESSIONAL_SERVICES = 'professional_services',
  OTHER = 'other',
}

@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: ExpenseCategory,
  })
  category: ExpenseCategory;

  @Column({ type: 'date' })
  date: Date;

  @Column({ nullable: true })
  reference: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @ManyToOne(() => Branch, { nullable: true })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({ name: 'branch_id', nullable: true })
  branchId: string;

  @Column({ nullable: true })
  branchName: string;

  @Column({ nullable: true })
  receiptUrl: string;

  @Column({ default: 'pending' })
  status: string; // pending, approved, rejected, paid

  @Column({ nullable: true })
  paymentMethod: string;

  @Column({ type: 'date', nullable: true })
  paidDate: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdByUser: User;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @Column({ nullable: true })
  createdByName: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approved_by' })
  approvedByUser: User;

  @Column({ name: 'approved_by', nullable: true })
  approvedBy?: string;

  @Column({ nullable: true })
  approvedByName: string;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
