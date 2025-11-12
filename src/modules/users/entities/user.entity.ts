import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Role } from '../../roles/entities/role.entity';
import { Branch } from '../../branches/entities/branch.entity';

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column({ nullable: true })
  @Exclude()
  pin: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  avatar: string;

  @ManyToMany(() => Role, (role) => role.users, { eager: true })
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: Role[];

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @ManyToOne(() => Branch, { nullable: true })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({ name: 'branch_id', nullable: true })
  branchId: string;

  @Column({ type: 'jsonb', nullable: true })
  preferences: {
    theme?: string;
    language?: string;
    notifications?: {
      email?: boolean;
      sms?: boolean;
      push?: boolean;
    };
  };

  @Column({ type: 'jsonb', nullable: true })
  staffProfile: {
    employeeId?: string;
    position?: string;
    department?: string;
    employmentType?: string;
    hireDate?: Date;
    salary?: number;
    schedule?: any;
  };

  // Server-specific fields
  @Column({ type: 'boolean', default: false })
  isServer: boolean;

  @Column({ unique: true, nullable: true })
  serverCode: string; // Unique server identifier (e.g., S001, S002)

  @Column({ type: 'jsonb', nullable: true })
  serverProfile: {
    rating?: number; // Average server rating (0-5)
    totalOrders?: number; // Lifetime orders served
    totalSales?: number; // Lifetime sales amount
    totalTips?: number; // Lifetime tips earned
    averageTipPercentage?: number; // Average tip percentage
    preferredSections?: string[]; // Preferred section IDs
    certifications?: string[]; // Server certifications
    specialties?: string[]; // Server specialties (e.g., wine service, desserts)
  };

  @Column({ type: 'timestamp', nullable: true })
  lastLogin: Date;

  @Column({ nullable: true })
  @Exclude()
  refreshToken: string;

  @Column({ type: 'int', default: 0 })
  @Exclude()
  pinAttempts: number;

  @Column({ type: 'timestamp', nullable: true })
  @Exclude()
  pinLockedUntil: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
