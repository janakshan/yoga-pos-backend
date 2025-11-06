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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PurchaseOrdersService } from './purchase-orders.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { FilterPurchaseOrderDto } from './dto/filter-purchase-order.dto';
import { ReceivePurchaseOrderDto } from './dto/receive-purchase-order.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Purchase Orders')
@Controller('purchase-orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class PurchaseOrdersController {
  constructor(
    private readonly purchaseOrdersService: PurchaseOrdersService,
  ) {}

  @Post()
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Create a new purchase order' })
  @ApiResponse({
    status: 201,
    description: 'Purchase order created successfully',
  })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(
    @Body() createPurchaseOrderDto: CreatePurchaseOrderDto,
    @CurrentUser() user?: any,
  ) {
    return this.purchaseOrdersService.create(
      createPurchaseOrderDto,
      user?.id,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all purchase orders with filtering' })
  @ApiResponse({
    status: 200,
    description: 'Purchase orders retrieved successfully',
  })
  findAll(@Query() filterDto: FilterPurchaseOrderDto) {
    return this.purchaseOrdersService.findAll(filterDto);
  }

  @Get('stats')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get purchase order statistics' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  getStats() {
    return this.purchaseOrdersService.getStats();
  }

  @Get('po-number/:poNumber')
  @ApiOperation({ summary: 'Get a purchase order by PO number' })
  @ApiResponse({
    status: 200,
    description: 'Purchase order retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Purchase order not found' })
  findByPONumber(@Param('poNumber') poNumber: string) {
    return this.purchaseOrdersService.findByPONumber(poNumber);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a purchase order by ID' })
  @ApiResponse({
    status: 200,
    description: 'Purchase order retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Purchase order not found' })
  findOne(@Param('id') id: string) {
    return this.purchaseOrdersService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Update a purchase order (draft only)' })
  @ApiResponse({
    status: 200,
    description: 'Purchase order updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Only draft POs can be updated' })
  @ApiResponse({ status: 404, description: 'Purchase order not found' })
  update(
    @Param('id') id: string,
    @Body() updatePurchaseOrderDto: UpdatePurchaseOrderDto,
  ) {
    return this.purchaseOrdersService.update(id, updatePurchaseOrderDto);
  }

  @Post(':id/submit')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Submit a purchase order for approval' })
  @ApiResponse({
    status: 200,
    description: 'Purchase order submitted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Only draft POs can be submitted',
  })
  @ApiResponse({ status: 404, description: 'Purchase order not found' })
  submit(@Param('id') id: string) {
    return this.purchaseOrdersService.submit(id);
  }

  @Post(':id/approve')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Approve a purchase order' })
  @ApiResponse({
    status: 200,
    description: 'Purchase order approved successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Only submitted POs can be approved',
  })
  @ApiResponse({ status: 404, description: 'Purchase order not found' })
  approve(@Param('id') id: string, @CurrentUser() user?: any) {
    return this.purchaseOrdersService.approve(id, user?.id);
  }

  @Post(':id/receive')
  @Roles('admin', 'manager', 'staff')
  @ApiOperation({ summary: 'Receive inventory against a purchase order' })
  @ApiResponse({
    status: 200,
    description: 'Inventory received successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Only approved or partially received POs can be received',
  })
  @ApiResponse({ status: 404, description: 'Purchase order not found' })
  receive(
    @Param('id') id: string,
    @Body() receiveDto: ReceivePurchaseOrderDto,
    @CurrentUser() user?: any,
  ) {
    return this.purchaseOrdersService.receive(id, receiveDto, user?.id);
  }

  @Post(':id/cancel')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Cancel a purchase order' })
  @ApiResponse({
    status: 200,
    description: 'Purchase order cancelled successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Received POs cannot be cancelled',
  })
  @ApiResponse({ status: 404, description: 'Purchase order not found' })
  cancel(@Param('id') id: string) {
    return this.purchaseOrdersService.cancel(id);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a purchase order (draft only)' })
  @ApiResponse({
    status: 200,
    description: 'Purchase order deleted successfully',
  })
  @ApiResponse({ status: 400, description: 'Only draft POs can be deleted' })
  @ApiResponse({ status: 404, description: 'Purchase order not found' })
  remove(@Param('id') id: string) {
    return this.purchaseOrdersService.remove(id);
  }
}
