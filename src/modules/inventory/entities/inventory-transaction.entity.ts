import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';

@Entity('inventory_transactions')
export class InventoryTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'product_id' })
  productId: string;

  @Column()
  type: string; // purchase, sale, adjustment, return, damage, write_off, transfer_in, transfer_out

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitCost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalCost: number;

  @Column({ nullable: true })
  referenceType: string;

  @Column({ nullable: true })
  referenceId: string;

  @Column({ default: 'completed' })
  status: string;

  @Column({ type: 'date' })
  transactionDate: Date;

  @CreateDateColumn()
  createdAt: Date;
}
