import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('suppliers')
export class Supplier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  contactPerson: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ type: 'jsonb', nullable: true })
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };

  @Column({ nullable: true })
  taxId: string;

  @Column({ type: 'jsonb', nullable: true })
  paymentTerms: any;

  @Column({ type: 'jsonb', nullable: true })
  bankDetails: any;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'decimal', precision: 3, scale: 1, nullable: true })
  rating: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalPurchased: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalOwed: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  averageDeliveryDays: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
