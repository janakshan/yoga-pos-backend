import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, In } from 'typeorm';
import { User } from './entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { BulkRolesUpdateDto } from './dto/bulk-roles.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
  ) {}

  async create(createUserDto: CreateUserDto | any): Promise<User> {
    const user = this.usersRepository.create(createUserDto) as any;
    return this.usersRepository.save(user);
  }

  async findAll(query?: any): Promise<[User[], number]> {
    const { page = 1, limit = 20, search, role, status, branchId, sortBy, sortOrder } = query || {};

    const where: any = {};

    if (search) {
      where.email = ILike(`%${search}%`);
    }

    if (status) {
      where.status = status;
    }

    if (branchId) {
      where.branchId = branchId;
    }

    const order: any = {};
    if (sortBy) {
      order[sortBy] = sortOrder || 'DESC';
    } else {
      order.createdAt = 'DESC';
    }

    return this.usersRepository.findAndCount({
      where,
      order,
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { username } });
  }

  async findByEmailOrUsername(email: string, username: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: [{ email }, { username }],
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    Object.assign(user, updateUserDto);
    return this.usersRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.usersRepository.update(id, { lastLogin: new Date() });
  }

  async updateRefreshToken(id: string, refreshToken: string | null): Promise<void> {
    await this.usersRepository.update(id, { refreshToken } as any);
  }

  async updatePin(id: string, pin: string | null): Promise<void> {
    await this.usersRepository.update(id, { pin, pinAttempts: 0, pinLockedUntil: null } as any);
  }

  async incrementPinAttempts(id: string): Promise<void> {
    const user = await this.findOne(id);
    const attempts = user.pinAttempts + 1;

    const updateData: any = { pinAttempts: attempts };

    // Lock PIN after 5 failed attempts for 15 minutes
    if (attempts >= 5) {
      const lockUntil = new Date();
      lockUntil.setMinutes(lockUntil.getMinutes() + 15);
      updateData.pinLockedUntil = lockUntil;
    }

    await this.usersRepository.update(id, updateData);
  }

  async resetPinAttempts(id: string): Promise<void> {
    await this.usersRepository.update(id, { pinAttempts: 0, pinLockedUntil: null } as any);
  }

  async getStats(): Promise<any> {
    const [total, active, inactive, suspended] = await Promise.all([
      this.usersRepository.count(),
      this.usersRepository.count({ where: { status: 'active' as any } }),
      this.usersRepository.count({ where: { status: 'inactive' as any } }),
      this.usersRepository.count({ where: { status: 'suspended' as any } }),
    ]);

    return {
      totalUsers: total,
      activeUsers: active,
      inactiveUsers: inactive,
      suspendedUsers: suspended,
    };
  }

  async bulkUpdateRoles(bulkRolesDto: BulkRolesUpdateDto): Promise<{
    updated: number;
    userIds: string[];
  }> {
    const { userIds, roleIds } = bulkRolesDto;

    // Validate users exist
    const users = await this.usersRepository.findBy({
      id: In(userIds),
    });

    if (users.length === 0) {
      throw new NotFoundException('No users found with the provided IDs');
    }

    // Validate roles exist
    const roles = await this.rolesRepository.findBy({
      id: In(roleIds),
    });

    if (roles.length === 0) {
      throw new BadRequestException('No roles found with the provided IDs');
    }

    if (roles.length !== roleIds.length) {
      throw new BadRequestException('Some role IDs are invalid');
    }

    // Update roles for all users
    const updatedUserIds: string[] = [];
    for (const user of users) {
      user.roles = roles;
      await this.usersRepository.save(user);
      updatedUserIds.push(user.id);
    }

    return {
      updated: updatedUserIds.length,
      userIds: updatedUserIds,
    };
  }
}
