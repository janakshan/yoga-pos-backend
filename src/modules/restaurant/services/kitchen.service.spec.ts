import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { KitchenService } from './kitchen.service';
import { KitchenStation } from '../entities/kitchen-station.entity';
import { OrderItem } from '../entities/order-item.entity';
import { RestaurantOrder } from '../entities/restaurant-order.entity';
import {
  KitchenStation as KitchenStationType,
  RestaurantOrderStatus,
  OrderPriority,
  CourseTiming,
  DiningType,
} from '../common/restaurant.constants';

describe('KitchenService', () => {
  let service: KitchenService;
  let stationRepository: Repository<KitchenStation>;
  let orderItemRepository: Repository<OrderItem>;
  let orderRepository: Repository<RestaurantOrder>;

  const mockStationRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
  };

  const mockOrderItemRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockOrderRepository = {
    createQueryBuilder: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KitchenService,
        {
          provide: getRepositoryToken(KitchenStation),
          useValue: mockStationRepository,
        },
        {
          provide: getRepositoryToken(OrderItem),
          useValue: mockOrderItemRepository,
        },
        {
          provide: getRepositoryToken(RestaurantOrder),
          useValue: mockOrderRepository,
        },
      ],
    }).compile();

    service = module.get<KitchenService>(KitchenService);
    stationRepository = module.get<Repository<KitchenStation>>(
      getRepositoryToken(KitchenStation),
    );
    orderItemRepository = module.get<Repository<OrderItem>>(
      getRepositoryToken(OrderItem),
    );
    orderRepository = module.get<Repository<RestaurantOrder>>(
      getRepositoryToken(RestaurantOrder),
    );

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createStation', () => {
    it('should create a new kitchen station', async () => {
      const createDto = {
        branchId: 'branch-123',
        stationType: KitchenStationType.GRILL,
        name: 'Main Grill',
        defaultPrepTime: 20,
      };

      const mockStation = {
        id: 'station-123',
        ...createDto,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockStationRepository.create.mockReturnValue(mockStation);
      mockStationRepository.save.mockResolvedValue(mockStation);

      const result = await service.createStation(createDto);

      expect(mockStationRepository.create).toHaveBeenCalledWith(createDto);
      expect(mockStationRepository.save).toHaveBeenCalledWith(mockStation);
      expect(result).toEqual(mockStation);
    });
  });

  describe('updateStation', () => {
    it('should update an existing kitchen station', async () => {
      const stationId = 'station-123';
      const updateDto = {
        name: 'Updated Grill Station',
        defaultPrepTime: 25,
      };

      const existingStation = {
        id: stationId,
        branchId: 'branch-123',
        stationType: KitchenStationType.GRILL,
        name: 'Old Grill Station',
        defaultPrepTime: 20,
      };

      const updatedStation = {
        ...existingStation,
        ...updateDto,
      };

      mockStationRepository.findOne.mockResolvedValue(existingStation);
      mockStationRepository.save.mockResolvedValue(updatedStation);

      const result = await service.updateStation(stationId, updateDto);

      expect(mockStationRepository.findOne).toHaveBeenCalledWith({
        where: { id: stationId },
      });
      expect(mockStationRepository.save).toHaveBeenCalled();
      expect(result.name).toBe(updateDto.name);
      expect(result.defaultPrepTime).toBe(updateDto.defaultPrepTime);
    });

    it('should throw NotFoundException if station not found', async () => {
      mockStationRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateStation('non-existent', { name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getStation', () => {
    it('should retrieve a kitchen station by ID', async () => {
      const stationId = 'station-123';
      const mockStation = {
        id: stationId,
        name: 'Grill Station',
      };

      mockStationRepository.findOne.mockResolvedValue(mockStation);

      const result = await service.getStation(stationId);

      expect(mockStationRepository.findOne).toHaveBeenCalledWith({
        where: { id: stationId },
      });
      expect(result).toEqual(mockStation);
    });

    it('should throw NotFoundException if station not found', async () => {
      mockStationRepository.findOne.mockResolvedValue(null);

      await expect(service.getStation('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getStationsByBranch', () => {
    it('should retrieve all active stations for a branch', async () => {
      const branchId = 'branch-123';
      const mockStations = [
        {
          id: 'station-1',
          name: 'Grill',
          displayOrder: 1,
        },
        {
          id: 'station-2',
          name: 'Fryer',
          displayOrder: 2,
        },
      ];

      mockStationRepository.find.mockResolvedValue(mockStations);

      const result = await service.getStationsByBranch(branchId);

      expect(mockStationRepository.find).toHaveBeenCalledWith({
        where: { branchId, isActive: true },
        order: { displayOrder: 'ASC' },
      });
      expect(result).toEqual(mockStations);
    });
  });

  describe('deleteStation', () => {
    it('should delete a kitchen station', async () => {
      const stationId = 'station-123';
      mockStationRepository.delete.mockResolvedValue({ affected: 1 });

      await service.deleteStation(stationId);

      expect(mockStationRepository.delete).toHaveBeenCalledWith(stationId);
    });

    it('should throw NotFoundException if station not found', async () => {
      mockStationRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(service.deleteStation('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('markItemReady', () => {
    it('should mark an order item as ready', async () => {
      const itemId = 'item-123';
      const mockItem = {
        id: itemId,
        orderId: 'order-123',
        status: RestaurantOrderStatus.PREPARING,
        productName: 'Burger',
      };

      const updatedItem = {
        ...mockItem,
        status: RestaurantOrderStatus.READY,
        completedAt: expect.any(Date),
      };

      mockOrderItemRepository.findOne.mockResolvedValue(mockItem);
      mockOrderItemRepository.save.mockResolvedValue(updatedItem);
      mockOrderRepository.findOne.mockResolvedValue({
        id: 'order-123',
        items: [updatedItem],
      });

      const result = await service.markItemReady({ itemId });

      expect(mockOrderItemRepository.findOne).toHaveBeenCalledWith({
        where: { id: itemId },
        relations: ['order'],
      });
      expect(mockOrderItemRepository.save).toHaveBeenCalled();
      expect(result.status).toBe(RestaurantOrderStatus.READY);
      expect(result.completedAt).toBeDefined();
    });

    it('should throw NotFoundException if item not found', async () => {
      mockOrderItemRepository.findOne.mockResolvedValue(null);

      await expect(
        service.markItemReady({ itemId: 'non-existent' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if item already ready', async () => {
      const mockItem = {
        id: 'item-123',
        status: RestaurantOrderStatus.READY,
      };

      mockOrderItemRepository.findOne.mockResolvedValue(mockItem);

      await expect(
        service.markItemReady({ itemId: 'item-123' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('bumpOrderItem', () => {
    it('should bump an order item from display', async () => {
      const itemId = 'item-123';
      const mockItem = {
        id: itemId,
        orderId: 'order-123',
        status: RestaurantOrderStatus.READY,
        productName: 'Burger',
      };

      const updatedItem = {
        ...mockItem,
        status: RestaurantOrderStatus.SERVED,
      };

      mockOrderItemRepository.findOne.mockResolvedValue(mockItem);
      mockOrderItemRepository.save.mockResolvedValue(updatedItem);
      mockOrderRepository.findOne.mockResolvedValue({
        id: 'order-123',
        items: [updatedItem],
      });

      const result = await service.bumpOrderItem({
        itemId,
        reason: 'Served to customer',
      });

      expect(mockOrderItemRepository.save).toHaveBeenCalled();
      expect(result.status).toBe(RestaurantOrderStatus.SERVED);
    });
  });

  describe('bumpOrder', () => {
    it('should bump entire order from display', async () => {
      const orderId = 'order-123';
      const mockOrder = {
        id: orderId,
        orderNumber: 'ORD-001',
        items: [
          {
            id: 'item-1',
            status: RestaurantOrderStatus.READY,
          },
          {
            id: 'item-2',
            status: RestaurantOrderStatus.READY,
          },
        ],
      };

      mockOrderRepository.findOne.mockResolvedValue(mockOrder);
      mockOrderItemRepository.save.mockResolvedValue(mockOrder.items);

      const result = await service.bumpOrder({ orderId });

      expect(mockOrderRepository.findOne).toHaveBeenCalled();
      expect(mockOrderItemRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if order not found', async () => {
      mockOrderRepository.findOne.mockResolvedValue(null);

      await expect(
        service.bumpOrder({ orderId: 'non-existent' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('recallOrder', () => {
    it('should recall order back to kitchen display', async () => {
      const orderId = 'order-123';
      const mockOrder = {
        id: orderId,
        status: RestaurantOrderStatus.READY,
        items: [
          {
            id: 'item-1',
            status: RestaurantOrderStatus.READY,
          },
        ],
      };

      mockOrderRepository.findOne.mockResolvedValue(mockOrder);
      mockOrderItemRepository.save.mockResolvedValue(mockOrder.items);
      mockOrderRepository.save.mockResolvedValue({
        ...mockOrder,
        status: RestaurantOrderStatus.PREPARING,
      });

      const result = await service.recallOrder({ orderId });

      expect(mockOrderRepository.findOne).toHaveBeenCalled();
      expect(mockOrderItemRepository.save).toHaveBeenCalled();
      expect(mockOrderRepository.save).toHaveBeenCalled();
    });
  });
});
