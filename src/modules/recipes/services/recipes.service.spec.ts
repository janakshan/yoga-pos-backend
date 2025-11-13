import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { RecipesService } from './recipes.service';
import { Recipe } from '../entities/recipe.entity';
import { RecipeIngredient } from '../entities/recipe-ingredient.entity';
import { Product } from '../../products/entities/product.entity';

describe('RecipesService', () => {
  let service: RecipesService;
  let recipeRepository: Repository<Recipe>;
  let recipeIngredientRepository: Repository<RecipeIngredient>;
  let productRepository: Repository<Product>;

  const mockRecipeRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockRecipeIngredientRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockProductRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockProduct = {
    id: 'product-123',
    name: 'Flour',
    sku: 'FLR-001',
    cost: 2.5,
    stockQuantity: 100,
  };

  const mockIngredient = {
    id: 'ingredient-456',
    name: 'Salt',
    sku: 'SLT-001',
    cost: 1.0,
    stockQuantity: 50,
  };

  const mockRecipe = {
    id: 'recipe-123',
    name: 'Margherita Pizza',
    code: 'RCP-001',
    description: 'Classic Italian pizza',
    productId: 'product-123',
    prepTime: 15,
    cookTime: 20,
    totalTime: 35,
    yieldQuantity: 4,
    yieldUnit: 'portions',
    servingSize: 1,
    ingredientCost: 10.5,
    laborCost: 5.0,
    overheadCost: 2.0,
    totalCost: 17.5,
    costPerServing: 4.375,
    wastePercentage: 5,
    difficultyLevel: 'medium',
    isActive: true,
    isPublished: true,
    ingredients: [],
  };

  const mockRecipeIngredient = {
    id: 'ing-123',
    recipeId: 'recipe-123',
    ingredientId: 'product-123',
    ingredientName: 'Flour',
    ingredientSku: 'FLR-001',
    quantity: 2,
    unit: 'kg',
    unitCost: 2.5,
    totalCost: 5.0,
    sortOrder: 1,
    ingredient: mockProduct,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecipesService,
        {
          provide: getRepositoryToken(Recipe),
          useValue: mockRecipeRepository,
        },
        {
          provide: getRepositoryToken(RecipeIngredient),
          useValue: mockRecipeIngredientRepository,
        },
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
      ],
    }).compile();

    service = module.get<RecipesService>(RecipesService);
    recipeRepository = module.get<Repository<Recipe>>(getRepositoryToken(Recipe));
    recipeIngredientRepository = module.get<Repository<RecipeIngredient>>(
      getRepositoryToken(RecipeIngredient),
    );
    productRepository = module.get<Repository<Product>>(getRepositoryToken(Product));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new recipe with ingredients', async () => {
      const createDto = {
        name: 'Margherita Pizza',
        code: 'RCP-001',
        prepTime: 15,
        cookTime: 20,
        yieldQuantity: 4,
        yieldUnit: 'portions',
        ingredients: [
          {
            ingredientId: 'product-123',
            quantity: 2,
            unit: 'kg',
          },
        ],
      };

      mockRecipeRepository.findOne.mockResolvedValue(null);
      mockProductRepository.findOne.mockResolvedValue(mockProduct);
      mockProductRepository.find.mockResolvedValue([mockProduct]);
      mockRecipeRepository.create.mockReturnValue(mockRecipe);
      mockRecipeRepository.save.mockResolvedValue(mockRecipe);
      mockRecipeIngredientRepository.create.mockReturnValue(mockRecipeIngredient);
      mockRecipeIngredientRepository.save.mockResolvedValue([mockRecipeIngredient]);

      // Mock findOne for the final result
      mockRecipeRepository.findOne.mockResolvedValueOnce(null); // For duplicate check
      mockRecipeRepository.findOne.mockResolvedValueOnce({
        ...mockRecipe,
        ingredients: [mockRecipeIngredient],
      }); // For final result

      const result = await service.create(createDto as any, 'user-123');

      expect(mockRecipeRepository.create).toHaveBeenCalled();
      expect(mockRecipeRepository.save).toHaveBeenCalled();
      expect(mockRecipeIngredientRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if recipe code already exists', async () => {
      const createDto = {
        name: 'Margherita Pizza',
        code: 'RCP-001',
        prepTime: 15,
        cookTime: 20,
        yieldQuantity: 4,
        yieldUnit: 'portions',
        ingredients: [],
      };

      mockRecipeRepository.findOne.mockResolvedValue(mockRecipe);

      await expect(service.create(createDto as any)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if product does not exist', async () => {
      const createDto = {
        name: 'Margherita Pizza',
        code: 'RCP-001',
        productId: 'invalid-product',
        prepTime: 15,
        cookTime: 20,
        yieldQuantity: 4,
        yieldUnit: 'portions',
        ingredients: [],
      };

      mockRecipeRepository.findOne.mockResolvedValue(null);
      mockProductRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createDto as any)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if ingredient products not found', async () => {
      const createDto = {
        name: 'Margherita Pizza',
        code: 'RCP-001',
        prepTime: 15,
        cookTime: 20,
        yieldQuantity: 4,
        yieldUnit: 'portions',
        ingredients: [
          {
            ingredientId: 'product-123',
            quantity: 2,
            unit: 'kg',
          },
          {
            ingredientId: 'product-456',
            quantity: 1,
            unit: 'kg',
          },
        ],
      };

      mockRecipeRepository.findOne.mockResolvedValue(null);
      mockProductRepository.find.mockResolvedValue([mockProduct]); // Only one product found

      await expect(service.create(createDto as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return paginated recipes with filters', async () => {
      const filterDto = {
        page: 1,
        limit: 10,
        search: 'pizza',
        sortBy: 'createdAt',
        sortOrder: 'DESC' as 'DESC',
      };

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        getMany: jest.fn().mockResolvedValue([mockRecipe]),
      };

      mockRecipeRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll(filterDto);

      expect(result).toEqual({
        data: [mockRecipe],
        total: 1,
        page: 1,
        limit: 10,
      });
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalled();
      expect(mockQueryBuilder.getMany).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a recipe by ID', async () => {
      mockRecipeRepository.findOne.mockResolvedValue({
        ...mockRecipe,
        ingredients: [mockRecipeIngredient],
      });

      const result = await service.findOne('recipe-123');

      expect(result).toBeDefined();
      expect(result.id).toBe('recipe-123');
      expect(mockRecipeRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'recipe-123' },
        relations: ['ingredients', 'ingredients.ingredient', 'product', 'createdByUser', 'updatedByUser'],
      });
    });

    it('should throw NotFoundException if recipe not found', async () => {
      mockRecipeRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByCode', () => {
    it('should return a recipe by code', async () => {
      mockRecipeRepository.findOne.mockResolvedValue(mockRecipe);

      const result = await service.findByCode('RCP-001');

      expect(result).toBeDefined();
      expect(result.code).toBe('RCP-001');
      expect(mockRecipeRepository.findOne).toHaveBeenCalledWith({
        where: { code: 'RCP-001' },
        relations: ['ingredients', 'ingredients.ingredient', 'product'],
      });
    });

    it('should throw NotFoundException if recipe not found', async () => {
      mockRecipeRepository.findOne.mockResolvedValue(null);

      await expect(service.findByCode('invalid-code')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a recipe', async () => {
      const updateDto = {
        name: 'Updated Pizza',
        prepTime: 20,
      };

      mockRecipeRepository.findOne.mockResolvedValueOnce({
        ...mockRecipe,
        ingredients: [mockRecipeIngredient],
      });
      mockRecipeRepository.update.mockResolvedValue({ affected: 1 } as any);
      mockRecipeRepository.findOne.mockResolvedValueOnce({
        ...mockRecipe,
        ...updateDto,
        ingredients: [mockRecipeIngredient],
      });

      const result = await service.update('recipe-123', updateDto, 'user-123');

      expect(mockRecipeRepository.update).toHaveBeenCalled();
      expect(result.name).toBe('Updated Pizza');
    });

    it('should throw BadRequestException if new code already exists', async () => {
      const updateDto = {
        code: 'RCP-002',
      };

      mockRecipeRepository.findOne.mockResolvedValueOnce({
        ...mockRecipe,
        ingredients: [mockRecipeIngredient],
      });
      mockRecipeRepository.findOne.mockResolvedValueOnce({
        id: 'different-recipe',
        code: 'RCP-002',
      } as any);

      await expect(service.update('recipe-123', updateDto, 'user-123')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('remove', () => {
    it('should remove a recipe', async () => {
      mockRecipeRepository.findOne.mockResolvedValue({
        ...mockRecipe,
        ingredients: [mockRecipeIngredient],
      });
      mockRecipeRepository.remove.mockResolvedValue(mockRecipe);

      await service.remove('recipe-123');

      expect(mockRecipeRepository.remove).toHaveBeenCalled();
    });

    it('should throw NotFoundException if recipe not found', async () => {
      mockRecipeRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('recalculateCosts', () => {
    it('should recalculate recipe costs', async () => {
      const recipeWithIngredients = {
        ...mockRecipe,
        ingredients: [
          {
            ...mockRecipeIngredient,
            quantity: 2,
            unitCost: 2.5,
            totalCost: 5.0,
          },
          {
            id: 'ing-456',
            quantity: 1,
            unitCost: 3.0,
            totalCost: 3.0,
          },
        ],
      };

      mockRecipeRepository.findOne.mockResolvedValue(recipeWithIngredients);
      mockRecipeRepository.update.mockResolvedValue({ affected: 1 } as any);

      const result = await service.recalculateCosts('recipe-123');

      expect(mockRecipeRepository.update).toHaveBeenCalled();
    });
  });

  describe('scaleRecipe', () => {
    it('should scale recipe by factor', async () => {
      const recipeWithIngredients = {
        ...mockRecipe,
        ingredients: [mockRecipeIngredient],
      };

      mockRecipeRepository.findOne.mockResolvedValue(recipeWithIngredients);

      const result = await service.scaleRecipe('recipe-123', {
        scaleFactor: 2,
        recalculateCosts: false,
      });

      expect(result.scaled.recipe.yieldQuantity).toBe(8); // 4 * 2
      expect(result.scaled.ingredients[0].quantity).toBe(4); // 2 * 2
    });
  });

  describe('scaleRecipeByYield', () => {
    it('should scale recipe to desired yield', async () => {
      const recipeWithIngredients = {
        ...mockRecipe,
        ingredients: [mockRecipeIngredient],
        yieldQuantity: 4,
      };

      mockRecipeRepository.findOne.mockResolvedValue(recipeWithIngredients);

      const result = await service.scaleRecipeByYield('recipe-123', {
        desiredYield: 8,
        recalculateCosts: false,
      });

      expect(result.scaled.recipe.yieldQuantity).toBe(8);
    });
  });

  describe('getCostBreakdown', () => {
    it('should return detailed cost breakdown', async () => {
      const recipeWithIngredients = {
        ...mockRecipe,
        ingredients: [mockRecipeIngredient],
      };

      mockRecipeRepository.findOne.mockResolvedValue(recipeWithIngredients);

      const result = await service.getCostBreakdown('recipe-123');

      expect(result.recipe).toBeDefined();
      expect(result.breakdown).toBeDefined();
      expect(result.breakdown.ingredients).toHaveLength(1);
      expect(result.breakdown.ingredientCost).toBeDefined();
    });
  });

  describe('checkIngredientAvailability', () => {
    it('should check ingredient availability', async () => {
      const recipeWithIngredients = {
        ...mockRecipe,
        ingredients: [
          {
            ...mockRecipeIngredient,
            quantity: 2,
            ingredient: {
              ...mockProduct,
              stockQuantity: 100,
            },
          },
        ],
      };

      mockRecipeRepository.findOne.mockResolvedValue(recipeWithIngredients);

      const result = await service.checkIngredientAvailability('recipe-123');

      expect(result.available).toBe(true);
      expect(result.ingredients).toHaveLength(1);
      expect(result.ingredients[0].available).toBe(true);
    });

    it('should return false if ingredient not available', async () => {
      const recipeWithIngredients = {
        ...mockRecipe,
        ingredients: [
          {
            ...mockRecipeIngredient,
            quantity: 200, // More than stock
            ingredient: {
              ...mockProduct,
              stockQuantity: 100,
            },
          },
        ],
      };

      mockRecipeRepository.findOne.mockResolvedValue(recipeWithIngredients);

      const result = await service.checkIngredientAvailability('recipe-123');

      expect(result.available).toBe(false);
      expect(result.ingredients[0].available).toBe(false);
    });
  });

  describe('getStatistics', () => {
    it('should return recipe statistics', async () => {
      const mockRecipes = [
        { ...mockRecipe, category: 'Pizza', difficultyLevel: 'medium', totalCost: 17.5, totalTime: 35 },
        {
          ...mockRecipe,
          id: 'recipe-456',
          category: 'Pasta',
          difficultyLevel: 'easy',
          totalCost: 12.0,
          totalTime: 25,
        },
      ];

      mockRecipeRepository.find.mockResolvedValue(mockRecipes);

      const result = await service.getStatistics();

      expect(result.total).toBe(2);
      expect(result.byCategory).toHaveProperty('Pizza', 1);
      expect(result.byCategory).toHaveProperty('Pasta', 1);
      expect(result.byDifficulty).toHaveProperty('medium', 1);
      expect(result.byDifficulty).toHaveProperty('easy', 1);
      expect(result.averageCost).toBe(14.75);
      expect(result.averageTotalTime).toBe(30);
    });
  });

  describe('getRecipesByProduct', () => {
    it('should return recipes for a specific product', async () => {
      mockRecipeRepository.find.mockResolvedValue([mockRecipe]);

      const result = await service.getRecipesByProduct('product-123');

      expect(result).toHaveLength(1);
      expect(mockRecipeRepository.find).toHaveBeenCalledWith({
        where: { productId: 'product-123' },
        relations: ['ingredients', 'ingredients.ingredient'],
      });
    });
  });
});
