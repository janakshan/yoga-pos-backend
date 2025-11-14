import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsDateString,
  IsEnum,
  IsOptional,
  IsArray,
} from 'class-validator';
import { TipDistributionMethod } from '../entities/tip-distribution.entity';

export class CalculateTipPoolDto {
  @ApiProperty({ description: 'Branch ID' })
  @IsUUID()
  branchId: string;

  @ApiProperty({ description: 'Start date (YYYY-MM-DD)' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'End date (YYYY-MM-DD)' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ enum: TipDistributionMethod })
  @IsEnum(TipDistributionMethod)
  method: TipDistributionMethod;

  @ApiPropertyOptional({ description: 'Server IDs to include in pool' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  serverIds?: string[];
}
