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
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { PosService } from './pos.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { RefundSaleDto } from './dto/refund-sale.dto';
import { SplitPaymentDto } from './dto/split-payment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('POS')
@Controller('pos')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class PosController {
  constructor(private readonly posService: PosService) {}

  @Post('transactions')
  @Roles('admin', 'manager', 'cashier')
  @ApiOperation({ summary: 'Create a new sale' })
  @ApiResponse({ status: 201, description: 'Sale created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(@Body() createSaleDto: CreateSaleDto, @Request() req: any) {
    return this.posService.create(createSaleDto, req.user.id);
  }

  @Get('stats')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get sales statistics' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  @ApiQuery({ name: 'branchId', required: false, type: String })
  getStats(@Query('branchId') branchId?: string) {
    return this.posService.getStats(branchId);
  }

  @Get('sales/daily')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get daily sales report' })
  @ApiResponse({ status: 200, description: 'Daily sales report retrieved successfully' })
  @ApiQuery({ name: 'date', required: false, type: String, description: 'Date in YYYY-MM-DD format' })
  @ApiQuery({ name: 'branchId', required: false, type: String })
  getDailySalesReport(
    @Query('date') date?: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.posService.getDailySalesReport(date, branchId);
  }

  @Get('transactions')
  @Roles('admin', 'manager', 'cashier')
  @ApiOperation({ summary: 'Get all sales' })
  @ApiResponse({ status: 200, description: 'Sales retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'customerId', required: false, type: String })
  @ApiQuery({ name: 'cashierId', required: false, type: String })
  @ApiQuery({ name: 'branchId', required: false, type: String })
  @ApiQuery({ name: 'paymentStatus', required: false, type: String })
  @ApiQuery({ name: 'saleType', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async findAll(@Query() query: PaginationDto) {
    const [data, total] = await this.posService.findAll(query);
    return {
      data,
      meta: {
        page: query.page || 1,
        limit: query.limit || 20,
        totalItems: total,
        totalPages: Math.ceil(total / (query.limit || 20)),
      },
    };
  }

  @Get('transactions/held')
  @Roles('admin', 'manager', 'cashier')
  @ApiOperation({ summary: 'List all held transactions' })
  @ApiResponse({ status: 200, description: 'Held transactions retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'branchId', required: false, type: String })
  @ApiQuery({ name: 'cashierId', required: false, type: String })
  async getHeldTransactions(@Query() query: PaginationDto) {
    const [data, total] = await this.posService.getHeldTransactions(query);
    return {
      data,
      meta: {
        page: query.page || 1,
        limit: query.limit || 20,
        totalItems: total,
        totalPages: Math.ceil(total / (query.limit || 20)),
      },
    };
  }

  @Get('transactions/held/:id')
  @Roles('admin', 'manager', 'cashier')
  @ApiOperation({ summary: 'Retrieve a held transaction by ID' })
  @ApiResponse({ status: 200, description: 'Held transaction retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Held transaction not found' })
  getHeldTransaction(@Param('id') id: string) {
    return this.posService.getHeldTransaction(id);
  }

  @Get('transactions/history')
  @Roles('admin', 'manager', 'cashier')
  @ApiOperation({ summary: 'Get transaction history with advanced filtering' })
  @ApiResponse({ status: 200, description: 'Transaction history retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'customerId', required: false, type: String })
  @ApiQuery({ name: 'cashierId', required: false, type: String })
  @ApiQuery({ name: 'branchId', required: false, type: String })
  @ApiQuery({ name: 'paymentStatus', required: false, type: String })
  @ApiQuery({ name: 'saleType', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'includeHeld', required: false, type: Boolean })
  async getTransactionHistory(@Query() query: any) {
    const [data, total] = await this.posService.getTransactionHistory(query);
    return {
      data,
      meta: {
        page: query.page || 1,
        limit: query.limit || 20,
        totalItems: total,
        totalPages: Math.ceil(total / (query.limit || 20)),
      },
    };
  }

  @Get('transactions/:id')
  @Roles('admin', 'manager', 'cashier')
  @ApiOperation({ summary: 'Get a sale by ID' })
  @ApiResponse({ status: 200, description: 'Sale retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Sale not found' })
  findOne(@Param('id') id: string) {
    return this.posService.findOne(id);
  }

  @Post('transactions/:id/hold')
  @Roles('admin', 'manager', 'cashier')
  @ApiOperation({ summary: 'Hold a transaction' })
  @ApiResponse({ status: 200, description: 'Transaction held successfully' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  holdTransaction(@Param('id') id: string) {
    return this.posService.holdTransaction(id);
  }

  @Post('transactions/:id/resume')
  @Roles('admin', 'manager', 'cashier')
  @ApiOperation({ summary: 'Resume a held transaction' })
  @ApiResponse({ status: 200, description: 'Transaction resumed successfully' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  resumeTransaction(@Param('id') id: string) {
    return this.posService.resumeHeldTransaction(id);
  }

  @Post('transactions/:id/refund')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Process a refund for a transaction' })
  @ApiResponse({ status: 200, description: 'Refund processed successfully' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  refundTransaction(
    @Param('id') id: string,
    @Body() refundDto: RefundSaleDto,
    @Request() req: any,
  ) {
    return this.posService.refundTransaction(id, refundDto, req.user.id);
  }

  @Post('transactions/:id/split-payment')
  @Roles('admin', 'manager', 'cashier')
  @ApiOperation({ summary: 'Split payment for a transaction across multiple payment methods' })
  @ApiResponse({ status: 200, description: 'Split payment processed successfully' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  splitPayment(
    @Param('id') id: string,
    @Body() splitPaymentDto: SplitPaymentDto,
    @Request() req: any,
  ) {
    return this.posService.splitPayment(id, splitPaymentDto, req.user.id);
  }

  @Patch('transactions/:id')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Update a sale' })
  @ApiResponse({ status: 200, description: 'Sale updated successfully' })
  @ApiResponse({ status: 404, description: 'Sale not found' })
  update(@Param('id') id: string, @Body() updateSaleDto: UpdateSaleDto) {
    return this.posService.update(id, updateSaleDto);
  }

  @Delete('transactions/:id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a sale' })
  @ApiResponse({ status: 200, description: 'Sale deleted successfully' })
  @ApiResponse({ status: 404, description: 'Sale not found' })
  remove(@Param('id') id: string) {
    return this.posService.remove(id);
  }
}
