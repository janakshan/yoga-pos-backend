import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Role } from './entities/role.entity';
import { Permission } from '../permissions/entities/permission.entity';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionsRepository: Repository<Permission>,
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

  async assignPermissions(id: string, assignPermissionsDto: AssignPermissionsDto) {
    const role = await this.findOne(id);

    if (role.isSystem) {
      throw new BadRequestException('Cannot modify permissions for system roles');
    }

    // Validate permissions exist
    const permissions = await this.permissionsRepository.findBy({
      id: In(assignPermissionsDto.permissionIds),
    });

    if (permissions.length === 0) {
      throw new NotFoundException('No permissions found with the provided IDs');
    }

    if (permissions.length !== assignPermissionsDto.permissionIds.length) {
      throw new BadRequestException('Some permission IDs are invalid');
    }

    // Assign permissions to the role
    role.permissions = permissions;
    await this.rolesRepository.save(role);

    return {
      success: true,
      message: 'Permissions assigned successfully',
      roleId: role.id,
      permissionsCount: permissions.length,
    };
  }
}
