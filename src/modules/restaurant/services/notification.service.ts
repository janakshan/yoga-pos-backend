import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationLog } from '../entities/notification-log.entity';
import { RestaurantOrder } from '../entities/restaurant-order.entity';
import {
  NotificationDeviceType,
  NotificationStatus,
  NOTIFICATION_TIMEOUTS,
} from '../common/hardware.constants';
import {
  SendNotificationDto,
  FilterNotificationsDto,
  NotificationDeviceConfigDto,
} from '../dto/hardware.dto';

/**
 * Notification Service
 *
 * Manages pagers, buzzers, and other notification devices
 * Handles customer pickup notifications and staff alerts
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private devices = new Map<string, NotificationDeviceConfigDto>();

  constructor(
    @InjectRepository(NotificationLog)
    private readonly notificationLogRepository: Repository<NotificationLog>,
  ) {}

  /**
   * Register a notification device
   */
  async registerDevice(config: NotificationDeviceConfigDto): Promise<void> {
    const key = `${config.branchId}:${config.deviceId}`;
    this.devices.set(key, config);
    this.logger.log(
      `Registered notification device: ${config.name} (${config.deviceType})`,
    );
  }

  /**
   * Send notification for order ready
   */
  async sendOrderReadyNotification(
    order: RestaurantOrder,
    deviceId?: string,
  ): Promise<NotificationLog> {
    const message = `Order #${order.orderNumber} is ready for pickup`;

    // Auto-select device if not specified
    const selectedDeviceId =
      deviceId || (await this.selectAvailableDevice(order.branchId));

    if (!selectedDeviceId) {
      throw new NotFoundException(
        `No notification device available for branch ${order.branchId}`,
      );
    }

    const deviceConfig = this.getDeviceConfig(order.branchId, selectedDeviceId);
    const timeout = this.getNotificationTimeout(deviceConfig.deviceType);

    const notification = this.notificationLogRepository.create({
      branchId: order.branchId,
      orderId: order.id,
      orderNumber: order.orderNumber,
      deviceId: selectedDeviceId,
      deviceName: deviceConfig.name,
      deviceType: deviceConfig.deviceType,
      message,
      status: NotificationStatus.PENDING,
      expiresAt: new Date(Date.now() + timeout),
      deviceSettings: {
        vibrationPattern: deviceConfig.vibrationPattern,
        lightColor: deviceConfig.lightColor,
        soundPattern: deviceConfig.soundPattern,
        duration: deviceConfig.timeout,
      },
      metadata: {
        notificationType: 'order_ready',
        tableNumber: order.table?.tableNumber,
      },
    });

    const saved = await this.notificationLogRepository.save(notification);

    // Send to device
    await this.sendToDevice(saved);

    return saved;
  }

  /**
   * Send custom notification
   */
  async sendNotification(
    branchId: string,
    deviceId: string,
    message: string,
    options: {
      orderId?: string;
      orderNumber?: string;
      metadata?: Record<string, any>;
    } = {},
  ): Promise<NotificationLog> {
    const deviceConfig = this.getDeviceConfig(branchId, deviceId);
    const timeout = this.getNotificationTimeout(deviceConfig.deviceType);

    const notification = this.notificationLogRepository.create({
      branchId,
      orderId: options.orderId,
      orderNumber: options.orderNumber,
      deviceId,
      deviceName: deviceConfig.name,
      deviceType: deviceConfig.deviceType,
      message,
      status: NotificationStatus.PENDING,
      expiresAt: new Date(Date.now() + timeout),
      deviceSettings: {
        vibrationPattern: deviceConfig.vibrationPattern,
        lightColor: deviceConfig.lightColor,
        soundPattern: deviceConfig.soundPattern,
        duration: deviceConfig.timeout,
      },
      metadata: options.metadata,
    });

    const saved = await this.notificationLogRepository.save(notification);

    // Send to device
    await this.sendToDevice(saved);

    return saved;
  }

  /**
   * Acknowledge notification (customer picked up order)
   */
  async acknowledgeNotification(
    notificationId: string,
    acknowledgedBy?: string,
  ): Promise<NotificationLog> {
    const notification = await this.notificationLogRepository.findOne({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException(`Notification ${notificationId} not found`);
    }

    notification.status = NotificationStatus.ACKNOWLEDGED;
    notification.acknowledgedAt = new Date();

    if (acknowledgedBy) {
      notification.metadata = {
        ...notification.metadata,
        acknowledgedBy,
      };
    }

    this.logger.log(`Notification ${notificationId} acknowledged`);
    return this.notificationLogRepository.save(notification);
  }

  /**
   * Cancel notification
   */
  async cancelNotification(notificationId: string): Promise<NotificationLog> {
    const notification = await this.notificationLogRepository.findOne({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException(`Notification ${notificationId} not found`);
    }

    if (notification.status === NotificationStatus.ACKNOWLEDGED) {
      throw new Error('Cannot cancel an acknowledged notification');
    }

    notification.status = NotificationStatus.FAILED;
    notification.errorMessage = 'Cancelled by user';

    this.logger.log(`Notification ${notificationId} cancelled`);
    return this.notificationLogRepository.save(notification);
  }

  /**
   * Retry failed notification
   */
  async retryNotification(notificationId: string): Promise<NotificationLog> {
    const notification = await this.notificationLogRepository.findOne({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException(`Notification ${notificationId} not found`);
    }

    if (notification.retryCount >= notification.maxRetries) {
      throw new Error('Maximum retry attempts exceeded');
    }

    notification.status = NotificationStatus.PENDING;
    notification.retryCount++;
    notification.errorMessage = null;
    notification.errorCode = null;

    await this.notificationLogRepository.save(notification);

    // Resend to device
    await this.sendToDevice(notification);

    return notification;
  }

  /**
   * Get notifications with filtering
   */
  async findNotifications(filter: FilterNotificationsDto): Promise<{
    notifications: NotificationLog[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filter.branchId) where.branchId = filter.branchId;
    if (filter.orderId) where.orderId = filter.orderId;
    if (filter.deviceId) where.deviceId = filter.deviceId;
    if (filter.status?.length) where.status = In(filter.status);

    const [notifications, total] = await this.notificationLogRepository.findAndCount({
      where,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      notifications,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Cleanup expired notifications (runs every hour)
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredNotifications(): Promise<void> {
    const now = new Date();

    const expired = await this.notificationLogRepository.find({
      where: {
        status: In([NotificationStatus.PENDING, NotificationStatus.SENT]),
        expiresAt: In([now]),
      },
    });

    for (const notification of expired) {
      notification.status = NotificationStatus.EXPIRED;
      notification.expiredAt = now;
      await this.notificationLogRepository.save(notification);
    }

    if (expired.length > 0) {
      this.logger.log(`Marked ${expired.length} notifications as expired`);
    }
  }

  /**
   * Private: Send to physical device
   */
  private async sendToDevice(notification: NotificationLog): Promise<void> {
    try {
      // TODO: Implement actual device communication
      // This would depend on the device type:
      //
      // For pagers:
      // - Use pager system API (e.g., Long Range Systems)
      // - Send page command with device ID
      //
      // For buzzers:
      // - Send RF signal to buzzer
      // - Use buzzer system protocol
      //
      // For lights:
      // - Control light system (e.g., DMX, relay)
      //
      // For screens:
      // - Send WebSocket message to display
      //
      // For now, simulate sending
      this.logger.log(
        `Sending notification to device ${notification.deviceId}: ${notification.message}`,
      );

      // Simulate device delay
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Update status
      notification.status = NotificationStatus.SENT;
      notification.sentAt = new Date();
      await this.notificationLogRepository.save(notification);

      this.logger.log(`Notification ${notification.id} sent successfully`);
    } catch (error) {
      this.logger.error(
        `Failed to send notification ${notification.id}: ${error.message}`,
        error.stack,
      );

      notification.errorMessage = error.message;
      notification.errorCode = 'SEND_FAILED';

      // Retry logic
      if (notification.retryCount < notification.maxRetries) {
        notification.status = NotificationStatus.PENDING;
        notification.retryCount++;
      } else {
        notification.status = NotificationStatus.FAILED;
      }

      await this.notificationLogRepository.save(notification);
    }
  }

  /**
   * Private: Get device configuration
   */
  private getDeviceConfig(
    branchId: string,
    deviceId: string,
  ): NotificationDeviceConfigDto {
    const key = `${branchId}:${deviceId}`;
    const config = this.devices.get(key);

    if (!config) {
      throw new NotFoundException(
        `Notification device ${deviceId} not found for branch ${branchId}`,
      );
    }

    return config;
  }

  /**
   * Private: Select available device for branch
   */
  private async selectAvailableDevice(branchId: string): Promise<string | null> {
    // Find first available device for the branch
    for (const [key, config] of this.devices.entries()) {
      if (config.branchId === branchId) {
        return config.deviceId;
      }
    }

    return null;
  }

  /**
   * Private: Get timeout based on device type
   */
  private getNotificationTimeout(deviceType: NotificationDeviceType): number {
    switch (deviceType) {
      case NotificationDeviceType.PAGER:
        return NOTIFICATION_TIMEOUTS.pager;
      case NotificationDeviceType.BUZZER:
        return NOTIFICATION_TIMEOUTS.buzzer;
      case NotificationDeviceType.LIGHT:
        return NOTIFICATION_TIMEOUTS.light;
      case NotificationDeviceType.SCREEN:
        return NOTIFICATION_TIMEOUTS.screen;
      default:
        return 300000; // 5 minutes default
    }
  }
}
