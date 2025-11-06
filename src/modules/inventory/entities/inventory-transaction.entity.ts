import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { User } from '../../users/entities/user.entity';

export enum TransactionType {
  PURCHASE = 'purchase',
  SALE = 'sale',
  ADJUSTMENT = 'adjustment',
  RETURN = 'return',
  DAMAGE = 'damage',
  WRITE_OFF = 'write_off',
  TRANSFER_IN = 'transfer_in',
  TRANSFER_OUT = 'transfer_out',
}

export enum TransactionStatus {
  COMPLETED = 'completed',
  PENDING = 'pending',
  CANCELLED = 'cancelled',
}

@Entity('inventory_transactions')
export class InventoryTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'product_id' })
  productId: string;

  @Column({ nullable: true })
  productName: string;

  @Column({ nullable: true })
  productSku: string;

  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  type: TransactionType;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitCost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalCost: number;

  @Column({ type: 'int', nullable: true })
  balanceAfter: number;

  @Column({ nullable: true })
  batchNumber: string;

  @Column({ nullable: true })
  serialNumber: string;

  @Column({ type: 'date', nullable: true })
  expiryDate: Date;

  @ManyToOne(() => Branch, { nullable: true })
  @JoinColumn({ name: 'location_id' })
  location: Branch;

  @Column({ name: 'location_id', nullable: true })
  locationId: string;

  @Column({ nullable: true })
  locationName: string;

  @Column({ nullable: true })
  referenceType: string;

  @Column({ nullable: true })
  referenceId: string;

  @Column({ nullable: true })
  referenceNumber: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.COMPLETED,
  })
  status: TransactionStatus;

  @Column({ type: 'date' })
  transactionDate: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdByUser: User;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @Column({ nullable: true })
  createdByName: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
