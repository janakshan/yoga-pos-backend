import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, Between } from 'typeorm';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Invoice } from '../invoices/entities/invoice.entity';
import { Sale, PaymentStatus as SalePaymentStatus } from '../pos/entities/sale.entity';
import { InvoicesService } from '../invoices/invoices.service';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
    @InjectRepository(Invoice)
    private invoicesRepository: Repository<Invoice>,
    @InjectRepository(Sale)
    private salesRepository: Repository<Sale>,
    private invoicesService: InvoicesService,
  ) {}

  async create(
    createPaymentDto: CreatePaymentDto,
    processedById: string,
  ): Promise<Payment> {
    // Validate invoice or sale exists
    if (createPaymentDto.invoiceId) {
      const invoice = await this.invoicesRepository.findOne({
        where: { id: createPaymentDto.invoiceId },
      });

      if (!invoice) {
        throw new NotFoundException(
          `Invoice with ID ${createPaymentDto.invoiceId} not found`,
        );
      }

      // Validate payment amount doesn't exceed amount due
      if (createPaymentDto.amount > invoice.amountDue) {
        throw new BadRequestException(
          `Payment amount (${createPaymentDto.amount}) exceeds invoice amount due (${invoice.amountDue})`,
        );
      }
    }

    if (createPaymentDto.saleId) {
      const sale = await this.salesRepository.findOne({
        where: { id: createPaymentDto.saleId },
      });

      if (!sale) {
        throw new NotFoundException(
          `Sale with ID ${createPaymentDto.saleId} not found`,
        );
      }
    }

    // Generate payment number
    const paymentNumber = await this.generatePaymentNumber();

    // Create payment
    const payment = this.paymentsRepository.create({
      paymentNumber,
      invoiceId: createPaymentDto.invoiceId,
      saleId: createPaymentDto.saleId,
      customerId: createPaymentDto.customerId,
      amount: createPaymentDto.amount,
      paymentMethod: createPaymentDto.paymentMethod,
      paymentDate: createPaymentDto.paymentDate
        ? new Date(createPaymentDto.paymentDate)
        : new Date(),
      reference: createPaymentDto.reference,
      status: createPaymentDto.status || PaymentStatus.COMPLETED,
      processedById,
      notes: createPaymentDto.notes,
    });

    const savedPayment = await this.paymentsRepository.save(payment);

    // Update invoice payment status if applicable
    if (
      createPaymentDto.invoiceId &&
      savedPayment.status === PaymentStatus.COMPLETED
    ) {
      await this.invoicesService.updatePaymentStatus(
        createPaymentDto.invoiceId,
        createPaymentDto.amount,
      );
    }

    // Update sale payment status if applicable
    if (
      createPaymentDto.saleId &&
      savedPayment.status === PaymentStatus.COMPLETED
    ) {
      const sale = await this.salesRepository.findOne({
        where: { id: createPaymentDto.saleId },
      });

      if (sale) {
        // If payment amount equals or exceeds sale total, mark as paid
        if (createPaymentDto.amount >= sale.total) {
          sale.paymentStatus = SalePaymentStatus.PAID;
        } else {
          sale.paymentStatus = SalePaymentStatus.PARTIAL;
        }
        await this.salesRepository.save(sale);
      }
    }

    return this.findOne(savedPayment.id);
  }

  async findAll(query?: any): Promise<[Payment[], number]> {
    const {
      page = 1,
      limit = 20,
      search,
      invoiceId,
      saleId,
      customerId,
      paymentMethod,
      status,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    } = query || {};

    const where: any = {};

    if (search) {
      where.paymentNumber = ILike(`%${search}%`);
    }

    if (invoiceId) {
      where.invoiceId = invoiceId;
    }

    if (saleId) {
      where.saleId = saleId;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }

    if (status) {
      where.status = status;
    }

    if (startDate && endDate) {
      where.paymentDate = Between(new Date(startDate), new Date(endDate));
    }

    const order: any = {};
    if (sortBy) {
      order[sortBy] = sortOrder || 'DESC';
    } else {
      order.paymentDate = 'DESC';
    }

    return this.paymentsRepository.findAndCount({
      where,
      order,
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async findOne(id: string): Promise<Payment> {
    const payment = await this.paymentsRepository.findOne({
      where: { id },
      relations: ['invoice', 'sale', 'customer', 'processedBy'],
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return payment;
  }

  async update(id: string, updatePaymentDto: UpdatePaymentDto): Promise<Payment> {
    const payment = await this.findOne(id);

    // Don't allow updates to completed payments except status and notes
    if (payment.status === PaymentStatus.COMPLETED) {
      if (updatePaymentDto.status !== undefined) {
        payment.status = updatePaymentDto.status;
      }
      if (updatePaymentDto.notes !== undefined) {
        payment.notes = updatePaymentDto.notes;
      }
    } else {
      // Allow all updates for non-completed payments
      Object.assign(payment, updatePaymentDto);

      if (updatePaymentDto.paymentDate) {
        payment.paymentDate = new Date(updatePaymentDto.paymentDate);
      }
    }

    return this.paymentsRepository.save(payment);
  }

  async refund(id: string, notes?: string): Promise<Payment> {
    const payment = await this.findOne(id);

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new BadRequestException('Only completed payments can be refunded');
    }

    payment.status = PaymentStatus.REFUNDED;
    if (notes) {
      payment.notes = notes;
    }

    // Update invoice if applicable
    if (payment.invoiceId) {
      const invoice = await this.invoicesRepository.findOne({
        where: { id: payment.invoiceId },
      });

      if (invoice) {
        invoice.amountPaid -= payment.amount;
        invoice.amountDue = invoice.total - invoice.amountPaid;

        if (invoice.amountPaid <= 0) {
          invoice.status = 'issued' as any;
        } else {
          invoice.status = 'partially_paid' as any;
        }

        await this.invoicesRepository.save(invoice);
      }
    }

    // Update sale if applicable
    if (payment.saleId) {
      const sale = await this.salesRepository.findOne({
        where: { id: payment.saleId },
      });

      if (sale) {
        sale.paymentStatus = SalePaymentStatus.REFUNDED;
        await this.salesRepository.save(sale);
      }
    }

    return this.paymentsRepository.save(payment);
  }

  async remove(id: string): Promise<void> {
    const payment = await this.findOne(id);

    if (payment.status === PaymentStatus.COMPLETED) {
      throw new BadRequestException('Cannot delete a completed payment. Please refund instead.');
    }

    await this.paymentsRepository.remove(payment);
  }

  async getStats(startDate?: Date, endDate?: Date): Promise<any> {
    const where: any = {
      status: PaymentStatus.COMPLETED,
    };

    if (startDate && endDate) {
      where.paymentDate = Between(startDate, endDate);
    }

    const [totalPayments, totalAmount, cashPayments, cardPayments] =
      await Promise.all([
        this.paymentsRepository.count(where),
        this.paymentsRepository
          .createQueryBuilder('payment')
          .select('SUM(payment.amount)', 'total')
          .where(where)
          .getRawOne(),
        this.paymentsRepository.count({
          where: { ...where, paymentMethod: 'cash' },
        }),
        this.paymentsRepository.count({
          where: [
            { ...where, paymentMethod: 'card' },
            { ...where, paymentMethod: 'credit_card' },
            { ...where, paymentMethod: 'debit_card' },
          ],
        }),
      ]);

    return {
      totalPayments,
      totalAmount: parseFloat(totalAmount?.total || '0'),
      cashPayments,
      cardPayments,
    };
  }

  private async generatePaymentNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    const prefix = `PAY-${year}${month}${day}`;

    const lastPayment = await this.paymentsRepository.findOne({
      where: { paymentNumber: ILike(`${prefix}%`) },
      order: { createdAt: 'DESC' },
    });

    let sequence = 1;
    if (lastPayment) {
      const lastSequence = parseInt(
        lastPayment.paymentNumber.split('-').pop() || '0',
        10,
      );
      sequence = lastSequence + 1;
    }

    return `${prefix}-${String(sequence).padStart(4, '0')}`;
  }
}
