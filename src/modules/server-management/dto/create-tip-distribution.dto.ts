import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsEnum,
  IsDateString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsString,
  IsObject,
  Min,
} from 'class-validator';
import {
  TipDistributionMethod,
  TipDistributionStatus,
} from '../entities/tip-distribution.entity';

export class CreateTipDistributionDto {
  @ApiProperty({ description: 'Branch ID' })
  @IsUUID()
  branchId: string;

  @ApiProperty({ description: 'Server user ID' })
  @IsUUID()
  serverId: string;

  @ApiPropertyOptional({ description: 'Shift ID' })
  @IsOptional()
  @IsUUID()
  shiftId?: string;

  @ApiPropertyOptional({ description: 'Order ID' })
  @IsOptional()
  @IsUUID()
  orderId?: string;

  @ApiProperty({ description: 'Distribution date (YYYY-MM-DD)' })
  @IsDateString()
  distributionDate: string;

  @ApiProperty({ enum: TipDistributionMethod })
  @IsEnum(TipDistributionMethod)
  distributionMethod: TipDistributionMethod;

  @ApiPropertyOptional({ enum: TipDistributionStatus })
  @IsOptional()
  @IsEnum(TipDistributionStatus)
  status?: TipDistributionStatus;

  @ApiProperty({ description: 'Original tip amount' })
  @IsNumber()
  @Min(0)
  originalTipAmount: number;

  @ApiPropertyOptional({ description: 'Calculation details' })
  @IsOptional()
  @IsObject()
  calculationDetails?: any;

  @ApiPropertyOptional({ description: 'Tip-out breakdown' })
  @IsOptional()
  @IsObject()
  tipOutBreakdown?: any;

  @ApiPropertyOptional({ description: 'Pool metadata' })
  @IsOptional()
  @IsObject()
  poolMetadata?: any;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
