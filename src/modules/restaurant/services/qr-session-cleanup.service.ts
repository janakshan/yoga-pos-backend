import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { QrOrderingService } from './qr-ordering.service';
import { QrGuestGateway } from '../gateways/qr-guest.gateway';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { QROrderSession, SessionStatus } from '../entities/qr-order-session.entity';

@Injectable()
export class QrSessionCleanupService {
  private readonly logger = new Logger(QrSessionCleanupService.name);

  constructor(
    private readonly qrOrderingService: QrOrderingService,
    private readonly qrGuestGateway: QrGuestGateway,
    @InjectRepository(QROrderSession)
    private readonly sessionRepository: Repository<QROrderSession>,
  ) {}

  /**
   * Clean up expired sessions every 30 minutes
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async handleExpiredSessions() {
    this.logger.log('Running expired sessions cleanup...');

    try {
      const count = await this.qrOrderingService.cleanupExpiredSessions();
      this.logger.log(`Cleaned up ${count} expired sessions`);
    } catch (error) {
      this.logger.error('Error cleaning up expired sessions:', error);
    }
  }

  /**
   * Mark abandoned sessions every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleAbandonedSessions() {
    this.logger.log('Running abandoned sessions check...');

    try {
      const count = await this.qrOrderingService.markAbandonedSessions(2); // 2 hours of inactivity
      this.logger.log(`Marked ${count} sessions as abandoned`);
    } catch (error) {
      this.logger.error('Error marking abandoned sessions:', error);
    }
  }

  /**
   * Send expiration warnings to sessions that will expire soon
   * Runs every 10 minutes
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async sendExpirationWarnings() {
    this.logger.log('Checking for sessions expiring soon...');

    try {
      // Find sessions expiring in the next 15 minutes
      const fifteenMinutesFromNow = new Date();
      fifteenMinutesFromNow.setMinutes(fifteenMinutesFromNow.getMinutes() + 15);

      const fiveMinutesFromNow = new Date();
      fiveMinutesFromNow.setMinutes(fiveMinutesFromNow.getMinutes() + 5);

      // Sessions expiring in 10-15 minutes
      const sessionsSoonExpiring = await this.sessionRepository.find({
        where: {
          status: SessionStatus.ACTIVE,
          expiresAt: LessThan(fifteenMinutesFromNow),
        },
      });

      for (const session of sessionsSoonExpiring) {
        const minutesRemaining = Math.ceil(
          (session.expiresAt.getTime() - new Date().getTime()) / (1000 * 60),
        );

        if (minutesRemaining > 0 && minutesRemaining <= 15) {
          // Check if we've already sent a warning (store in metadata)
          const warningsSent = session.metadata?.expirationWarnings || [];

          if (minutesRemaining === 15 && !warningsSent.includes('15min')) {
            this.qrGuestGateway.emitSessionExpiringWarning(session.sessionToken, 15);
            await this.updateWarningMetadata(session, '15min');
          } else if (minutesRemaining === 5 && !warningsSent.includes('5min')) {
            this.qrGuestGateway.emitSessionExpiringWarning(session.sessionToken, 5);
            await this.updateWarningMetadata(session, '5min');
          }
        }
      }

      this.logger.log(`Sent expiration warnings to ${sessionsSoonExpiring.length} sessions`);
    } catch (error) {
      this.logger.error('Error sending expiration warnings:', error);
    }
  }

  /**
   * Update session metadata to track sent warnings
   */
  private async updateWarningMetadata(session: QROrderSession, warning: string) {
    const warnings = session.metadata?.expirationWarnings || [];
    warnings.push(warning);

    session.metadata = {
      ...session.metadata,
      expirationWarnings: warnings,
    };

    await this.sessionRepository.save(session);
  }

  /**
   * Clean up old completed/expired sessions (older than 30 days)
   * Runs daily at 3 AM
   */
  @Cron('0 3 * * *')
  async cleanupOldSessions() {
    this.logger.log('Running old sessions cleanup...');

    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await this.sessionRepository
        .createQueryBuilder()
        .delete()
        .from(QROrderSession)
        .where('status IN (:...statuses)', {
          statuses: [SessionStatus.COMPLETED, SessionStatus.EXPIRED, SessionStatus.ABANDONED],
        })
        .andWhere('updatedAt < :date', { date: thirtyDaysAgo })
        .execute();

      this.logger.log(`Deleted ${result.affected || 0} old sessions`);
    } catch (error) {
      this.logger.error('Error cleaning up old sessions:', error);
    }
  }

  /**
   * Calculate and update session durations for completed sessions
   * Runs daily at 4 AM
   */
  @Cron('0 4 * * *')
  async updateSessionDurations() {
    this.logger.log('Updating session durations...');

    try {
      const sessionsNeedingUpdate = await this.sessionRepository.find({
        where: {
          status: SessionStatus.COMPLETED,
          sessionDuration: null,
        },
        take: 1000, // Process in batches
      });

      for (const session of sessionsNeedingUpdate) {
        if (session.completedAt && session.firstAccessAt) {
          const durationMs = session.completedAt.getTime() - session.firstAccessAt.getTime();
          session.sessionDuration = Math.floor(durationMs / 1000);
          await this.sessionRepository.save(session);
        }
      }

      this.logger.log(`Updated ${sessionsNeedingUpdate.length} session durations`);
    } catch (error) {
      this.logger.error('Error updating session durations:', error);
    }
  }
}
