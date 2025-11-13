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
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { ServerShiftsService } from '../services/server-shifts.service';
import { CreateServerShiftDto } from '../dto/create-server-shift.dto';
import { UpdateServerShiftDto } from '../dto/update-server-shift.dto';
import { ClockInDto } from '../dto/clock-in.dto';
import { ClockOutDto } from '../dto/clock-out.dto';

@ApiTags('Server Management - Shifts')
@Controller('server-shifts')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ServerShiftsController {
  constructor(private readonly shiftsService: ServerShiftsService) {}

  @Post()
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Create a new server shift' })
  @ApiResponse({ status: 201, description: 'Shift created successfully' })
  create(@Body() createDto: CreateServerShiftDto) {
    return this.shiftsService.create(createDto);
  }

  @Get()
  @Roles('admin', 'manager', 'staff')
  @ApiOperation({ summary: 'Get all server shifts' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'serverId', required: false, type: String })
  @ApiQuery({ name: 'branchId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async findAll(@Query() query: any) {
    const [data, total] = await this.shiftsService.findAll(query);
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

  @Get('active')
  @Roles('admin', 'manager', 'staff')
  @ApiOperation({ summary: 'Get active shift for a server' })
  @ApiQuery({ name: 'serverId', required: true, type: String })
  @ApiQuery({ name: 'branchId', required: true, type: String })
  getActiveShift(
    @Query('serverId') serverId: string,
    @Query('branchId') branchId: string,
  ) {
    return this.shiftsService.getActiveShift(serverId, branchId);
  }

  @Get(':id')
  @Roles('admin', 'manager', 'staff')
  @ApiOperation({ summary: 'Get server shift by ID' })
  @ApiParam({ name: 'id', description: 'Shift UUID' })
  findOne(@Param('id') id: string) {
    return this.shiftsService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Update server shift' })
  @ApiParam({ name: 'id', description: 'Shift UUID' })
  update(@Param('id') id: string, @Body() updateDto: UpdateServerShiftDto) {
    return this.shiftsService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles('admin', 'manager')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete server shift' })
  @ApiParam({ name: 'id', description: 'Shift UUID' })
  remove(@Param('id') id: string) {
    return this.shiftsService.remove(id);
  }

  @Post('clock-in')
  @Roles('admin', 'manager', 'staff')
  @ApiOperation({ summary: 'Clock in to a shift' })
  @ApiResponse({ status: 200, description: 'Clocked in successfully' })
  clockIn(@Body() clockInDto: ClockInDto) {
    return this.shiftsService.clockIn(clockInDto.shiftId, clockInDto.metadata);
  }

  @Post('clock-out')
  @Roles('admin', 'manager', 'staff')
  @ApiOperation({ summary: 'Clock out from a shift' })
  @ApiResponse({ status: 200, description: 'Clocked out successfully' })
  clockOut(@Body() clockOutDto: ClockOutDto) {
    return this.shiftsService.clockOut(clockOutDto.shiftId, clockOutDto.metadata);
  }

  @Post(':id/break/start')
  @Roles('admin', 'manager', 'staff')
  @ApiOperation({ summary: 'Start a break' })
  @ApiParam({ name: 'id', description: 'Shift UUID' })
  startBreak(
    @Param('id') id: string,
    @Body() body: { type?: 'meal' | 'rest' | 'other' },
  ) {
    return this.shiftsService.startBreak(id, body.type);
  }

  @Post(':id/break/end')
  @Roles('admin', 'manager', 'staff')
  @ApiOperation({ summary: 'End a break' })
  @ApiParam({ name: 'id', description: 'Shift UUID' })
  endBreak(@Param('id') id: string, @Body() body: { notes?: string }) {
    return this.shiftsService.endBreak(id, body.notes);
  }

  @Patch(':id/metrics')
  @Roles('admin', 'manager', 'staff')
  @ApiOperation({ summary: 'Update shift metrics' })
  @ApiParam({ name: 'id', description: 'Shift UUID' })
  updateMetrics(
    @Param('id') id: string,
    @Body()
    metrics: {
      ordersServed?: number;
      tablesServed?: number;
      totalSales?: number;
      totalTips?: number;
    },
  ) {
    return this.shiftsService.updateShiftMetrics(id, metrics);
  }

  @Get('server/:serverId/date-range')
  @Roles('admin', 'manager', 'staff')
  @ApiOperation({ summary: 'Get shifts for a server in a date range' })
  @ApiParam({ name: 'serverId', description: 'Server UUID' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  getShiftsByDateRange(
    @Param('serverId') serverId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.shiftsService.getShiftsByDateRange(serverId, startDate, endDate);
  }
}
