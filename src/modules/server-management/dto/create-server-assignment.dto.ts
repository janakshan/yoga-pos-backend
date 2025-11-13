import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsEnum,
  IsDateString,
  IsOptional,
  IsInt,
  Min,
  IsString,
  IsObject,
} from 'class-validator';
import { AssignmentStatus } from '../entities/server-assignment.entity';

export class CreateServerAssignmentDto {
  @ApiProperty({ description: 'Server user ID' })
  @IsUUID()
  serverId: string;

  @ApiProperty({ description: 'Branch ID' })
  @IsUUID()
  branchId: string;

  @ApiPropertyOptional({ description: 'Section ID' })
  @IsOptional()
  @IsUUID()
  sectionId?: string;

  @ApiPropertyOptional({ enum: AssignmentStatus })
  @IsOptional()
  @IsEnum(AssignmentStatus)
  status?: AssignmentStatus;

  @ApiProperty({ description: 'Assignment date (YYYY-MM-DD)' })
  @IsDateString()
  assignmentDate: string;

  @ApiPropertyOptional({ description: 'Start time (HH:mm:ss)' })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiPropertyOptional({ description: 'End time (HH:mm:ss)' })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiPropertyOptional({ description: 'Maximum table limit for this server' })
  @IsOptional()
  @IsInt()
  @Min(1)
  tableLimit?: number;

  @ApiPropertyOptional({ description: 'Priority order for rotation' })
  @IsOptional()
  @IsInt()
  @Min(0)
  priorityOrder?: number;

  @ApiPropertyOptional({ description: 'Assignment settings' })
  @IsOptional()
  @IsObject()
  settings?: {
    autoAssign?: boolean;
    preferredTables?: string[];
    skillLevel?: 'junior' | 'intermediate' | 'senior' | 'expert';
    maxGuestCount?: number;
    canHandleVIP?: boolean;
  };

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
