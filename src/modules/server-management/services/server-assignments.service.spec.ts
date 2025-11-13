import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServerAssignmentsService } from './server-assignments.service';
import { ServerAssignment, AssignmentStatus } from '../entities/server-assignment.entity';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';

describe('ServerAssignmentsService', () => {
  let service: ServerAssignmentsService;
  let assignmentRepository: Repository<ServerAssignment>;

  const mockAssignmentRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServerAssignmentsService,
        {
          provide: getRepositoryToken(ServerAssignment),
          useValue: mockAssignmentRepository,
        },
      ],
    }).compile();

    service = module.get<ServerAssignmentsService>(ServerAssignmentsService);
    assignmentRepository = module.get<Repository<ServerAssignment>>(
      getRepositoryToken(ServerAssignment),
    );

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto = {
      serverId: 'server-123',
      branchId: 'branch-123',
      sectionId: 'section-123',
      assignmentDate: '2024-01-15',
      status: AssignmentStatus.ACTIVE,
    };

    it('should create a new assignment', async () => {
      const expectedAssignment = { id: 'assignment-123', ...createDto };

      mockAssignmentRepository.findOne.mockResolvedValue(null);
      mockAssignmentRepository.create.mockReturnValue(expectedAssignment);
      mockAssignmentRepository.save.mockResolvedValue(expectedAssignment);

      const result = await service.create(createDto);

      expect(mockAssignmentRepository.findOne).toHaveBeenCalledWith({
        where: {
          serverId: createDto.serverId,
          assignmentDate: new Date(createDto.assignmentDate),
          status: AssignmentStatus.ACTIVE,
        },
      });
      expect(mockAssignmentRepository.create).toHaveBeenCalledWith(createDto);
      expect(mockAssignmentRepository.save).toHaveBeenCalledWith(expectedAssignment);
      expect(result).toEqual(expectedAssignment);
    });

    it('should throw ConflictException if active assignment already exists', async () => {
      mockAssignmentRepository.findOne.mockResolvedValue({ id: 'existing-123' });

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findOne', () => {
    it('should return an assignment by id', async () => {
      const assignment = { id: 'assignment-123', serverId: 'server-123' };
      mockAssignmentRepository.findOne.mockResolvedValue(assignment);

      const result = await service.findOne('assignment-123');

      expect(mockAssignmentRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'assignment-123' },
        relations: ['server', 'branch', 'section'],
      });
      expect(result).toEqual(assignment);
    });

    it('should throw NotFoundException if assignment not found', async () => {
      mockAssignmentRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update an assignment', async () => {
      const existingAssignment = {
        id: 'assignment-123',
        serverId: 'server-123',
        status: AssignmentStatus.ACTIVE,
      };
      const updateDto = { status: AssignmentStatus.INACTIVE };
      const updatedAssignment = { ...existingAssignment, ...updateDto };

      mockAssignmentRepository.findOne.mockResolvedValue(existingAssignment);
      mockAssignmentRepository.save.mockResolvedValue(updatedAssignment);

      const result = await service.update('assignment-123', updateDto);

      expect(mockAssignmentRepository.save).toHaveBeenCalled();
      expect(result.status).toEqual(AssignmentStatus.INACTIVE);
    });
  });

  describe('remove', () => {
    it('should remove an assignment', async () => {
      const assignment = { id: 'assignment-123', serverId: 'server-123' };
      mockAssignmentRepository.findOne.mockResolvedValue(assignment);
      mockAssignmentRepository.remove.mockResolvedValue(assignment);

      await service.remove('assignment-123');

      expect(mockAssignmentRepository.remove).toHaveBeenCalledWith(assignment);
    });
  });

  describe('updateTableCount', () => {
    it('should increment table count', async () => {
      const assignment = {
        id: 'assignment-123',
        currentTableCount: 3,
        tableLimit: 5,
      };

      mockAssignmentRepository.findOne.mockResolvedValue(assignment);
      mockAssignmentRepository.save.mockResolvedValue({ ...assignment, currentTableCount: 4 });

      const result = await service.updateTableCount('assignment-123', 1);

      expect(result.currentTableCount).toBe(4);
    });

    it('should throw BadRequestException if count goes below zero', async () => {
      const assignment = {
        id: 'assignment-123',
        currentTableCount: 0,
      };

      mockAssignmentRepository.findOne.mockResolvedValue(assignment);

      await expect(service.updateTableCount('assignment-123', -1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if count exceeds limit', async () => {
      const assignment = {
        id: 'assignment-123',
        currentTableCount: 5,
        tableLimit: 5,
      };

      mockAssignmentRepository.findOne.mockResolvedValue(assignment);

      await expect(service.updateTableCount('assignment-123', 1)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getActiveAssignments', () => {
    it('should return active assignments for a branch', async () => {
      const assignments = [
        { id: 'assignment-1', serverId: 'server-1' },
        { id: 'assignment-2', serverId: 'server-2' },
      ];

      mockAssignmentRepository.find.mockResolvedValue(assignments);

      const result = await service.getActiveAssignments('branch-123', '2024-01-15');

      expect(mockAssignmentRepository.find).toHaveBeenCalled();
      expect(result).toEqual(assignments);
    });
  });

  describe('getNextServerForRotation', () => {
    it('should return the server with lowest table count', async () => {
      const assignments = [
        { id: 'a1', serverId: 's1', currentTableCount: 3, tableLimit: 5, priorityOrder: 1 },
        { id: 'a2', serverId: 's2', currentTableCount: 2, tableLimit: 5, priorityOrder: 2 },
        { id: 'a3', serverId: 's3', currentTableCount: 2, tableLimit: 5, priorityOrder: 3 },
      ];

      mockAssignmentRepository.find.mockResolvedValue(assignments);

      const result = await service.getNextServerForRotation('branch-123', 'section-123');

      expect(result).toBe(assignments[1]); // Server with lowest count and priority
    });

    it('should return null if no servers are available', async () => {
      mockAssignmentRepository.find.mockResolvedValue([]);

      const result = await service.getNextServerForRotation('branch-123', 'section-123');

      expect(result).toBeNull();
    });
  });
});
