import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsEnum,
  IsDateString,
  IsBoolean,
  IsArray,
} from 'class-validator';
import { AssignmentStatus } from '../entities/server-assignment.entity';

export class CreateServerAssignmentDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Server (User) ID',
  })
  @IsUUID()
  @IsNotEmpty()
  serverId: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Section ID',
  })
  @IsUUID()
  @IsNotEmpty()
  sectionId: string;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Shift ID (optional)',
  })
  @IsUUID()
  @IsOptional()
  shiftId?: string;

  @ApiProperty({
    example: '2024-01-15T09:00:00Z',
    description: 'Assignment start time',
  })
  @IsDateString()
  @IsNotEmpty()
  startTime: Date;

  @ApiPropertyOptional({
    example: '2024-01-15T17:00:00Z',
    description: 'Assignment end time',
  })
  @IsDateString()
  @IsOptional()
  endTime?: Date;

  @ApiPropertyOptional({
    enum: AssignmentStatus,
    example: AssignmentStatus.ACTIVE,
    description: 'Assignment status',
  })
  @IsEnum(AssignmentStatus)
  @IsOptional()
  status?: AssignmentStatus;

  @ApiPropertyOptional({
    example: true,
    description: 'Is this server primary for the section',
  })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @ApiPropertyOptional({
    example: ['T1', 'T2', 'T3'],
    description: 'Specific tables assigned within the section',
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  assignedTables?: string[];

  @ApiPropertyOptional({
    example: 'Covering for Sarah',
    description: 'Assignment notes',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
