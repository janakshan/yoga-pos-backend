import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsObject } from 'class-validator';

export class ClockInDto {
  @ApiProperty({ description: 'Shift ID to clock into' })
  @IsUUID()
  shiftId: string;

  @ApiPropertyOptional({ description: 'Clock-in metadata (location, device, etc.)' })
  @IsOptional()
  @IsObject()
  metadata?: {
    location?: { lat: number; lng: number };
    device?: string;
  };
}
