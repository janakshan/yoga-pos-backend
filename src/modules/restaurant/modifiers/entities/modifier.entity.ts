import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ModifierGroup } from './modifier-group.entity';
import { Branch } from '../../../branches/entities/branch.entity';

export enum PriceAdjustmentType {
  FIXED = 'fixed',
  PERCENTAGE = 'percentage',
}

@Entity('modifiers')
@Index(['modifierGroupId', 'sortOrder'])
@Index(['branchId', 'isActive'])
export class Modifier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'modifier_group_id' })
  modifierGroupId: string;

  @ManyToOne(() => ModifierGroup, (group) => group.modifiers, {
    onDelete: 'CASCADE',
  })
  modifierGroup: ModifierGroup;

  @Column({ name: 'branch_id' })
  branchId: string;

  @ManyToOne(() => Branch, { nullable: false })
  branch: Branch;

  // Pricing
  @Column({
    type: 'enum',
    enum: PriceAdjustmentType,
    default: PriceAdjustmentType.FIXED,
  })
  priceAdjustmentType: PriceAdjustmentType;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  priceAdjustment: number;

  // Availability and Status
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'is_available', default: true })
  isAvailable: boolean;

  @Column({ name: 'is_default', default: false })
  isDefault: boolean;

  // Display Order
  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  // SKU for inventory tracking (optional)
  @Column({ nullable: true })
  sku: string;

  // Image for visual menus
  @Column({ name: 'image_url', nullable: true })
  imageUrl: string;

  // Nutritional Information (optional)
  @Column({ type: 'jsonb', nullable: true })
  nutritionalInfo: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    allergens?: string[];
    dietaryRestrictions?: string[];
  };

  // Time-based availability
  @Column({ type: 'jsonb', nullable: true })
  availability: {
    days?: string[]; // ['monday', 'tuesday', etc.]
    timeRanges?: Array<{
      startTime: string; // 'HH:mm' format
      endTime: string;
    }>;
    dateRanges?: Array<{
      startDate: string; // 'YYYY-MM-DD' format
      endDate: string;
    }>;
  };

  // Stock tracking (if applicable)
  @Column({ name: 'track_inventory', default: false })
  trackInventory: boolean;

  @Column({ name: 'stock_quantity', type: 'int', nullable: true })
  stockQuantity: number;

  @Column({ name: 'out_of_stock_action', nullable: true })
  outOfStockAction: 'hide' | 'disable' | 'show'; // What to do when out of stock

  // Cost tracking for reporting
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  cost: number;

  // Metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    preparationTime?: number; // in minutes
    kitchenInstructions?: string;
    displayTags?: string[];
    customAttributes?: Record<string, any>;
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
