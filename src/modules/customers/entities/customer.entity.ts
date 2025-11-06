import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column()
  phone: string;

  @Column({ type: 'jsonb', nullable: true })
  address: any;

  @Column({ default: 'regular' })
  customerType: string;

  @Column({ default: 'active' })
  status: string;

  @Column({ type: 'jsonb', nullable: true })
  loyaltyInfo: any;

  @Column({ type: 'jsonb', nullable: true })
  preferences: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
