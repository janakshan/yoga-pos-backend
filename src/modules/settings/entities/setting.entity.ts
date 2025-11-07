import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum SettingCategory {
  GENERAL = 'general',
  BUSINESS = 'business',
  BRANDING = 'branding',
  HARDWARE = 'hardware',
  NOTIFICATION = 'notification',
  PAYMENT = 'payment',
  TAX = 'tax',
  SECURITY = 'security',
  INTEGRATION = 'integration',
}

export enum SettingDataType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  JSON = 'json',
  ARRAY = 'array',
}

@Entity('settings')
export class Setting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  key: string;

  @Column({ type: 'text' })
  value: string;

  @Column({
    type: 'enum',
    enum: SettingDataType,
    default: SettingDataType.STRING,
  })
  dataType: SettingDataType;

  @Column({
    type: 'enum',
    enum: SettingCategory,
    default: SettingCategory.GENERAL,
  })
  category: SettingCategory;

  @Column({ nullable: true })
  label: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: false })
  isPublic: boolean; // Whether the setting can be accessed without authentication

  @Column({ default: false })
  isReadOnly: boolean; // Whether the setting can be modified

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    defaultValue?: any;
    validationRules?: any;
    options?: any[]; // For select/dropdown type settings
    min?: number;
    max?: number;
    [key: string]: any;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
