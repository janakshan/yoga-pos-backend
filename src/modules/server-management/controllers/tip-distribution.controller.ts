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
import { TipDistributionService } from '../services/tip-distribution.service';
import { CreateTipDistributionDto } from '../dto/create-tip-distribution.dto';
import { UpdateTipDistributionDto } from '../dto/update-tip-distribution.dto';
import { CalculateTipPoolDto } from '../dto/calculate-tip-pool.dto';

@ApiTags('Server Management - Tip Distribution')
@Controller('tip-distributions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class TipDistributionController {
  constructor(private readonly tipDistributionService: TipDistributionService) {}

  @Post()
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Create a new tip distribution record' })
  @ApiResponse({ status: 201, description: 'Tip distribution created successfully' })
  create(@Body() createDto: CreateTipDistributionDto) {
    return this.tipDistributionService.create(createDto);
  }

  @Get()
  @Roles('admin', 'manager', 'staff')
  @ApiOperation({ summary: 'Get all tip distributions' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'serverId', required: false, type: String })
  @ApiQuery({ name: 'branchId', required: false, type: String })
  @ApiQuery({ name: 'shiftId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async findAll(@Query() query: any) {
    const [data, total] = await this.tipDistributionService.findAll(query);
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

  @Get(':id')
  @Roles('admin', 'manager', 'staff')
  @ApiOperation({ summary: 'Get tip distribution by ID' })
  @ApiParam({ name: 'id', description: 'Tip distribution UUID' })
  findOne(@Param('id') id: string) {
    return this.tipDistributionService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Update tip distribution' })
  @ApiParam({ name: 'id', description: 'Tip distribution UUID' })
  update(@Param('id') id: string, @Body() updateDto: UpdateTipDistributionDto) {
    return this.tipDistributionService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles('admin', 'manager')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete tip distribution' })
  @ApiParam({ name: 'id', description: 'Tip distribution UUID' })
  remove(@Param('id') id: string) {
    return this.tipDistributionService.remove(id);
  }

  @Post('calculate-pool')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Calculate tip pool for a period' })
  @ApiResponse({ status: 200, description: 'Tip pool calculated successfully' })
  calculateTipPool(@Body() calculateDto: CalculateTipPoolDto) {
    return this.tipDistributionService.calculateTipPool(
      calculateDto.branchId,
      new Date(calculateDto.startDate),
      new Date(calculateDto.endDate),
      calculateDto.method,
      calculateDto.serverIds,
    );
  }

  @Post('apply-pool')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Apply calculated tip pool distribution' })
  @ApiResponse({ status: 201, description: 'Tip pool applied successfully' })
  applyTipPool(
    @Body()
    body: {
      poolId: string;
      distributions: any[];
    },
  ) {
    return this.tipDistributionService.applyTipPool(body.poolId, body.distributions);
  }

  @Get('summary/server/:serverId')
  @Roles('admin', 'manager', 'staff')
  @ApiOperation({ summary: 'Get tip summary for a server' })
  @ApiParam({ name: 'serverId', description: 'Server UUID' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  getTipSummary(
    @Param('serverId') serverId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.tipDistributionService.getTipSummary(serverId, startDate, endDate);
  }
}
