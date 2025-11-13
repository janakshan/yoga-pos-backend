import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinColumn,
  JoinTable,
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

  // ===== Restaurant-Specific Fields =====

  // Kitchen Station Assignment
  @Column({ name: 'kitchen_station', nullable: true })
  kitchenStation: string; // 'grill', 'fryer', 'salad', 'bar', etc.

  // Restaurant Menu Category
  @Column({ name: 'restaurant_category', nullable: true })
  restaurantCategory: string; // 'appetizer', 'main_course', 'dessert', 'beverage', 'side', 'special'

  // Preparation Information
  @Column({ name: 'preparation_time', type: 'int', nullable: true })
  preparationTime: number; // in minutes

  @Column({ name: 'cooking_instructions', type: 'text', nullable: true })
  cookingInstructions: string;

  // Menu Display
  @Column({ name: 'is_popular', default: false })
  isPopular: boolean;

  @Column({ name: 'is_recommended', default: false })
  isRecommended: boolean;

  @Column({ name: 'is_new', default: false })
  isNew: boolean;

  @Column({ name: 'is_seasonal', default: false })
  isSeasonal: boolean;

  @Column({ name: 'is_spicy', default: false })
  isSpicy: boolean;

  @Column({ name: 'spiciness_level', type: 'int', nullable: true })
  spicinessLevel: number; // 0-5 scale

  // Dietary Information
  @Column({ type: 'simple-array', nullable: true })
  allergens: string[]; // ['nuts', 'dairy', 'gluten', etc.]

  @Column({ type: 'simple-array', nullable: true })
  dietaryRestrictions: string[]; // ['vegetarian', 'vegan', 'gluten-free', 'halal', etc.]

  // Nutritional Information
  @Column({ type: 'jsonb', nullable: true })
  nutritionalInfo: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    sodium?: number;
    servingSize?: string;
  };

  // Availability Rules
  @Column({ name: 'is_available', default: true })
  isAvailable: boolean;

  @Column({ type: 'jsonb', nullable: true })
  availability: {
    days?: string[]; // ['monday', 'tuesday', 'wednesday', etc.]
    timeRanges?: Array<{
      startTime: string; // 'HH:mm' format (24-hour)
      endTime: string;
    }>;
    dateRanges?: Array<{
      startDate: string; // 'YYYY-MM-DD' format
      endDate: string;
    }>;
  };

  // Pricing Variations
  @Column({ name: 'has_size_variations', default: false })
  hasSizeVariations: boolean;

  @Column({ type: 'jsonb', nullable: true })
  sizeVariations: Array<{
    name: string; // 'Small', 'Medium', 'Large'
    price: number;
    calories?: number;
  }>;

  // Online Ordering
  @Column({ name: 'available_for_takeaway', default: true })
  availableForTakeaway: boolean;

  @Column({ name: 'available_for_delivery', default: true })
  availableForDelivery: boolean;

  @Column({ name: 'available_for_dine_in', default: true })
  availableForDineIn: boolean;

  // Menu Tags
  @Column({ type: 'simple-array', nullable: true })
  tags: string[]; // ['breakfast', 'lunch', 'dinner', 'combo', 'kids-menu', etc.]

  // Combo/Bundle Configuration
  @Column({ name: 'is_combo', default: false })
  isCombo: boolean;

  @Column({ type: 'jsonb', nullable: true })
  comboItems: Array<{
    productId: string;
    quantity: number;
    category?: string;
  }>;

  // Modifier Groups Relationship
  @ManyToMany(
    () => {
      // Lazy import to avoid circular dependency
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { ModifierGroup } = require('../../restaurant/modifiers/entities/modifier-group.entity');
      return ModifierGroup;
    },
    (modifierGroup) => modifierGroup.products,
  )
  @JoinTable({
    name: 'product_modifier_groups',
    joinColumn: { name: 'product_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'modifier_group_id', referencedColumnName: 'id' },
  })
  modifierGroups: any[]; // Type will be ModifierGroup[] at runtime

  // Sort Order for Menu Display
  @Column({ name: 'menu_sort_order', type: 'int', default: 0 })
  menuSortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
