import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { Branch } from '../../branches/entities/branch.entity';

@Entity('stock_levels')
@Index(['productId', 'locationId'], { unique: true })
export class StockLevel {
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

  @ManyToOne(() => Branch)
  @JoinColumn({ name: 'location_id' })
  location: Branch;

  @Column({ name: 'location_id' })
  locationId: string;

  @Column({ nullable: true })
  locationName: string;

  @Column({ type: 'int', default: 0 })
  quantity: number;

  @Column({ type: 'int', default: 10 })
  lowStockThreshold: number;

  @Column({ type: 'int', default: 15 })
  reorderPoint: number;

  @Column({ type: 'int', default: 50 })
  reorderQuantity: number;

  @Column({ default: false })
  isLowStock: boolean;

  @Column({ default: false })
  isOutOfStock: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  averageCost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalValue: number;

  @Column({ type: 'timestamp', nullable: true })
  lastRestockedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastSoldAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
