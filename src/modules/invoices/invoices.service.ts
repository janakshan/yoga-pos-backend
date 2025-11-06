import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, Between } from 'typeorm';
import { Invoice, InvoiceStatus } from './entities/invoice.entity';
import { InvoiceItem } from './entities/invoice-item.entity';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { Product } from '../products/entities/product.entity';
import { Sale } from '../pos/entities/sale.entity';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private invoicesRepository: Repository<Invoice>,
    @InjectRepository(InvoiceItem)
    private invoiceItemsRepository: Repository<InvoiceItem>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(Sale)
    private salesRepository: Repository<Sale>,
  ) {}

  async create(
    createInvoiceDto: CreateInvoiceDto,
    createdById: string,
  ): Promise<Invoice> {
    // If created from a sale, fetch sale items
    let items = createInvoiceDto.items;

    if (createInvoiceDto.saleId) {
      const sale = await this.salesRepository.findOne({
        where: { id: createInvoiceDto.saleId },
        relations: ['items', 'items.product'],
      });

      if (!sale) {
        throw new NotFoundException(
          `Sale with ID ${createInvoiceDto.saleId} not found`,
        );
      }

      // Convert sale items to invoice items
      items = sale.items.map((saleItem) => ({
        productId: saleItem.productId,
        description: saleItem.product.name,
        quantity: saleItem.quantity,
        unitPrice: saleItem.unitPrice,
        discount: saleItem.discount,
        tax: saleItem.tax,
      }));
    }

    // Validate products
    for (const item of items) {
      if (item.productId) {
        const product = await this.productsRepository.findOne({
          where: { id: item.productId },
        });

        if (!product) {
          throw new NotFoundException(
            `Product with ID ${item.productId} not found`,
          );
        }
      }
    }

    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber();

    // Calculate totals
    let subtotal = 0;
    let totalTax = 0;
    const invoiceItems: Partial<InvoiceItem>[] = [];

    for (const itemDto of items) {
      const itemSubtotal = itemDto.quantity * itemDto.unitPrice;
      const itemDiscount = itemDto.discount || 0;
      let itemTax = itemDto.tax || 0;

      // If product has tax rate and no tax provided, calculate it
      if (itemDto.productId && !itemDto.tax) {
        const product = await this.productsRepository.findOne({
          where: { id: itemDto.productId },
        });
        if (product) {
          itemTax = (itemSubtotal - itemDiscount) * (Number(product.taxRate) / 100);
        }
      }

      const itemTotal = itemSubtotal - itemDiscount + itemTax;

      subtotal += itemSubtotal;
      totalTax += itemTax;

      invoiceItems.push({
        productId: itemDto.productId,
        description: itemDto.description,
        quantity: itemDto.quantity,
        unitPrice: itemDto.unitPrice,
        discount: itemDiscount,
        tax: itemTax,
        total: itemTotal,
      });
    }

    const discount = createInvoiceDto.discount || 0;
    const total = subtotal - discount + totalTax;

    // Create invoice
    const invoice: any = {
      invoiceNumber,
      saleId: createInvoiceDto.saleId,
      customerId: createInvoiceDto.customerId,
      branchId: createInvoiceDto.branchId,
      createdById,
      subtotal,
      tax: totalTax,
      discount,
      total,
      amountPaid: 0,
      amountDue: total,
      status: createInvoiceDto.status || InvoiceStatus.DRAFT,
      issuedDate:
        createInvoiceDto.status === InvoiceStatus.ISSUED ? new Date() : null,
      dueDate: createInvoiceDto.dueDate
        ? new Date(createInvoiceDto.dueDate)
        : null,
      notes: createInvoiceDto.notes,
      terms: createInvoiceDto.terms,
    };

    const savedInvoice = await this.invoicesRepository.save(invoice);

    // Create invoice items
    for (const itemData of invoiceItems) {
      const invoiceItem = this.invoiceItemsRepository.create({
        ...itemData,
        invoiceId: savedInvoice.id,
      });
      await this.invoiceItemsRepository.save(invoiceItem);
    }

    return this.findOne(savedInvoice.id);
  }

  async findAll(query?: any): Promise<[Invoice[], number]> {
    const {
      page = 1,
      limit = 20,
      search,
      customerId,
      branchId,
      status,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    } = query || {};

    const where: any = {};

    if (search) {
      where.invoiceNumber = ILike(`%${search}%`);
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (branchId) {
      where.branchId = branchId;
    }

    if (status) {
      where.status = status;
    }

    if (startDate && endDate) {
      where.createdAt = Between(new Date(startDate), new Date(endDate));
    }

    const order: any = {};
    if (sortBy) {
      order[sortBy] = sortOrder || 'DESC';
    } else {
      order.createdAt = 'DESC';
    }

    return this.invoicesRepository.findAndCount({
      where,
      order,
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async findOne(id: string): Promise<Invoice> {
    const invoice = await this.invoicesRepository.findOne({
      where: { id },
      relations: [
        'items',
        'items.product',
        'customer',
        'branch',
        'createdBy',
        'sale',
      ],
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    return invoice;
  }

  async update(id: string, updateInvoiceDto: UpdateInvoiceDto): Promise<Invoice> {
    const invoice = await this.findOne(id);

    // Don't allow updates to paid invoices
    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Cannot update a paid invoice');
    }

    // Update basic fields
    if (updateInvoiceDto.status !== undefined) {
      invoice.status = updateInvoiceDto.status;

      if (
        updateInvoiceDto.status === InvoiceStatus.ISSUED &&
        !invoice.issuedDate
      ) {
        invoice.issuedDate = new Date();
      }
    }

    if (updateInvoiceDto.dueDate !== undefined) {
      invoice.dueDate = new Date(updateInvoiceDto.dueDate);
    }

    if (updateInvoiceDto.notes !== undefined) {
      invoice.notes = updateInvoiceDto.notes;
    }

    if (updateInvoiceDto.terms !== undefined) {
      invoice.terms = updateInvoiceDto.terms;
    }

    return this.invoicesRepository.save(invoice);
  }

  async updatePaymentStatus(
    id: string,
    amountPaid: number,
  ): Promise<Invoice> {
    const invoice = await this.findOne(id);

    invoice.amountPaid += amountPaid;
    invoice.amountDue = invoice.total - invoice.amountPaid;

    if (invoice.amountDue <= 0) {
      invoice.status = InvoiceStatus.PAID;
      invoice.amountDue = 0;
    } else if (invoice.amountPaid > 0) {
      invoice.status = InvoiceStatus.PARTIALLY_PAID;
    }

    return this.invoicesRepository.save(invoice);
  }

  async remove(id: string): Promise<void> {
    const invoice = await this.findOne(id);

    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Cannot delete a paid invoice');
    }

    await this.invoicesRepository.remove(invoice);
  }

  async getStats(branchId?: string): Promise<any> {
    const where: any = {};

    if (branchId) {
      where.branchId = branchId;
    }

    const [
      totalInvoices,
      draftInvoices,
      issuedInvoices,
      paidInvoices,
      overdueInvoices,
      totalAmount,
      paidAmount,
    ] = await Promise.all([
      this.invoicesRepository.count(where),
      this.invoicesRepository.count({
        where: { ...where, status: InvoiceStatus.DRAFT },
      }),
      this.invoicesRepository.count({
        where: { ...where, status: InvoiceStatus.ISSUED },
      }),
      this.invoicesRepository.count({
        where: { ...where, status: InvoiceStatus.PAID },
      }),
      this.invoicesRepository.count({
        where: { ...where, status: InvoiceStatus.OVERDUE },
      }),
      this.invoicesRepository
        .createQueryBuilder('invoice')
        .select('SUM(invoice.total)', 'total')
        .where(where)
        .getRawOne(),
      this.invoicesRepository
        .createQueryBuilder('invoice')
        .select('SUM(invoice.amountPaid)', 'paid')
        .where(where)
        .getRawOne(),
    ]);

    return {
      totalInvoices,
      draftInvoices,
      issuedInvoices,
      paidInvoices,
      overdueInvoices,
      totalAmount: parseFloat(totalAmount?.total || '0'),
      paidAmount: parseFloat(paidAmount?.paid || '0'),
      pendingAmount:
        parseFloat(totalAmount?.total || '0') -
        parseFloat(paidAmount?.paid || '0'),
    };
  }

  private async generateInvoiceNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');

    const prefix = `INV-${year}${month}`;

    const lastInvoice = await this.invoicesRepository.findOne({
      where: { invoiceNumber: ILike(`${prefix}%`) },
      order: { createdAt: 'DESC' },
    });

    let sequence = 1;
    if (lastInvoice) {
      const lastSequence = parseInt(
        lastInvoice.invoiceNumber.split('-').pop() || '0',
        10,
      );
      sequence = lastSequence + 1;
    }

    return `${prefix}-${String(sequence).padStart(4, '0')}`;
  }
}
