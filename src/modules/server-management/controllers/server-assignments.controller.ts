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
import { ServerAssignmentsService } from '../services/server-assignments.service';
import { CreateServerAssignmentDto } from '../dto/create-server-assignment.dto';
import { UpdateServerAssignmentDto } from '../dto/update-server-assignment.dto';

@ApiTags('Server Management - Assignments')
@Controller('server-assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ServerAssignmentsController {
  constructor(private readonly assignmentsService: ServerAssignmentsService) {}

  @Post()
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Create a new server assignment' })
  @ApiResponse({ status: 201, description: 'Assignment created successfully' })
  @ApiResponse({ status: 409, description: 'Server already has an active assignment for this date' })
  create(@Body() createDto: CreateServerAssignmentDto) {
    return this.assignmentsService.create(createDto);
  }

  @Get()
  @Roles('admin', 'manager', 'staff')
  @ApiOperation({ summary: 'Get all server assignments' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'serverId', required: false, type: String })
  @ApiQuery({ name: 'branchId', required: false, type: String })
  @ApiQuery({ name: 'sectionId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async findAll(@Query() query: any) {
    const [data, total] = await this.assignmentsService.findAll(query);
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
  @ApiOperation({ summary: 'Get active assignments for a branch and date' })
  @ApiQuery({ name: 'branchId', required: true, type: String })
  @ApiQuery({ name: 'date', required: false, type: String })
  getActiveAssignments(@Query('branchId') branchId: string, @Query('date') date?: string) {
    return this.assignmentsService.getActiveAssignments(branchId, date);
  }

  @Get('rotation/next')
  @Roles('admin', 'manager', 'staff')
  @ApiOperation({ summary: 'Get next server in rotation for a section' })
  @ApiQuery({ name: 'branchId', required: true, type: String })
  @ApiQuery({ name: 'sectionId', required: true, type: String })
  @ApiQuery({ name: 'date', required: false, type: String })
  getNextServerForRotation(
    @Query('branchId') branchId: string,
    @Query('sectionId') sectionId: string,
    @Query('date') date?: string,
  ) {
    return this.assignmentsService.getNextServerForRotation(branchId, sectionId, date);
  }

  @Get(':id')
  @Roles('admin', 'manager', 'staff')
  @ApiOperation({ summary: 'Get server assignment by ID' })
  @ApiParam({ name: 'id', description: 'Assignment UUID' })
  findOne(@Param('id') id: string) {
    return this.assignmentsService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Update server assignment' })
  @ApiParam({ name: 'id', description: 'Assignment UUID' })
  update(@Param('id') id: string, @Body() updateDto: UpdateServerAssignmentDto) {
    return this.assignmentsService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles('admin', 'manager')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete server assignment' })
  @ApiParam({ name: 'id', description: 'Assignment UUID' })
  remove(@Param('id') id: string) {
    return this.assignmentsService.remove(id);
  }

  @Post(':id/table-count/increment')
  @Roles('admin', 'manager', 'staff')
  @ApiOperation({ summary: 'Increment table count for assignment' })
  @ApiParam({ name: 'id', description: 'Assignment UUID' })
  incrementTableCount(@Param('id') id: string) {
    return this.assignmentsService.updateTableCount(id, 1);
  }

  @Post(':id/table-count/decrement')
  @Roles('admin', 'manager', 'staff')
  @ApiOperation({ summary: 'Decrement table count for assignment' })
  @ApiParam({ name: 'id', description: 'Assignment UUID' })
  decrementTableCount(@Param('id') id: string) {
    return this.assignmentsService.updateTableCount(id, -1);
  }

  @Post('assign-section')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Assign server to a section' })
  @ApiResponse({ status: 201, description: 'Server assigned to section successfully' })
  assignToSection(
    @Body()
    body: {
      serverId: string;
      sectionId: string;
      branchId: string;
      date: string;
    },
  ) {
    return this.assignmentsService.assignServerToSection(
      body.serverId,
      body.sectionId,
      body.branchId,
      body.date,
    );
  }
}
