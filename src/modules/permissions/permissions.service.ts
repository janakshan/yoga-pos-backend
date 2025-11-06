import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from './entities/permission.entity';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private permissionsRepository: Repository<Permission>,
  ) {}

  async create(data: Partial<Permission>) {
    const permission = this.permissionsRepository.create(data);
    return this.permissionsRepository.save(permission);
  }

  async findAll() {
    return this.permissionsRepository.find();
  }

  async findOne(id: string) {
    const permission = await this.permissionsRepository.findOne({ where: { id } });
    if (!permission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }
    return permission;
  }

  async findByRole(roleId: string) {
    return this.permissionsRepository
      .createQueryBuilder('permission')
      .leftJoin('permission.roles', 'role')
      .where('role.id = :roleId', { roleId })
      .getMany();
  }

  async update(id: string, data: Partial<Permission>) {
    await this.findOne(id);
    await this.permissionsRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string) {
    const permission = await this.findOne(id);
    await this.permissionsRepository.remove(permission);
  }
}
