import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { KitchenService } from '../services/kitchen.service';
import {
  CreateKitchenStationDto,
  UpdateKitchenStationDto,
  FilterKitchenQueueDto,
  MarkItemReadyDto,
  BumpOrderItemDto,
  BumpOrderDto,
  RecallOrderDto,
  KitchenPerformanceQueryDto,
  KitchenMetricsResponseDto,
  KitchenOrderDisplayDto,
  PrintKitchenTicketDto,
  ReprintKitchenTicketDto,
} from '../dto';
import { KitchenStation } from '../entities/kitchen-station.entity';
import { OrderItem } from '../entities/order-item.entity';
import { RestaurantOrder } from '../entities/restaurant-order.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { RESTAURANT_PERMISSIONS } from '../common/restaurant.constants';
import { KitchenStation as KitchenStationType } from '../common/restaurant.constants';

@ApiTags('Kitchen Display System')
@ApiBearerAuth()
@Controller('restaurant/kitchen')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class KitchenController {
  constructor(private readonly kitchenService: KitchenService) {}

  // ============================================================================
  // KITCHEN STATION MANAGEMENT
  // ============================================================================

  @Post('stations')
  @RequirePermissions(RESTAURANT_PERMISSIONS.VIEW_KITCHEN_DISPLAY)
  @ApiOperation({ summary: 'Create a new kitchen station' })
  @ApiResponse({
    status: 201,
    description: 'Kitchen station created successfully',
    type: KitchenStation,
  })
  async createStation(
    @Body() createDto: CreateKitchenStationDto,
  ): Promise<KitchenStation> {
    return await this.kitchenService.createStation(createDto);
  }

  @Put('stations/:id')
  @RequirePermissions(RESTAURANT_PERMISSIONS.VIEW_KITCHEN_DISPLAY)
  @ApiOperation({ summary: 'Update kitchen station' })
  @ApiParam({ name: 'id', description: 'Kitchen station ID' })
  @ApiResponse({
    status: 200,
    description: 'Kitchen station updated successfully',
    type: KitchenStation,
  })
  async updateStation(
    @Param('id') id: string,
    @Body() updateDto: UpdateKitchenStationDto,
  ): Promise<KitchenStation> {
    return await this.kitchenService.updateStation(id, updateDto);
  }

  @Get('stations/:id')
  @RequirePermissions(RESTAURANT_PERMISSIONS.VIEW_KITCHEN_DISPLAY)
  @ApiOperation({ summary: 'Get kitchen station by ID' })
  @ApiParam({ name: 'id', description: 'Kitchen station ID' })
  @ApiResponse({
    status: 200,
    description: 'Kitchen station retrieved successfully',
    type: KitchenStation,
  })
  async getStation(@Param('id') id: string): Promise<KitchenStation> {
    return await this.kitchenService.getStation(id);
  }

  @Get('stations/branch/:branchId')
  @RequirePermissions(RESTAURANT_PERMISSIONS.VIEW_KITCHEN_DISPLAY)
  @ApiOperation({ summary: 'Get all kitchen stations for a branch' })
  @ApiParam({ name: 'branchId', description: 'Branch ID' })
  @ApiResponse({
    status: 200,
    description: 'Kitchen stations retrieved successfully',
    type: [KitchenStation],
  })
  async getStationsByBranch(
    @Param('branchId') branchId: string,
  ): Promise<KitchenStation[]> {
    return await this.kitchenService.getStationsByBranch(branchId);
  }

  @Delete('stations/:id')
  @RequirePermissions(RESTAURANT_PERMISSIONS.VIEW_KITCHEN_DISPLAY)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete kitchen station' })
  @ApiParam({ name: 'id', description: 'Kitchen station ID' })
  @ApiResponse({ status: 204, description: 'Kitchen station deleted successfully' })
  async deleteStation(@Param('id') id: string): Promise<void> {
    return await this.kitchenService.deleteStation(id);
  }

  // ============================================================================
  // KITCHEN QUEUE & DISPLAY
  // ============================================================================

  @Get('queue')
  @RequirePermissions(RESTAURANT_PERMISSIONS.VIEW_KITCHEN_DISPLAY)
  @ApiOperation({
    summary: 'Get kitchen queue',
    description:
      'Retrieve orders in the kitchen queue with filtering, sorting, and timing calculations',
  })
  @ApiResponse({
    status: 200,
    description: 'Kitchen queue retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        orders: {
          type: 'array',
          items: { $ref: '#/components/schemas/KitchenOrderDisplayDto' },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
      },
    },
  })
  async getKitchenQueue(@Query() filter: FilterKitchenQueueDto): Promise<{
    orders: KitchenOrderDisplayDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    return await this.kitchenService.getKitchenQueue(filter);
  }

  @Get('queue/station/:branchId/:station')
  @RequirePermissions(RESTAURANT_PERMISSIONS.VIEW_KITCHEN_DISPLAY)
  @ApiOperation({ summary: 'Get active orders for a specific kitchen station' })
  @ApiParam({ name: 'branchId', description: 'Branch ID' })
  @ApiParam({
    name: 'station',
    description: 'Kitchen station type',
    enum: KitchenStationType,
  })
  @ApiResponse({
    status: 200,
    description: 'Station orders retrieved successfully',
    type: [KitchenOrderDisplayDto],
  })
  async getStationOrders(
    @Param('branchId') branchId: string,
    @Param('station') station: KitchenStationType,
  ): Promise<KitchenOrderDisplayDto[]> {
    return await this.kitchenService.getStationOrders(branchId, station);
  }

  @Get('queue/course-sequence/:branchId/:station')
  @RequirePermissions(RESTAURANT_PERMISSIONS.VIEW_KITCHEN_DISPLAY)
  @ApiOperation({ summary: 'Get orders sorted by course sequence' })
  @ApiParam({ name: 'branchId', description: 'Branch ID' })
  @ApiParam({
    name: 'station',
    description: 'Kitchen station type',
    enum: KitchenStationType,
  })
  @ApiResponse({
    status: 200,
    description: 'Orders sorted by course sequence',
    type: [KitchenOrderDisplayDto],
  })
  async getOrdersByCourseSequence(
    @Param('branchId') branchId: string,
    @Param('station') station: KitchenStationType,
  ): Promise<KitchenOrderDisplayDto[]> {
    return await this.kitchenService.getOrdersByCourseSequence(
      branchId,
      station,
    );
  }

  @Get('queue/priority/:branchId')
  @RequirePermissions(RESTAURANT_PERMISSIONS.VIEW_KITCHEN_DISPLAY)
  @ApiOperation({ summary: 'Get orders sorted by priority' })
  @ApiParam({ name: 'branchId', description: 'Branch ID' })
  @ApiQuery({
    name: 'station',
    required: false,
    description: 'Filter by kitchen station',
    enum: KitchenStationType,
  })
  @ApiResponse({
    status: 200,
    description: 'Orders sorted by priority',
    type: [KitchenOrderDisplayDto],
  })
  async getOrdersByPriority(
    @Param('branchId') branchId: string,
    @Query('station') station?: KitchenStationType,
  ): Promise<KitchenOrderDisplayDto[]> {
    return await this.kitchenService.getOrdersByPriority(branchId, station);
  }

  // ============================================================================
  // ORDER ITEM ACTIONS
  // ============================================================================

  @Post('items/ready')
  @RequirePermissions(RESTAURANT_PERMISSIONS.VIEW_KITCHEN_DISPLAY)
  @ApiOperation({ summary: 'Mark an order item as ready' })
  @ApiResponse({
    status: 200,
    description: 'Order item marked as ready',
    type: OrderItem,
  })
  async markItemReady(@Body() dto: MarkItemReadyDto): Promise<OrderItem> {
    return await this.kitchenService.markItemReady(dto);
  }

  @Post('items/bump')
  @RequirePermissions(RESTAURANT_PERMISSIONS.VIEW_KITCHEN_DISPLAY)
  @ApiOperation({
    summary: 'Bump (remove from display) an order item',
    description: 'Removes an item from the kitchen display, marking it as served',
  })
  @ApiResponse({
    status: 200,
    description: 'Order item bumped successfully',
    type: OrderItem,
  })
  async bumpOrderItem(@Body() dto: BumpOrderItemDto): Promise<OrderItem> {
    return await this.kitchenService.bumpOrderItem(dto);
  }

  // ============================================================================
  // ORDER ACTIONS
  // ============================================================================

  @Post('orders/bump')
  @RequirePermissions(RESTAURANT_PERMISSIONS.VIEW_KITCHEN_DISPLAY)
  @ApiOperation({
    summary: 'Bump entire order or specific items',
    description:
      'Removes order from kitchen display, optionally bumping only specific items',
  })
  @ApiResponse({
    status: 200,
    description: 'Order bumped successfully',
    type: RestaurantOrder,
  })
  async bumpOrder(@Body() dto: BumpOrderDto): Promise<RestaurantOrder> {
    return await this.kitchenService.bumpOrder(dto);
  }

  @Post('orders/recall')
  @RequirePermissions(RESTAURANT_PERMISSIONS.VIEW_KITCHEN_DISPLAY)
  @ApiOperation({
    summary: 'Recall order to kitchen display',
    description: 'Brings a previously bumped order back to the kitchen display',
  })
  @ApiResponse({
    status: 200,
    description: 'Order recalled successfully',
    type: RestaurantOrder,
  })
  async recallOrder(@Body() dto: RecallOrderDto): Promise<RestaurantOrder> {
    return await this.kitchenService.recallOrder(dto);
  }

  // ============================================================================
  // PERFORMANCE METRICS
  // ============================================================================

  @Get('metrics/performance')
  @RequirePermissions(RESTAURANT_PERMISSIONS.VIEW_KITCHEN_DISPLAY)
  @ApiOperation({
    summary: 'Get kitchen performance metrics',
    description:
      'Retrieve comprehensive performance metrics including prep times, on-time rates, and order statistics',
  })
  @ApiResponse({
    status: 200,
    description: 'Performance metrics retrieved successfully',
    type: KitchenMetricsResponseDto,
  })
  async getPerformanceMetrics(
    @Query() query: KitchenPerformanceQueryDto,
  ): Promise<KitchenMetricsResponseDto> {
    return await this.kitchenService.getPerformanceMetrics(query);
  }
}
