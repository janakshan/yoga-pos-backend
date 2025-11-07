import { IsString, IsOptional, IsBoolean, IsObject, IsArray, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSegmentDto {
  @ApiProperty({ description: 'Segment name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Segment description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Segment criteria as JSON object' })
  @IsObject()
  @IsOptional()
  criteria?: any;

  @ApiPropertyOptional({ description: 'Is segment active', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateSegmentDto {
  @ApiPropertyOptional({ description: 'Segment name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Segment description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Segment criteria as JSON object' })
  @IsObject()
  @IsOptional()
  criteria?: any;

  @ApiPropertyOptional({ description: 'Is segment active' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class AssignCustomersDto {
  @ApiProperty({ description: 'Array of customer IDs to assign to segment' })
  @IsArray()
  @IsUUID('4', { each: true })
  customerIds: string[];
}
