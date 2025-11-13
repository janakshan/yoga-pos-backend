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
import { RestaurantOrder } from './restaurant-order.entity';
import { Product } from '../../products/entities/product.entity';
import {
  KitchenStation,
  CourseTiming,
  RestaurantOrderStatus,
} from '../common/restaurant.constants';

@Entity('order_items')
@Index(['orderId', 'productId'])
@Index(['kitchenStation', 'status'])
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RestaurantOrder, (order) => order.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'order_id' })
  order: RestaurantOrder;

  @Column({ name: 'order_id' })
  orderId: string;

  @ManyToOne(() => Product, { eager: true })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'product_id' })
  productId: string;

  @Column({ name: 'product_name' })
  productName: string; // Store product name at time of order

  // Quantity and pricing
  @Column({ type: 'decimal', precision: 10, scale: 3 })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'unit_price' })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tax: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  // Restaurant-specific fields
  @Column({
    type: 'enum',
    enum: KitchenStation,
    name: 'kitchen_station',
    default: KitchenStation.GENERAL,
  })
  kitchenStation: KitchenStation;

  @Column({
    type: 'enum',
    enum: CourseTiming,
    nullable: true,
  })
  course: CourseTiming;

  @Column({
    type: 'enum',
    enum: RestaurantOrderStatus,
    default: RestaurantOrderStatus.PENDING,
  })
  status: RestaurantOrderStatus; // Individual item status for kitchen tracking

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true, name: 'special_instructions' })
  specialInstructions: string;

  @Column({ type: 'int', nullable: true, name: 'seat_number' })
  seatNumber: number; // Seat assignment for multi-guest orders

  // Modifiers and customizations
  @Column({ type: 'jsonb', nullable: true })
  modifiers: Array<{
    id: string;
    name: string;
    options: Array<{
      id: string;
      name: string;
      priceAdjustment: number;
    }>;
  }>;

  // Combo meal information
  @Column({ type: 'boolean', default: false, name: 'is_combo' })
  isCombo: boolean;

  @Column({ type: 'varchar', nullable: true, name: 'combo_group_id' })
  comboGroupId: string; // Group related combo items together

  // Kitchen tracking
  @Column({ type: 'int', nullable: true, name: 'preparation_time' })
  preparationTime: number; // in minutes

  @Column({ type: 'timestamp', nullable: true, name: 'sent_to_kitchen_at' })
  sentToKitchenAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'started_preparing_at' })
  startedPreparingAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'completed_at' })
  completedAt: Date;

  // Item modification tracking
  @Column({ type: 'boolean', default: false, name: 'is_modified' })
  isModified: boolean;

  @Column({ type: 'varchar', nullable: true, name: 'parent_item_id' })
  parentItemId: string; // Reference to original item if this is a modification

  @Column({ type: 'varchar', nullable: true, name: 'modification_type' })
  modificationType: 'added' | 'removed' | 'quantity_changed' | 'customization_changed';

  // Metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    allergens?: string[];
    nutritionalInfo?: {
      calories?: number;
      protein?: number;
      carbs?: number;
      fat?: number;
    };
    preparationNotes?: string;
    substituions?: Array<{
      original: string;
      substitute: string;
      reason?: string;
    }>;
    [key: string]: any;
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
