import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID, IsDateString } from 'class-validator';
import { ShiftStatus } from '../entities/server-shift.entity';

export class FilterServerShiftDto {
  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Filter by server ID',
  })
  @IsUUID()
  @IsOptional()
  serverId?: string;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Filter by branch ID',
  })
  @IsUUID()
  @IsOptional()
  branchId?: string;

  @ApiPropertyOptional({
    enum: ShiftStatus,
    example: ShiftStatus.STARTED,
    description: 'Filter by status',
  })
  @IsEnum(ShiftStatus)
  @IsOptional()
  status?: ShiftStatus;

  @ApiPropertyOptional({
    example: '2024-01-15T00:00:00Z',
    description: 'Filter shifts from this date',
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    example: '2024-01-31T23:59:59Z',
    description: 'Filter shifts until this date',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Page number',
    default: 1,
  })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({
    example: 20,
    description: 'Items per page',
    default: 20,
  })
  @IsOptional()
  limit?: number;
}
