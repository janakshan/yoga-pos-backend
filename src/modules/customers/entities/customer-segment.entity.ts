import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Customer } from './customer.entity';

@Entity('customer_segments')
export class CustomerSegment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  criteria: any; // Stores segment rules/criteria (e.g., {loyaltyTier: 'gold', minPurchases: 10})

  @Column({ default: true })
  isActive: boolean;

  @ManyToMany(() => Customer, { cascade: true })
  @JoinTable({
    name: 'customer_segment_assignments',
    joinColumn: { name: 'segment_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'customer_id', referencedColumnName: 'id' },
  })
  customers: Customer[];

  @Column({ type: 'int', default: 0 })
  customerCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
