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
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Customers')
@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

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
}
