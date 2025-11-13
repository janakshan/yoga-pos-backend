import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  ManyToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Modifier } from './modifier.entity';
import { Branch } from '../../../branches/entities/branch.entity';
import { Product } from '../../../products/entities/product.entity';

export enum ModifierGroupType {
  REQUIRED = 'required',
  OPTIONAL = 'optional',
}

export enum ModifierSelectionType {
  SINGLE = 'single', // Radio button - select exactly one
  MULTIPLE = 'multiple', // Checkbox - select multiple
}

@Entity('modifier_groups')
@Index(['branchId', 'isActive'])
@Index(['branchId', 'category'])
export class ModifierGroup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'branch_id' })
  branchId: string;

  @ManyToOne(() => Branch, { nullable: false })
  branch: Branch;

  // Modifier Type Configuration
  @Column({
    type: 'enum',
    enum: ModifierGroupType,
    default: ModifierGroupType.OPTIONAL,
  })
  type: ModifierGroupType;

  @Column({
    type: 'enum',
    enum: ModifierSelectionType,
    default: ModifierSelectionType.MULTIPLE,
  })
  selectionType: ModifierSelectionType;

  // Selection Constraints
  @Column({ name: 'min_selections', type: 'int', default: 0 })
  minSelections: number;

  @Column({ name: 'max_selections', type: 'int', nullable: true })
  maxSelections: number; // null = unlimited

  // Display Configuration
  @Column({ name: 'display_name', nullable: true })
  displayName: string; // Override name for customer-facing display

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'show_in_pos', default: true })
  showInPos: boolean;

  @Column({ name: 'show_in_online_menu', default: true })
  showInOnlineMenu: boolean;

  // Category for grouping (e.g., 'size', 'toppings', 'cooking-preference', 'extras')
  @Column({ nullable: true })
  category: string;

  // Relationships
  @OneToMany(() => Modifier, (modifier) => modifier.modifierGroup, {
    cascade: true,
    eager: true,
  })
  modifiers: Modifier[];

  @ManyToMany(() => Product, (product) => product.modifierGroups)
  products: Product[];

  // Price Calculation Rules
  @Column({ name: 'free_modifier_count', type: 'int', default: 0 })
  freeModifierCount: number; // First N modifiers are free

  @Column({ name: 'charge_above_free', default: false })
  chargeAboveFree: boolean; // Charge for modifiers beyond free count

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

  // Conditional Display Rules
  @Column({ type: 'jsonb', nullable: true })
  conditionalRules: {
    showWhenProductCategories?: string[]; // Show only for specific categories
    showWhenProductTags?: string[]; // Show only for specific tags
    hideWhenModifiersSelected?: string[]; // Hide if certain modifiers are selected
    customRules?: Array<{
      field: string;
      operator: 'equals' | 'not_equals' | 'in' | 'not_in';
      value: any;
    }>;
  };

  // UI Configuration
  @Column({ type: 'jsonb', nullable: true })
  uiConfig: {
    layout?: 'grid' | 'list' | 'dropdown';
    columns?: number;
    showImages?: boolean;
    showPrices?: boolean;
    showDescriptions?: boolean;
    customCss?: string;
  };

  // Metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    internalNotes?: string;
    displayTags?: string[];
    customAttributes?: Record<string, any>;
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
