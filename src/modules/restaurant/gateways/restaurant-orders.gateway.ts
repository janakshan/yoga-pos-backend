import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { RestaurantOrder } from '../entities/restaurant-order.entity';
import { OrderItem } from '../entities/order-item.entity';

/**
 * WebSocket Gateway for real-time restaurant order updates
 *
 * Namespace: /restaurant/orders
 *
 * Events:
 * - Client → Server:
 *   - joinBranch: Join a branch room to receive orders for that branch
 *   - leaveBranch: Leave a branch room
 *   - joinKitchen: Join a kitchen station room
 *   - leaveKitchen: Leave a kitchen station room
 *   - joinTable: Join a table room to receive updates for that table
 *   - leaveTable: Leave a table room
 *
 * - Server → Client:
 *   - orderCreated: New order created
 *   - orderUpdated: Order details updated
 *   - orderStatusChanged: Order status changed
 *   - orderItemUpdated: Individual order item updated
 *   - orderItemsAdded: New items added to order
 *   - orderItemsRemoved: Items removed from order
 *   - orderCancelled: Order cancelled
 *   - orderCompleted: Order completed
 *
 * Room naming conventions:
 * - branch:{branchId} - All orders for a branch
 * - kitchen:{branchId}:{station} - Orders for specific kitchen station
 * - table:{tableId} - Orders for a specific table
 */
