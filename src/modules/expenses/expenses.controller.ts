import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Request,
} from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { QueryExpenseDto } from './dto/query-expense.dto';
import { ExpenseCategory } from './entities/expense.entity';

@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  async findAll(@Query() query: QueryExpenseDto) {
    return this.expensesService.findAll(query);
  }

  @Get('stats')
  async getStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.expensesService.getStats(startDate, endDate);
  }

  @Get('stats/categories')
  async getCategoryStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.expensesService.getCategoryStats(startDate, endDate);
  }

  @Get('stats/period')
  async getExpensesByPeriod(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('groupBy') groupBy?: 'day' | 'week' | 'month',
  ) {
    return this.expensesService.getExpensesByPeriod(startDate, endDate, groupBy || 'day');
  }

  @Get('top')
  async getTopExpenses(
    @Query('limit') limit?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.expensesService.getTopExpenses(limit ? parseInt(limit.toString()) : 10, startDate, endDate);
  }

  @Get('pending')
  async getPendingExpenses() {
    return this.expensesService.getPendingExpenses();
  }

  @Get('category/:category')
  async getExpensesByCategory(
    @Param('category') category: ExpenseCategory,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.expensesService.getExpensesByCategory(category, startDate, endDate);
  }

  @Get('branch/:branchId')
  async getExpensesByBranch(
    @Param('branchId') branchId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.expensesService.getExpensesByBranch(branchId, startDate, endDate);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.expensesService.findOne(id);
  }

  @Post()
  async create(
    @Body() createDto: CreateExpenseDto,
    @Request() req?: any,
  ) {
    const userId = req?.user?.id;
    return this.expensesService.create(createDto, userId);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateExpenseDto,
  ) {
    return this.expensesService.update(id, updateDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.expensesService.delete(id);
    return { message: 'Expense deleted successfully' };
  }

  @Post(':id/approve')
  async approve(
    @Param('id') id: string,
    @Request() req?: any,
  ) {
    const userId = req?.user?.id;
    return this.expensesService.approve(id, userId);
  }

  @Post(':id/reject')
  async reject(
    @Param('id') id: string,
    @Request() req?: any,
  ) {
    const userId = req?.user?.id;
    return this.expensesService.reject(id, userId);
  }

  @Post(':id/mark-paid')
  async markAsPaid(
    @Param('id') id: string,
    @Body() body: { paymentMethod: string; paidDate?: string },
  ) {
    return this.expensesService.markAsPaid(
      id,
      body.paymentMethod,
      body.paidDate ? new Date(body.paidDate) : undefined,
    );
  }
}
