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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ModifiersService } from './services/modifiers.service';
import { CreateModifierDto } from './dto/create-modifier.dto';
import { UpdateModifierDto } from './dto/update-modifier.dto';
import { CreateModifierGroupDto } from './dto/create-modifier-group.dto';
import { UpdateModifierGroupDto } from './dto/update-modifier-group.dto';
import { FilterModifierDto } from './dto/filter-modifier.dto';
import { FilterModifierGroupDto } from './dto/filter-modifier-group.dto';
import { AssignModifiersToProductDto } from './dto/assign-modifiers-to-product.dto';
import { ValidateModifierSelectionDto } from './dto/validate-modifier-selection.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

@ApiTags('Restaurant - Modifiers')
@Controller('restaurant/modifiers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ModifiersController {
  constructor(private readonly modifiersService: ModifiersService) {}

  // ===== Modifier Endpoints =====

  @Post()
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Create a new modifier' })
  @ApiResponse({
    status: 201,
    description: 'Modifier created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Modifier group not found' })
  createModifier(@Body() createModifierDto: CreateModifierDto) {
    return this.modifiersService.createModifier(createModifierDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all modifiers with filtering' })
  @ApiResponse({ status: 200, description: 'List of modifiers' })
  findAllModifiers(@Query() filterDto: FilterModifierDto) {
    return this.modifiersService.findAllModifiers(filterDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single modifier by ID' })
  @ApiParam({ name: 'id', description: 'Modifier ID' })
  @ApiResponse({ status: 200, description: 'Modifier details' })
  @ApiResponse({ status: 404, description: 'Modifier not found' })
  findOneModifier(@Param('id') id: string) {
    return this.modifiersService.findOneModifier(id);
  }

  @Patch(':id')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Update a modifier' })
  @ApiParam({ name: 'id', description: 'Modifier ID' })
  @ApiResponse({ status: 200, description: 'Modifier updated successfully' })
  @ApiResponse({ status: 404, description: 'Modifier not found' })
  updateModifier(
    @Param('id') id: string,
    @Body() updateModifierDto: UpdateModifierDto,
  ) {
    return this.modifiersService.updateModifier(id, updateModifierDto);
  }

  @Delete(':id')
  @Roles('admin', 'manager')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a modifier' })
  @ApiParam({ name: 'id', description: 'Modifier ID' })
  @ApiResponse({ status: 204, description: 'Modifier deleted successfully' })
  @ApiResponse({ status: 404, description: 'Modifier not found' })
  removeModifier(@Param('id') id: string) {
    return this.modifiersService.removeModifier(id);
  }

  // ===== Modifier Group Endpoints =====

  @Post('groups')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Create a new modifier group' })
  @ApiResponse({
    status: 201,
    description: 'Modifier group created successfully',
  })
  createModifierGroup(@Body() createDto: CreateModifierGroupDto) {
    return this.modifiersService.createModifierGroup(createDto);
  }

  @Get('groups')
  @ApiOperation({ summary: 'Get all modifier groups with filtering' })
  @ApiResponse({ status: 200, description: 'List of modifier groups' })
  findAllModifierGroups(@Query() filterDto: FilterModifierGroupDto) {
    return this.modifiersService.findAllModifierGroups(filterDto);
  }

  @Get('groups/:id')
  @ApiOperation({ summary: 'Get a single modifier group by ID' })
  @ApiParam({ name: 'id', description: 'Modifier group ID' })
  @ApiResponse({ status: 200, description: 'Modifier group details' })
  @ApiResponse({ status: 404, description: 'Modifier group not found' })
  findOneModifierGroup(@Param('id') id: string) {
    return this.modifiersService.findOneModifierGroup(id);
  }

  @Patch('groups/:id')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Update a modifier group' })
  @ApiParam({ name: 'id', description: 'Modifier group ID' })
  @ApiResponse({
    status: 200,
    description: 'Modifier group updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Modifier group not found' })
  updateModifierGroup(
    @Param('id') id: string,
    @Body() updateDto: UpdateModifierGroupDto,
  ) {
    return this.modifiersService.updateModifierGroup(id, updateDto);
  }

  @Delete('groups/:id')
  @Roles('admin', 'manager')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a modifier group' })
  @ApiParam({ name: 'id', description: 'Modifier group ID' })
  @ApiResponse({
    status: 204,
    description: 'Modifier group deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Modifier group not found' })
  removeModifierGroup(@Param('id') id: string) {
    return this.modifiersService.removeModifierGroup(id);
  }

  // ===== Product-Modifier Assignment Endpoints =====

  @Post('products/:productId/assign')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Assign modifier groups to a product' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiResponse({
    status: 200,
    description: 'Modifier groups assigned successfully',
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  assignModifierGroupsToProduct(
    @Param('productId') productId: string,
    @Body() assignDto: AssignModifiersToProductDto,
  ) {
    return this.modifiersService.assignModifierGroupsToProduct(
      productId,
      assignDto.modifierGroupIds,
    );
  }

  @Get('products/:productId')
  @ApiOperation({ summary: 'Get all modifier groups for a product' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiResponse({
    status: 200,
    description: 'List of modifier groups for the product',
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  getProductModifierGroups(@Param('productId') productId: string) {
    return this.modifiersService.getProductModifierGroups(productId);
  }

  @Delete('products/:productId/groups/:groupId')
  @Roles('admin', 'manager')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a modifier group from a product' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiParam({ name: 'groupId', description: 'Modifier group ID' })
  @ApiResponse({
    status: 204,
    description: 'Modifier group removed from product',
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  removeModifierGroupFromProduct(
    @Param('productId') productId: string,
    @Param('groupId') groupId: string,
  ) {
    return this.modifiersService.removeModifierGroupFromProduct(
      productId,
      groupId,
    );
  }

  // ===== Validation Endpoint =====

  @Post('validate')
  @ApiOperation({ summary: 'Validate modifier selections for an order item' })
  @ApiResponse({
    status: 200,
    description: 'Validation result with errors and total price',
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  validateModifierSelection(@Body() validateDto: ValidateModifierSelectionDto) {
    return this.modifiersService.validateModifierSelection(validateDto);
  }

  // ===== Bulk Operations =====

  @Patch('bulk/availability')
  @Roles('admin', 'manager')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Bulk update modifier availability' })
  @ApiResponse({
    status: 204,
    description: 'Modifiers updated successfully',
  })
  bulkUpdateAvailability(
    @Body() body: { modifierIds: string[]; isAvailable: boolean },
  ) {
    return this.modifiersService.bulkUpdateModifierAvailability(
      body.modifierIds,
      body.isAvailable,
    );
  }

  @Patch('bulk/stock')
  @Roles('admin', 'manager')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Bulk update modifier stock quantities' })
  @ApiResponse({
    status: 204,
    description: 'Stock quantities updated successfully',
  })
  bulkUpdateStock(
    @Body()
    body: { updates: Array<{ modifierId: string; stockQuantity: number }> },
  ) {
    return this.modifiersService.bulkUpdateModifierStock(body.updates);
  }
}
