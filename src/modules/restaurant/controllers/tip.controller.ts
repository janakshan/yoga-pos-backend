import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { TipService } from '../services/tip.service';
import { CalculateTipDto } from '../dto/calculate-tip.dto';
import {
  UpdateTipConfigurationDto,
  TipConfigurationResponseDto,
} from '../dto/tip-configuration.dto';
import {
  DistributeTipsDto,
  TipDistributionResultDto,
} from '../dto/distribute-tips.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';

@ApiTags('Restaurant - Tips')
@Controller('restaurant/tips')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TipController {
  constructor(private readonly tipService: TipService) {}

  @Post('calculate')
  @ApiOperation({
    summary: 'Calculate tip',
    description: 'Calculate tip based on order amount and tip parameters',
  })
  @ApiResponse({
    status: 200,
    description: 'Tip calculated successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  calculateTip(@Body() dto: CalculateTipDto) {
    return this.tipService.calculateTip(dto);
  }

  @Post('apply/:orderId')
  @ApiOperation({
    summary: 'Apply tip to order',
    description: 'Apply calculated tip to an existing order',
  })
  @ApiParam({ name: 'orderId', description: 'Order ID' })
  @ApiResponse({
    status: 200,
    description: 'Tip applied successfully',
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  applyTipToOrder(
    @Param('orderId') orderId: string,
    @Body() dto: CalculateTipDto,
  ) {
    return this.tipService.applyTipToOrder(orderId, dto);
  }

  @Get('suggestions')
  @ApiOperation({
    summary: 'Get tip suggestions',
    description: 'Get suggested tip amounts based on order total',
  })
  @ApiQuery({
    name: 'orderAmount',
    description: 'Order amount',
    example: 100,
  })
  @ApiResponse({
    status: 200,
    description: 'Tip suggestions retrieved',
  })
  getTipSuggestions(@Query('orderAmount') orderAmount: number) {
    return this.tipService.getTipSuggestions(Number(orderAmount));
  }

  @Get('configuration')
  @ApiOperation({
    summary: 'Get tip configuration',
    description: 'Get current tip configuration settings',
  })
  @ApiResponse({
    status: 200,
    description: 'Tip configuration retrieved',
    type: TipConfigurationResponseDto,
  })
  getTipConfiguration(): TipConfigurationResponseDto {
    return this.tipService.getTipConfiguration();
  }

  @Put('configuration')
  @ApiOperation({
    summary: 'Update tip configuration',
    description: 'Update tip configuration settings',
  })
  @ApiResponse({
    status: 200,
    description: 'Tip configuration updated',
    type: TipConfigurationResponseDto,
  })
  updateTipConfiguration(
    @Body() dto: UpdateTipConfigurationDto,
  ): TipConfigurationResponseDto {
    return this.tipService.updateTipConfiguration(dto);
  }

  @Post('distribute')
  @ApiOperation({
    summary: 'Distribute tips',
    description: 'Distribute tips among multiple servers',
  })
  @ApiResponse({
    status: 200,
    description: 'Tips distributed successfully',
    type: TipDistributionResultDto,
  })
  distributeTips(@Body() dto: DistributeTipsDto): TipDistributionResultDto {
    const distribution = this.tipService.distributeTips(
      dto.totalTipAmount,
      dto.serverIds,
      dto.distributionMethod,
      dto.weights,
    );

    const totalDistributed = Object.values(distribution).reduce(
      (sum, amount) => sum + amount,
      0,
    );

    return {
      distribution,
      totalDistributed,
      serverCount: dto.serverIds.length,
    };
  }

  @Get('server/:serverId/average')
  @ApiOperation({
    summary: 'Get server average tip',
    description: 'Get average tip statistics for a server',
  })
  @ApiParam({ name: 'serverId', description: 'Server/Waiter ID' })
  @ApiQuery({ name: 'branchId', description: 'Branch ID' })
  @ApiQuery({
    name: 'startDate',
    description: 'Start date (ISO format)',
    required: false,
  })
  @ApiQuery({
    name: 'endDate',
    description: 'End date (ISO format)',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Server tip statistics retrieved',
  })
  getServerAverageTip(
    @Param('serverId') serverId: string,
    @Query('branchId') branchId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    return this.tipService.getServerAverageTip(serverId, branchId, start, end);
  }
}
