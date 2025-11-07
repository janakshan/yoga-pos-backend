import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreditTransaction } from '../entities/credit-transaction.entity';
import { Customer } from '../entities/customer.entity';
import { CreditChargeDto, CreditPaymentDto, UpdateCreditLimitDto } from '../dto/credit.dto';

@Injectable()
export class CreditManagementService {
  constructor(
    @InjectRepository(CreditTransaction)
    private readonly transactionRepository: Repository<CreditTransaction>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  async getTransactions(customerId: string): Promise<CreditTransaction[]> {
    // Verify customer exists
    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    return await this.transactionRepository.find({
      where: { customerId },
      order: { createdAt: 'DESC' },
    });
  }

  async chargeCredit(customerId: string, chargeDto: CreditChargeDto): Promise<{
    transaction: CreditTransaction;
    customer: Customer;
  }> {
    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    const balanceBefore = Number(customer.creditBalance) || 0;
    const balanceAfter = balanceBefore + Number(chargeDto.amount);

    // Check credit limit if set
    if (customer.creditLimit && balanceAfter > Number(customer.creditLimit)) {
      throw new BadRequestException(
        `Credit limit exceeded. Limit: ${customer.creditLimit}, New balance would be: ${balanceAfter}`
      );
    }

    // Create transaction record
    const transaction = this.transactionRepository.create({
      customerId,
      type: 'charge',
      amount: chargeDto.amount,
      balanceBefore,
      balanceAfter,
      description: chargeDto.description,
      referenceNumber: chargeDto.referenceNumber,
      processedBy: chargeDto.processedBy,
    });

    await this.transactionRepository.save(transaction);

    // Update customer balance
    customer.creditBalance = balanceAfter;
    await this.customerRepository.save(customer);

    return { transaction, customer };
  }

  async makePayment(customerId: string, paymentDto: CreditPaymentDto): Promise<{
    transaction: CreditTransaction;
    customer: Customer;
  }> {
    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    const balanceBefore = Number(customer.creditBalance) || 0;
    const balanceAfter = balanceBefore - Number(paymentDto.amount);

    if (balanceAfter < 0) {
      throw new BadRequestException(
        `Payment amount exceeds current balance. Current balance: ${balanceBefore}`
      );
    }

    // Create transaction record
    const transaction = this.transactionRepository.create({
      customerId,
      type: 'payment',
      amount: paymentDto.amount,
      balanceBefore,
      balanceAfter,
      description: paymentDto.description,
      referenceNumber: paymentDto.referenceNumber,
      processedBy: paymentDto.processedBy,
    });

    await this.transactionRepository.save(transaction);

    // Update customer balance
    customer.creditBalance = balanceAfter;
    await this.customerRepository.save(customer);

    return { transaction, customer };
  }

  async updateCreditLimit(customerId: string, updateLimitDto: UpdateCreditLimitDto): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    // Check if new limit is below current balance
    if (Number(customer.creditBalance) > updateLimitDto.creditLimit) {
      throw new BadRequestException(
        `Cannot set credit limit below current balance. Current balance: ${customer.creditBalance}`
      );
    }

    customer.creditLimit = updateLimitDto.creditLimit;
    return await this.customerRepository.save(customer);
  }
}
