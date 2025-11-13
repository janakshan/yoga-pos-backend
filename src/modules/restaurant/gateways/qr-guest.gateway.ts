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

/**
 * WebSocket Gateway for real-time updates to guests using QR ordering
 * Namespace: /qr/guest
 */
@WebSocketGateway({
  namespace: '/qr/guest',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class QrGuestGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(QrGuestGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Guest client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Guest client disconnected: ${client.id}`);
  }

  /**
   * Guest joins their session room to receive updates
   */
  @SubscribeMessage('joinSession')
  handleJoinSession(
    @MessageBody() data: { sessionToken: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `session:${data.sessionToken}`;
    client.join(room);
    this.logger.log(`Guest joined session room: ${room}`);
    return { event: 'sessionJoined', data: { room } };
  }

  /**
   * Guest leaves their session room
   */
  @SubscribeMessage('leaveSession')
  handleLeaveSession(
    @MessageBody() data: { sessionToken: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `session:${data.sessionToken}`;
    client.leave(room);
    this.logger.log(`Guest left session room: ${room}`);
    return { event: 'sessionLeft', data: { room } };
  }

  /**
   * Guest joins an order room to track specific order updates
   */
  @SubscribeMessage('joinOrder')
  handleJoinOrder(
    @MessageBody() data: { orderId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `order:${data.orderId}`;
    client.join(room);
    this.logger.log(`Guest joined order room: ${room}`);
    return { event: 'orderJoined', data: { room } };
  }

  /**
   * Guest leaves an order room
   */
  @SubscribeMessage('leaveOrder')
  handleLeaveOrder(@MessageBody() data: { orderId: string }, @ConnectedSocket() client: Socket) {
    const room = `order:${data.orderId}`;
    client.leave(room);
    this.logger.log(`Guest left order room: ${room}`);
    return { event: 'orderLeft', data: { room } };
  }

  // ============== Server → Client Events ==============

  /**
   * Emit order status update to guest
   */
  emitOrderStatusUpdate(orderId: string, order: RestaurantOrder, previousStatus: string) {
    const room = `order:${orderId}`;
    this.server.to(room).emit('orderStatusUpdated', {
      orderId,
      order,
      previousStatus,
      newStatus: order.status,
      timestamp: new Date(),
    });

    this.logger.log(`Order status update sent to room ${room}: ${previousStatus} → ${order.status}`);
  }

  /**
   * Emit order confirmed to guest
   */
  emitOrderConfirmed(orderId: string, order: RestaurantOrder, estimatedTime?: number) {
    const room = `order:${orderId}`;
    this.server.to(room).emit('orderConfirmed', {
      orderId,
      order,
      estimatedTime,
      message: 'Your order has been confirmed!',
      timestamp: new Date(),
    });

    this.logger.log(`Order confirmed notification sent to room ${room}`);
  }

  /**
   * Emit order preparing to guest
   */
  emitOrderPreparing(orderId: string, order: RestaurantOrder) {
    const room = `order:${orderId}`;
    this.server.to(room).emit('orderPreparing', {
      orderId,
      order,
      message: 'Your order is being prepared!',
      timestamp: new Date(),
    });

    this.logger.log(`Order preparing notification sent to room ${room}`);
  }

  /**
   * Emit order ready to guest
   */
  emitOrderReady(orderId: string, order: RestaurantOrder) {
    const room = `order:${orderId}`;
    this.server.to(room).emit('orderReady', {
      orderId,
      order,
      message: 'Your order is ready!',
      timestamp: new Date(),
    });

    this.logger.log(`Order ready notification sent to room ${room}`);
  }

  /**
   * Emit order served to guest
   */
  emitOrderServed(orderId: string, order: RestaurantOrder) {
    const room = `order:${orderId}`;
    this.server.to(room).emit('orderServed', {
      orderId,
      order,
      message: 'Your order has been served. Enjoy!',
      timestamp: new Date(),
    });

    this.logger.log(`Order served notification sent to room ${room}`);
  }

  /**
   * Emit order item update to guest
   */
  emitOrderItemUpdate(orderId: string, itemId: string, itemStatus: string) {
    const room = `order:${orderId}`;
    this.server.to(room).emit('orderItemUpdated', {
      orderId,
      itemId,
      itemStatus,
      timestamp: new Date(),
    });

    this.logger.log(`Order item update sent to room ${room}`);
  }

  /**
   * Emit server call response to guest
   */
  emitServerCallResponse(sessionToken: string, message: string) {
    const room = `session:${sessionToken}`;
    this.server.to(room).emit('serverCallResponse', {
      message,
      timestamp: new Date(),
    });

    this.logger.log(`Server call response sent to session ${sessionToken}`);
  }

  /**
   * Emit bill ready to guest
   */
  emitBillReady(sessionToken: string, billData: any) {
    const room = `session:${sessionToken}`;
    this.server.to(room).emit('billReady', {
      message: 'Your bill is ready',
      billData,
      timestamp: new Date(),
    });

    this.logger.log(`Bill ready notification sent to session ${sessionToken}`);
  }

  /**
   * Emit payment confirmation to guest
   */
  emitPaymentConfirmed(sessionToken: string, paymentData: any) {
    const room = `session:${sessionToken}`;
    this.server.to(room).emit('paymentConfirmed', {
      message: 'Payment confirmed. Thank you!',
      paymentData,
      timestamp: new Date(),
    });

    this.logger.log(`Payment confirmation sent to session ${sessionToken}`);
  }

  /**
   * Emit session expiring warning to guest
   */
  emitSessionExpiringWarning(sessionToken: string, minutesRemaining: number) {
    const room = `session:${sessionToken}`;
    this.server.to(room).emit('sessionExpiring', {
      message: `Your session will expire in ${minutesRemaining} minutes`,
      minutesRemaining,
      timestamp: new Date(),
    });

    this.logger.log(`Session expiring warning sent to session ${sessionToken}`);
  }

  /**
   * Emit session expired to guest
   */
  emitSessionExpired(sessionToken: string) {
    const room = `session:${sessionToken}`;
    this.server.to(room).emit('sessionExpired', {
      message: 'Your session has expired',
      timestamp: new Date(),
    });

    this.logger.log(`Session expired notification sent to session ${sessionToken}`);
  }

  /**
   * Emit general notification to guest
   */
  emitNotification(sessionToken: string, notification: {
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    data?: any;
  }) {
    const room = `session:${sessionToken}`;
    this.server.to(room).emit('notification', {
      ...notification,
      timestamp: new Date(),
    });

    this.logger.log(`Notification sent to session ${sessionToken}: ${notification.type} - ${notification.title}`);
  }
}
