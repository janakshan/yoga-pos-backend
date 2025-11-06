import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
  ) {}

  async create(data: Partial<Role>) {
    const role = this.rolesRepository.create(data);
    return this.rolesRepository.save(role);
  }

  async findAll() {
    return this.rolesRepository.find();
  }

  async findOne(id: string) {
    const role = await this.rolesRepository.findOne({ where: { id } });
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
    return role;
  }

  async update(id: string, data: Partial<Role>) {
    await this.findOne(id);
    await this.rolesRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string) {
    const role = await this.findOne(id);
    if (role.isSystem) {
      throw new Error('Cannot delete system role');
    }
    await this.rolesRepository.remove(role);
  }
}
