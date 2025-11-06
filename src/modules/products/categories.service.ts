import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    // Validate parent category exists if parentId is provided
    if (createCategoryDto.parentId) {
      const parent = await this.categoryRepository.findOne({
        where: { id: createCategoryDto.parentId },
      });
      if (!parent) {
        throw new NotFoundException(
          `Parent category with ID ${createCategoryDto.parentId} not found`,
        );
      }
    }

    const category = this.categoryRepository.create(createCategoryDto);
    return await this.categoryRepository.save(category);
  }

  async findAll(): Promise<Category[]> {
    return await this.categoryRepository.find({
      relations: ['parent', 'subcategories'],
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async findMainCategories(): Promise<Category[]> {
    return await this.categoryRepository.find({
      where: { parentId: IsNull() },
      relations: ['subcategories'],
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async findSubcategories(parentId: string): Promise<Category[]> {
    const parent = await this.categoryRepository.findOne({
      where: { id: parentId },
    });
    if (!parent) {
      throw new NotFoundException(`Category with ID ${parentId} not found`);
    }

    return await this.categoryRepository.find({
      where: { parentId },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['parent', 'subcategories'],
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    const category = await this.findOne(id);

    // Prevent setting self as parent
    if (updateCategoryDto.parentId && updateCategoryDto.parentId === id) {
      throw new BadRequestException('Category cannot be its own parent');
    }

    // Validate parent category exists if parentId is provided
    if (updateCategoryDto.parentId) {
      const parent = await this.categoryRepository.findOne({
        where: { id: updateCategoryDto.parentId },
      });
      if (!parent) {
        throw new NotFoundException(
          `Parent category with ID ${updateCategoryDto.parentId} not found`,
        );
      }
    }

    Object.assign(category, updateCategoryDto);
    return await this.categoryRepository.save(category);
  }

  async remove(id: string): Promise<void> {
    const category = await this.findOne(id);

    // Check if category has subcategories
    const subcategories = await this.categoryRepository.count({
      where: { parentId: id },
    });
    if (subcategories > 0) {
      throw new BadRequestException(
        'Cannot delete category with subcategories. Please delete subcategories first.',
      );
    }

    await this.categoryRepository.remove(category);
  }
}
