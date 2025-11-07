import { ApiProperty } from '@nestjs/swagger';
import { IsObject } from 'class-validator';

export class CustomFieldsDto {
  @ApiProperty({
    example: { warranty: '2 years', origin: 'USA', certifications: ['ISO', 'Eco-friendly'] },
    description: 'Custom fields to add/update',
  })
  @IsObject()
  fields: Record<string, any>;
}
