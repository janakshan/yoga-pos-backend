import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { SplitPaymentService } from '../services/split-payment.service';
import {
  SplitPaymentDto,
  SplitPaymentResultDto,
} from '../dto/split-payment.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';

@ApiTags('Restaurant - Split Payment')
@Controller('restaurant/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SplitPaymentController {
  constructor(
    private readonly splitPaymentService: SplitPaymentService,
  ) {}

  @Post(':orderId/split-payment')
  @ApiOperation({
    summary: 'Split order payment',
    description: 'Split an order payment using various methods (equal, custom, by item, by seat)',
  })
  @ApiParam({ name: 'orderId', description: 'Order ID' })
  @ApiResponse({
    status: 200,
    description: 'Payment split calculated successfully',
    type: SplitPaymentResultDto,
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async splitPayment(
    @Param('orderId') orderId: string,
    @Body() dto: SplitPaymentDto,
  ): Promise<SplitPaymentResultDto> {
    return this.splitPaymentService.processSplitPayment(orderId, dto);
  }
}
