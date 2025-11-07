import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, LessThanOrEqual, Between, In } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FilterProductDto } from './dto/filter-product.dto';
import { BulkStatusUpdateDto } from './dto/bulk-status-update.dto';
import { InventoryAdjustmentDto } from './dto/inventory-adjustment.dto';
import { CalculateBundleDto } from './dto/calculate-bundle.dto';
import { SearchAttributesDto } from './dto/search-attributes.dto';
import { UpdatePricingDto } from './dto/update-pricing.dto';
import { CustomFieldsDto } from './dto/custom-fields.dto';
import { GenerateBarcodeDto } from './dto/generate-barcode.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    // Check if SKU already exists
    const existingSku = await this.productRepository.findOne({
      where: { sku: createProductDto.sku },
    });
    if (existingSku) {
      throw new BadRequestException(`Product with SKU ${createProductDto.sku} already exists`);
    }

    const product = this.productRepository.create(createProductDto);
    return await this.productRepository.save(product);
  }

  async findAll(filterDto: FilterProductDto): Promise<{
    data: Product[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const { page = 1, limit = 10, search, categoryId, subcategoryId, status, lowStock, minPrice, maxPrice, tags, sortBy = 'createdAt', sortOrder = 'DESC' } = filterDto;

    const queryBuilder = this.productRepository.createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.subcategory', 'subcategory');

    // Search filter
    if (search) {
      queryBuilder.andWhere(
        '(product.name ILIKE :search OR product.sku ILIKE :search OR product.description ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Category filter
    if (categoryId) {
      queryBuilder.andWhere('product.categoryId = :categoryId', { categoryId });
    }

    // Subcategory filter
    if (subcategoryId) {
      queryBuilder.andWhere('product.subcategoryId = :subcategoryId', { subcategoryId });
    }

    // Status filter
    if (status) {
      queryBuilder.andWhere('product.status = :status', { status });
    }

    // Low stock filter
    if (lowStock === 'true') {
      queryBuilder.andWhere('product.stockQuantity <= product.lowStockThreshold');
    }

    // Price range filter
    if (minPrice !== undefined && maxPrice !== undefined) {
      queryBuilder.andWhere('product.price BETWEEN :minPrice AND :maxPrice', { minPrice, maxPrice });
    } else if (minPrice !== undefined) {
      queryBuilder.andWhere('product.price >= :minPrice', { minPrice });
    } else if (maxPrice !== undefined) {
      queryBuilder.andWhere('product.price <= :maxPrice', { maxPrice });
    }

    // Tags filter
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      queryBuilder.andWhere('product.tags && :tags', { tags: tagArray });
    }

    // Get total count before pagination
    const total = await queryBuilder.getCount();

    // Sorting
    const allowedSortFields = ['name', 'price', 'stockQuantity', 'createdAt'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    queryBuilder.orderBy(`product.${sortField}`, sortOrder);

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const data = await queryBuilder.getMany();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['category', 'subcategory'],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async findBySku(sku: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { sku },
      relations: ['category', 'subcategory'],
    });

    if (!product) {
      throw new NotFoundException(`Product with SKU ${sku} not found`);
    }

    return product;
  }

  async findByBarcode(barcode: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { barcode },
      relations: ['category', 'subcategory'],
    });

    if (!product) {
      throw new NotFoundException(`Product with barcode ${barcode} not found`);
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);

    // Check if SKU is being updated and if it already exists
    if (updateProductDto.sku && updateProductDto.sku !== product.sku) {
      const existingSku = await this.productRepository.findOne({
        where: { sku: updateProductDto.sku },
      });
      if (existingSku) {
        throw new BadRequestException(`Product with SKU ${updateProductDto.sku} already exists`);
      }
    }

    Object.assign(product, updateProductDto);
    return await this.productRepository.save(product);
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    await this.productRepository.remove(product);
  }

  async getLowStockProducts(threshold?: number): Promise<Product[]> {
    const queryBuilder = this.productRepository.createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.subcategory', 'subcategory')
      .where('product.trackInventory = :trackInventory', { trackInventory: true });

    if (threshold !== undefined) {
      queryBuilder.andWhere('product.stockQuantity <= :threshold', { threshold });
    } else {
      queryBuilder.andWhere('product.stockQuantity <= product.lowStockThreshold');
    }

    return await queryBuilder
      .orderBy('product.stockQuantity', 'ASC')
      .getMany();
  }

  async updateStock(id: string, quantity: number): Promise<Product> {
    const product = await this.findOne(id);

    if (!product.trackInventory) {
      throw new BadRequestException('Inventory tracking is not enabled for this product');
    }

    product.stockQuantity = quantity;
    return await this.productRepository.save(product);
  }

  async adjustStock(id: string, adjustment: number): Promise<Product> {
    const product = await this.findOne(id);

    if (!product.trackInventory) {
      throw new BadRequestException('Inventory tracking is not enabled for this product');
    }

    const newQuantity = product.stockQuantity + adjustment;
    if (newQuantity < 0 && !product.allowBackorder) {
      throw new BadRequestException('Insufficient stock and backorders are not allowed');
    }

    product.stockQuantity = newQuantity;
    return await this.productRepository.save(product);
  }

  async getStockValue(): Promise<{ totalValue: number; totalCost: number }> {
    const products = await this.productRepository.find({
      where: { trackInventory: true },
    });

    const totalValue = products.reduce((sum, product) => {
      return sum + (Number(product.price) * product.stockQuantity);
    }, 0);

    const totalCost = products.reduce((sum, product) => {
      return sum + (Number(product.cost) * product.stockQuantity);
    }, 0);

    return { totalValue, totalCost };
  }

  // New endpoints implementations

  async getProductStats(): Promise<{
    totalProducts: number;
    activeProducts: number;
    inactiveProducts: number;
    discontinuedProducts: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    averagePrice: number;
    totalStockValue: number;
  }> {
    const allProducts = await this.productRepository.find();

    const stats = {
      totalProducts: allProducts.length,
      activeProducts: allProducts.filter(p => p.isActive).length,
      inactiveProducts: allProducts.filter(p => !p.isActive).length,
      discontinuedProducts: 0, // Can be enhanced with status field
      lowStockProducts: allProducts.filter(p => p.trackInventory && p.stockQuantity <= p.reorderLevel).length,
      outOfStockProducts: allProducts.filter(p => p.trackInventory && p.stockQuantity === 0).length,
      averagePrice: allProducts.length > 0
        ? allProducts.reduce((sum, p) => sum + Number(p.price), 0) / allProducts.length
        : 0,
      totalStockValue: allProducts.reduce((sum, p) => sum + (Number(p.price) * p.stockQuantity), 0),
    };

    return stats;
  }

  async getOutOfStockProducts(): Promise<Product[]> {
    return await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.subcategory', 'subcategory')
      .where('product.trackInventory = :trackInventory', { trackInventory: true })
      .andWhere('product.stockQuantity = :quantity', { quantity: 0 })
      .orderBy('product.name', 'ASC')
      .getMany();
  }

  async bulkUpdateStatus(bulkStatusUpdateDto: BulkStatusUpdateDto): Promise<{ updated: number; failed: string[] }> {
    const { productIds, status } = bulkStatusUpdateDto;
    const failed: string[] = [];
    let updated = 0;

    for (const productId of productIds) {
      try {
        const product = await this.productRepository.findOne({ where: { id: productId } });
        if (product) {
          product.isActive = status === 'active';
          await this.productRepository.save(product);
          updated++;
        } else {
          failed.push(productId);
        }
      } catch (error) {
        failed.push(productId);
      }
    }

    return { updated, failed };
  }

  async inventoryAdjustment(id: string, inventoryAdjustmentDto: InventoryAdjustmentDto): Promise<Product> {
    const product = await this.findOne(id);

    if (!product.trackInventory) {
      throw new BadRequestException('Inventory tracking is not enabled for this product');
    }

    const newQuantity = product.stockQuantity + inventoryAdjustmentDto.quantity;
    if (newQuantity < 0 && !product.allowBackorder) {
      throw new BadRequestException('Insufficient stock and backorders are not allowed');
    }

    product.stockQuantity = newQuantity;

    // Store adjustment details in customFields if needed for audit trail
    if (!product.customFields) {
      product.customFields = {};
    }
    if (!product.customFields.adjustmentHistory) {
      product.customFields.adjustmentHistory = [];
    }
    product.customFields.adjustmentHistory.push({
      quantity: inventoryAdjustmentDto.quantity,
      reason: inventoryAdjustmentDto.reason,
      type: inventoryAdjustmentDto.type,
      timestamp: new Date(),
    });

    return await this.productRepository.save(product);
  }

  async getBundles(): Promise<Product[]> {
    const allProducts = await this.productRepository.find({
      relations: ['category', 'subcategory'],
    });

    // Filter products that have bundle information in customFields
    return allProducts.filter(product =>
      product.customFields &&
      (product.customFields.isBundle === true || product.customFields.bundle)
    );
  }

  async calculateBundlePrice(calculateBundleDto: CalculateBundleDto): Promise<{
    products: any[];
    subtotal: number;
    discountPercentage: number;
    discountAmount: number;
    total: number;
  }> {
    const { products, discountPercentage } = calculateBundleDto;

    const productDetails: any[] = [];
    let subtotal = 0;

    for (const item of products) {
      const product = await this.productRepository.findOne({
        where: { id: item.productId },
      });

      if (!product) {
        throw new NotFoundException(`Product with ID ${item.productId} not found`);
      }

      const itemTotal = Number(product.price) * item.quantity;
      subtotal += itemTotal;

      productDetails.push({
        id: product.id,
        name: product.name,
        sku: product.sku,
        price: Number(product.price),
        quantity: item.quantity,
        itemTotal,
      });
    }

    const discountAmount = (subtotal * discountPercentage) / 100;
    const total = subtotal - discountAmount;

    return {
      products: productDetails,
      subtotal,
      discountPercentage,
      discountAmount,
      total,
    };
  }

  async searchByAttributes(searchAttributesDto: SearchAttributesDto): Promise<{
    data: Product[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const { attributes, page = 1, limit = 10 } = searchAttributesDto;

    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.subcategory', 'subcategory');

    // Search for products with matching attributes
    for (const [key, value] of Object.entries(attributes)) {
      queryBuilder.andWhere(
        `product.attributes @> :attr${key}`,
        { [`attr${key}`]: JSON.stringify([{ name: key, value: value }]) }
      );
    }

    const total = await queryBuilder.getCount();
    const skip = (page - 1) * limit;

    const data = await queryBuilder
      .skip(skip)
      .take(limit)
      .getMany();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAvailableAttributes(): Promise<{
    attributes: { name: string; values: string[] }[];
  }> {
    const products = await this.productRepository.find();

    const attributesMap = new Map<string, Set<string>>();

    products.forEach(product => {
      if (product.attributes && Array.isArray(product.attributes)) {
        product.attributes.forEach((attr: any) => {
          if (attr.name && attr.value) {
            if (!attributesMap.has(attr.name)) {
              attributesMap.set(attr.name, new Set());
            }
            attributesMap.get(attr.name)?.add(attr.value);
          }
        });
      }
    });

    const attributes = Array.from(attributesMap.entries()).map(([name, values]) => ({
      name,
      values: Array.from(values),
    }));

    return { attributes };
  }

  async addCustomFields(id: string, customFieldsDto: CustomFieldsDto): Promise<Product> {
    const product = await this.findOne(id);

    if (!product.customFields) {
      product.customFields = {};
    }

    // Merge new fields with existing ones
    product.customFields = {
      ...product.customFields,
      ...customFieldsDto.fields,
    };

    return await this.productRepository.save(product);
  }

  async generateBarcode(generateBarcodeDto: GenerateBarcodeDto): Promise<{
    productId: string;
    barcode: string;
    format: string;
  }> {
    const { productId, format = 'EAN13' } = generateBarcodeDto;
    const product = await this.findOne(productId);

    // If product already has a barcode, return it
    if (product.barcode) {
      return {
        productId: product.id,
        barcode: product.barcode,
        format,
      };
    }

    // Generate a simple barcode (in production, use a proper barcode generation library)
    let barcode: string;
    switch (format) {
      case 'EAN13':
        // Generate 13-digit barcode
        barcode = this.generateEAN13();
        break;
      case 'CODE128':
        // Generate CODE128 barcode
        barcode = `CODE128-${Date.now()}`;
        break;
      case 'UPC':
        // Generate 12-digit UPC
        barcode = this.generateUPC();
        break;
      default:
        barcode = this.generateEAN13();
    }

    // Save barcode to product
    product.barcode = barcode;
    await this.productRepository.save(product);

    return {
      productId: product.id,
      barcode,
      format,
    };
  }

  private generateEAN13(): string {
    // Generate 12 random digits
    let barcode = '';
    for (let i = 0; i < 12; i++) {
      barcode += Math.floor(Math.random() * 10);
    }

    // Calculate check digit
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(barcode[i]);
      sum += i % 2 === 0 ? digit : digit * 3;
    }
    const checkDigit = (10 - (sum % 10)) % 10;

    return barcode + checkDigit;
  }

  private generateUPC(): string {
    // Generate 11 random digits
    let barcode = '';
    for (let i = 0; i < 11; i++) {
      barcode += Math.floor(Math.random() * 10);
    }

    // Calculate check digit
    let sum = 0;
    for (let i = 0; i < 11; i++) {
      const digit = parseInt(barcode[i]);
      sum += i % 2 === 0 ? digit * 3 : digit;
    }
    const checkDigit = (10 - (sum % 10)) % 10;

    return barcode + checkDigit;
  }

  async getProductsByPricingTier(tier: string): Promise<Product[]> {
    const allProducts = await this.productRepository.find({
      relations: ['category', 'subcategory'],
    });

    // Filter products that have pricing information in customFields
    return allProducts.filter(product =>
      product.customFields &&
      product.customFields.pricing &&
      product.customFields.pricing[tier] !== undefined
    );
  }

  async updatePricing(id: string, updatePricingDto: UpdatePricingDto): Promise<Product> {
    const product = await this.findOne(id);

    if (!product.customFields) {
      product.customFields = {};
    }

    product.customFields.pricing = updatePricingDto.pricing;

    // Also update the base price to match retail price
    if (updatePricingDto.pricing.retail) {
      product.price = updatePricingDto.pricing.retail;
    }

    return await this.productRepository.save(product);
  }

  async getProductsBySubcategory(subcategoryId: string): Promise<{
    data: Product[];
    meta: {
      total: number;
      subcategoryId: string;
    };
  }> {
    const products = await this.productRepository.find({
      where: { subcategoryId },
      relations: ['category', 'subcategory'],
      order: { name: 'ASC' },
    });

    return {
      data: products,
      meta: {
        total: products.length,
        subcategoryId,
      },
    };
  }
}
