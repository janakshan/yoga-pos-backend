import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  sku: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column()
  category: string;

  @Column({ nullable: true })
  subcategory: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'jsonb', nullable: true })
  pricing: {
    retail: number;
    wholesale: number;
    member: number;
  };

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  cost: number;

  @Column({ type: 'int', default: 0 })
  stockQuantity: number;

  @Column({ type: 'int', default: 10 })
  lowStockThreshold: number;

  @Column({ default: 'piece' })
  unit: string;

  @Column({ nullable: true })
  barcode: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ type: 'jsonb', nullable: true })
  imageUrls: string[];

  @Column({ default: 'active' })
  status: string;

  @Column({ type: 'jsonb', nullable: true })
  tags: string[];

  @Column({ type: 'jsonb', nullable: true })
  attributes: any[];

  @Column({ default: true })
  trackInventory: boolean;

  @Column({ default: false })
  allowBackorder: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  taxRate: number;

  @Column({ nullable: true })
  supplier: string;

  @Column({ nullable: true })
  supplierId: string;

  @Column({ default: false })
  isBundle: boolean;

  @Column({ type: 'jsonb', nullable: true })
  bundle: any;

  @Column({ type: 'jsonb', nullable: true })
  customFields: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
