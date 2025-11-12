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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

// Services
import { ServersSectionsService } from './servers-sections.service';
import { ServersShiftsService } from './servers-shifts.service';
import { ServersAssignmentsService } from './servers-assignments.service';
import { ServersTipsService } from './servers-tips.service';
import { ServersPerformanceService } from './servers-performance.service';
import { ServersReportsService } from './servers-reports.service';

// DTOs
import { CreateServerSectionDto } from './dto/create-server-section.dto';
import { UpdateServerSectionDto } from './dto/update-server-section.dto';
import { FilterServerSectionDto } from './dto/filter-server-section.dto';
import { CreateServerShiftDto } from './dto/create-server-shift.dto';
import { UpdateServerShiftDto } from './dto/update-server-shift.dto';
import { FilterServerShiftDto } from './dto/filter-server-shift.dto';
import { StartShiftDto, EndShiftDto } from './dto/start-shift.dto';
import { CreateServerAssignmentDto } from './dto/create-server-assignment.dto';
import { UpdateServerAssignmentDto } from './dto/update-server-assignment.dto';
import { CreateServerTipDto } from './dto/create-server-tip.dto';
import { UpdateServerTipDto } from './dto/update-server-tip.dto';
import { ServerPerformanceQueryDto } from './dto/server-performance.dto';
import { ServerReportQueryDto } from './dto/server-report.dto';

