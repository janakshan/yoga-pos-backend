import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class StartShiftDto {
  @ApiProperty({
    example: '2024-01-15T09:05:00Z',
    description: 'Actual shift start time',
  })
  @IsDateString()
  actualStart: Date;

  @ApiPropertyOptional({
    example: 'Started 5 minutes late due to traffic',
    description: 'Notes about shift start',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class EndShiftDto {
  @ApiProperty({
    example: '2024-01-15T17:10:00Z',
    description: 'Actual shift end time',
  })
  @IsDateString()
  actualEnd: Date;

  @ApiPropertyOptional({
    example: 'Stayed late to help with closing',
    description: 'Notes about shift end',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
