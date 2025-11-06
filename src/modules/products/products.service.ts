import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, LessThanOrEqual, Between } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FilterProductDto } from './dto/filter-product.dto';

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
}
