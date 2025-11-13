import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { QrCodeService } from '../services/qr-code.service';
import { QrOrderingService } from '../services/qr-ordering.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { QrSessionGuard } from '../../../common/guards/qr-session.guard';
import { Public } from '../../../common/decorators/public.decorator';
import { QrSession } from '../../../common/decorators/qr-session.decorator';
import { QROrderSession } from '../entities/qr-order-session.entity';
import {
  GenerateQRCodeDto,
  GenerateBranchQRCodesDto,
  CreateSessionDto,
  UpdateGuestInfoDto,
  UpdateCartDto,
  CreateGuestOrderDto,
  CallServerDto,
  RequestBillDto,
  RecordPaymentDto,
  QRAnalyticsQueryDto,
  SessionAnalyticsDto,
} from '../dto/qr-ordering.dto';
import { RestaurantOrdersService } from '../services/restaurant-orders.service';
import { DiningType } from '../common/restaurant.constants';
import { Request } from 'express';

@ApiTags('QR Ordering')
@Controller('restaurant/qr-ordering')
export class QrOrderingController {
  constructor(
    private readonly qrCodeService: QrCodeService,
    private readonly qrOrderingService: QrOrderingService,
    private readonly ordersService: RestaurantOrdersService,
  ) {}

  // ============== QR Code Management (Protected - Staff Only) ==============

