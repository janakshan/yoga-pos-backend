import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Customer } from './customer.entity';

@Entity('store_credit_transactions')
export class StoreCreditTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  customerId: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @Column({ type: 'varchar' })
  type: string; // 'add', 'deduct', 'loyalty_redeem'

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  balanceBefore: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  balanceAfter: number;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', nullable: true })
  referenceNumber?: string; // Order/transaction reference

  @Column({ type: 'int', nullable: true })
  loyaltyPointsUsed?: number; // For redemption transactions

  @Column({ type: 'varchar', nullable: true })
  processedBy?: string; // User ID or username who processed the transaction

  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date; // For store credit with expiration

  @CreateDateColumn()
  createdAt: Date;
}
