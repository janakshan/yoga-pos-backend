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
import { TableSectionService } from '../services/table-section.service';
import {
  CreateTableSectionDto,
  UpdateTableSectionDto,
  FilterTableSectionDto,
} from '../dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RestaurantModeGuard } from '../../../common/guards/restaurant-mode.guard';
import { RestaurantMode } from '../../../common/decorators/restaurant-mode.decorator';

@ApiTags('Restaurant - Table Sections')
@Controller('restaurant/table-sections')
@UseGuards(JwtAuthGuard, RolesGuard, RestaurantModeGuard)
@ApiBearerAuth('JWT-auth')
@RestaurantMode()
export class TableSectionController {
  constructor(private readonly tableSectionService: TableSectionService) {}

  @Post()
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Create a new table section' })
  @ApiResponse({ status: 201, description: 'Section created successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Section name already exists',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(@Body() createTableSectionDto: CreateTableSectionDto) {
    return this.tableSectionService.create(createTableSectionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all table sections with filtering and search' })
  @ApiResponse({ status: 200, description: 'Sections retrieved successfully' })
  findAll(@Query() filterDto: FilterTableSectionDto) {
    return this.tableSectionService.findAll(filterDto);
  }

  @Get('by-branch/:branchId')
  @ApiOperation({ summary: 'Get all sections for a specific branch' })
  @ApiResponse({
    status: 200,
    description: 'Sections for branch retrieved successfully',
  })
  @ApiParam({ name: 'branchId', description: 'Branch ID' })
  getSectionsByBranch(@Param('branchId') branchId: string) {
    return this.tableSectionService.getSectionsByBranch(branchId);
  }

  @Get('by-floor-plan/:floorPlanId')
  @ApiOperation({ summary: 'Get all sections for a specific floor plan' })
  @ApiResponse({
    status: 200,
    description: 'Sections for floor plan retrieved successfully',
  })
  @ApiParam({ name: 'floorPlanId', description: 'Floor plan ID' })
  getSectionsByFloorPlan(@Param('floorPlanId') floorPlanId: string) {
    return this.tableSectionService.getSectionsByFloorPlan(floorPlanId);
  }

  @Get(':branchId/:name')
  @ApiOperation({ summary: 'Get a section by name in a branch' })
  @ApiResponse({ status: 200, description: 'Section retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Section not found' })
  @ApiParam({ name: 'branchId', description: 'Branch ID' })
  @ApiParam({ name: 'name', description: 'Section name' })
  findByName(
    @Param('branchId') branchId: string,
    @Param('name') name: string,
  ) {
    return this.tableSectionService.findByName(branchId, name);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a section by ID' })
  @ApiResponse({ status: 200, description: 'Section retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Section not found' })
  @ApiParam({ name: 'id', description: 'Section ID' })
  findOne(@Param('id') id: string) {
    return this.tableSectionService.findOne(id);
  }

  @Get(':id/stats')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get section statistics' })
  @ApiResponse({
    status: 200,
    description: 'Section statistics retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Section not found' })
  @ApiParam({ name: 'id', description: 'Section ID' })
  getSectionStats(@Param('id') id: string) {
    return this.tableSectionService.getSectionStats(id);
  }

  @Patch(':id')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Update a section' })
  @ApiResponse({ status: 200, description: 'Section updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Section not found' })
  @ApiParam({ name: 'id', description: 'Section ID' })
  update(
    @Param('id') id: string,
    @Body() updateTableSectionDto: UpdateTableSectionDto,
  ) {
    return this.tableSectionService.update(id, updateTableSectionDto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a section' })
  @ApiResponse({ status: 200, description: 'Section deleted successfully' })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete section with active tables',
  })
  @ApiResponse({ status: 404, description: 'Section not found' })
  @ApiParam({ name: 'id', description: 'Section ID' })
  remove(@Param('id') id: string) {
    return this.tableSectionService.remove(id);
  }
}