@ApiTags('Servers')
@ApiBearerAuth()
@Controller('servers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ServersController {
  constructor(
    private readonly sectionsService: ServersSectionsService,
    private readonly shiftsService: ServersShiftsService,
    private readonly assignmentsService: ServersAssignmentsService,
    private readonly tipsService: ServersTipsService,
    private readonly performanceService: ServersPerformanceService,
    private readonly reportsService: ServersReportsService,
  ) {}

  // ==================== SECTIONS ====================

  @Post('sections')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Create a new server section' })
  @ApiResponse({ status: 201, description: 'Section created successfully' })
  createSection(@Body() createSectionDto: CreateServerSectionDto) {
    return this.sectionsService.create(createSectionDto);
  }

  @Get('sections')
  @ApiOperation({ summary: 'Get all server sections with filters' })
  @ApiResponse({ status: 200, description: 'Returns list of sections' })
  findAllSections(@Query() filters: FilterServerSectionDto) {
    return this.sectionsService.findAll(filters);
  }

  @Get('sections/stats')
  @ApiOperation({ summary: 'Get section statistics' })
  @ApiResponse({ status: 200, description: 'Returns section stats' })
  getSectionStats(@Query('branchId') branchId?: string) {
    return this.sectionsService.getStats(branchId);
  }

  @Get('sections/:id')
  @ApiOperation({ summary: 'Get section by ID' })
  @ApiResponse({ status: 200, description: 'Returns section details' })
  @ApiResponse({ status: 404, description: 'Section not found' })
  findOneSection(@Param('id') id: string) {
    return this.sectionsService.findOne(id);
  }

  @Patch('sections/:id')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Update section' })
  @ApiResponse({ status: 200, description: 'Section updated successfully' })
  updateSection(
    @Param('id') id: string,
    @Body() updateSectionDto: UpdateServerSectionDto,
  ) {
    return this.sectionsService.update(id, updateSectionDto);
  }

  @Delete('sections/:id')
  @Roles('admin', 'manager')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete section' })
  @ApiResponse({ status: 204, description: 'Section deleted successfully' })
  removeSection(@Param('id') id: string) {
    return this.sectionsService.remove(id);
  }

  // ==================== SHIFTS ====================

  @Post('shifts')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Create a new server shift' })
  @ApiResponse({ status: 201, description: 'Shift created successfully' })
  createShift(@Body() createShiftDto: CreateServerShiftDto) {
    return this.shiftsService.create(createShiftDto);
  }

  @Get('shifts')
  @ApiOperation({ summary: 'Get all shifts with filters' })
  @ApiResponse({ status: 200, description: 'Returns list of shifts' })
  findAllShifts(@Query() filters: FilterServerShiftDto) {
    return this.shiftsService.findAll(filters);
  }

  @Get('shifts/stats')
  @ApiOperation({ summary: 'Get shift statistics' })
  @ApiResponse({ status: 200, description: 'Returns shift stats' })
  getShiftStats(
    @Query('serverId') serverId?: string,
    @Query('branchId') branchId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.shiftsService.getShiftStats(serverId, branchId, startDate, endDate);
  }

  @Get('shifts/active/:serverId')
  @ApiOperation({ summary: 'Get active shift for a server' })
  @ApiResponse({ status: 200, description: 'Returns active shift or null' })
  findActiveShift(@Param('serverId') serverId: string) {
    return this.shiftsService.findActiveShift(serverId);
  }

  @Get('shifts/:id')
  @ApiOperation({ summary: 'Get shift by ID' })
  @ApiResponse({ status: 200, description: 'Returns shift details' })
  @ApiResponse({ status: 404, description: 'Shift not found' })
  findOneShift(@Param('id') id: string) {
    return this.shiftsService.findOne(id);
  }

  @Post('shifts/:id/start')
  @ApiOperation({ summary: 'Start a shift' })
  @ApiResponse({ status: 200, description: 'Shift started successfully' })
  startShift(@Param('id') id: string, @Body() startShiftDto: StartShiftDto) {
    return this.shiftsService.startShift(id, startShiftDto);
  }

  @Post('shifts/:id/end')
  @ApiOperation({ summary: 'End a shift' })
  @ApiResponse({ status: 200, description: 'Shift ended successfully' })
  endShift(@Param('id') id: string, @Body() endShiftDto: EndShiftDto) {
    return this.shiftsService.endShift(id, endShiftDto);
  }

  @Patch('shifts/:id')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Update shift' })
  @ApiResponse({ status: 200, description: 'Shift updated successfully' })
  updateShift(
    @Param('id') id: string,
    @Body() updateShiftDto: UpdateServerShiftDto,
  ) {
    return this.shiftsService.update(id, updateShiftDto);
  }

  @Delete('shifts/:id')
  @Roles('admin', 'manager')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete shift' })
  @ApiResponse({ status: 204, description: 'Shift deleted successfully' })
  removeShift(@Param('id') id: string) {
    return this.shiftsService.remove(id);
  }

  // ==================== ASSIGNMENTS ====================

  @Post('assignments')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Create a new server assignment' })
  @ApiResponse({ status: 201, description: 'Assignment created successfully' })
  createAssignment(@Body() createAssignmentDto: CreateServerAssignmentDto) {
    return this.assignmentsService.create(createAssignmentDto);
  }

  @Get('assignments')
  @ApiOperation({ summary: 'Get all assignments with filters' })
  @ApiResponse({ status: 200, description: 'Returns list of assignments' })
  findAllAssignments(
    @Query('serverId') serverId?: string,
    @Query('sectionId') sectionId?: string,
    @Query('shiftId') shiftId?: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.assignmentsService.findAll({
      serverId,
      sectionId,
      shiftId,
      status: status as any,
      page,
      limit,
    });
  }

  @Get('assignments/active/:serverId')
  @ApiOperation({ summary: 'Get active assignments for a server' })
  @ApiResponse({ status: 200, description: 'Returns active assignments' })
  findActiveAssignments(@Param('serverId') serverId: string) {
    return this.assignmentsService.findActiveAssignments(serverId);
  }

  @Get('assignments/section/:sectionId')
  @ApiOperation({ summary: 'Get current servers for a section' })
  @ApiResponse({ status: 200, description: 'Returns section servers' })
  findSectionServers(@Param('sectionId') sectionId: string) {
    return this.assignmentsService.findCurrentSectionServers(sectionId);
  }

  @Get('assignments/stats')
  @ApiOperation({ summary: 'Get assignment statistics' })
  @ApiResponse({ status: 200, description: 'Returns assignment stats' })
  getAssignmentStats(
    @Query('serverId') serverId?: string,
    @Query('sectionId') sectionId?: string,
  ) {
    return this.assignmentsService.getAssignmentStats(serverId, sectionId);
  }

  @Get('assignments/:id')
  @ApiOperation({ summary: 'Get assignment by ID' })
  @ApiResponse({ status: 200, description: 'Returns assignment details' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  findOneAssignment(@Param('id') id: string) {
    return this.assignmentsService.findOne(id);
  }

  @Post('assignments/:id/end')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'End an assignment' })
  @ApiResponse({ status: 200, description: 'Assignment ended successfully' })
  endAssignment(
    @Param('id') id: string,
    @Body('endTime') endTime: Date,
  ) {
    return this.assignmentsService.endAssignment(id, endTime);
  }

  @Patch('assignments/:id')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Update assignment' })
  @ApiResponse({ status: 200, description: 'Assignment updated successfully' })
  updateAssignment(
    @Param('id') id: string,
    @Body() updateAssignmentDto: UpdateServerAssignmentDto,
  ) {
    return this.assignmentsService.update(id, updateAssignmentDto);
  }

  @Delete('assignments/:id')
  @Roles('admin', 'manager')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete assignment' })
  @ApiResponse({ status: 204, description: 'Assignment deleted successfully' })
  removeAssignment(@Param('id') id: string) {
    return this.assignmentsService.remove(id);
  }

  // ==================== TIPS ====================

  @Post('tips')
  @ApiOperation({ summary: 'Create a new tip record' })
  @ApiResponse({ status: 201, description: 'Tip created successfully' })
  createTip(@Body() createTipDto: CreateServerTipDto) {
    return this.tipsService.create(createTipDto);
  }

  @Get('tips')
  @ApiOperation({ summary: 'Get all tips with filters' })
  @ApiResponse({ status: 200, description: 'Returns list of tips' })
  findAllTips(
    @Query('serverId') serverId?: string,
    @Query('shiftId') shiftId?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.tipsService.findAll({
      serverId,
      shiftId,
      status: status as any,
      startDate,
      endDate,
      page,
      limit,
    });
  }

  @Get('tips/stats')
  @ApiOperation({ summary: 'Get tip statistics' })
  @ApiResponse({ status: 200, description: 'Returns tip stats' })
  getTipStats(
    @Query('serverId') serverId?: string,
    @Query('shiftId') shiftId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.tipsService.getTipStats(serverId, shiftId, startDate, endDate);
  }

  @Get('tips/by-type')
  @ApiOperation({ summary: 'Get tips grouped by type' })
  @ApiResponse({ status: 200, description: 'Returns tips by type' })
  getTipsByType(
    @Query('serverId') serverId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.tipsService.getTipsByType(serverId, startDate, endDate);
  }

  @Get('tips/:id')
  @ApiOperation({ summary: 'Get tip by ID' })
  @ApiResponse({ status: 200, description: 'Returns tip details' })
  @ApiResponse({ status: 404, description: 'Tip not found' })
  findOneTip(@Param('id') id: string) {
    return this.tipsService.findOne(id);
  }

  @Post('tips/:id/mark-paid')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Mark tip as paid' })
  @ApiResponse({ status: 200, description: 'Tip marked as paid' })
  markTipAsPaid(
    @Param('id') id: string,
    @Body('paidDate') paidDate?: Date,
  ) {
    return this.tipsService.markAsPaid(id, paidDate);
  }

  @Patch('tips/:id')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Update tip' })
  @ApiResponse({ status: 200, description: 'Tip updated successfully' })
  updateTip(@Param('id') id: string, @Body() updateTipDto: UpdateServerTipDto) {
    return this.tipsService.update(id, updateTipDto);
  }

  @Delete('tips/:id')
  @Roles('admin', 'manager')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete tip' })
  @ApiResponse({ status: 204, description: 'Tip deleted successfully' })
  removeTip(@Param('id') id: string) {
    return this.tipsService.remove(id);
  }

  // ==================== PERFORMANCE ====================

  @Get('performance')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get server performance metrics' })
  @ApiResponse({ status: 200, description: 'Returns performance metrics' })
  getServerPerformance(@Query() query: ServerPerformanceQueryDto) {
    return this.performanceService.getServerPerformance(query);
  }

  @Get('performance/dashboard/:serverId')
  @ApiOperation({ summary: 'Get server performance dashboard' })
  @ApiResponse({ status: 200, description: 'Returns server dashboard' })
  getServerDashboard(
    @Param('serverId') serverId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.performanceService.getServerDashboard(serverId, startDate, endDate);
  }

  @Get('performance/order-history/:serverId')
  @ApiOperation({ summary: 'Get server order history' })
  @ApiResponse({ status: 200, description: 'Returns order history' })
  getServerOrderHistory(
    @Param('serverId') serverId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.performanceService.getServerOrderHistory(serverId, {
      startDate,
      endDate,
      page,
      limit,
    });
  }

  // ==================== REPORTS ====================

  @Get('reports')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Generate comprehensive server report' })
  @ApiResponse({ status: 200, description: 'Returns server report' })
  generateServerReport(@Query() query: ServerReportQueryDto) {
    return this.reportsService.generateServerReport(query);
  }

  @Get('reports/daily')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get daily server summary' })
  @ApiResponse({ status: 200, description: 'Returns daily summary' })
  getDailySummary(
    @Query('date') date: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.reportsService.getDailySummary(date, branchId);
  }
}
