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
  ApiParam,
} from '@nestjs/swagger';
import { TablesService } from '../services/tables.service';
import {
  CreateTableDto,
  UpdateTableDto,
  FilterTableDto,
  UpdateTableStatusDto,
  AssignServerDto,
} from '../dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RestaurantModeGuard } from '../../../common/guards/restaurant-mode.guard';
import { RestaurantMode } from '../../../common/decorators/restaurant-mode.decorator';

@ApiTags('Restaurant - Tables')
@Controller('restaurant/tables')
@UseGuards(JwtAuthGuard, RolesGuard, RestaurantModeGuard)
@ApiBearerAuth('JWT-auth')
@RestaurantMode()
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Post()
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Create a new table' })
  @ApiResponse({ status: 201, description: 'Table created successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Table number already exists',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(@Body() createTableDto: CreateTableDto) {
    return this.tablesService.create(createTableDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tables with filtering and search' })
  @ApiResponse({ status: 200, description: 'Tables retrieved successfully' })
  findAll(@Query() filterDto: FilterTableDto) {
    return this.tablesService.findAll(filterDto);
  }

  @Get('available/:branchId')
  @ApiOperation({ summary: 'Get all available tables for a branch' })
  @ApiResponse({
    status: 200,
    description: 'Available tables retrieved successfully',
  })
  @ApiParam({ name: 'branchId', description: 'Branch ID' })
  getAvailableTables(@Param('branchId') branchId: string) {
    return this.tablesService.getAvailableTables(branchId);
  }

  @Get('check-availability/:branchId/:partySize')
  @ApiOperation({
    summary: 'Check table availability for a specific party size',
  })
  @ApiResponse({
    status: 200,
    description: 'Available tables for party size retrieved successfully',
  })
  @ApiParam({ name: 'branchId', description: 'Branch ID' })
  @ApiParam({ name: 'partySize', description: 'Number of guests' })
  checkAvailability(
    @Param('branchId') branchId: string,
    @Param('partySize') partySize: string,
  ) {
    return this.tablesService.checkAvailability(branchId, parseInt(partySize));
  }

  @Get('stats/:branchId')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get table statistics for a branch' })
  @ApiResponse({
    status: 200,
    description: 'Table statistics retrieved successfully',
  })
  @ApiParam({ name: 'branchId', description: 'Branch ID' })
  getTableStats(@Param('branchId') branchId: string) {
    return this.tablesService.getTableStats(branchId);
  }

  @Get('by-server/:serverId')
  @ApiOperation({ summary: 'Get all tables assigned to a specific server' })
  @ApiResponse({
    status: 200,
    description: 'Tables for server retrieved successfully',
  })
  @ApiParam({ name: 'serverId', description: 'Server/Waiter user ID' })
  getTablesByServer(@Param('serverId') serverId: string) {
    return this.tablesService.getTablesByServer(serverId);
  }

  @Get('by-section/:sectionId')
  @ApiOperation({ summary: 'Get all tables in a specific section' })
  @ApiResponse({
    status: 200,
    description: 'Tables for section retrieved successfully',
  })
  @ApiParam({ name: 'sectionId', description: 'Section ID' })
  getTablesBySection(@Param('sectionId') sectionId: string) {
    return this.tablesService.getTablesBySection(sectionId);
  }

  @Get('by-floor-plan/:floorPlanId')
  @ApiOperation({ summary: 'Get all tables on a specific floor plan' })
  @ApiResponse({
    status: 200,
    description: 'Tables for floor plan retrieved successfully',
  })
  @ApiParam({ name: 'floorPlanId', description: 'Floor plan ID' })
  getTablesByFloorPlan(@Param('floorPlanId') floorPlanId: string) {
    return this.tablesService.getTablesByFloorPlan(floorPlanId);
  }

  @Get(':branchId/:tableNumber')
  @ApiOperation({ summary: 'Get a table by table number in a branch' })
  @ApiResponse({ status: 200, description: 'Table retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Table not found' })
  @ApiParam({ name: 'branchId', description: 'Branch ID' })
  @ApiParam({ name: 'tableNumber', description: 'Table number' })
  findByTableNumber(
    @Param('branchId') branchId: string,
    @Param('tableNumber') tableNumber: string,
  ) {
    return this.tablesService.findByTableNumber(branchId, tableNumber);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a table by ID' })
  @ApiResponse({ status: 200, description: 'Table retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Table not found' })
  @ApiParam({ name: 'id', description: 'Table ID' })
  findOne(@Param('id') id: string) {
    return this.tablesService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Update a table' })
  @ApiResponse({ status: 200, description: 'Table updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Table not found' })
  @ApiParam({ name: 'id', description: 'Table ID' })
  update(@Param('id') id: string, @Body() updateTableDto: UpdateTableDto) {
    return this.tablesService.update(id, updateTableDto);
  }

  @Patch(':id/status')
  @Roles('admin', 'manager', 'waiter', 'cashier')
  @ApiOperation({ summary: 'Update table status' })
  @ApiResponse({
    status: 200,
    description: 'Table status updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Table not found' })
  @ApiParam({ name: 'id', description: 'Table ID' })
  updateStatus(
    @Param('id') id: string,
    @Body() updateTableStatusDto: UpdateTableStatusDto,
  ) {
    return this.tablesService.updateStatus(id, updateTableStatusDto);
  }

  @Patch(':id/assign-server')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Assign a server/waiter to a table' })
  @ApiResponse({ status: 200, description: 'Server assigned successfully' })
  @ApiResponse({ status: 404, description: 'Table or server not found' })
  @ApiParam({ name: 'id', description: 'Table ID' })
  assignServer(
    @Param('id') id: string,
    @Body() assignServerDto: AssignServerDto,
  ) {
    return this.tablesService.assignServer(id, assignServerDto);
  }

  @Patch(':id/unassign-server')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Unassign server from a table' })
  @ApiResponse({
    status: 200,
    description: 'Server unassigned successfully',
  })
  @ApiResponse({ status: 404, description: 'Table not found' })
  @ApiParam({ name: 'id', description: 'Table ID' })
  unassignServer(@Param('id') id: string) {
    return this.tablesService.unassignServer(id);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a table' })
  @ApiResponse({ status: 200, description: 'Table deleted successfully' })
  @ApiResponse({ status: 404, description: 'Table not found' })
  @ApiParam({ name: 'id', description: 'Table ID' })
  remove(@Param('id') id: string) {
    return this.tablesService.remove(id);
  }
}
