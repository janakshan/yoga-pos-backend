import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';
import { CreateAdjustmentDto } from './dto/create-adjustment.dto';
import { CreateWriteOffDto } from './dto/create-writeoff.dto';
import { TransferStockDto } from './dto/transfer-stock.dto';
import { QueryStockLevelDto } from './dto/query-stock-level.dto';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // Inventory Transactions

  @Get('transactions')
  async findAllTransactions(@Query() query: QueryTransactionDto) {
    return this.inventoryService.findAllTransactions(query);
  }

  @Get('transactions/:id')
  async findOneTransaction(@Param('id') id: string) {
    return this.inventoryService.findOneTransaction(id);
  }

  @Post('transactions')
  async createTransaction(
    @Body() createDto: CreateTransactionDto,
    @Request() req?: any,
  ) {
    const userId = req?.user?.id;
    return this.inventoryService.createTransaction(createDto, userId);
  }

  @Put('transactions/:id')
  async updateTransaction(
    @Param('id') id: string,
    @Body() updateDto: UpdateTransactionDto,
  ) {
    return this.inventoryService.updateTransaction(id, updateDto);
  }

  @Delete('transactions/:id')
  async deleteTransaction(@Param('id') id: string) {
    await this.inventoryService.deleteTransaction(id);
    return { message: 'Transaction deleted successfully' };
  }

  @Post('transactions/:id/cancel')
  async cancelTransaction(@Param('id') id: string) {
    return this.inventoryService.cancelTransaction(id);
  }

  // Stock Levels

  @Get('stock-levels')
  async findAllStockLevels(@Query() query: QueryStockLevelDto) {
    return this.inventoryService.findAllStockLevels(query);
  }

  @Get('stock-levels/low')
  async getLowStockProducts() {
    return this.inventoryService.getLowStockProducts();
  }

  @Get('stock-levels/out')
  async getOutOfStockProducts() {
    return this.inventoryService.getOutOfStockProducts();
  }

  @Get('stock-levels/:productId')
  async findStockLevelByProduct(
    @Param('productId') productId: string,
    @Query('locationId') locationId?: string,
  ) {
    return this.inventoryService.findStockLevelByProduct(productId, locationId);
  }

  // Inventory Adjustments

  @Post('adjustments')
  async createAdjustment(
    @Body() adjustmentDto: CreateAdjustmentDto,
    @Request() req?: any,
  ) {
    const userId = req?.user?.id;
    return this.inventoryService.createAdjustment(adjustmentDto, userId);
  }

  @Post('write-offs')
  async createWriteOff(
    @Body() writeOffDto: CreateWriteOffDto,
    @Request() req?: any,
  ) {
    const userId = req?.user?.id;
    return this.inventoryService.createWriteOff(writeOffDto, userId);
  }

  // Stock Transfers

  @Post('transfers')
  async transferStock(
    @Body() transferDto: TransferStockDto,
    @Request() req?: any,
  ) {
    const userId = req?.user?.id;
    return this.inventoryService.transferStock(transferDto, userId);
  }

  // Batch and Serial Tracking

  @Get('batches/:batchNumber/transactions')
  async getTransactionsByBatch(@Param('batchNumber') batchNumber: string) {
    return this.inventoryService.getTransactionsByBatch(batchNumber);
  }

  @Get('serials/:serialNumber/transactions')
  async getTransactionsBySerial(@Param('serialNumber') serialNumber: string) {
    return this.inventoryService.getTransactionsBySerial(serialNumber);
  }

  @Get('batches/expiring')
  async getExpiringBatches(@Query('daysThreshold') daysThreshold?: number) {
    return this.inventoryService.getExpiringBatches(daysThreshold ? parseInt(daysThreshold.toString()) : 30);
  }

  @Get('batches/expired')
  async getExpiredBatches() {
    return this.inventoryService.getExpiredBatches();
  }

  // Inventory Statistics

  @Get('stats')
  async getInventoryStats() {
    return this.inventoryService.getInventoryStats();
  }
}
