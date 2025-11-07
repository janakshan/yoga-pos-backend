import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Category } from './category.entity';

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

  // Category relationship
  @Column({ name: 'category_id', nullable: true })
  categoryId: string;

  @ManyToOne(() => Category, { nullable: true, eager: true })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  // Subcategory relationship
  @Column({ name: 'subcategory_id', nullable: true })
  subcategoryId: string;

  @ManyToOne(() => Category, { nullable: true, eager: true })
  @JoinColumn({ name: 'subcategory_id' })
  subcategory: Category;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  cost: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  taxRate: number;

  @Column({ nullable: true })
  unit: string;

  @Column({ type: 'int', default: 0 })
  stockQuantity: number;

  @Column({ type: 'int', default: 0 })
  reorderLevel: number;

  @Column({ type: 'int', default: 0 })
  reorderQuantity: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isFeatured: boolean;

  @Column({ default: true })
  trackInventory: boolean;

  @Column({ default: false })
  allowBackorder: boolean;

  @Column({ nullable: true })
  barcode: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ type: 'jsonb', nullable: true })
  images: any;

  @Column({ type: 'jsonb', nullable: true })
  attributes: any;

  @Column({ type: 'jsonb', nullable: true })
  dimensions: any;

  @Column({ type: 'jsonb', nullable: true })
  seo: any;

  @Column({ name: 'supplier_id', nullable: true })
  supplierId: string;

  @Column({ type: 'jsonb', nullable: true })
  customFields: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
