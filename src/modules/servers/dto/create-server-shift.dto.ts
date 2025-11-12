import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsEnum,
  IsDateString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ShiftStatus } from '../entities/server-shift.entity';

class BreakTimeDto {
  @ApiProperty({ example: '2024-01-15T10:00:00Z', description: 'Break start time' })
  @IsDateString()
  start: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00Z', description: 'Break end time' })
  @IsDateString()
  end: Date;

  @ApiProperty({ example: 30, description: 'Break duration in minutes' })
  duration: number;
}

export class CreateServerShiftDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Server (User) ID',
  })
  @IsUUID()
  @IsNotEmpty()
  serverId: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Branch ID',
  })
  @IsUUID()
  @IsNotEmpty()
  branchId: string;

  @ApiProperty({
    example: '2024-01-15T09:00:00Z',
    description: 'Scheduled shift start time',
  })
  @IsDateString()
  @IsNotEmpty()
  scheduledStart: Date;

  @ApiProperty({
    example: '2024-01-15T17:00:00Z',
    description: 'Scheduled shift end time',
  })
  @IsDateString()
  @IsNotEmpty()
  scheduledEnd: Date;

  @ApiPropertyOptional({
    example: '2024-01-15T09:05:00Z',
    description: 'Actual shift start time',
  })
  @IsDateString()
  @IsOptional()
  actualStart?: Date;

  @ApiPropertyOptional({
    example: '2024-01-15T17:10:00Z',
    description: 'Actual shift end time',
  })
  @IsDateString()
  @IsOptional()
  actualEnd?: Date;

  @ApiPropertyOptional({
    enum: ShiftStatus,
    example: ShiftStatus.SCHEDULED,
    description: 'Shift status',
  })
  @IsEnum(ShiftStatus)
  @IsOptional()
  status?: ShiftStatus;

  @ApiPropertyOptional({
    example: 'Server requested early start',
    description: 'Shift notes',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    type: [BreakTimeDto],
    description: 'Break times during shift',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BreakTimeDto)
  @IsOptional()
  breakTimes?: BreakTimeDto[];
}
