import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsArray,
  IsEnum,
  IsOptional,
  IsObject,
  Min,
  ArrayMinSize,
} from 'class-validator';

export enum TipDistributionMethod {
  EQUAL = 'equal',
  WEIGHTED = 'weighted',
}

export class DistributeTipsDto {
  @ApiProperty({
    description: 'Total tip amount to distribute',
    example: 50.00,
  })
  @IsNumber()
  @Min(0)
  totalTipAmount: number;

  @ApiProperty({
    description: 'List of server IDs to distribute tips to',
    example: ['uuid-1', 'uuid-2', 'uuid-3'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  serverIds: string[];

  @ApiProperty({
    description: 'Method of distribution',
    enum: TipDistributionMethod,
    example: TipDistributionMethod.EQUAL,
  })
  @IsEnum(TipDistributionMethod)
  distributionMethod: TipDistributionMethod;

  @ApiPropertyOptional({
    description: 'Weights for each server (required if distributionMethod is weighted)',
    example: { 'uuid-1': 2, 'uuid-2': 1, 'uuid-3': 1 },
  })
  @IsOptional()
  @IsObject()
  weights?: Record<string, number>;
}

export class TipDistributionResultDto {
  @ApiProperty({
    description: 'Distribution of tips by server ID',
    example: { 'uuid-1': 16.67, 'uuid-2': 16.67, 'uuid-3': 16.66 },
  })
  distribution: Record<string, number>;

  @ApiProperty({
    description: 'Total amount distributed',
    example: 50.00,
  })
  totalDistributed: number;

  @ApiProperty({
    description: 'Number of servers',
    example: 3,
  })
  serverCount: number;
}
