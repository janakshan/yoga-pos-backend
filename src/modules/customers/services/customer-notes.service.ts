import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerNote } from '../entities/customer-note.entity';
import { Customer } from '../entities/customer.entity';
import { CreateNoteDto, UpdateNoteDto } from '../dto/note.dto';

@Injectable()
export class CustomerNotesService {
  constructor(
    @InjectRepository(CustomerNote)
    private readonly noteRepository: Repository<CustomerNote>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  async findByCustomer(customerId: string): Promise<CustomerNote[]> {
    // Verify customer exists
    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    return await this.noteRepository.find({
      where: { customerId },
      order: { isPinned: 'DESC', createdAt: 'DESC' },
    });
  }

  async create(customerId: string, createNoteDto: CreateNoteDto): Promise<CustomerNote> {
    // Verify customer exists
    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    const note = this.noteRepository.create({
      ...createNoteDto,
      customerId,
    });

    return await this.noteRepository.save(note);
  }

  async update(noteId: string, updateNoteDto: UpdateNoteDto): Promise<CustomerNote> {
    const note = await this.noteRepository.findOne({
      where: { id: noteId },
    });

    if (!note) {
      throw new NotFoundException(`Note with ID ${noteId} not found`);
    }

    Object.assign(note, updateNoteDto);
    return await this.noteRepository.save(note);
  }

  async remove(noteId: string): Promise<void> {
    const note = await this.noteRepository.findOne({
      where: { id: noteId },
    });

    if (!note) {
      throw new NotFoundException(`Note with ID ${noteId} not found`);
    }

    await this.noteRepository.remove(note);
  }
}