  @Post('qr-codes/generate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate QR code for a table' })
  @ApiResponse({ status: 201, description: 'QR code generated successfully' })
  async generateQRCode(@Body() dto: GenerateQRCodeDto) {
    const options = {
      width: dto.width,
      color: {
        dark: dto.foregroundColor,
        light: dto.backgroundColor,
      },
    };

    return await this.qrCodeService.generateQRCodeForTable(
      dto.branchId,
      dto.tableId,
      dto.type,
      options,
    );
  }

  @Post('qr-codes/generate-branch')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate QR codes for all tables in a branch' })
  @ApiResponse({ status: 201, description: 'QR codes generated successfully' })
  async generateBranchQRCodes(@Body() dto: GenerateBranchQRCodesDto) {
    const options = dto.width ? { width: dto.width } : undefined;
    return await this.qrCodeService.generateQRCodesForBranch(dto.branchId, dto.type, options);
  }

  @Get('qr-codes/branch/:branchId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all QR codes for a branch' })
  @ApiResponse({ status: 200, description: 'QR codes retrieved successfully' })
  async getBranchQRCodes(@Param('branchId') branchId: string) {
    return await this.qrCodeService.getQRCodesByBranch(branchId);
  }

  @Get('qr-codes/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get QR code by ID' })
  @ApiResponse({ status: 200, description: 'QR code retrieved successfully' })
  async getQRCode(@Param('id') id: string) {
    return await this.qrCodeService.getQRCode(id);
  }

  @Post('qr-codes/:id/regenerate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Regenerate QR code' })
  @ApiResponse({ status: 200, description: 'QR code regenerated successfully' })
  async regenerateQRCode(@Param('id') id: string) {
    return await this.qrCodeService.regenerateQRCode(id);
  }

  @Post('qr-codes/:id/activate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activate QR code' })
  @ApiResponse({ status: 200, description: 'QR code activated successfully' })
  async activateQRCode(@Param('id') id: string) {
    return await this.qrCodeService.activateQRCode(id);
  }

  @Post('qr-codes/:id/deactivate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate QR code' })
  @ApiResponse({ status: 200, description: 'QR code deactivated successfully' })
  async deactivateQRCode(@Param('id') id: string) {
    return await this.qrCodeService.deactivateQRCode(id);
  }

  @Get('qr-codes/statistics/:branchId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get QR code statistics for a branch' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getQRCodeStatistics(@Param('branchId') branchId: string) {
    return await this.qrCodeService.getStatistics(branchId);
  }

  // ============== Public Session Endpoints (No Authentication) ==============

  @Post('sessions/create')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new guest session by scanning QR code' })
  @ApiResponse({ status: 201, description: 'Session created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid QR code or QR code is not active' })
  async createSession(@Body() dto: CreateSessionDto, @Req() req: Request) {
    const deviceInfo = {
      deviceId: dto.deviceId,
      userAgent: dto.userAgent || req.headers['user-agent'],
      ipAddress: dto.ipAddress || req.ip,
    };

    return await this.qrOrderingService.createSession(dto.qrCode, deviceInfo);
  }

  @Get('sessions/validate')
  @Public()
  @ApiOperation({ summary: 'Validate a session token' })
  @ApiQuery({ name: 'sessionToken', required: true })
  @ApiResponse({ status: 200, description: 'Session is valid' })
  @ApiResponse({ status: 401, description: 'Invalid or expired session' })
  async validateSession(@Query('sessionToken') sessionToken: string) {
    const isValid = await this.qrOrderingService.validateSession(sessionToken);
    return { valid: isValid };
  }

  @Get('sessions/info')
  @Public()
  @ApiOperation({ summary: 'Get session information' })
  @ApiQuery({ name: 'sessionToken', required: true })
  @ApiResponse({ status: 200, description: 'Session info retrieved successfully' })
  async getSessionInfo(@Query('sessionToken') sessionToken: string) {
    return await this.qrOrderingService.getSessionByToken(sessionToken);
  }

  @Post('sessions/guest-info')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update guest information' })
  @ApiResponse({ status: 200, description: 'Guest information updated successfully' })
  async updateGuestInfo(
    @Query('sessionToken') sessionToken: string,
    @Body() dto: UpdateGuestInfoDto,
  ) {
    return await this.qrOrderingService.updateGuestInfo(sessionToken, dto);
  }

  // ============== Cart Management (Public) ==============

  @Post('cart/update')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update shopping cart' })
  @ApiResponse({ status: 200, description: 'Cart updated successfully' })
  async updateCart(@Query('sessionToken') sessionToken: string, @Body() dto: UpdateCartDto) {
    return await this.qrOrderingService.updateCart(sessionToken, dto);
  }

  @Post('cart/clear')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear shopping cart' })
  @ApiResponse({ status: 200, description: 'Cart cleared successfully' })
  async clearCart(@Query('sessionToken') sessionToken: string) {
    return await this.qrOrderingService.clearCart(sessionToken);
  }

  // ============== Guest Order Creation (Public) ==============

  @Post('orders/create')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an order as a guest' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  async createGuestOrder(@Body() dto: CreateGuestOrderDto) {
    // Get session
    const session = await this.qrOrderingService.getSessionByToken(dto.sessionToken);

    // Update guest info if provided
    if (dto.guestName || dto.guestPhone) {
      await this.qrOrderingService.updateGuestInfo(dto.sessionToken, {
        guestName: dto.guestName,
        guestPhone: dto.guestPhone,
      });
    }

    // Convert cart items to order items format
    const orderItems = dto.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      modifiers: item.modifiers?.map((mod) => ({
        id: mod.modifierId,
        name: mod.modifierName,
        options: [
          {
            id: mod.modifierId,
            name: mod.modifierName,
            priceAdjustment: mod.priceAdjustment,
          },
        ],
      })),
      specialInstructions: item.specialInstructions,
    }));

    // Create order
    const order = await this.ordersService.createOrder({
      branchId: session.branchId,
      tableId: session.tableId,
      serviceType: DiningType.DINE_IN,
      items: orderItems,
      specialInstructions: dto.specialInstructions,
      guestCount: session.guestCount,
      metadata: {
        qrSessionId: session.id,
        guestName: session.guestName || dto.guestName,
        guestPhone: session.guestPhone || dto.guestPhone,
        deviceId: session.deviceId,
      },
      // Use a default server ID or make it optional
      serverId: null, // Will need to be handled by the service
    });

    // Add order to session
    await this.qrOrderingService.addOrder(dto.sessionToken, order.id);

    // Clear cart after successful order
    await this.qrOrderingService.clearCart(dto.sessionToken);

    return order;
  }

  // ============== Order Tracking (Public) ==============

  @Get('orders/track')
  @Public()
  @ApiOperation({ summary: 'Track orders for a session' })
  @ApiQuery({ name: 'sessionToken', required: true })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  async trackOrders(@Query('sessionToken') sessionToken: string) {
    const session = await this.qrOrderingService.getSessionByToken(sessionToken);

    if (!session.orderIds || session.orderIds.length === 0) {
      return { orders: [] };
    }

    // Get all orders for this session
    const orders = await Promise.all(
      session.orderIds.map((orderId) => this.ordersService.getOrderById(orderId)),
    );

    return { orders };
  }

  @Get('orders/:orderId')
  @Public()
  @ApiOperation({ summary: 'Get order details' })
  @ApiQuery({ name: 'sessionToken', required: true })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
  async getOrder(@Param('orderId') orderId: string, @Query('sessionToken') sessionToken: string) {
    // Validate session
    const session = await this.qrOrderingService.getSessionByToken(sessionToken);

    // Verify order belongs to this session
    if (!session.orderIds || !session.orderIds.includes(orderId)) {
      throw new Error('Order not found in this session');
    }

    return await this.ordersService.getOrderById(orderId);
  }

  // ============== Service Requests (Public) ==============

  @Post('service/call-server')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Call server for assistance' })
  @ApiResponse({ status: 200, description: 'Server called successfully' })
  async callServer(@Body() dto: CallServerDto) {
    const session = await this.qrOrderingService.callServer(dto.sessionToken, dto.notes);

    // TODO: Send notification to staff (via WebSocket, notification service, etc.)

    return {
      message: 'Server has been notified',
      callCount: session.callServerCount,
    };
  }

  @Post('service/request-bill')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request bill' })
  @ApiResponse({ status: 200, description: 'Bill requested successfully' })
  async requestBill(@Body() dto: RequestBillDto) {
    const session = await this.qrOrderingService.requestBill(dto.sessionToken);

    // TODO: Send notification to staff (via WebSocket, notification service, etc.)

    return {
      message: 'Bill request has been sent to staff',
      billRequestedAt: session.billRequestedAt,
    };
  }

  // ============== Payment (Public) ==============

  @Post('payment/record')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record payment (for online payment integration)' })
  @ApiResponse({ status: 200, description: 'Payment recorded successfully' })
  async recordPayment(@Body() dto: RecordPaymentDto) {
    const session = await this.qrOrderingService.recordPayment(
      dto.sessionToken,
      dto.paymentMethod,
      dto.amount,
    );

    // If payment is completed, complete the session
    if (session.paymentCompleted) {
      await this.qrOrderingService.completeSession(dto.sessionToken);
    }

    return {
      message: 'Payment recorded successfully',
      paymentCompleted: session.paymentCompleted,
      totalSpent: session.totalSpent,
    };
  }

  // ============== Session Management (Protected - Staff) ==============

  @Get('sessions/branch/:branchId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all sessions for a branch' })
  @ApiQuery({ name: 'status', required: false })
  @ApiResponse({ status: 200, description: 'Sessions retrieved successfully' })
  async getBranchSessions(@Param('branchId') branchId: string, @Query('status') status?: string) {
    return await this.qrOrderingService.getSessionsByBranch(branchId, status as any);
  }

  @Post('sessions/:sessionId/extend')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Extend session expiration' })
  @ApiResponse({ status: 200, description: 'Session extended successfully' })
  async extendSession(@Param('sessionId') sessionId: string, @Body('hours') hours?: number) {
    // First get the session to get its token
    const sessions = await this.qrOrderingService.getSessionsByBranch(''); // We need to refactor this
    const session = sessions.find((s) => s.id === sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    return await this.qrOrderingService.extendSession(session.sessionToken, hours);
  }

  // ============== Analytics (Protected - Staff) ==============

  @Get('analytics/qr-codes')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get QR code analytics' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
  async getQRCodeAnalytics(@Query() query: QRAnalyticsQueryDto) {
    return await this.qrCodeService.getStatistics(query.branchId);
  }

  @Get('analytics/sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get session analytics' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
  async getSessionAnalytics(@Query() query: SessionAnalyticsDto) {
    return await this.qrOrderingService.getSessionStatistics(
      query.branchId,
      query.startDate,
      query.endDate,
    );
  }

  // ============== Cleanup (Protected - Staff/System) ==============

  @Post('cleanup/expired-sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Clean up expired sessions' })
  @ApiResponse({ status: 200, description: 'Cleanup completed' })
  async cleanupExpiredSessions() {
    const count = await this.qrOrderingService.cleanupExpiredSessions();
    return { message: `${count} expired sessions cleaned up` };
  }

  @Post('cleanup/abandoned-sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark abandoned sessions' })
  @ApiResponse({ status: 200, description: 'Cleanup completed' })
  async markAbandonedSessions(@Body('inactiveHours') inactiveHours?: number) {
    const count = await this.qrOrderingService.markAbandonedSessions(inactiveHours);
    return { message: `${count} sessions marked as abandoned` };
  }
}
