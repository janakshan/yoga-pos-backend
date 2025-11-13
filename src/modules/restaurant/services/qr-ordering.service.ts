import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import {
  QROrderSession,
  SessionStatus,
  SessionAction,
} from '../entities/qr-order-session.entity';
import { TableQRCode } from '../entities/table-qr-code.entity';
import { Table } from '../entities/table.entity';
import { QrCodeService } from './qr-code.service';

@Injectable()
export class QrOrderingService {
  private readonly SESSION_DURATION_HOURS: number;

  constructor(
    @InjectRepository(QROrderSession)
    private readonly sessionRepository: Repository<QROrderSession>,
    @InjectRepository(Table)
    private readonly tableRepository: Repository<Table>,
    private readonly qrCodeService: QrCodeService,
    private readonly configService: ConfigService,
  ) {
    // Default session duration is 4 hours
    this.SESSION_DURATION_HOURS =
      this.configService.get<number>('QR_SESSION_DURATION_HOURS') || 4;
  }

  /**
   * Generate a secure session token
   */
  private generateSessionToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Calculate session expiration time
   */
  private calculateExpirationTime(hours: number = this.SESSION_DURATION_HOURS): Date {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + hours);
    return expiresAt;
  }

  /**
   * Create a new QR ordering session when a customer scans a QR code
   */
  async createSession(
    qrCode: string,
    deviceInfo?: {
      deviceId?: string;
      userAgent?: string;
      ipAddress?: string;
    },
  ): Promise<QROrderSession> {
    // Verify QR code exists and is active
    const qrCodeEntity = await this.qrCodeService.getQRCodeByCode(qrCode);

    if (qrCodeEntity.status !== 'ACTIVE') {
      throw new BadRequestException('QR code is not active');
    }

    // Record scan
    await this.qrCodeService.recordScan(qrCodeEntity.id);

    // Create session
    const sessionToken = this.generateSessionToken();
    const now = new Date();
    const expiresAt = this.calculateExpirationTime();

    const session = this.sessionRepository.create({
      branchId: qrCodeEntity.branchId,
      tableId: qrCodeEntity.tableId,
      qrCodeId: qrCodeEntity.id,
      sessionToken,
      status: SessionStatus.ACTIVE,
      expiresAt,
      firstAccessAt: now,
      lastAccessAt: now,
      accessCount: 1,
      deviceId: deviceInfo?.deviceId,
      userAgent: deviceInfo?.userAgent,
      ipAddress: deviceInfo?.ipAddress,
      actions: [
        {
          action: SessionAction.SCAN,
          timestamp: now,
          details: { qrCode },
        },
      ],
    });

    return await this.sessionRepository.save(session);
  }

  /**
   * Get session by token
   */
  async getSessionByToken(sessionToken: string): Promise<QROrderSession> {
    const session = await this.sessionRepository.findOne({
      where: { sessionToken },
      relations: ['table', 'branch', 'qrCode', 'orders'],
    });

    if (!session) {
      throw new UnauthorizedException('Invalid session token');
    }

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      if (session.status === SessionStatus.ACTIVE) {
        session.status = SessionStatus.EXPIRED;
        await this.sessionRepository.save(session);
      }
      throw new UnauthorizedException('Session has expired');
    }

    // Update last access
    session.lastAccessAt = new Date();
    session.accessCount += 1;
    await this.sessionRepository.save(session);

    return session;
  }

  /**
   * Validate session token
   */
  async validateSession(sessionToken: string): Promise<boolean> {
    try {
      await this.getSessionByToken(sessionToken);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get active session by table
   */
  async getActiveSessionByTable(branchId: string, tableId: string): Promise<QROrderSession | null> {
    return await this.sessionRepository.findOne({
      where: {
        branchId,
        tableId,
        status: SessionStatus.ACTIVE,
        expiresAt: LessThan(new Date()),
      },
      relations: ['table', 'branch', 'orders'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Record an action in the session
   */
  async recordAction(
    sessionToken: string,
    action: SessionAction,
    details?: any,
  ): Promise<QROrderSession> {
    const session = await this.getSessionByToken(sessionToken);

    const actionRecord = {
      action,
      timestamp: new Date(),
      details,
    };

    session.actions = session.actions || [];
    session.actions.push(actionRecord);

    return await this.sessionRepository.save(session);
  }

  /**
   * Update guest information
   */
  async updateGuestInfo(
    sessionToken: string,
    guestInfo: {
      guestName?: string;
      guestPhone?: string;
      guestEmail?: string;
      guestCount?: number;
    },
  ): Promise<QROrderSession> {
    const session = await this.getSessionByToken(sessionToken);

    if (guestInfo.guestName) session.guestName = guestInfo.guestName;
    if (guestInfo.guestPhone) session.guestPhone = guestInfo.guestPhone;
    if (guestInfo.guestEmail) session.guestEmail = guestInfo.guestEmail;
    if (guestInfo.guestCount) session.guestCount = guestInfo.guestCount;

    return await this.sessionRepository.save(session);
  }

  /**
   * Update shopping cart
   */
  async updateCart(sessionToken: string, cart: any): Promise<QROrderSession> {
    const session = await this.getSessionByToken(sessionToken);
    session.cart = cart;

    await this.recordAction(sessionToken, SessionAction.ADD_TO_CART, { itemCount: cart.items?.length || 0 });

    return await this.sessionRepository.save(session);
  }

  /**
   * Clear shopping cart
   */
  async clearCart(sessionToken: string): Promise<QROrderSession> {
    const session = await this.getSessionByToken(sessionToken);
    session.cart = null;
    return await this.sessionRepository.save(session);
  }

  /**
   * Add order to session
   */
  async addOrder(sessionToken: string, orderId: string): Promise<QROrderSession> {
    const session = await this.getSessionByToken(sessionToken);

    session.orderIds = session.orderIds || [];
    if (!session.orderIds.includes(orderId)) {
      session.orderIds.push(orderId);
      session.totalOrders = (session.totalOrders || 0) + 1;
    }

    await this.recordAction(sessionToken, SessionAction.PLACE_ORDER, { orderId });

    return await this.sessionRepository.save(session);
  }

  /**
   * Call server
   */
  async callServer(sessionToken: string, notes?: string): Promise<QROrderSession> {
    const session = await this.getSessionByToken(sessionToken);

    session.callServerCount += 1;
    session.lastCallServerAt = new Date();

    await this.recordAction(sessionToken, SessionAction.CALL_SERVER, { notes });

    return await this.sessionRepository.save(session);
  }

  /**
   * Request bill
   */
  async requestBill(sessionToken: string): Promise<QROrderSession> {
    const session = await this.getSessionByToken(sessionToken);

    session.billRequested = true;
    session.billRequestedAt = new Date();

    await this.recordAction(sessionToken, SessionAction.REQUEST_BILL);

    return await this.sessionRepository.save(session);
  }

  /**
   * Record payment
   */
  async recordPayment(
    sessionToken: string,
    paymentMethod: string,
    amount: number,
  ): Promise<QROrderSession> {
    const session = await this.getSessionByToken(sessionToken);

    session.paymentCompleted = true;
    session.paymentCompletedAt = new Date();
    session.paymentMethod = paymentMethod;
    session.totalSpent = (session.totalSpent || 0) + amount;

    await this.recordAction(sessionToken, SessionAction.MAKE_PAYMENT, { paymentMethod, amount });

    return await this.sessionRepository.save(session);
  }

  /**
   * Complete session
   */
  async completeSession(sessionToken: string): Promise<QROrderSession> {
    const session = await this.getSessionByToken(sessionToken);

    session.status = SessionStatus.COMPLETED;
    session.completedAt = new Date();

    // Calculate session duration
    const durationMs = session.completedAt.getTime() - session.firstAccessAt.getTime();
    session.sessionDuration = Math.floor(durationMs / 1000); // in seconds

    return await this.sessionRepository.save(session);
  }

  /**
   * Extend session expiration
   */
  async extendSession(
    sessionToken: string,
    additionalHours: number = this.SESSION_DURATION_HOURS,
  ): Promise<QROrderSession> {
    const session = await this.getSessionByToken(sessionToken);

    const newExpiresAt = new Date(session.expiresAt);
    newExpiresAt.setHours(newExpiresAt.getHours() + additionalHours);
    session.expiresAt = newExpiresAt;

    return await this.sessionRepository.save(session);
  }

  /**
   * Get all sessions for a branch
   */
  async getSessionsByBranch(
    branchId: string,
    status?: SessionStatus,
  ): Promise<QROrderSession[]> {
    const where: any = { branchId };
    if (status) {
      where.status = status;
    }

    return await this.sessionRepository.find({
      where,
      relations: ['table'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get session statistics
   */
  async getSessionStatistics(branchId: string, startDate?: Date, endDate?: Date) {
    const queryBuilder = this.sessionRepository
      .createQueryBuilder('session')
      .where('session.branchId = :branchId', { branchId });

    if (startDate) {
      queryBuilder.andWhere('session.createdAt >= :startDate', { startDate });
    }
    if (endDate) {
      queryBuilder.andWhere('session.createdAt <= :endDate', { endDate });
    }

    const sessions = await queryBuilder.getMany();

    const totalSessions = sessions.length;
    const activeSessions = sessions.filter((s) => s.status === SessionStatus.ACTIVE).length;
    const completedSessions = sessions.filter((s) => s.status === SessionStatus.COMPLETED).length;
    const expiredSessions = sessions.filter((s) => s.status === SessionStatus.EXPIRED).length;
    const abandonedSessions = sessions.filter((s) => s.status === SessionStatus.ABANDONED).length;

    const totalOrders = sessions.reduce((sum, s) => sum + (s.totalOrders || 0), 0);
    const totalRevenue = sessions.reduce((sum, s) => sum + (s.totalSpent || 0), 0);
    const totalCallServer = sessions.reduce((sum, s) => sum + s.callServerCount, 0);
    const billRequests = sessions.filter((s) => s.billRequested).length;
    const completedPayments = sessions.filter((s) => s.paymentCompleted).length;

    const avgSessionDuration =
      sessions.filter((s) => s.sessionDuration).length > 0
        ? sessions
            .filter((s) => s.sessionDuration)
            .reduce((sum, s) => sum + s.sessionDuration, 0) /
          sessions.filter((s) => s.sessionDuration).length
        : 0;

    const avgOrdersPerSession = totalSessions > 0 ? totalOrders / totalSessions : 0;
    const avgRevenuePerSession = totalSessions > 0 ? totalRevenue / totalSessions : 0;

    return {
      totalSessions,
      activeSessions,
      completedSessions,
      expiredSessions,
      abandonedSessions,
      totalOrders,
      totalRevenue,
      totalCallServer,
      billRequests,
      completedPayments,
      avgSessionDuration: Math.round(avgSessionDuration),
      avgOrdersPerSession: Math.round(avgOrdersPerSession * 100) / 100,
      avgRevenuePerSession: Math.round(avgRevenuePerSession * 100) / 100,
    };
  }

  /**
   * Clean up expired sessions (mark as expired)
   */
  async cleanupExpiredSessions(): Promise<number> {
    const result = await this.sessionRepository
      .createQueryBuilder()
      .update(QROrderSession)
      .set({ status: SessionStatus.EXPIRED })
      .where('status = :status', { status: SessionStatus.ACTIVE })
      .andWhere('expiresAt < :now', { now: new Date() })
      .execute();

    return result.affected || 0;
  }

  /**
   * Mark abandoned sessions (active but no activity for extended period)
   */
  async markAbandonedSessions(inactiveHours: number = 2): Promise<number> {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - inactiveHours);

    const result = await this.sessionRepository
      .createQueryBuilder()
      .update(QROrderSession)
      .set({ status: SessionStatus.ABANDONED, abandonedAt: new Date() })
      .where('status = :status', { status: SessionStatus.ACTIVE })
      .andWhere('lastAccessAt < :cutoffTime', { cutoffTime })
      .execute();

    return result.affected || 0;
  }

  /**
   * Update session metadata
   */
  async updateMetadata(sessionToken: string, metadata: any): Promise<QROrderSession> {
    const session = await this.getSessionByToken(sessionToken);
    session.metadata = { ...session.metadata, ...metadata };
    return await this.sessionRepository.save(session);
  }
}
