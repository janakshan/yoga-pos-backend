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
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PrinterQueueService } from '../services/printer-queue.service';
import { PrinterRoutingService } from '../services/printer-routing.service';
import { PrinterStatusService } from '../services/printer-status.service';
import { CustomerDisplayService } from '../services/customer-display.service';
import { NotificationService } from '../services/notification.service';
import { RestaurantOrdersService } from '../services/restaurant-orders.service';
import {
  CreatePrintJobDto,
  RetryPrintJobDto,
  CancelPrintJobDto,
  FilterPrintJobsDto,
  CreatePrinterConfigDto,
  UpdatePrinterConfigDto,
  CustomerDisplayConfigDto,
  UpdateCustomerDisplayDto,
  ShowOrderOnDisplayDto,
  NotificationDeviceConfigDto,
  SendNotificationDto,
  AcknowledgeNotificationDto,
  FilterNotificationsDto,
  PrinterHealthCheckDto,
  UpdateHardwareSettingsDto,
} from '../dto/hardware.dto';
import { PrinterRoutingStrategy } from '../common/hardware.constants';

/**
 * Hardware Controller
 *
 * Handles all hardware integration endpoints:
 * - Printer configuration and management
 * - Print job queue operations
 * - Printer status monitoring
 * - Customer display control
 * - Pager/buzzer notifications
 */
@ApiTags('Hardware Integration')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('restaurant/hardware')
export class HardwareController {
  constructor(
    private readonly printerQueueService: PrinterQueueService,
    private readonly printerRoutingService: PrinterRoutingService,
    private readonly printerStatusService: PrinterStatusService,
    private readonly customerDisplayService: CustomerDisplayService,
    private readonly notificationService: NotificationService,
    private readonly restaurantOrdersService: RestaurantOrdersService,
  ) {}

  // ============================================================================
  // PRINT JOB ENDPOINTS
  // ============================================================================

