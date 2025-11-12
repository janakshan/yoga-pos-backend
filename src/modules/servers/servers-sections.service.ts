import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServerSection } from './entities/server-section.entity';
import { CreateServerSectionDto } from './dto/create-server-section.dto';
import { UpdateServerSectionDto } from './dto/update-server-section.dto';
import { FilterServerSectionDto } from './dto/filter-server-section.dto';

@Injectable()
export class ServersSectionsService {
  constructor(
    @InjectRepository(ServerSection)
    private readonly sectionRepository: Repository<ServerSection>,
  ) {}

  async create(
    createServerSectionDto: CreateServerSectionDto,
  ): Promise<ServerSection> {
    const section = this.sectionRepository.create(createServerSectionDto);
    return await this.sectionRepository.save(section);
  }

  async findAll(filters: FilterServerSectionDto) {
    const { page = 1, limit = 20, branchId, status } = filters;
    const queryBuilder = this.sectionRepository
      .createQueryBuilder('section')
      .leftJoinAndSelect('section.branch', 'branch');

    if (branchId) {
      queryBuilder.andWhere('section.branchId = :branchId', { branchId });
    }

    if (status) {
      queryBuilder.andWhere('section.status = :status', { status });
    }

    queryBuilder.skip((page - 1) * limit).take(limit);
    queryBuilder.orderBy('section.createdAt', 'DESC');

    const [data, totalItems] = await queryBuilder.getManyAndCount();

    return {
      data,
      meta: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  }

  async findOne(id: string): Promise<ServerSection> {
    const section = await this.sectionRepository.findOne({
      where: { id },
      relations: ['branch'],
    });

    if (!section) {
      throw new NotFoundException(`Server section with ID ${id} not found`);
    }

    return section;
  }

  async findByBranch(branchId: string): Promise<ServerSection[]> {
    return await this.sectionRepository.find({
      where: { branchId },
      relations: ['branch'],
      order: { name: 'ASC' },
    });
  }

  async update(
    id: string,
    updateServerSectionDto: UpdateServerSectionDto,
  ): Promise<ServerSection> {
    const section = await this.findOne(id);

    Object.assign(section, updateServerSectionDto);

    return await this.sectionRepository.save(section);
  }

  async remove(id: string): Promise<void> {
    const section = await this.findOne(id);
    await this.sectionRepository.remove(section);
  }

  async getStats(branchId?: string) {
    const queryBuilder = this.sectionRepository
      .createQueryBuilder('section')
      .select('COUNT(section.id)', 'totalSections')
      .addSelect('SUM(section.tableCount)', 'totalTables')
      .addSelect(
        "COUNT(CASE WHEN section.status = 'active' THEN 1 END)",
        'activeSections',
      );

    if (branchId) {
      queryBuilder.where('section.branchId = :branchId', { branchId });
    }

    const result = await queryBuilder.getRawOne();

    return {
      totalSections: parseInt(result.totalSections) || 0,
      totalTables: parseInt(result.totalTables) || 0,
      activeSections: parseInt(result.activeSections) || 0,
    };
  }
}
