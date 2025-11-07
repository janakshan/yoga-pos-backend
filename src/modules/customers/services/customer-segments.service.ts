import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CustomerSegment } from '../entities/customer-segment.entity';
import { Customer } from '../entities/customer.entity';
import { CreateSegmentDto, UpdateSegmentDto, AssignCustomersDto } from '../dto/segment.dto';

@Injectable()
export class CustomerSegmentsService {
  constructor(
    @InjectRepository(CustomerSegment)
    private readonly segmentRepository: Repository<CustomerSegment>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  async findAll(): Promise<CustomerSegment[]> {
    return await this.segmentRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<CustomerSegment> {
    const segment = await this.segmentRepository.findOne({
      where: { id },
      relations: ['customers'],
    });

    if (!segment) {
      throw new NotFoundException(`Segment with ID ${id} not found`);
    }

    return segment;
  }

  async create(createSegmentDto: CreateSegmentDto): Promise<CustomerSegment> {
    const segment = this.segmentRepository.create(createSegmentDto);
    return await this.segmentRepository.save(segment);
  }

  async update(id: string, updateSegmentDto: UpdateSegmentDto): Promise<CustomerSegment> {
    const segment = await this.findOne(id);
    Object.assign(segment, updateSegmentDto);
    return await this.segmentRepository.save(segment);
  }

  async remove(id: string): Promise<void> {
    const segment = await this.findOne(id);
    await this.segmentRepository.remove(segment);
  }

  async assignCustomers(id: string, assignCustomersDto: AssignCustomersDto): Promise<CustomerSegment> {
    const segment = await this.segmentRepository.findOne({
      where: { id },
      relations: ['customers'],
    });

    if (!segment) {
      throw new NotFoundException(`Segment with ID ${id} not found`);
    }

    // Find all customers by IDs
    const customers = await this.customerRepository.findBy({
      id: In(assignCustomersDto.customerIds),
    });

    if (customers.length !== assignCustomersDto.customerIds.length) {
      throw new BadRequestException('One or more customer IDs are invalid');
    }

    // Add new customers to existing ones (avoid duplicates)
    const existingIds = new Set(segment.customers?.map(c => c.id) || []);
    const newCustomers = customers.filter(c => !existingIds.has(c.id));

    segment.customers = [...(segment.customers || []), ...newCustomers];
    segment.customerCount = segment.customers.length;

    return await this.segmentRepository.save(segment);
  }

  async removeCustomers(id: string, assignCustomersDto: AssignCustomersDto): Promise<CustomerSegment> {
    const segment = await this.segmentRepository.findOne({
      where: { id },
      relations: ['customers'],
    });

    if (!segment) {
      throw new NotFoundException(`Segment with ID ${id} not found`);
    }

    // Remove specified customers
    const removeIds = new Set(assignCustomersDto.customerIds);
    segment.customers = segment.customers?.filter(c => !removeIds.has(c.id)) || [];
    segment.customerCount = segment.customers.length;

    return await this.segmentRepository.save(segment);
  }
}
