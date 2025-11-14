import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsObject } from 'class-validator';

export class ClockOutDto {
  @ApiProperty({ description: 'Shift ID to clock out from' })
  @IsUUID()
  shiftId: string;

  @ApiPropertyOptional({ description: 'Clock-out metadata (location, device, etc.)' })
  @IsOptional()
  @IsObject()
  metadata?: {
    location?: { lat: number; lng: number };
    device?: string;
  };
}
