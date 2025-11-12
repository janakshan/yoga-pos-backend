import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { SectionStatus } from '../entities/server-section.entity';

export class FilterServerSectionDto {
  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Filter by branch ID',
  })
  @IsUUID()
  @IsOptional()
  branchId?: string;

  @ApiPropertyOptional({
    enum: SectionStatus,
    example: SectionStatus.ACTIVE,
    description: 'Filter by status',
  })
  @IsEnum(SectionStatus)
  @IsOptional()
  status?: SectionStatus;

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
