import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsEnum,
  IsDateString,
  IsOptional,
  IsString,
  IsObject,
  IsArray,
} from 'class-validator';
import { ShiftStatus, ShiftType } from '../entities/server-shift.entity';

export class CreateServerShiftDto {
  @ApiProperty({ description: 'Server user ID' })
  @IsUUID()
  serverId: string;

  @ApiProperty({ description: 'Branch ID' })
  @IsUUID()
  branchId: string;

  @ApiProperty({ description: 'Shift date (YYYY-MM-DD)' })
  @IsDateString()
  shiftDate: string;

  @ApiProperty({ enum: ShiftType, description: 'Type of shift' })
  @IsEnum(ShiftType)
  shiftType: ShiftType;

  @ApiPropertyOptional({ enum: ShiftStatus })
  @IsOptional()
  @IsEnum(ShiftStatus)
  status?: ShiftStatus;

  @ApiProperty({ description: 'Scheduled start time' })
  @IsDateString()
  scheduledStart: string;

  @ApiProperty({ description: 'Scheduled end time' })
  @IsDateString()
  scheduledEnd: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Metadata' })
  @IsOptional()
  @IsObject()
  metadata?: any;
}
