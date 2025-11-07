import { Controller, Post, Body, UseGuards, Res, Query, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Response } from 'express';
import { ExportService } from './export.service';
import { ExportOptionsDto, ExportFormat } from './dto/export-options.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Export')
@Controller('export')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Post('report')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Export report in specified format' })
  @ApiResponse({ status: 200, description: 'Report exported successfully' })
  async exportReport(@Body() options: ExportOptionsDto, @Res() res: Response) {
    const result = await this.exportService.exportReport(options);

    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.data);
  }

  @Get('sales')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Export sales data' })
  @ApiResponse({ status: 200, description: 'Sales data exported successfully' })
  @ApiQuery({ name: 'format', enum: ExportFormat, required: true })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'branchId', required: false, type: String })
  async exportSales(
    @Query('format') format: ExportFormat,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('branchId') branchId: string,
    @Res() res: Response,
  ) {
    const result = await this.exportService.exportSalesData({
      format,
      startDate,
      endDate,
      branchId,
    });

    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.data);
  }

  @Get('inventory')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Export inventory data' })
  @ApiResponse({ status: 200, description: 'Inventory data exported successfully' })
  @ApiQuery({ name: 'format', enum: ExportFormat, required: true })
  @ApiQuery({ name: 'branchId', required: false, type: String })
  async exportInventory(
    @Query('format') format: ExportFormat,
    @Query('branchId') branchId: string,
    @Res() res: Response,
  ) {
    const result = await this.exportService.exportInventoryData({
      format,
      branchId,
    });

    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.data);
  }

  @Get('customers')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Export customer data' })
  @ApiResponse({ status: 200, description: 'Customer data exported successfully' })
  @ApiQuery({ name: 'format', enum: ExportFormat, required: true })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'branchId', required: false, type: String })
  async exportCustomers(
    @Query('format') format: ExportFormat,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('branchId') branchId: string,
    @Res() res: Response,
  ) {
    const result = await this.exportService.exportCustomerData({
      format,
      startDate,
      endDate,
      branchId,
    });

    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.data);
  }
}
