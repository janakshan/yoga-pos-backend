import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FloorPlanService } from './floor-plan.service';
import { FloorPlan } from '../entities/floor-plan.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('FloorPlanService', () => {
  let service: FloorPlanService;
  let floorPlanRepository: Repository<FloorPlan>;
  let branchRepository: Repository<Branch>;

  const mockFloorPlanRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(0),
      getMany: jest.fn().mockResolvedValue([]),
    })),
  };

  const mockBranchRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FloorPlanService,
        {
          provide: getRepositoryToken(FloorPlan),
          useValue: mockFloorPlanRepository,
        },
        {
          provide: getRepositoryToken(Branch),
          useValue: mockBranchRepository,
        },
      ],
    }).compile();

    service = module.get<FloorPlanService>(FloorPlanService);
    floorPlanRepository = module.get<Repository<FloorPlan>>(
      getRepositoryToken(FloorPlan),
    );
    branchRepository = module.get<Repository<Branch>>(
      getRepositoryToken(Branch),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new floor plan', async () => {
      const createFloorPlanDto = {
        name: 'Main Floor',
        branchId: 'branch-id',
      };

      const mockBranch = { id: 'branch-id', name: 'Test Branch' };
      const mockFloorPlan = { id: 'floor-plan-id', ...createFloorPlanDto };

      mockBranchRepository.findOne.mockResolvedValue(mockBranch);
      mockFloorPlanRepository.findOne.mockResolvedValue(null);
      mockFloorPlanRepository.create.mockReturnValue(mockFloorPlan);
      mockFloorPlanRepository.save.mockResolvedValue(mockFloorPlan);

      const result = await service.create(createFloorPlanDto);

      expect(result).toEqual(mockFloorPlan);
      expect(mockBranchRepository.findOne).toHaveBeenCalledWith({
        where: { id: createFloorPlanDto.branchId },
      });
      expect(mockFloorPlanRepository.create).toHaveBeenCalledWith(
        createFloorPlanDto,
      );
      expect(mockFloorPlanRepository.save).toHaveBeenCalledWith(mockFloorPlan);
    });

    it('should throw NotFoundException if branch does not exist', async () => {
      const createFloorPlanDto = {
        name: 'Main Floor',
        branchId: 'invalid-branch-id',
      };

      mockBranchRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createFloorPlanDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if floor plan name already exists', async () => {
      const createFloorPlanDto = {
        name: 'Main Floor',
        branchId: 'branch-id',
      };

      const mockBranch = { id: 'branch-id', name: 'Test Branch' };
      const mockExistingFloorPlan = {
        id: 'existing-floor-plan-id',
        name: 'Main Floor',
      };

      mockBranchRepository.findOne.mockResolvedValue(mockBranch);
      mockFloorPlanRepository.findOne.mockResolvedValue(
        mockExistingFloorPlan,
      );

      await expect(service.create(createFloorPlanDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findOne', () => {
    it('should return a floor plan by id', async () => {
      const mockFloorPlan = {
        id: 'floor-plan-id',
        name: 'Main Floor',
        branchId: 'branch-id',
      };

      mockFloorPlanRepository.findOne.mockResolvedValue(mockFloorPlan);

      const result = await service.findOne('floor-plan-id');

      expect(result).toEqual(mockFloorPlan);
      expect(mockFloorPlanRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'floor-plan-id' },
        relations: ['branch', 'tables', 'sections'],
      });
    });

    it('should throw NotFoundException if floor plan does not exist', async () => {
      mockFloorPlanRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('setAsDefault', () => {
    it('should set a floor plan as default', async () => {
      const mockFloorPlan = {
        id: 'floor-plan-id',
        name: 'Main Floor',
        branchId: 'branch-id',
        isDefault: false,
      };

      mockFloorPlanRepository.findOne.mockResolvedValue(mockFloorPlan);
      mockFloorPlanRepository.update.mockResolvedValue({ affected: 1 });
      mockFloorPlanRepository.save.mockResolvedValue({
        ...mockFloorPlan,
        isDefault: true,
      });

      const result = await service.setAsDefault('floor-plan-id');

      expect(result.isDefault).toBe(true);
      expect(mockFloorPlanRepository.update).toHaveBeenCalled();
      expect(mockFloorPlanRepository.save).toHaveBeenCalled();
    });
  });

  describe('getDefaultFloorPlan', () => {
    it('should return the default floor plan for a branch', async () => {
      const mockFloorPlan = {
        id: 'floor-plan-id',
        name: 'Main Floor',
        branchId: 'branch-id',
        isDefault: true,
        isActive: true,
      };

      mockFloorPlanRepository.findOne.mockResolvedValue(mockFloorPlan);

      const result = await service.getDefaultFloorPlan('branch-id');

      expect(result).toEqual(mockFloorPlan);
      expect(mockFloorPlanRepository.findOne).toHaveBeenCalledWith({
        where: { branchId: 'branch-id', isDefault: true, isActive: true },
        relations: ['tables', 'sections'],
      });
    });

    it('should throw NotFoundException if no default floor plan exists', async () => {
      mockFloorPlanRepository.findOne.mockResolvedValue(null);

      await expect(service.getDefaultFloorPlan('branch-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('duplicateFloorPlan', () => {
    it('should duplicate a floor plan with a new name', async () => {
      const mockFloorPlan = {
        id: 'floor-plan-id',
        name: 'Main Floor',
        branchId: 'branch-id',
        description: 'Main dining area',
        layout: { width: 1200, height: 800 },
        settings: { snapToGrid: true },
        displayOrder: 0,
      };

      const newName = 'Main Floor Copy';

      mockFloorPlanRepository.findOne
        .mockResolvedValueOnce(mockFloorPlan)
        .mockResolvedValueOnce(null);
      mockFloorPlanRepository.create.mockReturnValue({
        ...mockFloorPlan,
        name: newName,
      });
      mockFloorPlanRepository.save.mockResolvedValue({
        ...mockFloorPlan,
        name: newName,
        id: 'new-floor-plan-id',
      });

      const result = await service.duplicateFloorPlan('floor-plan-id', newName);

      expect(result.name).toBe(newName);
      expect(mockFloorPlanRepository.create).toHaveBeenCalled();
      expect(mockFloorPlanRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if new name already exists', async () => {
      const mockFloorPlan = {
        id: 'floor-plan-id',
        name: 'Main Floor',
        branchId: 'branch-id',
      };

      const existingFloorPlan = {
        id: 'existing-id',
        name: 'Main Floor Copy',
      };

      mockFloorPlanRepository.findOne
        .mockResolvedValueOnce(mockFloorPlan)
        .mockResolvedValueOnce(existingFloorPlan);

      await expect(
        service.duplicateFloorPlan('floor-plan-id', 'Main Floor Copy'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
