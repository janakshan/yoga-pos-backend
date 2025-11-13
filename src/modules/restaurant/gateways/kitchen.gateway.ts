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
import { OrderItem } from '../entities/order-item.entity';
import { RestaurantOrder } from '../entities/restaurant-order.entity';
import { KitchenStation } from '../common/restaurant.constants';

/**
 * WebSocket Gateway for Kitchen Display System real-time updates
 *
 * Namespace: /kitchen
 *
 * Events:
 * - Client → Server:
 *   - joinStation: Join a kitchen station room to receive orders for that station
 *   - leaveStation: Leave a kitchen station room
 *   - joinBranch: Join a branch room for all kitchen updates
 *   - leaveBranch: Leave a branch room
 *
 * - Server → Client:
 *   - orderReceived: New order received in kitchen
 *   - orderItemReceived: New item added to existing order
 *   - itemStatusChanged: Order item status changed (preparing, ready, etc.)
 *   - itemBumped: Item removed from display
 *   - orderBumped: Entire order removed from display
 *   - orderRecalled: Order recalled back to kitchen display
 *   - stationAlert: Alert for overdue or urgent items
 *   - performanceUpdate: Real-time performance metrics update
 *
 * Room naming conventions:
 * - kitchen:branch:{branchId} - All kitchen updates for a branch
 * - kitchen:station:{branchId}:{station} - Updates for specific kitchen station
 */
