import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { QrOrderingService } from '../../modules/restaurant/services/qr-ordering.service';

/**
 * Guard for validating QR session tokens
 * Extracts session token from Authorization header or query parameter
 */
@Injectable()
export class QrSessionGuard implements CanActivate {
  constructor(
    private readonly qrOrderingService: QrOrderingService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Extract session token from Authorization header (Bearer token) or query parameter
    let sessionToken: string | undefined;

    // Try Authorization header first
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      sessionToken = authHeader.substring(7);
    }

    // Fallback to query parameter
    if (!sessionToken && request.query.sessionToken) {
      sessionToken = request.query.sessionToken;
    }

    // Fallback to body parameter
    if (!sessionToken && request.body && request.body.sessionToken) {
      sessionToken = request.body.sessionToken;
    }

    if (!sessionToken) {
      throw new UnauthorizedException('Session token is required');
    }

    try {
      // Validate session and attach to request
      const session = await this.qrOrderingService.getSessionByToken(sessionToken);
      request.qrSession = session;
      return true;
    } catch (error) {
      throw new UnauthorizedException(error.message || 'Invalid session token');
    }
  }
}
