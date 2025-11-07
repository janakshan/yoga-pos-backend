import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, In } from 'typeorm';
import {
  Notification,
  NotificationStatus,
} from './entities/notification.entity';
import { User } from '../users/entities/user.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { FilterNotificationDto } from './dto/filter-notification.dto';
import { BulkNotificationDto } from './dto/bulk-notification.dto';
import { NotificationPreferencesDto } from './dto/notification-preferences.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(
    createNotificationDto: CreateNotificationDto,
  ): Promise<Notification> {
    const notification = this.notificationsRepository.create(
      createNotificationDto,
    );

    // If userId is provided, validate user exists and get their recipient info
    if (createNotificationDto.userId) {
      const user = await this.usersRepository.findOne({
        where: { id: createNotificationDto.userId },
      });
      if (!user) {
        throw new NotFoundException(
          `User with ID ${createNotificationDto.userId} not found`,
        );
      }

      // Auto-populate recipient if not provided
      if (!createNotificationDto.recipient) {
        switch (createNotificationDto.channel) {
          case 'email':
            notification.recipient = user.email;
            break;
          case 'sms':
          case 'whatsapp':
            notification.recipient = user.phone;
            break;
          // Push notifications would use device token from user preferences
        }
      }
    }

    // If not scheduled, mark as pending for immediate sending
    if (!createNotificationDto.scheduledFor) {
      notification.status = NotificationStatus.PENDING;
      // In a real implementation, you would trigger the actual sending here
      // For now, we'll just mark it as sent
      notification.status = NotificationStatus.SENT;
      notification.sentAt = new Date();
    } else {
      notification.status = NotificationStatus.SCHEDULED;
    }

    return this.notificationsRepository.save(notification);
  }

  async findAll(
    query: FilterNotificationDto,
  ): Promise<[Notification[], number]> {
    const {
      page = 1,
      limit = 10,
      search,
      userId,
      channel,
      status,
      type,
      sortBy,
      sortOrder,
    } = query;

    const where: any = {};

    if (search) {
      // Search in subject or message
      where.message = ILike(`%${search}%`);
    }

    if (userId) {
      where.userId = userId;
    }

    if (channel) {
      where.channel = channel;
    }

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    const order: any = {};
    if (sortBy) {
      order[sortBy] = sortOrder || 'DESC';
    } else {
      order.createdAt = 'DESC';
    }

    return this.notificationsRepository.findAndCount({
      where,
      order,
      relations: ['user'],
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async findOne(id: string): Promise<Notification> {
    const notification = await this.notificationsRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }
    return notification;
  }

  async update(
    id: string,
    updateNotificationDto: UpdateNotificationDto,
  ): Promise<Notification> {
    const notification = await this.findOne(id);
    Object.assign(notification, updateNotificationDto);
    return this.notificationsRepository.save(notification);
  }

  async remove(id: string): Promise<void> {
    const notification = await this.findOne(id);
    await this.notificationsRepository.remove(notification);
  }

  async bulkSend(
    bulkNotificationDto: BulkNotificationDto,
  ): Promise<{ sent: number; failed: number; notificationIds: string[] }> {
    const { userIds, channel, type, subject, message, metadata, scheduledFor } =
      bulkNotificationDto;

    // Validate users exist
    const users = await this.usersRepository.findBy({
      id: In(userIds),
    });

    if (users.length === 0) {
      throw new NotFoundException('No users found with the provided IDs');
    }

    const notificationIds: string[] = [];
    let sent = 0;
    let failed = 0;

    // Create notification for each user
    for (const user of users) {
      try {
        let recipient: string;
        switch (channel) {
          case 'email':
            recipient = user.email;
            break;
          case 'sms':
          case 'whatsapp':
            if (!user.phone) {
              failed++;
              continue;
            }
            recipient = user.phone;
            break;
          case 'push':
            // Would use device token from user preferences
            recipient = user.id; // Placeholder
            break;
          default:
            recipient = user.email;
        }

        const notification = this.notificationsRepository.create({
          channel,
          type,
          subject,
          message,
          recipient,
          userId: user.id,
          metadata,
          scheduledFor,
          status: scheduledFor
            ? NotificationStatus.SCHEDULED
            : NotificationStatus.SENT,
          sentAt: scheduledFor ? null : new Date(),
        });

        const saved = await this.notificationsRepository.save(notification);
        notificationIds.push(saved.id);
        sent++;
      } catch (error) {
        failed++;
      }
    }

    return {
      sent,
      failed,
      notificationIds,
    };
  }

  async getUserPreferences(userId: string): Promise<any> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Return notification preferences from user entity
    return (
      user.preferences?.notifications || {
        email: true,
        sms: false,
        push: true,
        whatsapp: false,
        types: {
          lowStock: true,
          orderUpdates: true,
          marketing: false,
          system: true,
        },
      }
    );
  }

  async updateUserPreferences(
    userId: string,
    preferencesDto: NotificationPreferencesDto,
  ): Promise<any> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Update user preferences
    const currentPreferences = user.preferences || {};
    const updatedNotifications = {
      ...currentPreferences.notifications,
      ...preferencesDto,
    };

    user.preferences = {
      ...currentPreferences,
      notifications: updatedNotifications,
    };

    await this.usersRepository.save(user);

    return updatedNotifications;
  }
}
