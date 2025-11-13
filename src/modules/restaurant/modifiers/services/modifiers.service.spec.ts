import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModifiersService } from './modifiers.service';
import { Modifier, PriceAdjustmentType } from '../entities/modifier.entity';
import {
  ModifierGroup,
  ModifierGroupType,
  ModifierSelectionType,
} from '../entities/modifier-group.entity';
import { Product } from '../../../products/entities/product.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('ModifiersService', () => {
  let service: ModifiersService;
  let modifierRepository: Repository<Modifier>;
  let modifierGroupRepository: Repository<ModifierGroup>;
  let productRepository: Repository<Product>;

  const mockModifierRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    })),
  };

  const mockModifierGroupRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    })),
  };

  const mockProductRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModifiersService,
        {
          provide: getRepositoryToken(Modifier),
          useValue: mockModifierRepository,
        },
        {
          provide: getRepositoryToken(ModifierGroup),
          useValue: mockModifierGroupRepository,
        },
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
      ],
    }).compile();

    service = module.get<ModifiersService>(ModifiersService);
    modifierRepository = module.get<Repository<Modifier>>(
      getRepositoryToken(Modifier),
    );
    modifierGroupRepository = module.get<Repository<ModifierGroup>>(
      getRepositoryToken(ModifierGroup),
    );
    productRepository = module.get<Repository<Product>>(
      getRepositoryToken(Product),
    );

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('Modifier CRUD Operations', () => {
    describe('createModifier', () => {
      it('should create a modifier successfully', async () => {
        const createDto = {
          name: 'Extra Cheese',
          modifierGroupId: 'group-id',
          branchId: 'branch-id',
          priceAdjustment: 2.5,
        };

        const mockGroup = { id: 'group-id', name: 'Toppings' };
        const mockModifier = { id: 'modifier-id', ...createDto };

        mockModifierGroupRepository.findOne.mockResolvedValue(mockGroup);
        mockModifierRepository.create.mockReturnValue(mockModifier);
        mockModifierRepository.save.mockResolvedValue(mockModifier);

        const result = await service.createModifier(createDto as any);

        expect(result).toEqual(mockModifier);
        expect(mockModifierGroupRepository.findOne).toHaveBeenCalledWith({
          where: { id: createDto.modifierGroupId },
        });
        expect(mockModifierRepository.create).toHaveBeenCalledWith(createDto);
        expect(mockModifierRepository.save).toHaveBeenCalledWith(mockModifier);
      });

      it('should throw NotFoundException if modifier group not found', async () => {
        const createDto = {
          name: 'Extra Cheese',
          modifierGroupId: 'invalid-id',
          branchId: 'branch-id',
        };

        mockModifierGroupRepository.findOne.mockResolvedValue(null);

        await expect(service.createModifier(createDto as any)).rejects.toThrow(
          NotFoundException,
        );
      });

      it('should throw BadRequestException if SKU already exists', async () => {
        const createDto = {
          name: 'Extra Cheese',
          modifierGroupId: 'group-id',
          branchId: 'branch-id',
          sku: 'CHEESE-001',
        };

        const mockGroup = { id: 'group-id' };
        const existingModifier = { id: 'existing-id', sku: 'CHEESE-001' };

        mockModifierGroupRepository.findOne.mockResolvedValue(mockGroup);
        mockModifierRepository.findOne.mockResolvedValue(existingModifier);

        await expect(service.createModifier(createDto as any)).rejects.toThrow(
          BadRequestException,
        );
      });
    });

    describe('findOneModifier', () => {
      it('should return a modifier by id', async () => {
        const mockModifier = {
          id: 'modifier-id',
          name: 'Extra Cheese',
          modifierGroup: { id: 'group-id' },
          branch: { id: 'branch-id' },
        };

        mockModifierRepository.findOne.mockResolvedValue(mockModifier);

        const result = await service.findOneModifier('modifier-id');

        expect(result).toEqual(mockModifier);
        expect(mockModifierRepository.findOne).toHaveBeenCalledWith({
          where: { id: 'modifier-id' },
          relations: ['modifierGroup', 'branch'],
        });
      });

      it('should throw NotFoundException if modifier not found', async () => {
        mockModifierRepository.findOne.mockResolvedValue(null);

        await expect(service.findOneModifier('invalid-id')).rejects.toThrow(
          NotFoundException,
        );
      });
    });

    describe('updateModifier', () => {
      it('should update a modifier successfully', async () => {
        const updateDto = { name: 'Double Cheese', priceAdjustment: 3.0 };
        const existingModifier = {
          id: 'modifier-id',
          name: 'Extra Cheese',
          priceAdjustment: 2.5,
          branchId: 'branch-id',
        };
        const updatedModifier = { ...existingModifier, ...updateDto };

        mockModifierRepository.findOne.mockResolvedValue(existingModifier);
        mockModifierRepository.save.mockResolvedValue(updatedModifier);

        const result = await service.updateModifier('modifier-id', updateDto);

        expect(result).toEqual(updatedModifier);
        expect(mockModifierRepository.save).toHaveBeenCalled();
      });
    });

    describe('removeModifier', () => {
      it('should remove a modifier successfully', async () => {
        const mockModifier = { id: 'modifier-id', name: 'Extra Cheese' };

        mockModifierRepository.findOne.mockResolvedValue(mockModifier);
        mockModifierRepository.remove.mockResolvedValue(mockModifier);

        await service.removeModifier('modifier-id');

        expect(mockModifierRepository.remove).toHaveBeenCalledWith(
          mockModifier,
        );
      });
    });
  });

  describe('Modifier Group CRUD Operations', () => {
    describe('createModifierGroup', () => {
      it('should create a modifier group successfully', async () => {
        const createDto = {
          name: 'Toppings',
          branchId: 'branch-id',
          type: ModifierGroupType.OPTIONAL,
          selectionType: ModifierSelectionType.MULTIPLE,
        };

        const mockGroup = { id: 'group-id', ...createDto };

        mockModifierGroupRepository.create.mockReturnValue(mockGroup);
        mockModifierGroupRepository.save.mockResolvedValue(mockGroup);

        const result = await service.createModifierGroup(createDto as any);

        expect(result).toEqual(mockGroup);
        expect(mockModifierGroupRepository.create).toHaveBeenCalledWith(
          createDto,
        );
        expect(mockModifierGroupRepository.save).toHaveBeenCalledWith(
          mockGroup,
        );
      });
    });

    describe('findOneModifierGroup', () => {
      it('should return a modifier group by id', async () => {
        const mockGroup = {
          id: 'group-id',
          name: 'Toppings',
          modifiers: [],
          branch: { id: 'branch-id' },
        };

        mockModifierGroupRepository.findOne.mockResolvedValue(mockGroup);

        const result = await service.findOneModifierGroup('group-id');

        expect(result).toEqual(mockGroup);
        expect(mockModifierGroupRepository.findOne).toHaveBeenCalledWith({
          where: { id: 'group-id' },
          relations: ['modifiers', 'branch'],
        });
      });

      it('should throw NotFoundException if group not found', async () => {
        mockModifierGroupRepository.findOne.mockResolvedValue(null);

        await expect(
          service.findOneModifierGroup('invalid-id'),
        ).rejects.toThrow(NotFoundException);
      });
    });
  });

  describe('Product-Modifier Relationships', () => {
    describe('assignModifierGroupsToProduct', () => {
      it('should assign modifier groups to a product', async () => {
        const productId = 'product-id';
        const modifierGroupIds = ['group-id-1', 'group-id-2'];

        const mockProduct = {
          id: productId,
          name: 'Pizza',
          modifierGroups: [],
        };

        const mockGroups = [
          { id: 'group-id-1', name: 'Size' },
          { id: 'group-id-2', name: 'Toppings' },
        ];

        const updatedProduct = {
          ...mockProduct,
          modifierGroups: mockGroups,
        };

        mockProductRepository.findOne.mockResolvedValue(mockProduct);
        mockModifierGroupRepository.find.mockResolvedValue(mockGroups);
        mockProductRepository.save.mockResolvedValue(updatedProduct);

        const result = await service.assignModifierGroupsToProduct(
          productId,
          modifierGroupIds,
        );

        expect(result).toEqual(updatedProduct);
        expect(mockProductRepository.findOne).toHaveBeenCalledWith({
          where: { id: productId },
          relations: ['modifierGroups'],
        });
      });

      it('should throw NotFoundException if product not found', async () => {
        mockProductRepository.findOne.mockResolvedValue(null);

        await expect(
          service.assignModifierGroupsToProduct('invalid-id', []),
        ).rejects.toThrow(NotFoundException);
      });

      it('should throw BadRequestException if not all groups found', async () => {
        const mockProduct = { id: 'product-id', modifierGroups: [] };
        mockProductRepository.findOne.mockResolvedValue(mockProduct);
        mockModifierGroupRepository.find.mockResolvedValue([
          { id: 'group-id-1' },
        ]);

        await expect(
          service.assignModifierGroupsToProduct('product-id', [
            'group-id-1',
            'group-id-2',
          ]),
        ).rejects.toThrow(BadRequestException);
      });
    });

    describe('getProductModifierGroups', () => {
      it('should return filtered and sorted modifier groups', async () => {
        const mockProduct = {
          id: 'product-id',
          modifierGroups: [
            {
              id: 'group-1',
              isActive: true,
              sortOrder: 1,
              modifiers: [
                { id: 'mod-1', isActive: true, isAvailable: true, sortOrder: 1 },
                { id: 'mod-2', isActive: false, isAvailable: true, sortOrder: 2 },
              ],
            },
            {
              id: 'group-2',
              isActive: false,
              sortOrder: 2,
              modifiers: [],
            },
          ],
        };

        mockProductRepository.findOne.mockResolvedValue(mockProduct);

        const result = await service.getProductModifierGroups('product-id');

        expect(result).toHaveLength(1);
        expect(result[0].modifiers).toHaveLength(1);
        expect(result[0].modifiers[0].id).toBe('mod-1');
      });
    });
  });

  describe('Modifier Validation', () => {
    describe('validateModifierSelection', () => {
      it('should validate selections successfully', async () => {
        const validateDto = {
          productId: 'product-id',
          selections: [
            {
              modifierGroupId: 'group-1',
              selectedModifiers: [
                { modifierId: 'mod-1', name: 'Extra Cheese', priceAdjustment: 2.5 },
              ],
            },
          ],
        };

        const mockProduct = {
          id: 'product-id',
          modifierGroups: [
            {
              id: 'group-1',
              name: 'Toppings',
              isActive: true,
              minSelections: 0,
              maxSelections: 3,
              selectionType: 'multiple',
              freeModifierCount: 0,
              chargeAboveFree: false,
              modifiers: [
                {
                  id: 'mod-1',
                  name: 'Extra Cheese',
                  isActive: true,
                  isAvailable: true,
                  priceAdjustment: 2.5,
                },
              ],
            },
          ],
        };

        mockProductRepository.findOne.mockResolvedValue(mockProduct);

        const result = await service.validateModifierSelection(validateDto as any);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(result.totalPrice).toBe(2.5);
      });

      it('should detect minimum selection violations', async () => {
        const validateDto = {
          productId: 'product-id',
          selections: [],
        };

        const mockProduct = {
          id: 'product-id',
          modifierGroups: [
            {
              id: 'group-1',
              name: 'Size',
              isActive: true,
              minSelections: 1,
              maxSelections: 1,
              selectionType: 'single',
              modifiers: [
                { id: 'mod-1', isActive: true, isAvailable: true },
              ],
            },
          ],
        };

        mockProductRepository.findOne.mockResolvedValue(mockProduct);

        const result = await service.validateModifierSelection(validateDto as any);

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Size requires at least 1 selection(s)');
      });

      it('should detect maximum selection violations', async () => {
        const validateDto = {
          productId: 'product-id',
          selections: [
            {
              modifierGroupId: 'group-1',
              selectedModifiers: [
                { modifierId: 'mod-1', name: 'Mod 1', priceAdjustment: 1 },
                { modifierId: 'mod-2', name: 'Mod 2', priceAdjustment: 1 },
                { modifierId: 'mod-3', name: 'Mod 3', priceAdjustment: 1 },
              ],
            },
          ],
        };

        const mockProduct = {
          id: 'product-id',
          modifierGroups: [
            {
              id: 'group-1',
              name: 'Toppings',
              isActive: true,
              minSelections: 0,
              maxSelections: 2,
              selectionType: 'multiple',
              freeModifierCount: 0,
              chargeAboveFree: false,
              modifiers: [
                { id: 'mod-1', isActive: true, isAvailable: true },
                { id: 'mod-2', isActive: true, isAvailable: true },
                { id: 'mod-3', isActive: true, isAvailable: true },
              ],
            },
          ],
        };

        mockProductRepository.findOne.mockResolvedValue(mockProduct);

        const result = await service.validateModifierSelection(validateDto as any);

        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
          'Toppings allows maximum 2 selection(s)',
        );
      });

      it('should calculate price with free modifier logic', async () => {
        const validateDto = {
          productId: 'product-id',
          selections: [
            {
              modifierGroupId: 'group-1',
              selectedModifiers: [
                { modifierId: 'mod-1', name: 'Topping 1', priceAdjustment: 2 },
                { modifierId: 'mod-2', name: 'Topping 2', priceAdjustment: 2 },
                { modifierId: 'mod-3', name: 'Topping 3', priceAdjustment: 2 },
              ],
            },
          ],
        };

        const mockProduct = {
          id: 'product-id',
          modifierGroups: [
            {
              id: 'group-1',
              name: 'Toppings',
              isActive: true,
              minSelections: 0,
              maxSelections: 5,
              selectionType: 'multiple',
              freeModifierCount: 2, // First 2 are free
              chargeAboveFree: true,
              modifiers: [
                { id: 'mod-1', isActive: true, isAvailable: true },
                { id: 'mod-2', isActive: true, isAvailable: true },
                { id: 'mod-3', isActive: true, isAvailable: true },
              ],
            },
          ],
        };

        mockProductRepository.findOne.mockResolvedValue(mockProduct);

        const result = await service.validateModifierSelection(validateDto as any);

        expect(result.valid).toBe(true);
        expect(result.totalPrice).toBe(2); // Only the 3rd topping is charged
      });
    });
  });

  describe('Availability Checking', () => {
    describe('isModifierAvailable', () => {
      it('should return true for available modifier', () => {
        const modifier = {
          isActive: true,
          isAvailable: true,
          trackInventory: false,
          availability: null,
        } as Modifier;

        const result = service.isModifierAvailable(modifier);

        expect(result).toBe(true);
      });

      it('should return false if not active', () => {
        const modifier = {
          isActive: false,
          isAvailable: true,
        } as Modifier;

        const result = service.isModifierAvailable(modifier);

        expect(result).toBe(false);
      });

      it('should check day availability', () => {
        const modifier = {
          isActive: true,
          isAvailable: true,
          trackInventory: false,
          availability: {
            days: ['monday', 'tuesday'],
          },
        } as Modifier;

        // Test with a Monday (2025-01-13 is a Monday)
        const monday = new Date('2025-01-13T12:00:00');
        const result = service.isModifierAvailable(modifier, monday);

        expect(result).toBe(true);

        // Test with a Sunday (2025-01-12 is a Sunday)
        const sunday = new Date('2025-01-12T12:00:00');
        const resultSunday = service.isModifierAvailable(modifier, sunday);

        expect(resultSunday).toBe(false);
      });

      it('should check time availability', () => {
        const modifier = {
          isActive: true,
          isAvailable: true,
          trackInventory: false,
          availability: {
            timeRanges: [
              { startTime: '09:00', endTime: '17:00' },
            ],
          },
        } as Modifier;

        // Test within time range
        const morningDate = new Date('2025-01-13T10:00:00');
        const result = service.isModifierAvailable(modifier, morningDate);

        expect(result).toBe(true);

        // Test outside time range
        const eveningDate = new Date('2025-01-13T20:00:00');
        const resultEvening = service.isModifierAvailable(modifier, eveningDate);

        expect(resultEvening).toBe(false);
      });
    });
  });

  describe('Pricing Calculation', () => {
    describe('calculateModifierPrice', () => {
      it('should calculate total price for selected modifiers', () => {
        const modifierGroup = {
          freeModifierCount: 0,
          chargeAboveFree: false,
          modifiers: [
            { id: 'mod-1', priceAdjustment: 2.5, priceAdjustmentType: PriceAdjustmentType.FIXED },
            { id: 'mod-2', priceAdjustment: 1.5, priceAdjustmentType: PriceAdjustmentType.FIXED },
          ],
        } as ModifierGroup;

        const selectedIds = ['mod-1', 'mod-2'];

        const result = service.calculateModifierPrice(modifierGroup, selectedIds);

        expect(result).toBe(4.0);
      });

      it('should apply free modifier logic correctly', () => {
        const modifierGroup = {
          freeModifierCount: 1,
          chargeAboveFree: true,
          modifiers: [
            { id: 'mod-1', priceAdjustment: 2, priceAdjustmentType: PriceAdjustmentType.FIXED },
            { id: 'mod-2', priceAdjustment: 2, priceAdjustmentType: PriceAdjustmentType.FIXED },
            { id: 'mod-3', priceAdjustment: 2, priceAdjustmentType: PriceAdjustmentType.FIXED },
          ],
        } as ModifierGroup;

        const selectedIds = ['mod-1', 'mod-2', 'mod-3'];

        const result = service.calculateModifierPrice(modifierGroup, selectedIds);

        expect(result).toBe(4); // First one is free, charge for 2nd and 3rd
      });
    });
  });
});
