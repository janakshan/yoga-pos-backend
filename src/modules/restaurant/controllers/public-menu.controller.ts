import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Public } from '../../../common/decorators/public.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { Category } from '../../categories/entities/category.entity';
import { ModifierGroup } from '../modifiers/entities/modifier-group.entity';

@ApiTags('Public Menu')
@Controller('public/menu')
export class PublicMenuController {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(ModifierGroup)
    private readonly modifierGroupRepository: Repository<ModifierGroup>,
  ) {}

  @Get('branches/:branchId')
  @Public()
  @ApiOperation({ summary: 'Get complete menu for a branch (public access)' })
  @ApiQuery({ name: 'includeModifiers', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Menu retrieved successfully' })
  async getMenu(
    @Param('branchId') branchId: string,
    @Query('includeModifiers') includeModifiers?: boolean,
  ) {
    // Get all active categories
    const categories = await this.categoryRepository.find({
      where: { isActive: true },
      order: { displayOrder: 'ASC', name: 'ASC' },
    });

    // Get all active and available products for the branch
    const products = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.modifierGroups', 'modifierGroups')
      .leftJoinAndSelect('modifierGroups.modifiers', 'modifiers')
      .where('product.isActive = :isActive', { isActive: true })
      .andWhere('product.isAvailable = :isAvailable', { isAvailable: true })
      .andWhere('(product.branchId = :branchId OR product.branchId IS NULL)', { branchId })
      .orderBy('product.menuSortOrder', 'ASC')
      .addOrderBy('product.name', 'ASC')
      .getMany();

    // Group products by category
    const menuByCategory = categories.map((category) => ({
      category: {
        id: category.id,
        name: category.name,
        description: category.description,
        image: category.image,
      },
      products: products
        .filter((p) => p.categoryId === category.id)
        .map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price,
          image: p.image,
          isPopular: p.isPopular,
          isRecommended: p.isRecommended,
          isNew: p.isNew,
          isSeasonal: p.isSeasonal,
          isSpicy: p.isSpicy,
          spicinessLevel: p.spicinessLevel,
          allergens: p.allergens,
          dietaryRestrictions: p.dietaryRestrictions,
          nutritionalInfo: p.nutritionalInfo,
          preparationTime: p.preparationTime,
          tags: p.tags,
          hasSizeVariations: p.hasSizeVariations,
          sizeVariations: p.sizeVariations,
          modifierGroups: includeModifiers
            ? p.modifierGroups?.map((mg) => ({
                id: mg.id,
                name: mg.name,
                displayName: mg.displayName,
                type: mg.type,
                selectionType: mg.selectionType,
                minSelections: mg.minSelections,
                maxSelections: mg.maxSelections,
                sortOrder: mg.sortOrder,
                modifiers: mg.modifiers
                  ?.filter((m) => m.isActive && m.isAvailable)
                  .map((m) => ({
                    id: m.id,
                    name: m.name,
                    priceAdjustmentType: m.priceAdjustmentType,
                    priceAdjustment: m.priceAdjustment,
                    isDefault: m.isDefault,
                    imageUrl: m.imageUrl,
                    nutritionalInfo: m.nutritionalInfo,
                  })),
              }))
            : undefined,
        })),
    })).filter((cat) => cat.products.length > 0);

    return {
      categories: menuByCategory,
      totalCategories: menuByCategory.length,
      totalProducts: products.length,
    };
  }

  @Get('branches/:branchId/categories')
  @Public()
  @ApiOperation({ summary: 'Get all categories for a branch (public access)' })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  async getCategories(@Param('branchId') branchId: string) {
    const categories = await this.categoryRepository.find({
      where: { isActive: true },
      order: { displayOrder: 'ASC', name: 'ASC' },
    });

    return categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      image: cat.image,
      parentId: cat.parentId,
    }));
  }

  @Get('branches/:branchId/categories/:categoryId/products')
  @Public()
  @ApiOperation({ summary: 'Get products in a category (public access)' })
  @ApiQuery({ name: 'includeModifiers', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
  async getCategoryProducts(
    @Param('branchId') branchId: string,
    @Param('categoryId') categoryId: string,
    @Query('includeModifiers') includeModifiers?: boolean,
  ) {
    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.categoryId = :categoryId', { categoryId })
      .andWhere('product.isActive = :isActive', { isActive: true })
      .andWhere('product.isAvailable = :isAvailable', { isAvailable: true })
      .andWhere('(product.branchId = :branchId OR product.branchId IS NULL)', { branchId })
      .orderBy('product.menuSortOrder', 'ASC')
      .addOrderBy('product.name', 'ASC');

    if (includeModifiers) {
      queryBuilder
        .leftJoinAndSelect('product.modifierGroups', 'modifierGroups')
        .leftJoinAndSelect('modifierGroups.modifiers', 'modifiers');
    }

    const products = await queryBuilder.getMany();

    return products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      image: p.image,
      isPopular: p.isPopular,
      isRecommended: p.isRecommended,
      isNew: p.isNew,
      isSeasonal: p.isSeasonal,
      isSpicy: p.isSpicy,
      spicinessLevel: p.spicinessLevel,
      allergens: p.allergens,
      dietaryRestrictions: p.dietaryRestrictions,
      nutritionalInfo: p.nutritionalInfo,
      preparationTime: p.preparationTime,
      tags: p.tags,
      hasSizeVariations: p.hasSizeVariations,
      sizeVariations: p.sizeVariations,
      modifierGroups: includeModifiers
        ? p.modifierGroups?.map((mg) => ({
            id: mg.id,
            name: mg.name,
            displayName: mg.displayName,
            type: mg.type,
            selectionType: mg.selectionType,
            minSelections: mg.minSelections,
            maxSelections: mg.maxSelections,
            sortOrder: mg.sortOrder,
            modifiers: mg.modifiers
              ?.filter((m) => m.isActive && m.isAvailable)
              .map((m) => ({
                id: m.id,
                name: m.name,
                priceAdjustmentType: m.priceAdjustmentType,
                priceAdjustment: m.priceAdjustment,
                isDefault: m.isDefault,
                imageUrl: m.imageUrl,
                nutritionalInfo: m.nutritionalInfo,
              })),
          }))
        : undefined,
    }));
  }

  @Get('products/:productId')
  @Public()
  @ApiOperation({ summary: 'Get product details (public access)' })
  @ApiResponse({ status: 200, description: 'Product retrieved successfully' })
  async getProduct(@Param('productId') productId: string) {
    const product = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.modifierGroups', 'modifierGroups')
      .leftJoinAndSelect('modifierGroups.modifiers', 'modifiers')
      .where('product.id = :productId', { productId })
      .andWhere('product.isActive = :isActive', { isActive: true })
      .andWhere('product.isAvailable = :isAvailable', { isAvailable: true })
      .getOne();

    if (!product) {
      throw new Error('Product not found or not available');
    }

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      image: product.image,
      category: product.category
        ? {
            id: product.category.id,
            name: product.category.name,
          }
        : null,
      isPopular: product.isPopular,
      isRecommended: product.isRecommended,
      isNew: product.isNew,
      isSeasonal: product.isSeasonal,
      isSpicy: product.isSpicy,
      spicinessLevel: product.spicinessLevel,
      allergens: product.allergens,
      dietaryRestrictions: product.dietaryRestrictions,
      nutritionalInfo: product.nutritionalInfo,
      preparationTime: product.preparationTime,
      tags: product.tags,
      hasSizeVariations: product.hasSizeVariations,
      sizeVariations: product.sizeVariations,
      modifierGroups: product.modifierGroups?.map((mg) => ({
        id: mg.id,
        name: mg.name,
        displayName: mg.displayName,
        type: mg.type,
        selectionType: mg.selectionType,
        minSelections: mg.minSelections,
        maxSelections: mg.maxSelections,
        sortOrder: mg.sortOrder,
        modifiers: mg.modifiers
          ?.filter((m) => m.isActive && m.isAvailable)
          .map((m) => ({
            id: m.id,
            name: m.name,
            priceAdjustmentType: m.priceAdjustmentType,
            priceAdjustment: m.priceAdjustment,
            isDefault: m.isDefault,
            imageUrl: m.imageUrl,
            nutritionalInfo: m.nutritionalInfo,
          })),
      })),
    };
  }

  @Get('branches/:branchId/featured')
  @Public()
  @ApiOperation({ summary: 'Get featured products (popular, recommended, new)' })
  @ApiResponse({ status: 200, description: 'Featured products retrieved successfully' })
  async getFeaturedProducts(@Param('branchId') branchId: string) {
    const popular = await this.productRepository.find({
      where: {
        isActive: true,
        isAvailable: true,
        isPopular: true,
      },
      take: 10,
      order: { menuSortOrder: 'ASC' },
    });

    const recommended = await this.productRepository.find({
      where: {
        isActive: true,
        isAvailable: true,
        isRecommended: true,
      },
      take: 10,
      order: { menuSortOrder: 'ASC' },
    });

    const newItems = await this.productRepository.find({
      where: {
        isActive: true,
        isAvailable: true,
        isNew: true,
      },
      take: 10,
      order: { createdAt: 'DESC' },
    });

    return {
      popular: popular.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        image: p.image,
      })),
      recommended: recommended.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        image: p.image,
      })),
      new: newItems.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        image: p.image,
      })),
    };
  }

  @Get('branches/:branchId/search')
  @Public()
  @ApiOperation({ summary: 'Search products by name or description' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  @ApiResponse({ status: 200, description: 'Search results retrieved successfully' })
  async searchProducts(@Param('branchId') branchId: string, @Query('q') query: string) {
    const products = await this.productRepository
      .createQueryBuilder('product')
      .where('product.isActive = :isActive', { isActive: true })
      .andWhere('product.isAvailable = :isAvailable', { isAvailable: true })
      .andWhere('(product.branchId = :branchId OR product.branchId IS NULL)', { branchId })
      .andWhere(
        '(LOWER(product.name) LIKE LOWER(:query) OR LOWER(product.description) LIKE LOWER(:query))',
        { query: `%${query}%` },
      )
      .take(20)
      .getMany();

    return products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      image: p.image,
      categoryId: p.categoryId,
    }));
  }
}
