import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdateSettingValueDto {
  @ApiProperty({
    example: 'New Yoga Studio',
    description: 'New value for the setting',
  })
  @IsString()
  value: string;
}
