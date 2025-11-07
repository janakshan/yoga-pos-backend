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
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { PartialPaymentDto } from './dto/partial-payment.dto';
import { SendInvoiceDto } from './dto/send-invoice.dto';
import { EmailInvoiceDto } from './dto/email-invoice.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Invoices')
@Controller('invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @Roles('admin', 'manager', 'cashier')
  @ApiOperation({ summary: 'Create a new invoice' })
  @ApiResponse({ status: 201, description: 'Invoice created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(@Body() createInvoiceDto: CreateInvoiceDto, @Request() req: any) {
    return this.invoicesService.create(createInvoiceDto, req.user.id);
  }

  @Get()
  @Roles('admin', 'manager', 'cashier')
  @ApiOperation({ summary: 'Get all invoices' })
  @ApiResponse({ status: 200, description: 'Invoices retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'customerId', required: false, type: String })
  @ApiQuery({ name: 'branchId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async findAll(@Query() query: PaginationDto) {
    const [data, total] = await this.invoicesService.findAll(query);
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

  @Get('stats')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get invoice statistics' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  @ApiQuery({ name: 'branchId', required: false, type: String })
  getStats(@Query('branchId') branchId?: string) {
    return this.invoicesService.getStats(branchId);
  }

  @Get(':id')
  @Roles('admin', 'manager', 'cashier')
  @ApiOperation({ summary: 'Get an invoice by ID' })
  @ApiResponse({ status: 200, description: 'Invoice retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  findOne(@Param('id') id: string) {
    return this.invoicesService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Update an invoice' })
  @ApiResponse({ status: 200, description: 'Invoice updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  update(
    @Param('id') id: string,
    @Body() updateInvoiceDto: UpdateInvoiceDto,
  ) {
    return this.invoicesService.update(id, updateInvoiceDto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete an invoice' })
  @ApiResponse({ status: 200, description: 'Invoice deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete paid invoice' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  remove(@Param('id') id: string) {
    return this.invoicesService.remove(id);
  }

  @Post(':id/mark-paid')
  @Roles('admin', 'manager', 'cashier')
  @ApiOperation({ summary: 'Mark invoice as paid' })
  @ApiResponse({ status: 200, description: 'Invoice marked as paid successfully' })
  @ApiResponse({ status: 400, description: 'Invoice is already paid' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  markAsPaid(@Param('id') id: string) {
    return this.invoicesService.markAsPaid(id);
  }

  @Post(':id/partial-payment')
  @Roles('admin', 'manager', 'cashier')
  @ApiOperation({ summary: 'Record a partial payment for an invoice' })
  @ApiResponse({
    status: 200,
    description: 'Partial payment recorded successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid payment amount' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  recordPartialPayment(
    @Param('id') id: string,
    @Body() partialPaymentDto: PartialPaymentDto,
  ) {
    return this.invoicesService.recordPartialPayment(
      id,
      partialPaymentDto.amount,
      partialPaymentDto.notes,
    );
  }

  @Post(':id/send')
  @Roles('admin', 'manager', 'cashier')
  @ApiOperation({ summary: 'Send invoice to customer' })
  @ApiResponse({ status: 200, description: 'Invoice sent successfully' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  sendInvoice(@Param('id') id: string, @Body() sendInvoiceDto: SendInvoiceDto) {
    return this.invoicesService.sendInvoice(
      id,
      sendInvoiceDto.email,
      sendInvoiceDto.message,
    );
  }

  @Get('overdue')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get overdue invoices' })
  @ApiResponse({
    status: 200,
    description: 'Overdue invoices retrieved successfully',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'branchId', required: false, type: String })
  async getOverdueInvoices(@Query() query: any) {
    const [data, total] = await this.invoicesService.getOverdueInvoices(query);
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

  @Post(':id/pdf')
  @Roles('admin', 'manager', 'cashier')
  @ApiOperation({ summary: 'Generate PDF for invoice' })
  @ApiResponse({ status: 200, description: 'PDF generated successfully' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  generatePdf(@Param('id') id: string) {
    return this.invoicesService.generatePdf(id);
  }

  @Post(':id/email')
  @Roles('admin', 'manager', 'cashier')
  @ApiOperation({ summary: 'Email invoice with PDF attachment' })
  @ApiResponse({ status: 200, description: 'Invoice emailed successfully' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  emailInvoice(@Param('id') id: string, @Body() emailInvoiceDto: EmailInvoiceDto) {
    return this.invoicesService.emailInvoice(
      id,
      emailInvoiceDto.email,
      emailInvoiceDto.subject,
      emailInvoiceDto.message,
    );
  }
}
