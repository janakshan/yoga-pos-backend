import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsUUID,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsArray,
  ValidateNested,
  Min,
  Max,
  IsObject,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateRecipeIngredientDto } from './create-recipe-ingredient.dto';

class RecipeStepDto {
  @ApiProperty({ description: 'Step number' })
  @IsNumber()
  @Min(1)
  stepNumber: number;

  @ApiProperty({ description: 'Step instruction' })
  @IsString()
  instruction: string;

  @ApiPropertyOptional({ description: 'Duration in minutes' })
  @IsOptional()
  @IsNumber()
  duration?: number;

  @ApiPropertyOptional({ description: 'Step image URL' })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}

class NutritionalInfoDto {
  @ApiPropertyOptional({ description: 'Calories per serving' })
  @IsOptional()
  @IsNumber()
  calories?: number;

  @ApiPropertyOptional({ description: 'Protein in grams' })
  @IsOptional()
  @IsNumber()
  protein?: number;

  @ApiPropertyOptional({ description: 'Carbohydrates in grams' })
  @IsOptional()
  @IsNumber()
  carbohydrates?: number;

  @ApiPropertyOptional({ description: 'Fat in grams' })
  @IsOptional()
  @IsNumber()
  fat?: number;

  @ApiPropertyOptional({ description: 'Fiber in grams' })
  @IsOptional()
  @IsNumber()
  fiber?: number;

  @ApiPropertyOptional({ description: 'Sodium in mg' })
  @IsOptional()
  @IsNumber()
  sodium?: number;

  @ApiPropertyOptional({ description: 'Serving size description' })
  @IsOptional()
  @IsString()
  servingSize?: string;
}

export class CreateRecipeDto {
  @ApiProperty({ description: 'Recipe name', example: 'Margherita Pizza' })
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: 'Recipe description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Unique recipe code', example: 'RCP-001' })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  code: string;

  @ApiPropertyOptional({ description: 'Product ID this recipe creates' })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiProperty({ description: 'Preparation time in minutes', example: 15 })
  @IsNumber()
  @Min(0)
  prepTime: number;

  @ApiProperty({ description: 'Cooking time in minutes', example: 20 })
  @IsNumber()
  @Min(0)
  cookTime: number;

  @ApiProperty({ description: 'Yield quantity', example: 4 })
  @IsNumber()
  @Min(0)
  yieldQuantity: number;

  @ApiProperty({ description: 'Yield unit', example: 'portions' })
  @IsString()
  yieldUnit: string;

  @ApiPropertyOptional({ description: 'Default serving size', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  servingSize?: number;

  @ApiPropertyOptional({ description: 'Labor cost per recipe', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  laborCost?: number;

  @ApiPropertyOptional({ description: 'Overhead cost per recipe', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  overheadCost?: number;

  @ApiPropertyOptional({ description: 'Expected waste percentage (0-100)', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  wastePercentage?: number;

  @ApiPropertyOptional({ description: 'Recipe instructions' })
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiPropertyOptional({ description: 'Step-by-step instructions', type: [RecipeStepDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeStepDto)
  steps?: RecipeStepDto[];

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Recipe category', example: 'Main Course' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Recipe tags', example: ['Italian', 'Vegetarian'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Difficulty level',
    enum: ['easy', 'medium', 'hard', 'expert'],
    default: 'medium',
  })
  @IsOptional()
  @IsEnum(['easy', 'medium', 'hard', 'expert'])
  difficultyLevel?: string;

  @ApiPropertyOptional({ description: 'Kitchen station', example: 'Grill' })
  @IsOptional()
  @IsString()
  kitchenStation?: string;

  @ApiPropertyOptional({ description: 'Allergens', example: ['gluten', 'dairy'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergens?: string[];

  @ApiPropertyOptional({ description: 'Dietary restrictions', example: ['vegetarian'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dietaryRestrictions?: string[];

  @ApiPropertyOptional({ description: 'Is recipe active?', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Is recipe published?', default: false })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional({ description: 'Recipe image URL' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Recipe images', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ description: 'Recipe videos', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  videos?: string[];

  @ApiPropertyOptional({ description: 'Nutritional information', type: NutritionalInfoDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => NutritionalInfoDto)
  nutritionalInfo?: NutritionalInfoDto;

  @ApiPropertyOptional({ description: 'Custom fields' })
  @IsOptional()
  @IsObject()
  customFields?: Record<string, any>;

  @ApiProperty({ description: 'Recipe ingredients', type: [CreateRecipeIngredientDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRecipeIngredientDto)
  ingredients: CreateRecipeIngredientDto[];
}
