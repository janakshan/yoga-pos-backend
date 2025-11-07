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
  Put,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { FilterCustomerDto } from './dto/filter-customer.dto';
import {
  UpdateLoyaltyPointsDto,
  UpdateLoyaltyTierDto,
} from './dto/update-loyalty.dto';
import { CreateSegmentDto, UpdateSegmentDto, AssignCustomersDto } from './dto/segment.dto';
import { CreateNoteDto, UpdateNoteDto } from './dto/note.dto';
import { CreditChargeDto, CreditPaymentDto, UpdateCreditLimitDto } from './dto/credit.dto';
import { AddStoreCreditDto, DeductStoreCreditDto, RedeemLoyaltyDto } from './dto/store-credit.dto';
import { BulkStatusUpdateDto, UpdatePurchaseStatsDto } from './dto/bulk-operations.dto';
import { CustomerSegmentsService } from './services/customer-segments.service';
import { CustomerNotesService } from './services/customer-notes.service';
import { CreditManagementService } from './services/credit-management.service';
import { StoreCreditService } from './services/store-credit.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Customers')
@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class CustomersController {
  constructor(
    private readonly customersService: CustomersService,
    private readonly segmentsService: CustomerSegmentsService,
    private readonly notesService: CustomerNotesService,
    private readonly creditService: CreditManagementService,
    private readonly storeCreditService: StoreCreditService,
  ) {}

  @Post()
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Create a new customer' })
  @ApiResponse({ status: 201, description: 'Customer created successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Email already exists',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customersService.create(createCustomerDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all customers with filtering and search' })
  @ApiResponse({ status: 200, description: 'Customers retrieved successfully' })
  findAll(@Query() filterDto: FilterCustomerDto) {
    return this.customersService.findAll(filterDto);
  }

  @Get('stats')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get overall customer statistics' })
  @ApiResponse({
    status: 200,
    description: 'Customer statistics retrieved successfully',
  })
  getOverallStats() {
    return this.customersService.getOverallStats();
  }

  @Get('email/:email')
  @ApiOperation({ summary: 'Get a customer by email' })
  @ApiResponse({ status: 200, description: 'Customer retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  findByEmail(@Param('email') email: string) {
    return this.customersService.findByEmail(email);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a customer by ID' })
  @ApiResponse({ status: 200, description: 'Customer retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Get(':id/loyalty')
  @ApiOperation({ summary: 'Get customer loyalty information' })
  @ApiResponse({
    status: 200,
    description: 'Loyalty information retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  getLoyaltyInfo(@Param('id') id: string) {
    return this.customersService.getLoyaltyInfo(id);
  }

  @Get(':id/purchase-history')
  @ApiOperation({ summary: 'Get customer purchase history' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Purchase history retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  getPurchaseHistory(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.customersService.getPurchaseHistory(id, page, limit);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get customer statistics' })
  @ApiResponse({
    status: 200,
    description: 'Customer statistics retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  getCustomerStats(@Param('id') id: string) {
    return this.customersService.getCustomerStats(id);
  }

  @Patch(':id')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Update a customer' })
  @ApiResponse({ status: 200, description: 'Customer updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  update(@Param('id') id: string, @Body() updateCustomerDto: UpdateCustomerDto) {
    return this.customersService.update(id, updateCustomerDto);
  }

  @Patch(':id/loyalty/points')
  @Roles('admin', 'manager', 'cashier')
  @ApiOperation({ summary: 'Update customer loyalty points' })
  @ApiResponse({
    status: 200,
    description: 'Loyalty points updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  updateLoyaltyPoints(
    @Param('id') id: string,
    @Body() updateLoyaltyPointsDto: UpdateLoyaltyPointsDto,
  ) {
    return this.customersService.updateLoyaltyPoints(id, updateLoyaltyPointsDto);
  }

  @Patch(':id/loyalty/tier')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Update customer loyalty tier' })
  @ApiResponse({
    status: 200,
    description: 'Loyalty tier updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  updateLoyaltyTier(
    @Param('id') id: string,
    @Body() updateLoyaltyTierDto: UpdateLoyaltyTierDto,
  ) {
    return this.customersService.updateLoyaltyTier(id, updateLoyaltyTierDto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a customer' })
  @ApiResponse({ status: 200, description: 'Customer deleted successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  remove(@Param('id') id: string) {
    return this.customersService.remove(id);
  }

  // ========== CUSTOMER SEGMENTS ENDPOINTS ==========
  @Get('segments')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'List all customer segments' })
  @ApiResponse({ status: 200, description: 'Segments retrieved successfully' })
  getAllSegments() {
    return this.segmentsService.findAll();
  }

  @Get('segments/:id')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get segment details' })
  @ApiResponse({ status: 200, description: 'Segment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Segment not found' })
  getSegment(@Param('id') id: string) {
    return this.segmentsService.findOne(id);
  }

  @Post('segments')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Create a new customer segment' })
  @ApiResponse({ status: 201, description: 'Segment created successfully' })
  createSegment(@Body() createSegmentDto: CreateSegmentDto) {
    return this.segmentsService.create(createSegmentDto);
  }

  @Put('segments/:id')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Update a customer segment' })
  @ApiResponse({ status: 200, description: 'Segment updated successfully' })
  @ApiResponse({ status: 404, description: 'Segment not found' })
  updateSegment(@Param('id') id: string, @Body() updateSegmentDto: UpdateSegmentDto) {
    return this.segmentsService.update(id, updateSegmentDto);
  }

  @Delete('segments/:id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a customer segment' })
  @ApiResponse({ status: 200, description: 'Segment deleted successfully' })
  @ApiResponse({ status: 404, description: 'Segment not found' })
  deleteSegment(@Param('id') id: string) {
    return this.segmentsService.remove(id);
  }

  @Post('segments/:id/assign')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Assign customers to a segment' })
  @ApiResponse({ status: 200, description: 'Customers assigned successfully' })
  @ApiResponse({ status: 404, description: 'Segment not found' })
  assignCustomersToSegment(@Param('id') id: string, @Body() assignDto: AssignCustomersDto) {
    return this.segmentsService.assignCustomers(id, assignDto);
  }

  @Post('segments/:id/remove')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Remove customers from a segment' })
  @ApiResponse({ status: 200, description: 'Customers removed successfully' })
  @ApiResponse({ status: 404, description: 'Segment not found' })
  removeCustomersFromSegment(@Param('id') id: string, @Body() removeDto: AssignCustomersDto) {
    return this.segmentsService.removeCustomers(id, removeDto);
  }

  // ========== CUSTOMER NOTES ENDPOINTS ==========
  @Get(':customerId/notes')
  @ApiOperation({ summary: 'Get all notes for a customer' })
  @ApiResponse({ status: 200, description: 'Notes retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  getCustomerNotes(@Param('customerId') customerId: string) {
    return this.notesService.findByCustomer(customerId);
  }

  @Post(':customerId/notes')
  @Roles('admin', 'manager', 'cashier')
  @ApiOperation({ summary: 'Create a note for a customer' })
  @ApiResponse({ status: 201, description: 'Note created successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  createCustomerNote(@Param('customerId') customerId: string, @Body() createNoteDto: CreateNoteDto) {
    return this.notesService.create(customerId, createNoteDto);
  }

  @Put('notes/:noteId')
  @Roles('admin', 'manager', 'cashier')
  @ApiOperation({ summary: 'Update a customer note' })
  @ApiResponse({ status: 200, description: 'Note updated successfully' })
  @ApiResponse({ status: 404, description: 'Note not found' })
  updateCustomerNote(@Param('noteId') noteId: string, @Body() updateNoteDto: UpdateNoteDto) {
    return this.notesService.update(noteId, updateNoteDto);
  }

  @Delete('notes/:noteId')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Delete a customer note' })
  @ApiResponse({ status: 200, description: 'Note deleted successfully' })
  @ApiResponse({ status: 404, description: 'Note not found' })
  deleteCustomerNote(@Param('noteId') noteId: string) {
    return this.notesService.remove(noteId);
  }

  // ========== CREDIT MANAGEMENT ENDPOINTS ==========
  @Get(':customerId/credit/transactions')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get customer credit transactions' })
  @ApiResponse({ status: 200, description: 'Transactions retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  getCreditTransactions(@Param('customerId') customerId: string) {
    return this.creditService.getTransactions(customerId);
  }

  @Post(':customerId/credit/charge')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Charge amount to customer credit' })
  @ApiResponse({ status: 200, description: 'Credit charged successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  chargeCredit(@Param('customerId') customerId: string, @Body() chargeDto: CreditChargeDto) {
    return this.creditService.chargeCredit(customerId, chargeDto);
  }

  @Post(':customerId/credit/payment')
  @Roles('admin', 'manager', 'cashier')
  @ApiOperation({ summary: 'Record a credit payment' })
  @ApiResponse({ status: 200, description: 'Payment recorded successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  makeCreditPayment(@Param('customerId') customerId: string, @Body() paymentDto: CreditPaymentDto) {
    return this.creditService.makePayment(customerId, paymentDto);
  }

  @Put(':customerId/credit/limit')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Update customer credit limit' })
  @ApiResponse({ status: 200, description: 'Credit limit updated successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  updateCreditLimit(@Param('customerId') customerId: string, @Body() limitDto: UpdateCreditLimitDto) {
    return this.creditService.updateCreditLimit(customerId, limitDto);
  }

  // ========== STORE CREDIT ENDPOINTS ==========
  @Get(':customerId/store-credit/transactions')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get customer store credit transactions' })
  @ApiResponse({ status: 200, description: 'Transactions retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  getStoreCreditTransactions(@Param('customerId') customerId: string) {
    return this.storeCreditService.getTransactions(customerId);
  }

  @Post(':customerId/store-credit/add')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Add store credit to customer' })
  @ApiResponse({ status: 200, description: 'Store credit added successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  addStoreCredit(@Param('customerId') customerId: string, @Body() addDto: AddStoreCreditDto) {
    return this.storeCreditService.addStoreCredit(customerId, addDto);
  }

  @Post(':customerId/store-credit/deduct')
  @Roles('admin', 'manager', 'cashier')
  @ApiOperation({ summary: 'Deduct store credit from customer' })
  @ApiResponse({ status: 200, description: 'Store credit deducted successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  deductStoreCredit(@Param('customerId') customerId: string, @Body() deductDto: DeductStoreCreditDto) {
    return this.storeCreditService.deductStoreCredit(customerId, deductDto);
  }

  @Post(':customerId/loyalty/redeem')
  @Roles('admin', 'manager', 'cashier')
  @ApiOperation({ summary: 'Redeem loyalty points for store credit' })
  @ApiResponse({ status: 200, description: 'Loyalty points redeemed successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  redeemLoyaltyPoints(@Param('customerId') customerId: string, @Body() redeemDto: RedeemLoyaltyDto) {
    return this.storeCreditService.redeemLoyaltyPoints(customerId, redeemDto);
  }

  // ========== OTHER MISSING ENDPOINTS ==========
  @Post(':id/stats/purchase')
  @Roles('admin', 'manager', 'cashier')
  @ApiOperation({ summary: 'Update customer purchase statistics' })
  @ApiResponse({ status: 200, description: 'Purchase stats updated successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  updatePurchaseStats(@Param('id') id: string, @Body() updateStatsDto: UpdatePurchaseStatsDto) {
    return this.customersService.updatePurchaseStats(id, updateStatsDto);
  }

  @Post('bulk/status')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Bulk update customer status' })
  @ApiResponse({ status: 200, description: 'Customer statuses updated successfully' })
  bulkUpdateStatus(@Body() bulkUpdateDto: BulkStatusUpdateDto) {
    return this.customersService.bulkUpdateStatus(bulkUpdateDto);
  }

  @Get(':customerId/purchases/stats')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get detailed purchase statistics for a customer' })
  @ApiResponse({ status: 200, description: 'Purchase stats retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  getDetailedPurchaseStats(@Param('customerId') customerId: string) {
    return this.customersService.getDetailedPurchaseStats(customerId);
  }
}