  @Post('print-jobs')
  @ApiOperation({ summary: 'Create print job for an order' })
  @ApiResponse({ status: 201, description: 'Print job(s) created successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async createPrintJob(@Body() dto: CreatePrintJobDto) {
    const order = await this.restaurantOrdersService.findOne(dto.orderId);

    const strategy = dto.printerIds?.length
      ? PrinterRoutingStrategy.MANUAL
      : PrinterRoutingStrategy.STATION_BASED;

    const jobIds = await this.printerRoutingService.routeOrderToPrinters(
      order,
      strategy,
      {
        specificPrinterIds: dto.printerIds,
        copies: dto.copies,
        priority: dto.priority,
      },
    );

    return {
      message: 'Print job(s) created successfully',
      jobIds,
      totalJobs: jobIds.length,
    };
  }

  @Get('print-jobs')
  @ApiOperation({ summary: 'Get print jobs with filtering' })
  @ApiResponse({ status: 200, description: 'Print jobs retrieved successfully' })
  async getPrintJobs(@Query() filter: FilterPrintJobsDto) {
    return this.printerQueueService.findJobs(filter);
  }

  @Get('print-jobs/:jobId')
  @ApiOperation({ summary: 'Get print job by ID' })
  @ApiParam({ name: 'jobId', description: 'Print job ID' })
  @ApiResponse({ status: 200, description: 'Print job retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Print job not found' })
  async getPrintJob(@Param('jobId') jobId: string) {
    return this.printerQueueService.findJobs({ branchId: jobId });
  }

  @Post('print-jobs/:jobId/retry')
  @ApiOperation({ summary: 'Retry a failed print job' })
  @ApiParam({ name: 'jobId', description: 'Print job ID' })
  @ApiResponse({ status: 200, description: 'Print job retried successfully' })
  @ApiResponse({ status: 404, description: 'Print job not found' })
  async retryPrintJob(@Param('jobId') jobId: string, @Body() dto: RetryPrintJobDto) {
    const job = await this.printerQueueService.retryJob(dto.jobId, dto.force);
    return {
      message: 'Print job queued for retry',
      job,
    };
  }

  @Post('print-jobs/:jobId/cancel')
  @ApiOperation({ summary: 'Cancel a print job' })
  @ApiParam({ name: 'jobId', description: 'Print job ID' })
  @ApiResponse({ status: 200, description: 'Print job cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Print job not found' })
  async cancelPrintJob(@Param('jobId') jobId: string, @Body() dto: CancelPrintJobDto) {
    const job = await this.printerQueueService.cancelJob(dto.jobId, dto.reason);
    return {
      message: 'Print job cancelled',
      job,
    };
  }

  @Get('print-jobs/statistics/:branchId')
  @ApiOperation({ summary: 'Get print queue statistics for a branch' })
  @ApiParam({ name: 'branchId', description: 'Branch ID' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getQueueStatistics(@Param('branchId') branchId: string) {
    return this.printerQueueService.getQueueStatistics(branchId);
  }

  // ============================================================================
  // PRINTER STATUS & MONITORING ENDPOINTS
  // ============================================================================

  @Get('printers/:printerId/health')
  @ApiOperation({ summary: 'Check printer health' })
  @ApiParam({ name: 'printerId', description: 'Printer ID' })
  @ApiResponse({ status: 200, description: 'Health check completed' })
  async checkPrinterHealth(@Param('printerId') printerId: string) {
    return this.printerStatusService.checkPrinterHealth(printerId);
  }

  @Get('printers/:printerId/statistics')
  @ApiOperation({ summary: 'Get printer statistics' })
  @ApiParam({ name: 'printerId', description: 'Printer ID' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getPrinterStatistics(@Param('printerId') printerId: string) {
    return this.printerStatusService.getPrinterStatistics(printerId);
  }

  @Get('printers/health/:branchId')
  @ApiOperation({ summary: 'Get health status for all printers in a branch' })
  @ApiParam({ name: 'branchId', description: 'Branch ID' })
  @ApiResponse({ status: 200, description: 'Health status retrieved successfully' })
  async getBranchPrintersHealth(@Param('branchId') branchId: string) {
    return this.printerStatusService.getBranchPrintersHealth(branchId);
  }

  @Post('printers/:printerId/test')
  @ApiOperation({ summary: 'Test printer connectivity' })
  @ApiParam({ name: 'printerId', description: 'Printer ID' })
  @ApiResponse({ status: 200, description: 'Test completed' })
  async testPrinter(@Param('printerId') printerId: string) {
    return this.printerStatusService.testPrinter(printerId);
  }

  // ============================================================================
  // CUSTOMER DISPLAY ENDPOINTS
  // ============================================================================

  @Post('customer-display/register')
  @ApiOperation({ summary: 'Register a customer display' })
  @ApiResponse({ status: 201, description: 'Display registered successfully' })
  async registerCustomerDisplay(@Body() dto: CustomerDisplayConfigDto) {
    await this.customerDisplayService.registerDisplay(dto);
    return {
      message: 'Customer display registered successfully',
    };
  }

  @Post('customer-display/show-order')
  @ApiOperation({ summary: 'Show order on customer display' })
  @ApiResponse({ status: 200, description: 'Order displayed successfully' })
  @ApiResponse({ status: 404, description: 'Order or display not found' })
  async showOrderOnDisplay(@Body() dto: ShowOrderOnDisplayDto) {
    const order = await this.restaurantOrdersService.findOne(dto.orderId);

    await this.customerDisplayService.showOrder(
      order.branchId,
      order,
      { showItems: dto.showItems },
    );

    return {
      message: 'Order displayed successfully',
    };
  }

  @Post('customer-display/update')
  @ApiOperation({ summary: 'Update customer display content' })
  @ApiResponse({ status: 200, description: 'Display updated successfully' })
  async updateCustomerDisplay(@Body() dto: UpdateCustomerDisplayDto) {
    const config = this.customerDisplayService.getDisplayConfig(dto.displayId);
    if (!config) {
      return { success: false, message: 'Display not found' };
    }

    if (dto.clear) {
      await this.customerDisplayService.clearDisplay(config.branchId);
    } else {
      await this.customerDisplayService.showMessage(
        config.branchId,
        dto.topLine || '',
        dto.bottomLine,
      );
    }

    return {
      message: 'Display updated successfully',
    };
  }

  @Post('customer-display/:branchId/welcome')
  @ApiOperation({ summary: 'Show welcome message on display' })
  @ApiParam({ name: 'branchId', description: 'Branch ID' })
  @ApiResponse({ status: 200, description: 'Welcome message displayed' })
  async showWelcomeMessage(@Param('branchId') branchId: string) {
    await this.customerDisplayService.showWelcomeMessage(branchId);
    return {
      message: 'Welcome message displayed',
    };
  }

  @Post('customer-display/:branchId/thank-you')
  @ApiOperation({ summary: 'Show thank you message on display' })
  @ApiParam({ name: 'branchId', description: 'Branch ID' })
  @ApiResponse({ status: 200, description: 'Thank you message displayed' })
  async showThankYouMessage(@Param('branchId') branchId: string) {
    await this.customerDisplayService.showThankYouMessage(branchId);
    return {
      message: 'Thank you message displayed',
    };
  }

  @Post('customer-display/:branchId/clear')
  @ApiOperation({ summary: 'Clear customer display' })
  @ApiParam({ name: 'branchId', description: 'Branch ID' })
  @ApiResponse({ status: 200, description: 'Display cleared' })
  async clearCustomerDisplay(@Param('branchId') branchId: string) {
    await this.customerDisplayService.clearDisplay(branchId);
    return {
      message: 'Display cleared',
    };
  }

  @Post('customer-display/:branchId/test')
  @ApiOperation({ summary: 'Test customer display' })
  @ApiParam({ name: 'branchId', description: 'Branch ID' })
  @ApiResponse({ status: 200, description: 'Test completed' })
  async testCustomerDisplay(@Param('branchId') branchId: string) {
    return this.customerDisplayService.testDisplay(branchId);
  }

  // ============================================================================
  // NOTIFICATION (PAGER/BUZZER) ENDPOINTS
  // ============================================================================

  @Post('notifications/devices/register')
  @ApiOperation({ summary: 'Register a notification device (pager/buzzer)' })
  @ApiResponse({ status: 201, description: 'Device registered successfully' })
  async registerNotificationDevice(@Body() dto: NotificationDeviceConfigDto) {
    await this.notificationService.registerDevice(dto);
    return {
      message: 'Notification device registered successfully',
    };
  }

  @Post('notifications/send')
  @ApiOperation({ summary: 'Send notification to device' })
  @ApiResponse({ status: 201, description: 'Notification sent successfully' })
  @ApiResponse({ status: 404, description: 'Order or device not found' })
  async sendNotification(@Body() dto: SendNotificationDto) {
    const order = await this.restaurantOrdersService.findOne(dto.orderId);

    const notification = await this.notificationService.sendOrderReadyNotification(
      order,
      dto.deviceId,
    );

    return {
      message: 'Notification sent successfully',
      notification,
    };
  }

  @Post('notifications/:notificationId/acknowledge')
  @ApiOperation({ summary: 'Acknowledge notification (customer picked up order)' })
  @ApiParam({ name: 'notificationId', description: 'Notification ID' })
  @ApiResponse({ status: 200, description: 'Notification acknowledged' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async acknowledgeNotification(
    @Param('notificationId') notificationId: string,
    @Body() dto: AcknowledgeNotificationDto,
  ) {
    const notification = await this.notificationService.acknowledgeNotification(
      dto.notificationId,
      dto.acknowledgedBy,
    );

    return {
      message: 'Notification acknowledged',
      notification,
    };
  }

  @Post('notifications/:notificationId/cancel')
  @ApiOperation({ summary: 'Cancel a notification' })
  @ApiParam({ name: 'notificationId', description: 'Notification ID' })
  @ApiResponse({ status: 200, description: 'Notification cancelled' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async cancelNotification(@Param('notificationId') notificationId: string) {
    const notification = await this.notificationService.cancelNotification(
      notificationId,
    );

    return {
      message: 'Notification cancelled',
      notification,
    };
  }

  @Post('notifications/:notificationId/retry')
  @ApiOperation({ summary: 'Retry a failed notification' })
  @ApiParam({ name: 'notificationId', description: 'Notification ID' })
  @ApiResponse({ status: 200, description: 'Notification retried' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async retryNotification(@Param('notificationId') notificationId: string) {
    const notification = await this.notificationService.retryNotification(
      notificationId,
    );

    return {
      message: 'Notification queued for retry',
      notification,
    };
  }

  @Get('notifications')
  @ApiOperation({ summary: 'Get notifications with filtering' })
  @ApiResponse({ status: 200, description: 'Notifications retrieved successfully' })
  async getNotifications(@Query() filter: FilterNotificationsDto) {
    return this.notificationService.findNotifications(filter);
  }
}
