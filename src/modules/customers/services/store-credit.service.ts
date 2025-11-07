import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoreCreditTransaction } from '../entities/store-credit-transaction.entity';
import { Customer } from '../entities/customer.entity';
import { AddStoreCreditDto, DeductStoreCreditDto, RedeemLoyaltyDto } from '../dto/store-credit.dto';

@Injectable()
export class StoreCreditService {
  constructor(
    @InjectRepository(StoreCreditTransaction)
    private readonly transactionRepository: Repository<StoreCreditTransaction>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  async getTransactions(customerId: string): Promise<StoreCreditTransaction[]> {
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

  async addStoreCredit(customerId: string, addCreditDto: AddStoreCreditDto): Promise<{
    transaction: StoreCreditTransaction;
    customer: Customer;
  }> {
    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    const balanceBefore = Number(customer.storeCreditBalance) || 0;
    const balanceAfter = balanceBefore + Number(addCreditDto.amount);

    // Create transaction record
    const transaction = new StoreCreditTransaction();
    transaction.customerId = customerId;
    transaction.type = 'add';
    transaction.amount = addCreditDto.amount;
    transaction.balanceBefore = balanceBefore;
    transaction.balanceAfter = balanceAfter;
    transaction.description = addCreditDto.description;
    transaction.referenceNumber = addCreditDto.referenceNumber;
    transaction.processedBy = addCreditDto.processedBy;

    if (addCreditDto.expiresAt) {
      transaction.expiresAt = new Date(addCreditDto.expiresAt);
    }

    const savedTransaction = await this.transactionRepository.save(transaction);

    // Update customer balance
    customer.storeCreditBalance = balanceAfter;
    const updatedCustomer = await this.customerRepository.save(customer);

    return { transaction: savedTransaction, customer: updatedCustomer };
  }

  async deductStoreCredit(customerId: string, deductCreditDto: DeductStoreCreditDto): Promise<{
    transaction: StoreCreditTransaction;
    customer: Customer;
  }> {
    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    const balanceBefore = Number(customer.storeCreditBalance) || 0;
    const balanceAfter = balanceBefore - Number(deductCreditDto.amount);

    if (balanceAfter < 0) {
      throw new BadRequestException(
        `Insufficient store credit. Current balance: ${balanceBefore}`
      );
    }

    // Create transaction record
    const transaction = this.transactionRepository.create({
      customerId,
      type: 'deduct',
      amount: deductCreditDto.amount,
      balanceBefore,
      balanceAfter,
      description: deductCreditDto.description,
      referenceNumber: deductCreditDto.referenceNumber,
      processedBy: deductCreditDto.processedBy,
    });

    await this.transactionRepository.save(transaction);

    // Update customer balance
    customer.storeCreditBalance = balanceAfter;
    await this.customerRepository.save(customer);

    return { transaction, customer };
  }

  async redeemLoyaltyPoints(customerId: string, redeemDto: RedeemLoyaltyDto): Promise<{
    transaction: StoreCreditTransaction;
    customer: Customer;
  }> {
    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    const currentPoints = customer.loyaltyInfo?.points || 0;

    if (currentPoints < redeemDto.points) {
      throw new BadRequestException(
        `Insufficient loyalty points. Current points: ${currentPoints}`
      );
    }

    const balanceBefore = Number(customer.storeCreditBalance) || 0;
    const balanceAfter = balanceBefore + Number(redeemDto.creditAmount);

    // Create transaction record
    const transaction = this.transactionRepository.create({
      customerId,
      type: 'loyalty_redeem',
      amount: redeemDto.creditAmount,
      balanceBefore,
      balanceAfter,
      description: redeemDto.description || `Redeemed ${redeemDto.points} loyalty points`,
      loyaltyPointsUsed: redeemDto.points,
      processedBy: redeemDto.processedBy,
    });

    await this.transactionRepository.save(transaction);

    // Update customer balances
    customer.storeCreditBalance = balanceAfter;
    customer.loyaltyInfo = {
      ...customer.loyaltyInfo,
      points: currentPoints - redeemDto.points,
    };
    await this.customerRepository.save(customer);

    return { transaction, customer };
  }
}
