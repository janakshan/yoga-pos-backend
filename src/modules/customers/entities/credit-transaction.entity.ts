import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Customer } from './customer.entity';

@Entity('credit_transactions')
export class CreditTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  customerId: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @Column({ type: 'varchar' })
  type: string; // 'charge' or 'payment'

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  balanceBefore: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  balanceAfter: number;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', nullable: true })
  referenceNumber?: string; // Invoice number or payment reference

  @Column({ type: 'varchar', nullable: true })
  processedBy?: string; // User ID or username who processed the transaction

  @CreateDateColumn()
  createdAt: Date;
}
