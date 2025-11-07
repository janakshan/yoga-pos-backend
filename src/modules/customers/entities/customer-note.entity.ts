import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Customer } from './customer.entity';

@Entity('customer_notes')
export class CustomerNote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  customerId: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', nullable: true })
  category: string; // e.g., 'general', 'complaint', 'preference', 'reminder'

  @Column({ type: 'varchar', nullable: true })
  createdBy: string; // User ID or username who created the note

  @Column({ default: false })
  isPinned: boolean; // For important notes

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
