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
} from '@nestjs/swagger';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { FilterSupplierDto } from './dto/filter-supplier.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Suppliers')
@Controller('suppliers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Create a new supplier' })
  @ApiResponse({ status: 201, description: 'Supplier created successfully' })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Supplier code already exists',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(@Body() createSupplierDto: CreateSupplierDto) {
    return this.suppliersService.create(createSupplierDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all suppliers with filtering' })
  @ApiResponse({ status: 200, description: 'Suppliers retrieved successfully' })
  findAll(@Query() filterDto: FilterSupplierDto) {
    return this.suppliersService.findAll(filterDto);
  }

  @Get('stats')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get overall supplier statistics' })
  @ApiResponse({
    status: 200,
    description: 'Supplier statistics retrieved successfully',
  })
  getStats() {
    return this.suppliersService.getStats();
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Get a supplier by code' })
  @ApiResponse({ status: 200, description: 'Supplier retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  findByCode(@Param('code') code: string) {
    return this.suppliersService.findByCode(code);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a supplier by ID' })
  @ApiResponse({ status: 200, description: 'Supplier retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  findOne(@Param('id') id: string) {
    return this.suppliersService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Update a supplier' })
  @ApiResponse({ status: 200, description: 'Supplier updated successfully' })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  @ApiResponse({ status: 409, description: 'Conflict - Code already exists' })
  update(@Param('id') id: string, @Body() updateSupplierDto: UpdateSupplierDto) {
    return this.suppliersService.update(id, updateSupplierDto);
  }

  @Put(':id/payment-terms')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Update supplier payment terms' })
  @ApiResponse({
    status: 200,
    description: 'Payment terms updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  updatePaymentTerms(
    @Param('id') id: string,
    @Body('paymentTerms') paymentTerms: string,
  ) {
    return this.suppliersService.updatePaymentTerms(id, paymentTerms);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a supplier' })
  @ApiResponse({ status: 200, description: 'Supplier deleted successfully' })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  remove(@Param('id') id: string) {
    return this.suppliersService.remove(id);
  }
}
