import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { QROrderSession } from '../../modules/restaurant/entities/qr-order-session.entity';

/**
 * Decorator to extract QR session from request
 * Usage: @QrSession() session: QROrderSession
 */
export const QrSession = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): QROrderSession => {
    const request = ctx.switchToHttp().getRequest();
    return request.qrSession;
  },
);
