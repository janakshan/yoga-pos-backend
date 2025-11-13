import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { RestaurantOrdersService } from '../services/restaurant-orders.service';
import {
  CreateOrderDto,
  UpdateOrderDto,
  FilterOrderDto,
  UpdateOrderStatusDto,
  AddOrderItemsDto,
  RemoveOrderItemsDto,
  UpdateOrderItemDto,
} from '../dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RestaurantModeGuard } from '../../../common/guards/restaurant-mode.guard';
import { RestaurantMode } from '../../../common/decorators/restaurant-mode.decorator';
import { KitchenStation } from '../common/restaurant.constants';

@ApiTags('Restaurant - Orders')
@Controller('restaurant/orders')
@UseGuards(JwtAuthGuard, RolesGuard, RestaurantModeGuard)
@ApiBearerAuth('JWT-auth')
@RestaurantMode()
export class RestaurantOrdersController {
  constructor(
    private readonly ordersService: RestaurantOrdersService,
  ) {}

  @Post()
  @Roles('admin', 'manager', 'waiter')
  @ApiOperation({ summary: 'Create a new restaurant order' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed or invalid data',
  })
  @ApiResponse({ status: 404, description: 'Branch, table, or products not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiBody({ type: CreateOrderDto })
  create(@Body() createOrderDto: CreateOrderDto, @Request() req: any) {
    const userId = req.user?.id || 'system';
    const userName = req.user?.username || 'System';
    return this.ordersService.create(createOrderDto, userId, userName);
  }

  @Get()
  @Roles('admin', 'manager', 'waiter')
  @ApiOperation({ summary: 'Get all orders with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  findAll(@Query() filterDto: FilterOrderDto) {
    return this.ordersService.findAll(filterDto);
  }

  @Get('kitchen/:branchId/:station')
  @Roles('admin', 'manager', 'waiter', 'kitchen')
  @ApiOperation({ summary: 'Get orders for a specific kitchen station' })
  @ApiResponse({
    status: 200,
    description: 'Kitchen orders retrieved successfully',
  })
  @ApiParam({ name: 'branchId', description: 'Branch ID' })
  @ApiParam({
    name: 'station',
    description: 'Kitchen station',
    enum: KitchenStation,
  })
  getKitchenOrders(
    @Param('branchId') branchId: string,
    @Param('station') station: KitchenStation,
  ) {
    return this.ordersService.getOrdersByKitchenStation(branchId, station);
  }

  @Get(':id')
  @Roles('admin', 'manager', 'waiter')
  @ApiOperation({ summary: 'Get a single order by ID' })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'manager', 'waiter')
  @ApiOperation({ summary: 'Update order details' })
  @ApiResponse({ status: 200, description: 'Order updated successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({
    status: 403,
    description: 'Cannot update completed or cancelled orders',
  })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiBody({ type: UpdateOrderDto })
  update(
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || 'system';
    const userName = req.user?.username || 'System';
    return this.ordersService.update(id, updateOrderDto, userId, userName);
  }

  @Patch(':id/status')
  @Roles('admin', 'manager', 'waiter', 'kitchen')
  @ApiOperation({ summary: 'Update order status' })
  @ApiResponse({ status: 200, description: 'Order status updated successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({
    status: 400,
    description: 'Invalid status transition',
  })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiBody({ type: UpdateOrderStatusDto })
  updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateOrderStatusDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || 'system';
    const userName = req.user?.username || 'System';
    return this.ordersService.updateStatus(
      id,
      updateStatusDto,
      userId,
      userName,
    );
  }

  @Post(':id/items')
  @Roles('admin', 'manager', 'waiter')
  @ApiOperation({ summary: 'Add items to an existing order' })
  @ApiResponse({ status: 200, description: 'Items added successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({
    status: 403,
    description: 'Cannot add items to completed or cancelled orders',
  })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiBody({ type: AddOrderItemsDto })
  addItems(
    @Param('id') id: string,
    @Body() addItemsDto: AddOrderItemsDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || 'system';
    const userName = req.user?.username || 'System';
    return this.ordersService.addItems(id, addItemsDto, userId, userName);
  }

  @Delete(':id/items')
  @Roles('admin', 'manager', 'waiter')
  @ApiOperation({ summary: 'Remove items from an order' })
  @ApiResponse({ status: 200, description: 'Items removed successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({
    status: 403,
    description: 'Cannot remove items from completed or cancelled orders',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot remove all items or items do not belong to order',
  })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiBody({ type: RemoveOrderItemsDto })
  removeItems(
    @Param('id') id: string,
    @Body() removeItemsDto: RemoveOrderItemsDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || 'system';
    const userName = req.user?.username || 'System';
    return this.ordersService.removeItems(
      id,
      removeItemsDto,
      userId,
      userName,
    );
  }

  @Patch(':id/items/:itemId')
  @Roles('admin', 'manager', 'waiter', 'kitchen')
  @ApiOperation({ summary: 'Update an order item' })
  @ApiResponse({ status: 200, description: 'Order item updated successfully' })
  @ApiResponse({ status: 404, description: 'Order or item not found' })
  @ApiResponse({
    status: 403,
    description: 'Cannot update items in completed or cancelled orders',
  })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiParam({ name: 'itemId', description: 'Order item ID' })
  @ApiBody({ type: UpdateOrderItemDto })
  updateItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() updateItemDto: UpdateOrderItemDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || 'system';
    const userName = req.user?.username || 'System';
    return this.ordersService.updateItem(
      id,
      itemId,
      updateItemDto,
      userId,
      userName,
    );
  }

  @Delete(':id')
  @Roles('admin', 'manager')
  @ApiOperation({
    summary: 'Delete (cancel) an order',
    description: 'Marks the order as cancelled. Cannot delete completed orders.',
  })
  @ApiResponse({ status: 200, description: 'Order cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({
    status: 403,
    description: 'Cannot delete completed orders',
  })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        reason: {
          type: 'string',
          description: 'Reason for cancellation',
          example: 'Customer requested cancellation',
        },
      },
      required: ['reason'],
    },
  })
  remove(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Request() req: any,
  ) {
    const userId = req.user?.id || 'system';
    const userName = req.user?.username || 'System';
    return this.ordersService.remove(id, reason, userId, userName);
  }
}
