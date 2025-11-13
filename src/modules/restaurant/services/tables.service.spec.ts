import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TablesService } from './tables.service';
import { Table } from '../entities/table.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { User } from '../../users/entities/user.entity';
import { FloorPlan } from '../entities/floor-plan.entity';
import { TableSection } from '../entities/table-section.entity';
import { TableStatus } from '../common/restaurant.constants';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('TablesService', () => {
  let service: TablesService;
  let tableRepository: Repository<Table>;
  let branchRepository: Repository<Branch>;
  let userRepository: Repository<User>;
  let floorPlanRepository: Repository<FloorPlan>;
  let tableSectionRepository: Repository<TableSection>;

  const mockTableRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(0),
      getMany: jest.fn().mockResolvedValue([]),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({}),
      clone: jest.fn().mockReturnThis(),
    })),
  };

  const mockBranchRepository = {
    findOne: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockFloorPlanRepository = {
    findOne: jest.fn(),
  };

  const mockTableSectionRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TablesService,
        {
          provide: getRepositoryToken(Table),
          useValue: mockTableRepository,
        },
        {
          provide: getRepositoryToken(Branch),
          useValue: mockBranchRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(FloorPlan),
          useValue: mockFloorPlanRepository,
        },
        {
          provide: getRepositoryToken(TableSection),
          useValue: mockTableSectionRepository,
        },
      ],
    }).compile();

    service = module.get<TablesService>(TablesService);
    tableRepository = module.get<Repository<Table>>(getRepositoryToken(Table));
    branchRepository = module.get<Repository<Branch>>(
      getRepositoryToken(Branch),
    );
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    floorPlanRepository = module.get<Repository<FloorPlan>>(
      getRepositoryToken(FloorPlan),
    );
    tableSectionRepository = module.get<Repository<TableSection>>(
      getRepositoryToken(TableSection),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new table', async () => {
      const createTableDto = {
        tableNumber: 'T-1',
        capacity: 4,
        branchId: 'branch-id',
      };

      const mockBranch = { id: 'branch-id', name: 'Test Branch' };
      const mockTable = { id: 'table-id', ...createTableDto };

      mockBranchRepository.findOne.mockResolvedValue(mockBranch);
      mockTableRepository.findOne.mockResolvedValue(null);
      mockTableRepository.create.mockReturnValue(mockTable);
      mockTableRepository.save.mockResolvedValue(mockTable);

      const result = await service.create(createTableDto);

      expect(result).toEqual(mockTable);
      expect(mockBranchRepository.findOne).toHaveBeenCalledWith({
        where: { id: createTableDto.branchId },
      });
      expect(mockTableRepository.create).toHaveBeenCalledWith(createTableDto);
      expect(mockTableRepository.save).toHaveBeenCalledWith(mockTable);
    });

    it('should throw NotFoundException if branch does not exist', async () => {
      const createTableDto = {
        tableNumber: 'T-1',
        capacity: 4,
        branchId: 'invalid-branch-id',
      };

      mockBranchRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createTableDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if table number already exists', async () => {
      const createTableDto = {
        tableNumber: 'T-1',
        capacity: 4,
        branchId: 'branch-id',
      };

      const mockBranch = { id: 'branch-id', name: 'Test Branch' };
      const mockExistingTable = { id: 'existing-table-id', tableNumber: 'T-1' };

      mockBranchRepository.findOne.mockResolvedValue(mockBranch);
      mockTableRepository.findOne.mockResolvedValue(mockExistingTable);

      await expect(service.create(createTableDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findOne', () => {
    it('should return a table by id', async () => {
      const mockTable = {
        id: 'table-id',
        tableNumber: 'T-1',
        capacity: 4,
      };

      mockTableRepository.findOne.mockResolvedValue(mockTable);

      const result = await service.findOne('table-id');

      expect(result).toEqual(mockTable);
      expect(mockTableRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'table-id' },
        relations: ['branch', 'floorPlan', 'section', 'assignedServer'],
      });
    });

    it('should throw NotFoundException if table does not exist', async () => {
      mockTableRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateStatus', () => {
    it('should update table status', async () => {
      const mockTable = {
        id: 'table-id',
        tableNumber: 'T-1',
        capacity: 4,
        status: TableStatus.AVAILABLE,
      };

      const updateStatusDto = { status: TableStatus.OCCUPIED };

      mockTableRepository.findOne.mockResolvedValue(mockTable);
      mockTableRepository.save.mockResolvedValue({
        ...mockTable,
        status: TableStatus.OCCUPIED,
      });

      const result = await service.updateStatus('table-id', updateStatusDto);

      expect(result.status).toBe(TableStatus.OCCUPIED);
      expect(mockTableRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid status transition', async () => {
      const mockTable = {
        id: 'table-id',
        tableNumber: 'T-1',
        capacity: 4,
        status: TableStatus.OUT_OF_SERVICE,
      };

      const updateStatusDto = { status: TableStatus.OCCUPIED };

      mockTableRepository.findOne.mockResolvedValue(mockTable);

      await expect(
        service.updateStatus('table-id', updateStatusDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('checkAvailability', () => {
    it('should return available tables for party size', async () => {
      const mockTables = [
        {
          id: 'table-1',
          tableNumber: 'T-1',
          capacity: 4,
          minCapacity: 1,
          status: TableStatus.AVAILABLE,
          isActive: true,
        },
        {
          id: 'table-2',
          tableNumber: 'T-2',
          capacity: 6,
          minCapacity: 2,
          status: TableStatus.AVAILABLE,
          isActive: true,
        },
      ];

      mockTableRepository.find.mockResolvedValue(mockTables);

      const result = await service.checkAvailability('branch-id', 4);

      expect(result).toHaveLength(2);
      expect(mockTableRepository.find).toHaveBeenCalledWith({
        where: {
          branchId: 'branch-id',
          status: TableStatus.AVAILABLE,
          isActive: true,
        },
        relations: ['section', 'floorPlan'],
        order: { capacity: 'ASC' },
      });
    });
  });
});
