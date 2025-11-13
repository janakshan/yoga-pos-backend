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
import { FloorPlanService } from '../services/floor-plan.service';
import {
  CreateFloorPlanDto,
  UpdateFloorPlanDto,
  FilterFloorPlanDto,
} from '../dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RestaurantModeGuard } from '../../../common/guards/restaurant-mode.guard';
import { RestaurantMode } from '../../../common/decorators/restaurant-mode.decorator';

@ApiTags('Restaurant - Floor Plans')
@Controller('restaurant/floor-plans')
@UseGuards(JwtAuthGuard, RolesGuard, RestaurantModeGuard)
@ApiBearerAuth('JWT-auth')
@RestaurantMode()
export class FloorPlanController {
  constructor(private readonly floorPlanService: FloorPlanService) {}

  @Post()
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Create a new floor plan' })
  @ApiResponse({ status: 201, description: 'Floor plan created successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Floor plan name already exists',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(@Body() createFloorPlanDto: CreateFloorPlanDto) {
    return this.floorPlanService.create(createFloorPlanDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all floor plans with filtering and search' })
  @ApiResponse({
    status: 200,
    description: 'Floor plans retrieved successfully',
  })
  findAll(@Query() filterDto: FilterFloorPlanDto) {
    return this.floorPlanService.findAll(filterDto);
  }

  @Get('default/:branchId')
  @ApiOperation({ summary: 'Get the default floor plan for a branch' })
  @ApiResponse({
    status: 200,
    description: 'Default floor plan retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Default floor plan not found' })
  @ApiParam({ name: 'branchId', description: 'Branch ID' })
  getDefaultFloorPlan(@Param('branchId') branchId: string) {
    return this.floorPlanService.getDefaultFloorPlan(branchId);
  }

  @Get('by-branch/:branchId')
  @ApiOperation({ summary: 'Get all floor plans for a specific branch' })
  @ApiResponse({
    status: 200,
    description: 'Floor plans for branch retrieved successfully',
  })
  @ApiParam({ name: 'branchId', description: 'Branch ID' })
  getFloorPlansByBranch(@Param('branchId') branchId: string) {
    return this.floorPlanService.getFloorPlansByBranch(branchId);
  }

  @Get(':branchId/:name')
  @ApiOperation({ summary: 'Get a floor plan by name in a branch' })
  @ApiResponse({
    status: 200,
    description: 'Floor plan retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Floor plan not found' })
  @ApiParam({ name: 'branchId', description: 'Branch ID' })
  @ApiParam({ name: 'name', description: 'Floor plan name' })
  findByName(
    @Param('branchId') branchId: string,
    @Param('name') name: string,
  ) {
    return this.floorPlanService.findByName(branchId, name);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a floor plan by ID' })
  @ApiResponse({
    status: 200,
    description: 'Floor plan retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Floor plan not found' })
  @ApiParam({ name: 'id', description: 'Floor plan ID' })
  findOne(@Param('id') id: string) {
    return this.floorPlanService.findOne(id);
  }

  @Get(':id/stats')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get floor plan statistics' })
  @ApiResponse({
    status: 200,
    description: 'Floor plan statistics retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Floor plan not found' })
  @ApiParam({ name: 'id', description: 'Floor plan ID' })
  getFloorPlanStats(@Param('id') id: string) {
    return this.floorPlanService.getFloorPlanStats(id);
  }

  @Patch(':id')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Update a floor plan' })
  @ApiResponse({
    status: 200,
    description: 'Floor plan updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Floor plan not found' })
  @ApiParam({ name: 'id', description: 'Floor plan ID' })
  update(
    @Param('id') id: string,
    @Body() updateFloorPlanDto: UpdateFloorPlanDto,
  ) {
    return this.floorPlanService.update(id, updateFloorPlanDto);
  }

  @Patch(':id/layout')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Update floor plan layout' })
  @ApiResponse({
    status: 200,
    description: 'Floor plan layout updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Floor plan not found' })
  @ApiParam({ name: 'id', description: 'Floor plan ID' })
  updateLayout(@Param('id') id: string, @Body() layout: any) {
    return this.floorPlanService.updateLayout(id, layout);
  }

  @Patch(':id/set-default')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Set floor plan as default for the branch' })
  @ApiResponse({
    status: 200,
    description: 'Floor plan set as default successfully',
  })
  @ApiResponse({ status: 404, description: 'Floor plan not found' })
  @ApiParam({ name: 'id', description: 'Floor plan ID' })
  setAsDefault(@Param('id') id: string) {
    return this.floorPlanService.setAsDefault(id);
  }

  @Post(':id/duplicate')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Duplicate a floor plan with a new name' })
  @ApiResponse({
    status: 201,
    description: 'Floor plan duplicated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - New name already exists',
  })
  @ApiResponse({ status: 404, description: 'Floor plan not found' })
  @ApiParam({ name: 'id', description: 'Floor plan ID to duplicate' })
  duplicateFloorPlan(
    @Param('id') id: string,
    @Body('newName') newName: string,
  ) {
    return this.floorPlanService.duplicateFloorPlan(id, newName);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a floor plan' })
  @ApiResponse({
    status: 200,
    description: 'Floor plan deleted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete default floor plan',
  })
  @ApiResponse({ status: 404, description: 'Floor plan not found' })
  @ApiParam({ name: 'id', description: 'Floor plan ID' })
  remove(@Param('id') id: string) {
    return this.floorPlanService.remove(id);
  }
}