@WebSocketGateway({
  namespace: '/kitchen',
  cors: {
    origin: '*', // Configure based on environment
    credentials: true,
  },
})
export class KitchenGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(KitchenGateway.name);

  /**
   * Handle client connection
   */
  handleConnection(client: Socket) {
    this.logger.log(`Kitchen display client connected: ${client.id}`);
  }

  /**
   * Handle client disconnection
   */
  handleDisconnect(client: Socket) {
    this.logger.log(`Kitchen display client disconnected: ${client.id}`);
  }

  /**
   * Client subscribes to kitchen station updates
   */
  @SubscribeMessage('joinStation')
  handleJoinStation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { branchId: string; station: KitchenStation },
  ) {
    const room = `kitchen:station:${data.branchId}:${data.station}`;
    client.join(room);
    this.logger.log(
      `Kitchen client ${client.id} joined station room: ${room}`,
    );
    return {
      event: 'joinedStation',
      data: { branchId: data.branchId, station: data.station },
    };
  }

  /**
   * Client unsubscribes from kitchen station updates
   */
  @SubscribeMessage('leaveStation')
  handleLeaveStation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { branchId: string; station: KitchenStation },
  ) {
    const room = `kitchen:station:${data.branchId}:${data.station}`;
    client.leave(room);
    this.logger.log(`Kitchen client ${client.id} left station room: ${room}`);
    return {
      event: 'leftStation',
      data: { branchId: data.branchId, station: data.station },
    };
  }

  /**
   * Client subscribes to branch-wide kitchen updates
   */
  @SubscribeMessage('joinBranch')
  handleJoinBranch(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { branchId: string },
  ) {
    const room = `kitchen:branch:${data.branchId}`;
    client.join(room);
    this.logger.log(
      `Kitchen client ${client.id} joined branch room: ${room}`,
    );
    return { event: 'joinedBranch', data: { branchId: data.branchId } };
  }

  /**
   * Client unsubscribes from branch-wide kitchen updates
   */
  @SubscribeMessage('leaveBranch')
  handleLeaveBranch(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { branchId: string },
  ) {
    const room = `kitchen:branch:${data.branchId}`;
    client.leave(room);
    this.logger.log(`Kitchen client ${client.id} left branch room: ${room}`);
    return { event: 'leftBranch', data: { branchId: data.branchId } };
  }

  /**
   * Emit new order received in kitchen
   */
  emitOrderReceived(order: RestaurantOrder) {
    const rooms = [`kitchen:branch:${order.branchId}`];

    // Emit to relevant kitchen stations
    const kitchenStations = new Set(
      order.items.map((item) => item.kitchenStation),
    );
    kitchenStations.forEach((station) => {
      rooms.push(`kitchen:station:${order.branchId}:${station}`);
    });

    const payload = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      tableNumber: order.table?.tableNumber,
      serviceType: order.serviceType,
      priority: order.priority,
      items: order.items.map((item) => ({
        id: item.id,
        productName: item.productName,
        quantity: item.quantity,
        kitchenStation: item.kitchenStation,
        specialInstructions: item.specialInstructions,
        modifiers: item.modifiers,
        course: item.course,
      })),
      timestamp: new Date(),
    };

    rooms.forEach((room) => {
      this.server.to(room).emit('orderReceived', payload);
      this.logger.log(`Emitted orderReceived to kitchen room: ${room}`);
    });
  }

  /**
   * Emit new item added to existing order
   */
  emitOrderItemReceived(order: RestaurantOrder, newItems: OrderItem[]) {
    const rooms = [`kitchen:branch:${order.branchId}`];

    // Emit to relevant kitchen stations
    const kitchenStations = new Set(
      newItems.map((item) => item.kitchenStation),
    );
    kitchenStations.forEach((station) => {
      rooms.push(`kitchen:station:${order.branchId}:${station}`);
    });

    const payload = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      items: newItems.map((item) => ({
        id: item.id,
        productName: item.productName,
        quantity: item.quantity,
        kitchenStation: item.kitchenStation,
        specialInstructions: item.specialInstructions,
        modifiers: item.modifiers,
        course: item.course,
      })),
      timestamp: new Date(),
    };

    rooms.forEach((room) => {
      this.server.to(room).emit('orderItemReceived', payload);
      this.logger.log(`Emitted orderItemReceived to kitchen room: ${room}`);
    });
  }

  /**
   * Emit item status changed
   */
  emitItemStatusChanged(
    item: OrderItem,
    order: RestaurantOrder,
    previousStatus: string,
    newStatus: string,
  ) {
    const rooms = [
      `kitchen:branch:${order.branchId}`,
      `kitchen:station:${order.branchId}:${item.kitchenStation}`,
    ];

    const payload = {
      itemId: item.id,
      orderId: order.id,
      orderNumber: order.orderNumber,
      previousStatus,
      newStatus,
      timestamp: new Date(),
    };

    rooms.forEach((room) => {
      this.server.to(room).emit('itemStatusChanged', payload);
      this.logger.log(`Emitted itemStatusChanged to kitchen room: ${room}`);
    });
  }

  /**
   * Emit item bumped from display
   */
  emitItemBumped(item: OrderItem, order: RestaurantOrder, reason?: string) {
    const rooms = [
      `kitchen:branch:${order.branchId}`,
      `kitchen:station:${order.branchId}:${item.kitchenStation}`,
    ];

    const payload = {
      itemId: item.id,
      orderId: order.id,
      orderNumber: order.orderNumber,
      reason,
      timestamp: new Date(),
    };

    rooms.forEach((room) => {
      this.server.to(room).emit('itemBumped', payload);
      this.logger.log(`Emitted itemBumped to kitchen room: ${room}`);
    });
  }

  /**
   * Emit order bumped from display
   */
  emitOrderBumped(order: RestaurantOrder, reason?: string) {
    const rooms = [`kitchen:branch:${order.branchId}`];

    const kitchenStations = new Set(
      order.items.map((item) => item.kitchenStation),
    );
    kitchenStations.forEach((station) => {
      rooms.push(`kitchen:station:${order.branchId}:${station}`);
    });

    const payload = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      reason,
      timestamp: new Date(),
    };

    rooms.forEach((room) => {
      this.server.to(room).emit('orderBumped', payload);
      this.logger.log(`Emitted orderBumped to kitchen room: ${room}`);
    });
  }

  /**
   * Emit order recalled to kitchen display
   */
  emitOrderRecalled(order: RestaurantOrder, reason?: string) {
    const rooms = [`kitchen:branch:${order.branchId}`];

    const kitchenStations = new Set(
      order.items.map((item) => item.kitchenStation),
    );
    kitchenStations.forEach((station) => {
      rooms.push(`kitchen:station:${order.branchId}:${station}`);
    });

    const payload = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      tableNumber: order.table?.tableNumber,
      serviceType: order.serviceType,
      priority: order.priority,
      items: order.items.map((item) => ({
        id: item.id,
        productName: item.productName,
        quantity: item.quantity,
        kitchenStation: item.kitchenStation,
        status: item.status,
      })),
      reason,
      timestamp: new Date(),
    };

    rooms.forEach((room) => {
      this.server.to(room).emit('orderRecalled', payload);
      this.logger.log(`Emitted orderRecalled to kitchen room: ${room}`);
    });
  }

  /**
   * Emit station alert (for overdue or urgent items)
   */
  emitStationAlert(
    branchId: string,
    station: KitchenStation,
    alertType: 'overdue' | 'urgent' | 'warning',
    data: {
      orderId: string;
      orderNumber: string;
      itemId?: string;
      message: string;
      age?: number;
    },
  ) {
    const rooms = [
      `kitchen:branch:${branchId}`,
      `kitchen:station:${branchId}:${station}`,
    ];

    const payload = {
      alertType,
      station,
      ...data,
      timestamp: new Date(),
    };

    rooms.forEach((room) => {
      this.server.to(room).emit('stationAlert', payload);
      this.logger.log(`Emitted stationAlert to kitchen room: ${room}`);
    });
  }

  /**
   * Emit performance metrics update
   */
  emitPerformanceUpdate(
    branchId: string,
    station: KitchenStation,
    metrics: {
      activeOrders: number;
      averagePrepTime: number;
      onTimeRate: number;
      overdueCount: number;
    },
  ) {
    const room = `kitchen:station:${branchId}:${station}`;

    const payload = {
      station,
      ...metrics,
      timestamp: new Date(),
    };

    this.server.to(room).emit('performanceUpdate', payload);
    this.logger.log(`Emitted performanceUpdate to kitchen room: ${room}`);
  }

  /**
   * Broadcast message to all kitchen displays in a branch
   */
  broadcastToBranch(branchId: string, event: string, data: any) {
    const room = `kitchen:branch:${branchId}`;
    this.server.to(room).emit(event, {
      ...data,
      timestamp: new Date(),
    });
    this.logger.log(`Broadcasted ${event} to kitchen branch: ${room}`);
  }

  /**
   * Broadcast message to specific station
   */
  broadcastToStation(
    branchId: string,
    station: KitchenStation,
    event: string,
    data: any,
  ) {
    const room = `kitchen:station:${branchId}:${station}`;
    this.server.to(room).emit(event, {
      ...data,
      timestamp: new Date(),
    });
    this.logger.log(`Broadcasted ${event} to kitchen station: ${room}`);
  }
}
