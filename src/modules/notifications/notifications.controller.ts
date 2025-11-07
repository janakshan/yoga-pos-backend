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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { FilterNotificationDto } from './dto/filter-notification.dto';
import { BulkNotificationDto } from './dto/bulk-notification.dto';
import { NotificationPreferencesDto } from './dto/notification-preferences.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @Roles('admin', 'manager')
  @ApiOperation({
    summary: 'Send a notification',
    description:
      'Send a notification via email, SMS, push, or WhatsApp to a user',
  })
  @ApiResponse({
    status: 201,
    description: 'Notification sent successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'User not found' })
  create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationsService.create(createNotificationDto);
  }

  @Post('bulk')
  @Roles('admin', 'manager')
  @ApiOperation({
    summary: 'Send bulk notifications',
    description: 'Send notifications to multiple users at once',
  })
  @ApiResponse({
    status: 201,
    description: 'Bulk notifications sent successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'No users found' })
  bulkSend(@Body() bulkNotificationDto: BulkNotificationDto) {
    return this.notificationsService.bulkSend(bulkNotificationDto);
  }

  @Get()
  @Roles('admin', 'manager', 'staff')
  @ApiOperation({
    summary: 'Get notification history',
    description: 'Retrieve all notifications with filtering and pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Notifications retrieved successfully',
  })
  async findAll(@Query() query: FilterNotificationDto) {
    const [data, total] = await this.notificationsService.findAll(query);
    return {
      data,
      meta: {
        page: query.page,
        limit: query.limit,
        totalItems: total,
        totalPages: Math.ceil(total / (query.limit || 10)),
      },
    };
  }

  @Get('preferences/:userId')
  @Roles('admin', 'manager', 'staff')
  @ApiOperation({
    summary: 'Get user notification preferences',
    description: 'Retrieve notification preferences for a specific user',
  })
  @ApiResponse({
    status: 200,
    description: 'Preferences retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  getUserPreferences(@Param('userId') userId: string) {
    return this.notificationsService.getUserPreferences(userId);
  }

  @Patch('preferences/:userId')
  @Roles('admin', 'manager', 'staff')
  @ApiOperation({
    summary: 'Update user notification preferences',
    description: 'Update notification preferences for a specific user',
  })
  @ApiResponse({
    status: 200,
    description: 'Preferences updated successfully',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  updateUserPreferences(
    @Param('userId') userId: string,
    @Body() preferencesDto: NotificationPreferencesDto,
  ) {
    return this.notificationsService.updateUserPreferences(
      userId,
      preferencesDto,
    );
  }

  @Get(':id')
  @Roles('admin', 'manager', 'staff')
  @ApiOperation({
    summary: 'Get a notification by ID',
    description: 'Retrieve a specific notification',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  findOne(@Param('id') id: string) {
    return this.notificationsService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'manager')
  @ApiOperation({
    summary: 'Update a notification',
    description: 'Update notification details or status',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  update(
    @Param('id') id: string,
    @Body() updateNotificationDto: UpdateNotificationDto,
  ) {
    return this.notificationsService.update(id, updateNotificationDto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({
    summary: 'Delete a notification',
    description: 'Remove a notification from the history',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  remove(@Param('id') id: string) {
    return this.notificationsService.remove(id);
  }
}
