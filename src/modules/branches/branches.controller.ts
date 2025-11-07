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
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { FilterBranchDto } from './dto/filter-branch.dto';
import {
  UpdateOperatingHoursDto,
  UpdateBranchSettingsDto,
} from './dto/update-operating-hours.dto';
import { AssignManagerDto } from './dto/assign-manager.dto';
import { BulkStatusUpdateDto } from './dto/bulk-status.dto';
import { CompareBranchesDto } from './dto/compare-branches.dto';
import { CloneSettingsDto } from './dto/clone-settings.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Branches')
@Controller('branches')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create a new branch' })
  @ApiResponse({ status: 201, description: 'Branch created successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Code already exists',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(@Body() createBranchDto: CreateBranchDto) {
    return this.branchesService.create(createBranchDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all branches with filtering and search' })
  @ApiResponse({ status: 200, description: 'Branches retrieved successfully' })
  findAll(@Query() filterDto: FilterBranchDto) {
    return this.branchesService.findAll(filterDto);
  }

  @Get('stats')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get overall branch statistics' })
  @ApiResponse({
    status: 200,
    description: 'Branch statistics retrieved successfully',
  })
  getOverallStats() {
    return this.branchesService.getOverallStats();
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Get a branch by code' })
  @ApiResponse({ status: 200, description: 'Branch retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Branch not found' })
  findByCode(@Param('code') code: string) {
    return this.branchesService.findByCode(code);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a branch by ID' })
  @ApiResponse({ status: 200, description: 'Branch retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Branch not found' })
  findOne(@Param('id') id: string) {
    return this.branchesService.findOne(id);
  }

  @Get(':id/settings')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get branch settings' })
  @ApiResponse({
    status: 200,
    description: 'Branch settings retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Branch not found' })
  getSettings(@Param('id') id: string) {
    return this.branchesService.getSettings(id);
  }

  @Get(':id/operating-hours')
  @ApiOperation({ summary: 'Get branch operating hours' })
  @ApiResponse({
    status: 200,
    description: 'Operating hours retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Branch not found' })
  getOperatingHours(@Param('id') id: string) {
    return this.branchesService.getOperatingHours(id);
  }

  @Get(':id/stats')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get branch performance statistics' })
  @ApiResponse({
    status: 200,
    description: 'Branch statistics retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Branch not found' })
  getBranchStats(@Param('id') id: string) {
    return this.branchesService.getBranchStats(id);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update a branch' })
  @ApiResponse({ status: 200, description: 'Branch updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Branch not found' })
  update(@Param('id') id: string, @Body() updateBranchDto: UpdateBranchDto) {
    return this.branchesService.update(id, updateBranchDto);
  }

  @Patch(':id/settings')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Update branch settings' })
  @ApiResponse({
    status: 200,
    description: 'Branch settings updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Branch not found' })
  updateSettings(
    @Param('id') id: string,
    @Body() updateBranchSettingsDto: UpdateBranchSettingsDto,
  ) {
    return this.branchesService.updateSettings(id, updateBranchSettingsDto);
  }

  @Patch(':id/operating-hours')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Update branch operating hours' })
  @ApiResponse({
    status: 200,
    description: 'Operating hours updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Branch not found' })
  updateOperatingHours(
    @Param('id') id: string,
    @Body() updateOperatingHoursDto: UpdateOperatingHoursDto,
  ) {
    return this.branchesService.updateOperatingHours(
      id,
      updateOperatingHoursDto,
    );
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a branch' })
  @ApiResponse({ status: 200, description: 'Branch deleted successfully' })
  @ApiResponse({ status: 404, description: 'Branch not found' })
  remove(@Param('id') id: string) {
    return this.branchesService.remove(id);
  }

  @Post(':id/manager')
  @Roles('admin')
  @ApiOperation({ summary: 'Assign manager to branch' })
  @ApiResponse({ status: 200, description: 'Manager assigned successfully' })
  @ApiResponse({ status: 404, description: 'Branch or user not found' })
  @ApiResponse({ status: 400, description: 'User does not have manager privileges' })
  assignManager(
    @Param('id') id: string,
    @Body() assignManagerDto: AssignManagerDto,
  ) {
    return this.branchesService.assignManager(id, assignManagerDto.managerId);
  }

  @Post('bulk/status')
  @Roles('admin')
  @ApiOperation({ summary: 'Bulk update branch status' })
  @ApiResponse({ status: 200, description: 'Branches updated successfully' })
  @ApiResponse({ status: 404, description: 'No branches found' })
  bulkStatusUpdate(@Body() bulkStatusUpdateDto: BulkStatusUpdateDto) {
    return this.branchesService.bulkStatusUpdate(
      bulkStatusUpdateDto.branchIds,
      bulkStatusUpdateDto.isActive,
    );
  }

  @Get('performance')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get consolidated performance for all branches' })
  @ApiResponse({
    status: 200,
    description: 'Performance data retrieved successfully',
  })
  getPerformance() {
    return this.branchesService.getPerformance();
  }

  @Post('compare')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Compare multiple branches' })
  @ApiResponse({ status: 200, description: 'Comparison data retrieved successfully' })
  @ApiResponse({ status: 400, description: 'At least 2 branches required' })
  compareBranches(@Body() compareBranchesDto: CompareBranchesDto) {
    return this.branchesService.compareBranches(compareBranchesDto.branchIds);
  }

  @Post('settings/clone')
  @Roles('admin')
  @ApiOperation({ summary: 'Clone settings from one branch to another' })
  @ApiResponse({ status: 200, description: 'Settings cloned successfully' })
  @ApiResponse({ status: 404, description: 'Branch not found' })
  @ApiResponse({ status: 400, description: 'Source branch has no settings' })
  cloneSettings(@Body() cloneSettingsDto: CloneSettingsDto) {
    return this.branchesService.cloneSettings(
      cloneSettingsDto.sourceBranchId,
      cloneSettingsDto.targetBranchId,
    );
  }
}
