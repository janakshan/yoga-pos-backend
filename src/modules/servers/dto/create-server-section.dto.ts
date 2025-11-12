import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsArray,
  IsUUID,
  IsEnum,
  IsObject,
  Min,
} from 'class-validator';
import { SectionStatus } from '../entities/server-section.entity';

export class CreateServerSectionDto {
  @ApiProperty({ example: 'Section A', description: 'Section name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: 'Main dining area',
    description: 'Section description',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 10, description: 'Number of tables in section' })
  @IsInt()
  @Min(0)
  tableCount: number;

  @ApiPropertyOptional({
    example: ['T1', 'T2', 'T3'],
    description: 'Array of table identifiers',
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tables?: string[];

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Branch ID',
  })
  @IsUUID()
  @IsNotEmpty()
  branchId: string;

  @ApiPropertyOptional({
    enum: SectionStatus,
    example: SectionStatus.ACTIVE,
    description: 'Section status',
  })
  @IsEnum(SectionStatus)
  @IsOptional()
  status?: SectionStatus;

  @ApiPropertyOptional({
    example: { color: '#FF5733', floor: '1st', capacity: 40 },
    description: 'Additional metadata',
  })
  @IsObject()
  @IsOptional()
  metadata?: {
    color?: string;
    floor?: string;
    capacity?: number;
    [key: string]: any;
  };
}
