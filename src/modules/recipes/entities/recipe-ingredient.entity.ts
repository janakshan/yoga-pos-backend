import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Recipe } from './recipe.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('recipe_ingredients')
@Index(['recipeId', 'ingredientId'], { unique: true })
export class RecipeIngredient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Recipe relation
  @Column({ type: 'uuid' })
  recipeId: string;

  @ManyToOne(() => Recipe, (recipe) => recipe.ingredients, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'recipeId' })
  recipe: Recipe;

  // Ingredient (Product) relation
  @Column({ type: 'uuid' })
  ingredientId: string;

  @ManyToOne(() => Product, { eager: true })
  @JoinColumn({ name: 'ingredientId' })
  ingredient: Product;

  // Ingredient details
  @Column({ length: 255 })
  ingredientName: string;

  @Column({ length: 100, nullable: true })
  ingredientSku: string;

  // Quantity and measurement
  @Column({ type: 'decimal', precision: 10, scale: 4 })
  quantity: number;

  @Column({ length: 50, comment: 'Unit of measurement (e.g., kg, g, ml, l, pieces, cups)' })
  unit: string;

  // Cost tracking
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    comment: 'Unit cost of ingredient at time of recipe creation',
  })
  unitCost: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    generatedType: 'STORED',
    asExpression: 'quantity * "unitCost"',
    comment: 'Total cost for this ingredient (computed)',
  })
  totalCost: number;

  // Preparation instructions
  @Column({ type: 'text', nullable: true, comment: 'Preparation method for this ingredient' })
  preparation: string;

  @Column({ type: 'text', nullable: true, comment: 'Any notes or substitutions' })
  notes: string;

  // Sequencing
  @Column({ type: 'int', default: 0, comment: 'Order in which ingredient is used' })
  sortOrder: number;

  // Grouping for recipe steps
  @Column({ length: 100, nullable: true, comment: 'Group ingredients by section (e.g., Sauce, Base, Garnish)' })
  ingredientGroup: string;

  // Optional/Required
  @Column({ default: true })
  isRequired: boolean;

  @Column({ default: false })
  isOptional: boolean;

  // Substitutions
  @Column({ type: 'jsonb', nullable: true })
  substitutions: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unit: string;
    notes?: string;
  }>;

  // Waste factor for this specific ingredient
  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
    comment: 'Expected waste percentage for this ingredient (0-100)',
  })
  wastePercentage: number;

  // Conversion factors
  @Column({ type: 'jsonb', nullable: true, comment: 'Conversion ratios to other units' })
  conversionFactors: Record<string, number>;

  // Custom fields
  @Column({ type: 'jsonb', nullable: true })
  customFields: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
