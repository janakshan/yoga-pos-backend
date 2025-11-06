import { IsString, IsEnum, IsNumber, IsOptional, IsDateString } from 'class-validator';
import { ExpenseCategory } from '../entities/expense.entity';

export class CreateExpenseDto {
  @IsString()
  description: string;

  @IsNumber()
  amount: number;

  @IsEnum(ExpenseCategory)
  category: ExpenseCategory;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsString()
  receiptUrl?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;
}
