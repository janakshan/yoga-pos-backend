import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Expense, ExpenseCategory } from './entities/expense.entity';
import { Branch } from '../branches/entities/branch.entity';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { QueryExpenseDto } from './dto/query-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,
    @InjectRepository(Branch)
    private branchRepository: Repository<Branch>,
  ) {}

  async findAll(query: QueryExpenseDto) {
    const queryBuilder = this.expenseRepository.createQueryBuilder('expense');

    if (query.search) {
      queryBuilder.andWhere(
        '(expense.description ILIKE :search OR expense.reference ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.startDate) {
      queryBuilder.andWhere('expense.date >= :startDate', { startDate: query.startDate });
    }

    if (query.endDate) {
      queryBuilder.andWhere('expense.date <= :endDate', { endDate: query.endDate });
    }

    if (query.category) {
      queryBuilder.andWhere('expense.category = :category', { category: query.category });
    }

    if (query.minAmount !== undefined) {
      queryBuilder.andWhere('expense.amount >= :minAmount', { minAmount: query.minAmount });
    }

    if (query.maxAmount !== undefined) {
      queryBuilder.andWhere('expense.amount <= :maxAmount', { maxAmount: query.maxAmount });
    }

    if (query.branchId) {
      queryBuilder.andWhere('expense.branchId = :branchId', { branchId: query.branchId });
    }

    if (query.status) {
      queryBuilder.andWhere('expense.status = :status', { status: query.status });
    }

    const sortBy = query.sortBy || 'date';
    const sortOrder = query.sortOrder || 'DESC';
    queryBuilder.orderBy(`expense.${sortBy}`, sortOrder);

    return await queryBuilder.getMany();
  }

  async findOne(id: string) {
    const expense = await this.expenseRepository.findOne({
      where: { id },
      relations: ['branch', 'createdByUser', 'approvedByUser'],
    });

    if (!expense) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }

    return expense;
  }

  async create(createDto: CreateExpenseDto, userId?: string) {
    let branchName: string | undefined;

    if (createDto.branchId) {
      const branch = await this.branchRepository.findOne({
        where: { id: createDto.branchId },
      });

      if (branch) {
        branchName = branch.name;
      }
    }

    const expense = this.expenseRepository.create({
      ...createDto,
      branchName,
      createdBy: userId,
      status: 'pending',
    });

    return await this.expenseRepository.save(expense);
  }

  async update(id: string, updateDto: UpdateExpenseDto) {
    const expense = await this.findOne(id);

    if (updateDto.branchId && updateDto.branchId !== expense.branchId) {
      const branch = await this.branchRepository.findOne({
        where: { id: updateDto.branchId },
      });

      if (branch) {
        expense.branchName = branch.name;
      }
    }

    Object.assign(expense, updateDto);

    return await this.expenseRepository.save(expense);
  }

  async delete(id: string) {
    const expense = await this.findOne(id);
    await this.expenseRepository.remove(expense);
  }

  async approve(id: string, userId?: string) {
    const expense = await this.findOne(id);

    expense.status = 'approved';
    expense.approvedBy = userId;
    expense.approvedAt = new Date();

    return await this.expenseRepository.save(expense);
  }

  async reject(id: string, userId?: string) {
    const expense = await this.findOne(id);

    expense.status = 'rejected';
    expense.approvedBy = userId;
    expense.approvedAt = new Date();

    return await this.expenseRepository.save(expense);
  }

  async markAsPaid(id: string, paymentMethod: string, paidDate?: Date) {
    const expense = await this.findOne(id);

    expense.status = 'paid';
    expense.paymentMethod = paymentMethod;
    expense.paidDate = paidDate || new Date();

    return await this.expenseRepository.save(expense);
  }

  async getStats(startDate?: string, endDate?: string) {
    const queryBuilder = this.expenseRepository.createQueryBuilder('expense');

    if (startDate) {
      queryBuilder.andWhere('expense.date >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('expense.date <= :endDate', { endDate });
    }

    const expenses = await queryBuilder.getMany();

    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const expenseCount = expenses.length;
    const averageExpense = expenseCount > 0 ? totalExpenses / expenseCount : 0;

    // Calculate by category
    const byCategory: Record<string, number> = {};
    expenses.forEach(expense => {
      const category = expense.category;
      byCategory[category] = (byCategory[category] || 0) + Number(expense.amount);
    });

    // Calculate by status
    const byStatus: Record<string, number> = {};
    expenses.forEach(expense => {
      const status = expense.status;
      byStatus[status] = (byStatus[status] || 0) + 1;
    });

    // Calculate by branch
    const byBranch: Record<string, number> = {};
    expenses.forEach(expense => {
      if (expense.branchName) {
        byBranch[expense.branchName] = (byBranch[expense.branchName] || 0) + Number(expense.amount);
      }
    });

    return {
      totalExpenses,
      expenseCount,
      averageExpense,
      byCategory,
      byStatus,
      byBranch,
    };
  }

  async getCategoryStats(startDate?: string, endDate?: string) {
    const queryBuilder = this.expenseRepository
      .createQueryBuilder('expense')
      .select('expense.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(expense.amount)', 'total')
      .addSelect('AVG(expense.amount)', 'average')
      .groupBy('expense.category');

    if (startDate) {
      queryBuilder.andWhere('expense.date >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('expense.date <= :endDate', { endDate });
    }

    const results = await queryBuilder.getRawMany();

    return results.map(r => ({
      category: r.category,
      count: parseInt(r.count),
      total: parseFloat(r.total || 0),
      average: parseFloat(r.average || 0),
    }));
  }

  async getExpensesByPeriod(
    startDate: string,
    endDate: string,
    groupBy: 'day' | 'week' | 'month' = 'day',
  ) {
    const queryBuilder = this.expenseRepository.createQueryBuilder('expense');

    queryBuilder
      .where('expense.date >= :startDate', { startDate })
      .andWhere('expense.date <= :endDate', { endDate });

    let dateFormat: string;
    switch (groupBy) {
      case 'month':
        dateFormat = 'YYYY-MM';
        break;
      case 'week':
        dateFormat = 'YYYY-WW';
        break;
      default:
        dateFormat = 'YYYY-MM-DD';
    }

    queryBuilder
      .select(`TO_CHAR(expense.date, '${dateFormat}')`, 'period')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(expense.amount)', 'total')
      .groupBy('period')
      .orderBy('period', 'ASC');

    const results = await queryBuilder.getRawMany();

    return results.map(r => ({
      period: r.period,
      count: parseInt(r.count),
      total: parseFloat(r.total || 0),
    }));
  }

  async getTopExpenses(limit: number = 10, startDate?: string, endDate?: string) {
    const queryBuilder = this.expenseRepository.createQueryBuilder('expense');

    if (startDate) {
      queryBuilder.andWhere('expense.date >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('expense.date <= :endDate', { endDate });
    }

    queryBuilder
      .orderBy('expense.amount', 'DESC')
      .limit(limit);

    return await queryBuilder.getMany();
  }

  async getExpensesByCategory(category: ExpenseCategory, startDate?: string, endDate?: string) {
    const queryBuilder = this.expenseRepository.createQueryBuilder('expense');

    queryBuilder.where('expense.category = :category', { category });

    if (startDate) {
      queryBuilder.andWhere('expense.date >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('expense.date <= :endDate', { endDate });
    }

    queryBuilder.orderBy('expense.date', 'DESC');

    return await queryBuilder.getMany();
  }

  async getPendingExpenses() {
    return await this.expenseRepository.find({
      where: { status: 'pending' },
      order: { date: 'DESC' },
    });
  }

  async getExpensesByBranch(branchId: string, startDate?: string, endDate?: string) {
    const queryBuilder = this.expenseRepository.createQueryBuilder('expense');

    queryBuilder.where('expense.branchId = :branchId', { branchId });

    if (startDate) {
      queryBuilder.andWhere('expense.date >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('expense.date <= :endDate', { endDate });
    }

    queryBuilder.orderBy('expense.date', 'DESC');

    return await queryBuilder.getMany();
  }
}
