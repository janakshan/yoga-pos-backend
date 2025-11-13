import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Like, Between } from 'typeorm';
import { Recipe } from '../entities/recipe.entity';
import { RecipeIngredient } from '../entities/recipe-ingredient.entity';
import { Product } from '../../products/entities/product.entity';
import {
  CreateRecipeDto,
  UpdateRecipeDto,
  FilterRecipeDto,
  ScaleRecipeDto,
  ScaleRecipeByYieldDto,
} from '../dto';

@Injectable()
export class RecipesService {
  private readonly logger = new Logger(RecipesService.name);

  constructor(
    @InjectRepository(Recipe)
    private recipeRepository: Repository<Recipe>,
    @InjectRepository(RecipeIngredient)
    private recipeIngredientRepository: Repository<RecipeIngredient>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  /**
   * Create a new recipe with ingredients
   */
  async create(createRecipeDto: CreateRecipeDto, userId?: string): Promise<Recipe> {
    // Check if recipe code already exists
    const existingRecipe = await this.recipeRepository.findOne({
      where: { code: createRecipeDto.code },
    });

    if (existingRecipe) {
      throw new BadRequestException(`Recipe with code ${createRecipeDto.code} already exists`);
    }

    // Validate product exists if provided
    if (createRecipeDto.productId) {
      const product = await this.productRepository.findOne({
        where: { id: createRecipeDto.productId },
      });
      if (!product) {
        throw new NotFoundException(`Product with ID ${createRecipeDto.productId} not found`);
      }
    }

    // Validate all ingredients exist
    const ingredientIds = createRecipeDto.ingredients.map((ing) => ing.ingredientId);
    const ingredients = await this.productRepository.find({
      where: { id: In(ingredientIds) },
    });

    if (ingredients.length !== ingredientIds.length) {
      throw new BadRequestException('One or more ingredient products not found');
    }

    // Create recipe entity
    const { ingredients: ingredientsDto, ...recipeData } = createRecipeDto;
    const recipe = this.recipeRepository.create({
      ...recipeData,
      createdBy: userId,
      updatedBy: userId,
    });

    // Save recipe first
    const savedRecipe = await this.recipeRepository.save(recipe);

    // Create recipe ingredients
    const recipeIngredients = ingredientsDto.map((ingredientDto) => {
      const product = ingredients.find((p) => p.id === ingredientDto.ingredientId);
      return this.recipeIngredientRepository.create({
        ...ingredientDto,
        recipeId: savedRecipe.id,
        ingredientName: product.name,
        ingredientSku: product.sku,
        unitCost: product.cost || 0,
      });
    });

    await this.recipeIngredientRepository.save(recipeIngredients);

    // Recalculate costs
    await this.recalculateCosts(savedRecipe.id);

    // Return recipe with ingredients
    return this.findOne(savedRecipe.id);
  }

  /**
   * Find all recipes with filtering and pagination
   */
  async findAll(filterDto: FilterRecipeDto): Promise<{
    data: Recipe[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      search,
      category,
      difficultyLevel,
      kitchenStation,
      productId,
      isActive,
      isPublished,
      tags,
      allergens,
      dietaryRestrictions,
      minTotalTime,
      maxTotalTime,
      minCost,
      maxCost,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      page = 1,
      limit = 10,
    } = filterDto;

    const queryBuilder = this.recipeRepository
      .createQueryBuilder('recipe')
      .leftJoinAndSelect('recipe.ingredients', 'ingredients')
      .leftJoinAndSelect('ingredients.ingredient', 'product')
      .leftJoinAndSelect('recipe.product', 'finishedProduct');

    // Search filter
    if (search) {
      queryBuilder.andWhere(
        '(recipe.name ILIKE :search OR recipe.code ILIKE :search OR recipe.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Category filter
    if (category) {
      queryBuilder.andWhere('recipe.category = :category', { category });
    }

    // Difficulty filter
    if (difficultyLevel) {
      queryBuilder.andWhere('recipe.difficultyLevel = :difficultyLevel', { difficultyLevel });
    }

    // Kitchen station filter
    if (kitchenStation) {
      queryBuilder.andWhere('recipe.kitchenStation = :kitchenStation', { kitchenStation });
    }

    // Product filter
    if (productId) {
      queryBuilder.andWhere('recipe.productId = :productId', { productId });
    }

    // Active filter
    if (isActive !== undefined) {
      queryBuilder.andWhere('recipe.isActive = :isActive', { isActive });
    }

    // Published filter
    if (isPublished !== undefined) {
      queryBuilder.andWhere('recipe.isPublished = :isPublished', { isPublished });
    }

    // Tags filter
    if (tags) {
      const tagArray = tags.split(',').map((t) => t.trim());
      queryBuilder.andWhere('recipe.tags && :tags', { tags: tagArray });
    }

    // Allergens filter
    if (allergens) {
      const allergenArray = allergens.split(',').map((a) => a.trim());
      queryBuilder.andWhere('recipe.allergens && :allergens', { allergens: allergenArray });
    }

    // Dietary restrictions filter
    if (dietaryRestrictions) {
      const restrictionArray = dietaryRestrictions.split(',').map((r) => r.trim());
      queryBuilder.andWhere('recipe.dietaryRestrictions && :dietaryRestrictions', {
        dietaryRestrictions: restrictionArray,
      });
    }

    // Time range filter
    if (minTotalTime !== undefined) {
      queryBuilder.andWhere('recipe.totalTime >= :minTotalTime', { minTotalTime });
    }
    if (maxTotalTime !== undefined) {
      queryBuilder.andWhere('recipe.totalTime <= :maxTotalTime', { maxTotalTime });
    }

    // Cost range filter
    if (minCost !== undefined) {
      queryBuilder.andWhere('recipe.totalCost >= :minCost', { minCost });
    }
    if (maxCost !== undefined) {
      queryBuilder.andWhere('recipe.totalCost <= :maxCost', { maxCost });
    }

    // Get total count before pagination
    const total = await queryBuilder.getCount();

    // Sorting
    queryBuilder.orderBy(`recipe.${sortBy}`, sortOrder);

    // Pagination
    queryBuilder.skip((page - 1) * limit).take(limit);

    const data = await queryBuilder.getMany();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  /**
   * Find one recipe by ID
   */
  async findOne(id: string): Promise<Recipe> {
    const recipe = await this.recipeRepository.findOne({
      where: { id },
      relations: ['ingredients', 'ingredients.ingredient', 'product', 'createdByUser', 'updatedByUser'],
    });

    if (!recipe) {
      throw new NotFoundException(`Recipe with ID ${id} not found`);
    }

    return recipe;
  }

  /**
   * Find recipe by code
   */
  async findByCode(code: string): Promise<Recipe> {
    const recipe = await this.recipeRepository.findOne({
      where: { code },
      relations: ['ingredients', 'ingredients.ingredient', 'product'],
    });

    if (!recipe) {
      throw new NotFoundException(`Recipe with code ${code} not found`);
    }

    return recipe;
  }

  /**
   * Update a recipe
   */
  async update(id: string, updateRecipeDto: UpdateRecipeDto, userId?: string): Promise<Recipe> {
    const recipe = await this.findOne(id);

    // Check code uniqueness if being changed
    if (updateRecipeDto.code && updateRecipeDto.code !== recipe.code) {
      const existingRecipe = await this.recipeRepository.findOne({
        where: { code: updateRecipeDto.code },
      });
      if (existingRecipe) {
        throw new BadRequestException(`Recipe with code ${updateRecipeDto.code} already exists`);
      }
    }

    // Validate product if being changed
    if (updateRecipeDto.productId) {
      const product = await this.productRepository.findOne({
        where: { id: updateRecipeDto.productId },
      });
      if (!product) {
        throw new NotFoundException(`Product with ID ${updateRecipeDto.productId} not found`);
      }
    }

    // Handle ingredients update
    if (updateRecipeDto.ingredients) {
      // Delete existing ingredients
      await this.recipeIngredientRepository.delete({ recipeId: id });

      // Validate and create new ingredients
      const ingredientIds = updateRecipeDto.ingredients.map((ing) => ing.ingredientId);
      const ingredients = await this.productRepository.find({
        where: { id: In(ingredientIds) },
      });

      if (ingredients.length !== ingredientIds.length) {
        throw new BadRequestException('One or more ingredient products not found');
      }

      const recipeIngredients = updateRecipeDto.ingredients.map((ingredientDto) => {
        const product = ingredients.find((p) => p.id === ingredientDto.ingredientId);
        return this.recipeIngredientRepository.create({
          ...ingredientDto,
          recipeId: id,
          ingredientName: product.name,
          ingredientSku: product.sku,
          unitCost: product.cost || 0,
        });
      });

      await this.recipeIngredientRepository.save(recipeIngredients);
    }

    // Update recipe
    const { ingredients, ...recipeData } = updateRecipeDto;
    await this.recipeRepository.update(id, {
      ...recipeData,
      updatedBy: userId,
    });

    // Recalculate costs if ingredients changed
    if (updateRecipeDto.ingredients || updateRecipeDto.laborCost || updateRecipeDto.overheadCost) {
      await this.recalculateCosts(id);
    }

    return this.findOne(id);
  }

  /**
   * Remove a recipe
   */
  async remove(id: string): Promise<void> {
    const recipe = await this.findOne(id);
    await this.recipeRepository.remove(recipe);
  }

  /**
   * Recalculate costs for a recipe
   */
  async recalculateCosts(recipeId: string): Promise<Recipe> {
    const recipe = await this.findOne(recipeId);

    // Calculate ingredient costs
    let totalIngredientCost = 0;
    for (const ingredient of recipe.ingredients) {
      const ingredientCost = Number(ingredient.quantity) * Number(ingredient.unitCost);
      totalIngredientCost += ingredientCost;

      // Update ingredient total cost if needed
      if (Number(ingredient.totalCost) !== ingredientCost) {
        await this.recipeIngredientRepository.update(ingredient.id, {
          totalCost: ingredientCost,
        });
      }
    }

    // Apply waste percentage
    if (recipe.wastePercentage > 0) {
      totalIngredientCost = totalIngredientCost * (1 + recipe.wastePercentage / 100);
    }

    // Calculate cost per serving
    const costPerServing = recipe.yieldQuantity > 0
      ? (totalIngredientCost + Number(recipe.laborCost) + Number(recipe.overheadCost)) / Number(recipe.yieldQuantity)
      : 0;

    // Update recipe costs
    await this.recipeRepository.update(recipeId, {
      ingredientCost: totalIngredientCost,
      costPerServing,
    });

    return this.findOne(recipeId);
  }

  /**
   * Recalculate costs for all recipes or specific ones
   */
  async recalculateAllCosts(recipeIds?: string[]): Promise<{ updated: number; recipes: Recipe[] }> {
    let recipes: Recipe[];

    if (recipeIds && recipeIds.length > 0) {
      recipes = await this.recipeRepository.find({
        where: { id: In(recipeIds) },
        relations: ['ingredients'],
      });
    } else {
      recipes = await this.recipeRepository.find({
        relations: ['ingredients'],
      });
    }

    const updatedRecipes: Recipe[] = [];
    for (const recipe of recipes) {
      const updated = await this.recalculateCosts(recipe.id);
      updatedRecipes.push(updated);
    }

    return {
      updated: updatedRecipes.length,
      recipes: updatedRecipes,
    };
  }

  /**
   * Scale a recipe by a factor
   */
  async scaleRecipe(
    recipeId: string,
    scaleDto: ScaleRecipeDto,
  ): Promise<{
    original: Recipe;
    scaled: {
      recipe: Partial<Recipe>;
      ingredients: Partial<RecipeIngredient>[];
    };
  }> {
    const recipe = await this.findOne(recipeId);
    const { scaleFactor, recalculateCosts } = scaleDto;

    // Scale ingredients
    const scaledIngredients = recipe.ingredients.map((ingredient) => {
      const scaledQuantity = Number(ingredient.quantity) * scaleFactor;
      const unitCost = recalculateCosts
        ? ingredient.ingredient.cost || ingredient.unitCost
        : ingredient.unitCost;

      return {
        ...ingredient,
        quantity: scaledQuantity,
        unitCost: Number(unitCost),
        totalCost: scaledQuantity * Number(unitCost),
      };
    });

    // Calculate scaled costs
    const scaledIngredientCost = scaledIngredients.reduce(
      (sum, ing) => sum + Number(ing.totalCost),
      0,
    );
    const scaledLaborCost = Number(recipe.laborCost) * scaleFactor;
    const scaledOverheadCost = Number(recipe.overheadCost) * scaleFactor;
    const scaledTotalCost = scaledIngredientCost + scaledLaborCost + scaledOverheadCost;
    const scaledYieldQuantity = Number(recipe.yieldQuantity) * scaleFactor;
    const scaledCostPerServing = scaledYieldQuantity > 0
      ? scaledTotalCost / scaledYieldQuantity
      : 0;

    return {
      original: recipe,
      scaled: {
        recipe: {
          ...recipe,
          yieldQuantity: scaledYieldQuantity,
          ingredientCost: scaledIngredientCost,
          laborCost: scaledLaborCost,
          overheadCost: scaledOverheadCost,
          totalCost: scaledTotalCost,
          costPerServing: scaledCostPerServing,
        },
        ingredients: scaledIngredients,
      },
    };
  }

  /**
   * Scale recipe to a desired yield
   */
  async scaleRecipeByYield(
    recipeId: string,
    scaleByYieldDto: ScaleRecipeByYieldDto,
  ): Promise<{
    original: Recipe;
    scaled: {
      recipe: Partial<Recipe>;
      ingredients: Partial<RecipeIngredient>[];
    };
  }> {
    const recipe = await this.findOne(recipeId);
    const { desiredYield } = scaleByYieldDto;

    const scaleFactor = desiredYield / Number(recipe.yieldQuantity);

    return this.scaleRecipe(recipeId, {
      scaleFactor,
      recalculateCosts: scaleByYieldDto.recalculateCosts,
    });
  }

  /**
   * Get cost breakdown for a recipe
   */
  async getCostBreakdown(recipeId: string): Promise<{
    recipe: Recipe;
    breakdown: {
      ingredientCost: number;
      laborCost: number;
      overheadCost: number;
      totalCost: number;
      costPerServing: number;
      ingredients: Array<{
        name: string;
        sku: string;
        quantity: number;
        unit: string;
        unitCost: number;
        totalCost: number;
        percentageOfTotal: number;
      }>;
    };
  }> {
    const recipe = await this.findOne(recipeId);

    const totalCost = Number(recipe.totalCost);
    const ingredients = recipe.ingredients.map((ingredient) => ({
      name: ingredient.ingredientName,
      sku: ingredient.ingredientSku,
      quantity: Number(ingredient.quantity),
      unit: ingredient.unit,
      unitCost: Number(ingredient.unitCost),
      totalCost: Number(ingredient.totalCost),
      percentageOfTotal: totalCost > 0 ? (Number(ingredient.totalCost) / totalCost) * 100 : 0,
    }));

    return {
      recipe,
      breakdown: {
        ingredientCost: Number(recipe.ingredientCost),
        laborCost: Number(recipe.laborCost),
        overheadCost: Number(recipe.overheadCost),
        totalCost: Number(recipe.totalCost),
        costPerServing: Number(recipe.costPerServing),
        ingredients,
      },
    };
  }

  /**
   * Get recipes by product ID
   */
  async getRecipesByProduct(productId: string): Promise<Recipe[]> {
    return this.recipeRepository.find({
      where: { productId },
      relations: ['ingredients', 'ingredients.ingredient'],
    });
  }

  /**
   * Check ingredient availability across locations
   */
  async checkIngredientAvailability(recipeId: string, locationId?: string): Promise<{
    recipe: Recipe;
    available: boolean;
    ingredients: Array<{
      ingredientId: string;
      ingredientName: string;
      required: number;
      unit: string;
      stockQuantity: number;
      available: boolean;
    }>;
  }> {
    const recipe = await this.findOne(recipeId);

    const ingredientChecks = await Promise.all(
      recipe.ingredients.map(async (recipeIngredient) => {
        const product = recipeIngredient.ingredient;

        // Use product's stock quantity
        const stockQuantity = Number(product.stockQuantity || 0);
        const required = Number(recipeIngredient.quantity);
        const available = stockQuantity >= required;

        return {
          ingredientId: product.id,
          ingredientName: product.name,
          required,
          unit: recipeIngredient.unit,
          stockQuantity,
          available,
        };
      }),
    );

    const allAvailable = ingredientChecks.every((check) => check.available);

    return {
      recipe,
      available: allAvailable,
      ingredients: ingredientChecks,
    };
  }

  /**
   * Get recipe statistics
   */
  async getStatistics(): Promise<{
    total: number;
    active: number;
    published: number;
    byCategory: Record<string, number>;
    byDifficulty: Record<string, number>;
    averageCost: number;
    averageTotalTime: number;
  }> {
    const recipes = await this.recipeRepository.find();

    const stats = {
      total: recipes.length,
      active: recipes.filter((r) => r.isActive).length,
      published: recipes.filter((r) => r.isPublished).length,
      byCategory: {} as Record<string, number>,
      byDifficulty: {} as Record<string, number>,
      averageCost: 0,
      averageTotalTime: 0,
    };

    recipes.forEach((recipe) => {
      // Category stats
      if (recipe.category) {
        stats.byCategory[recipe.category] = (stats.byCategory[recipe.category] || 0) + 1;
      }

      // Difficulty stats
      stats.byDifficulty[recipe.difficultyLevel] =
        (stats.byDifficulty[recipe.difficultyLevel] || 0) + 1;
    });

    // Calculate averages
    if (recipes.length > 0) {
      stats.averageCost =
        recipes.reduce((sum, r) => sum + Number(r.totalCost), 0) / recipes.length;
      stats.averageTotalTime =
        recipes.reduce((sum, r) => sum + Number(r.totalTime), 0) / recipes.length;
    }

    return stats;
  }
}
