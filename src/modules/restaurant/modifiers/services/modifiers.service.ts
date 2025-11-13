import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Modifier } from '../entities/modifier.entity';
import { ModifierGroup } from '../entities/modifier-group.entity';
import { Product } from '../../../products/entities/product.entity';
import { CreateModifierDto } from '../dto/create-modifier.dto';
import { UpdateModifierDto } from '../dto/update-modifier.dto';
import { CreateModifierGroupDto } from '../dto/create-modifier-group.dto';
import { UpdateModifierGroupDto } from '../dto/update-modifier-group.dto';
import { FilterModifierDto } from '../dto/filter-modifier.dto';
import { FilterModifierGroupDto } from '../dto/filter-modifier-group.dto';
import { ValidateModifierSelectionDto } from '../dto/validate-modifier-selection.dto';

@Injectable()
export class ModifiersService {
  constructor(
    @InjectRepository(Modifier)
    private readonly modifierRepository: Repository<Modifier>,
    @InjectRepository(ModifierGroup)
    private readonly modifierGroupRepository: Repository<ModifierGroup>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  // ===== Modifier CRUD Operations =====

  async createModifier(createDto: CreateModifierDto): Promise<Modifier> {
    // Verify modifier group exists
    const modifierGroup = await this.modifierGroupRepository.findOne({
      where: { id: createDto.modifierGroupId },
    });

    if (!modifierGroup) {
      throw new NotFoundException(
        `Modifier group with ID ${createDto.modifierGroupId} not found`,
      );
    }

    // Check if SKU is unique (if provided)
    if (createDto.sku) {
      const existing = await this.modifierRepository.findOne({
        where: { sku: createDto.sku, branchId: createDto.branchId },
      });
      if (existing) {
        throw new BadRequestException(
          `Modifier with SKU ${createDto.sku} already exists`,
        );
      }
    }

    const modifier = this.modifierRepository.create(createDto);
    return this.modifierRepository.save(modifier);
  }

  async findAllModifiers(
    filterDto: FilterModifierDto,
  ): Promise<{ data: Modifier[]; meta: any }> {
    const {
      branchId,
      modifierGroupId,
      search,
      isActive,
      isAvailable,
      page = 1,
      limit = 20,
      sortBy = 'sortOrder',
      sortOrder = 'ASC',
    } = filterDto;

    const query = this.modifierRepository
      .createQueryBuilder('modifier')
      .leftJoinAndSelect('modifier.modifierGroup', 'modifierGroup')
      .leftJoinAndSelect('modifier.branch', 'branch');

    // Filters
    if (branchId) {
      query.andWhere('modifier.branchId = :branchId', { branchId });
    }

    if (modifierGroupId) {
      query.andWhere('modifier.modifierGroupId = :modifierGroupId', {
        modifierGroupId,
      });
    }

    if (search) {
      query.andWhere(
        '(modifier.name ILIKE :search OR modifier.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (isActive !== undefined) {
      query.andWhere('modifier.isActive = :isActive', { isActive });
    }

    if (isAvailable !== undefined) {
      query.andWhere('modifier.isAvailable = :isAvailable', { isAvailable });
    }

    // Sorting
    query.orderBy(`modifier.${sortBy}`, sortOrder);

    // Pagination
    const skip = (page - 1) * limit;
    query.skip(skip).take(limit);

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOneModifier(id: string): Promise<Modifier> {
    const modifier = await this.modifierRepository.findOne({
      where: { id },
      relations: ['modifierGroup', 'branch'],
    });

    if (!modifier) {
      throw new NotFoundException(`Modifier with ID ${id} not found`);
    }

    return modifier;
  }

  async updateModifier(
    id: string,
    updateDto: UpdateModifierDto,
  ): Promise<Modifier> {
    const modifier = await this.findOneModifier(id);

    // Check SKU uniqueness if being updated
    if (updateDto.sku && updateDto.sku !== modifier.sku) {
      const existing = await this.modifierRepository.findOne({
        where: { sku: updateDto.sku, branchId: modifier.branchId },
      });
      if (existing && existing.id !== id) {
        throw new BadRequestException(
          `Modifier with SKU ${updateDto.sku} already exists`,
        );
      }
    }

    Object.assign(modifier, updateDto);
    return this.modifierRepository.save(modifier);
  }

  async removeModifier(id: string): Promise<void> {
    const modifier = await this.findOneModifier(id);
    await this.modifierRepository.remove(modifier);
  }

  // ===== Modifier Group CRUD Operations =====

  async createModifierGroup(
    createDto: CreateModifierGroupDto,
  ): Promise<ModifierGroup> {
    const modifierGroup = this.modifierGroupRepository.create(createDto);
    return this.modifierGroupRepository.save(modifierGroup);
  }

  async findAllModifierGroups(
    filterDto: FilterModifierGroupDto,
  ): Promise<{ data: ModifierGroup[]; meta: any }> {
    const {
      branchId,
      search,
      category,
      type,
      selectionType,
      isActive,
      showInPos,
      showInOnlineMenu,
      page = 1,
      limit = 20,
      sortBy = 'sortOrder',
      sortOrder = 'ASC',
    } = filterDto;

    const query = this.modifierGroupRepository
      .createQueryBuilder('modifierGroup')
      .leftJoinAndSelect('modifierGroup.modifiers', 'modifiers')
      .leftJoinAndSelect('modifierGroup.branch', 'branch');

    // Filters
    if (branchId) {
      query.andWhere('modifierGroup.branchId = :branchId', { branchId });
    }

    if (search) {
      query.andWhere(
        '(modifierGroup.name ILIKE :search OR modifierGroup.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (category) {
      query.andWhere('modifierGroup.category = :category', { category });
    }

    if (type) {
      query.andWhere('modifierGroup.type = :type', { type });
    }

    if (selectionType) {
      query.andWhere('modifierGroup.selectionType = :selectionType', {
        selectionType,
      });
    }

    if (isActive !== undefined) {
      query.andWhere('modifierGroup.isActive = :isActive', { isActive });
    }

    if (showInPos !== undefined) {
      query.andWhere('modifierGroup.showInPos = :showInPos', { showInPos });
    }

    if (showInOnlineMenu !== undefined) {
      query.andWhere('modifierGroup.showInOnlineMenu = :showInOnlineMenu', {
        showInOnlineMenu,
      });
    }

    // Sorting
    query.orderBy(`modifierGroup.${sortBy}`, sortOrder);

    // Also sort modifiers within each group
    query.addOrderBy('modifiers.sortOrder', 'ASC');

    // Pagination
    const skip = (page - 1) * limit;
    query.skip(skip).take(limit);

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOneModifierGroup(id: string): Promise<ModifierGroup> {
    const modifierGroup = await this.modifierGroupRepository.findOne({
      where: { id },
      relations: ['modifiers', 'branch'],
    });

    if (!modifierGroup) {
      throw new NotFoundException(`Modifier group with ID ${id} not found`);
    }

    return modifierGroup;
  }

  async updateModifierGroup(
    id: string,
    updateDto: UpdateModifierGroupDto,
  ): Promise<ModifierGroup> {
    const modifierGroup = await this.findOneModifierGroup(id);

    Object.assign(modifierGroup, updateDto);
    return this.modifierGroupRepository.save(modifierGroup);
  }

  async removeModifierGroup(id: string): Promise<void> {
    const modifierGroup = await this.findOneModifierGroup(id);
    await this.modifierGroupRepository.remove(modifierGroup);
  }

  // ===== Product-Modifier Relationships =====

  async assignModifierGroupsToProduct(
    productId: string,
    modifierGroupIds: string[],
  ): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
      relations: ['modifierGroups'],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    const modifierGroups = await this.modifierGroupRepository.find({
      where: { id: In(modifierGroupIds) },
    });

    if (modifierGroups.length !== modifierGroupIds.length) {
      throw new BadRequestException('One or more modifier groups not found');
    }

    product.modifierGroups = modifierGroups;
    return this.productRepository.save(product);
  }

  async getProductModifierGroups(productId: string): Promise<ModifierGroup[]> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
      relations: ['modifierGroups', 'modifierGroups.modifiers'],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // Filter active and available modifiers
    const filteredGroups = product.modifierGroups
      .filter((group) => group.isActive)
      .map((group) => ({
        ...group,
        modifiers: group.modifiers
          .filter((mod) => mod.isActive && mod.isAvailable)
          .sort((a, b) => a.sortOrder - b.sortOrder),
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder);

    return filteredGroups;
  }

  async removeModifierGroupFromProduct(
    productId: string,
    modifierGroupId: string,
  ): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
      relations: ['modifierGroups'],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    product.modifierGroups = product.modifierGroups.filter(
      (group) => group.id !== modifierGroupId,
    );

    return this.productRepository.save(product);
  }

  // ===== Modifier Validation =====

  async validateModifierSelection(
    validateDto: ValidateModifierSelectionDto,
  ): Promise<{ valid: boolean; errors: string[]; totalPrice: number }> {
    const errors: string[] = [];
    let totalPrice = 0;

    const product = await this.productRepository.findOne({
      where: { id: validateDto.productId },
      relations: ['modifierGroups', 'modifierGroups.modifiers'],
    });

    if (!product) {
      throw new NotFoundException(
        `Product with ID ${validateDto.productId} not found`,
      );
    }

    // Create a map of modifier group selections
    const selectionMap = new Map(
      validateDto.selections.map((s) => [s.modifierGroupId, s]),
    );

    // Validate each modifier group
    for (const modifierGroup of product.modifierGroups) {
      if (!modifierGroup.isActive) continue;

      const selection = selectionMap.get(modifierGroup.id);
      const selectedCount = selection?.selectedModifiers.length || 0;

      // Check minimum selections
      if (selectedCount < modifierGroup.minSelections) {
        errors.push(
          `${modifierGroup.name} requires at least ${modifierGroup.minSelections} selection(s)`,
        );
      }

      // Check maximum selections
      if (
        modifierGroup.maxSelections &&
        selectedCount > modifierGroup.maxSelections
      ) {
        errors.push(
          `${modifierGroup.name} allows maximum ${modifierGroup.maxSelections} selection(s)`,
        );
      }

      // Check if selection type is SINGLE but multiple selected
      if (
        modifierGroup.selectionType === 'single' &&
        selectedCount > 1
      ) {
        errors.push(
          `${modifierGroup.name} allows only one selection`,
        );
      }

      // Validate selected modifiers exist and are available
      if (selection) {
        const validModifierIds = new Set(
          modifierGroup.modifiers
            .filter((m) => m.isActive && m.isAvailable)
            .map((m) => m.id),
        );

        for (const selectedMod of selection.selectedModifiers) {
          if (!validModifierIds.has(selectedMod.modifierId)) {
            errors.push(
              `Modifier ${selectedMod.name} is not available`,
            );
          }
        }
      }

      // Calculate price
      if (selection) {
        const freeCount = modifierGroup.freeModifierCount || 0;
        const chargeAboveFree = modifierGroup.chargeAboveFree || false;

        selection.selectedModifiers.forEach((selectedMod, index) => {
          if (chargeAboveFree && index >= freeCount) {
            totalPrice += Number(selectedMod.priceAdjustment) || 0;
          } else if (!chargeAboveFree) {
            totalPrice += Number(selectedMod.priceAdjustment) || 0;
          }
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      totalPrice,
    };
  }

  // ===== Pricing Calculation =====

  calculateModifierPrice(
    modifierGroup: ModifierGroup,
    selectedModifierIds: string[],
  ): number {
    let total = 0;
    const freeCount = modifierGroup.freeModifierCount || 0;
    const chargeAboveFree = modifierGroup.chargeAboveFree;

    selectedModifierIds.forEach((modifierId, index) => {
      const modifier = modifierGroup.modifiers.find((m) => m.id === modifierId);
      if (!modifier) return;

      let price = Number(modifier.priceAdjustment) || 0;

      // Apply percentage if needed
      if (modifier.priceAdjustmentType === 'percentage') {
        // Note: This would need the product price passed in for accurate calculation
        // For now, we'll just return the percentage value
        // In real implementation, pass product price and calculate: (productPrice * price) / 100
      }

      // Apply free modifier logic
      if (chargeAboveFree) {
        if (index >= freeCount) {
          total += price;
        }
      } else {
        total += price;
      }
    });

    return total;
  }

  // ===== Availability Checking =====

  isModifierAvailable(modifier: Modifier, currentDate?: Date): boolean {
    if (!modifier.isActive || !modifier.isAvailable) {
      return false;
    }

    // Check stock if tracking inventory
    if (modifier.trackInventory) {
      if (!modifier.stockQuantity || modifier.stockQuantity <= 0) {
        return modifier.outOfStockAction !== 'hide';
      }
    }

    // Check time-based availability
    if (modifier.availability) {
      const now = currentDate || new Date();
      return this.checkAvailability(modifier.availability, now);
    }

    return true;
  }

  isModifierGroupAvailable(
    modifierGroup: ModifierGroup,
    currentDate?: Date,
  ): boolean {
    if (!modifierGroup.isActive) {
      return false;
    }

    // Check time-based availability
    if (modifierGroup.availability) {
      const now = currentDate || new Date();
      return this.checkAvailability(modifierGroup.availability, now);
    }

    return true;
  }

  private checkAvailability(
    availability: any,
    currentDate: Date,
  ): boolean {
    // Check day availability
    if (availability.days && availability.days.length > 0) {
      const dayNames = [
        'sunday',
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
      ];
      const currentDay = dayNames[currentDate.getDay()];
      if (!availability.days.includes(currentDay)) {
        return false;
      }
    }

    // Check time ranges
    if (availability.timeRanges && availability.timeRanges.length > 0) {
      const currentTime = currentDate.toTimeString().slice(0, 5); // 'HH:mm'
      const isInTimeRange = availability.timeRanges.some((range: any) => {
        return currentTime >= range.startTime && currentTime <= range.endTime;
      });
      if (!isInTimeRange) {
        return false;
      }
    }

    // Check date ranges
    if (availability.dateRanges && availability.dateRanges.length > 0) {
      const currentDateStr = currentDate.toISOString().slice(0, 10); // 'YYYY-MM-DD'
      const isInDateRange = availability.dateRanges.some((range: any) => {
        return (
          currentDateStr >= range.startDate && currentDateStr <= range.endDate
        );
      });
      if (!isInDateRange) {
        return false;
      }
    }

    return true;
  }

  // ===== Bulk Operations =====

  async bulkUpdateModifierAvailability(
    modifierIds: string[],
    isAvailable: boolean,
  ): Promise<void> {
    await this.modifierRepository.update(
      { id: In(modifierIds) },
      { isAvailable },
    );
  }

  async bulkUpdateModifierStock(
    updates: Array<{ modifierId: string; stockQuantity: number }>,
  ): Promise<void> {
    for (const update of updates) {
      await this.modifierRepository.update(
        { id: update.modifierId },
        { stockQuantity: update.stockQuantity },
      );
    }
  }
}
