import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { RecipeIngredient } from './recipe-ingredient.entity';
import { User } from '../../auth/entities/user.entity';

@Entity('recipes')
export class Recipe {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 100, unique: true })
  code: string;

  // Link to the finished product this recipe creates
  @Column({ type: 'uuid', nullable: true })
  productId: string;

  @ManyToOne(() => Product, { nullable: true })
  @JoinColumn({ name: 'productId' })
  product: Product;

  // Recipe timing
  @Column({ type: 'int', comment: 'Preparation time in minutes' })
  prepTime: number;

  @Column({ type: 'int', comment: 'Cooking time in minutes' })
  cookTime: number;

  @Column({
    type: 'int',
    generatedType: 'STORED',
    asExpression: '"prepTime" + "cookTime"',
    comment: 'Total time in minutes (computed)',
  })
  totalTime: number;

  // Recipe scaling and yield
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  yieldQuantity: number;

  @Column({ length: 50, comment: 'Unit of measurement for yield (e.g., portions, kg, liters)' })
  yieldUnit: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 1, comment: 'Default serving size' })
  servingSize: number;

  // Costing information
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    comment: 'Total cost of all ingredients',
  })
  ingredientCost: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    comment: 'Labor cost per recipe',
  })
  laborCost: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    comment: 'Overhead cost per recipe',
  })
  overheadCost: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    generatedType: 'STORED',
    asExpression: '"ingredientCost" + "laborCost" + "overheadCost"',
    comment: 'Total recipe cost (computed)',
  })
  totalCost: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    comment: 'Cost per serving',
  })
  costPerServing: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
    comment: 'Expected waste percentage (0-100)',
  })
  wastePercentage: number;

  // Instructions and notes
  @Column({ type: 'text', nullable: true })
  instructions: string;

  @Column({ type: 'jsonb', nullable: true, comment: 'Step-by-step instructions array' })
  steps: Array<{
    stepNumber: number;
    instruction: string;
    duration?: number;
    imageUrl?: string;
  }>;

  @Column({ type: 'text', nullable: true })
  notes: string;

  // Categorization
  @Column({ length: 100, nullable: true })
  category: string;

  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  // Difficulty and skill level
  @Column({
    type: 'enum',
    enum: ['easy', 'medium', 'hard', 'expert'],
    default: 'medium',
  })
  difficultyLevel: string;

  @Column({ length: 100, nullable: true, comment: 'Kitchen station assigned to this recipe' })
  kitchenStation: string;

  // Allergens and dietary info
  @Column({ type: 'simple-array', nullable: true })
  allergens: string[];

  @Column({ type: 'simple-array', nullable: true })
  dietaryRestrictions: string[];

  // Recipe status
  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isPublished: boolean;

  // Recipe version control
  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ type: 'uuid', nullable: true, comment: 'Parent recipe ID for versioning' })
  parentRecipeId: string;

  // Media
  @Column({ length: 500, nullable: true })
  imageUrl: string;

  @Column({ type: 'jsonb', nullable: true })
  images: string[];

  @Column({ type: 'jsonb', nullable: true })
  videos: string[];

  // Nutritional information (optional)
  @Column({ type: 'jsonb', nullable: true })
  nutritionalInfo: {
    calories?: number;
    protein?: number;
    carbohydrates?: number;
    fat?: number;
    fiber?: number;
    sodium?: number;
    servingSize?: string;
  };

  // Custom fields for flexibility
  @Column({ type: 'jsonb', nullable: true })
  customFields: Record<string, any>;

  // Audit fields
  @Column({ type: 'uuid', nullable: true })
  createdBy: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'createdBy' })
  createdByUser: User;

  @Column({ type: 'uuid', nullable: true })
  updatedBy: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'updatedBy' })
  updatedByUser: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => RecipeIngredient, (ingredient) => ingredient.recipe, {
    cascade: true,
  })
  ingredients: RecipeIngredient[];
}