@WebSocketGateway({
  namespace: '/restaurant/orders',
  cors: {
    origin: '*', // Configure based on environment
    credentials: true,
  },
})
export class RestaurantOrdersGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RestaurantOrdersGateway.name);

  /**
   * Handle client connection
   */
  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  /**
   * Handle client disconnection
   */
  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Client subscribes to branch orders
   */
  @SubscribeMessage('joinBranch')
  handleJoinBranch(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { branchId: string },
  ) {
    const room = `branch:${data.branchId}`;
    client.join(room);
    this.logger.log(`Client ${client.id} joined branch room: ${room}`);
    return { event: 'joinedBranch', data: { branchId: data.branchId } };
  }

  /**
   * Client unsubscribes from branch orders
   */
  @SubscribeMessage('leaveBranch')
  handleLeaveBranch(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { branchId: string },
  ) {
    const room = `branch:${data.branchId}`;
    client.leave(room);
    this.logger.log(`Client ${client.id} left branch room: ${room}`);
    return { event: 'leftBranch', data: { branchId: data.branchId } };
  }

  /**
   * Client subscribes to kitchen station orders
   */
  @SubscribeMessage('joinKitchen')
  handleJoinKitchen(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { branchId: string; station: string },
  ) {
    const room = `kitchen:${data.branchId}:${data.station}`;
    client.join(room);
    this.logger.log(`Client ${client.id} joined kitchen room: ${room}`);
    return {
      event: 'joinedKitchen',
      data: { branchId: data.branchId, station: data.station },
    };
  }

  /**
   * Client unsubscribes from kitchen station orders
   */
  @SubscribeMessage('leaveKitchen')
  handleLeaveKitchen(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { branchId: string; station: string },
  ) {
    const room = `kitchen:${data.branchId}:${data.station}`;
    client.leave(room);
    this.logger.log(`Client ${client.id} left kitchen room: ${room}`);
    return {
      event: 'leftKitchen',
      data: { branchId: data.branchId, station: data.station },
    };
  }

  /**
   * Client subscribes to table orders
   */
  @SubscribeMessage('joinTable')
  handleJoinTable(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tableId: string },
  ) {
    const room = `table:${data.tableId}`;
    client.join(room);
    this.logger.log(`Client ${client.id} joined table room: ${room}`);
    return { event: 'joinedTable', data: { tableId: data.tableId } };
  }

  /**
   * Client unsubscribes from table orders
   */
  @SubscribeMessage('leaveTable')
  handleLeaveTable(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tableId: string },
  ) {
    const room = `table:${data.tableId}`;
    client.leave(room);
    this.logger.log(`Client ${client.id} left table room: ${room}`);
    return { event: 'leftTable', data: { tableId: data.tableId } };
  }

  /**
   * Broadcast order created event
   */
  emitOrderCreated(order: RestaurantOrder) {
    const rooms = [`branch:${order.branchId}`];
    if (order.tableId) {
      rooms.push(`table:${order.tableId}`);
    }

    // Emit to kitchen stations
    const kitchenStations = new Set(
      order.items.map((item) => item.kitchenStation),
    );
    kitchenStations.forEach((station) => {
      rooms.push(`kitchen:${order.branchId}:${station}`);
    });

    rooms.forEach((room) => {
      this.server.to(room).emit('orderCreated', order);
      this.logger.log(`Emitted orderCreated to room: ${room}`);
    });
  }

  /**
   * Broadcast order updated event
   */
  emitOrderUpdated(order: RestaurantOrder) {
    const rooms = [`branch:${order.branchId}`];
    if (order.tableId) {
      rooms.push(`table:${order.tableId}`);
    }

    rooms.forEach((room) => {
      this.server.to(room).emit('orderUpdated', order);
      this.logger.log(`Emitted orderUpdated to room: ${room}`);
    });
  }

  /**
   * Broadcast order status changed event
   */
  emitOrderStatusChanged(
    order: RestaurantOrder,
    previousStatus: string,
    newStatus: string,
  ) {
    const rooms = [`branch:${order.branchId}`];
    if (order.tableId) {
      rooms.push(`table:${order.tableId}`);
    }

    // Emit to kitchen stations
    const kitchenStations = new Set(
      order.items.map((item) => item.kitchenStation),
    );
    kitchenStations.forEach((station) => {
      rooms.push(`kitchen:${order.branchId}:${station}`);
    });

    const payload = {
      order,
      previousStatus,
      newStatus,
    };

    rooms.forEach((room) => {
      this.server.to(room).emit('orderStatusChanged', payload);
      this.logger.log(`Emitted orderStatusChanged to room: ${room}`);
    });
  }

  /**
   * Broadcast order item updated event
   */
  emitOrderItemUpdated(order: RestaurantOrder, item: OrderItem) {
    const rooms = [
      `branch:${order.branchId}`,
      `kitchen:${order.branchId}:${item.kitchenStation}`,
    ];
    if (order.tableId) {
      rooms.push(`table:${order.tableId}`);
    }

    const payload = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      item,
    };

    rooms.forEach((room) => {
      this.server.to(room).emit('orderItemUpdated', payload);
      this.logger.log(`Emitted orderItemUpdated to room: ${room}`);
    });
  }

  /**
   * Broadcast order items added event
   */
  emitOrderItemsAdded(order: RestaurantOrder, items: OrderItem[]) {
    const rooms = [`branch:${order.branchId}`];
    if (order.tableId) {
      rooms.push(`table:${order.tableId}`);
    }

    // Emit to affected kitchen stations
    const kitchenStations = new Set(items.map((item) => item.kitchenStation));
    kitchenStations.forEach((station) => {
      rooms.push(`kitchen:${order.branchId}:${station}`);
    });

    const payload = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      items,
    };

    rooms.forEach((room) => {
      this.server.to(room).emit('orderItemsAdded', payload);
      this.logger.log(`Emitted orderItemsAdded to room: ${room}`);
    });
  }

  /**
   * Broadcast order items removed event
   */
  emitOrderItemsRemoved(order: RestaurantOrder, itemIds: string[]) {
    const rooms = [`branch:${order.branchId}`];
    if (order.tableId) {
      rooms.push(`table:${order.tableId}`);
    }

    const payload = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      itemIds,
    };

    rooms.forEach((room) => {
      this.server.to(room).emit('orderItemsRemoved', payload);
      this.logger.log(`Emitted orderItemsRemoved to room: ${room}`);
    });
  }

  /**
   * Broadcast order cancelled event
   */
  emitOrderCancelled(order: RestaurantOrder, reason: string) {
    const rooms = [`branch:${order.branchId}`];
    if (order.tableId) {
      rooms.push(`table:${order.tableId}`);
    }

    // Emit to kitchen stations
    const kitchenStations = new Set(
      order.items.map((item) => item.kitchenStation),
    );
    kitchenStations.forEach((station) => {
      rooms.push(`kitchen:${order.branchId}:${station}`);
    });

    const payload = {
      order,
      reason,
    };

    rooms.forEach((room) => {
      this.server.to(room).emit('orderCancelled', payload);
      this.logger.log(`Emitted orderCancelled to room: ${room}`);
    });
  }

  /**
   * Broadcast order completed event
   */
  emitOrderCompleted(order: RestaurantOrder) {
    const rooms = [`branch:${order.branchId}`];
    if (order.tableId) {
      rooms.push(`table:${order.tableId}`);
    }

    rooms.forEach((room) => {
      this.server.to(room).emit('orderCompleted', order);
      this.logger.log(`Emitted orderCompleted to room: ${room}`);
    });
  }
}
