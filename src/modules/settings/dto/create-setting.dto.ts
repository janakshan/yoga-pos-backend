import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsObject,
} from 'class-validator';
import { SettingCategory, SettingDataType } from '../entities/setting.entity';

export class CreateSettingDto {
  @ApiProperty({
    example: 'business_name',
    description: 'Unique setting key',
  })
  @IsString()
  key: string;

  @ApiProperty({
    example: 'Yoga Studio POS',
    description: 'Setting value',
  })
  @IsString()
  value: string;

  @ApiProperty({
    enum: SettingDataType,
    example: SettingDataType.STRING,
    description: 'Data type of the setting value',
  })
  @IsEnum(SettingDataType)
  dataType: SettingDataType;

  @ApiProperty({
    enum: SettingCategory,
    example: SettingCategory.BUSINESS,
    description: 'Setting category',
  })
  @IsEnum(SettingCategory)
  category: SettingCategory;

  @ApiPropertyOptional({
    example: 'Business Name',
    description: 'Human-readable label',
  })
  @IsString()
  @IsOptional()
  label?: string;

  @ApiPropertyOptional({
    example: 'The name of your business as it appears on invoices',
    description: 'Setting description',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether setting is publicly accessible',
  })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether setting is read-only',
  })
  @IsBoolean()
  @IsOptional()
  isReadOnly?: boolean;

  @ApiPropertyOptional({
    example: { defaultValue: 'My Yoga Studio', min: 3, max: 100 },
    description: 'Additional metadata for the setting',
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
