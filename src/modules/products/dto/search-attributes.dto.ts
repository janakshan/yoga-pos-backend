import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsNumber, Min } from 'class-validator';

export class SearchAttributesDto {
  @ApiProperty({
    example: { Color: 'Blue', Material: 'TPE', Size: 'Large' },
    description: 'Attributes to search for (key-value pairs)',
  })
  @IsObject()
  attributes: Record<string, string>;

  @ApiPropertyOptional({
    example: 1,
    description: 'Page number',
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    example: 10,
    description: 'Items per page',
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  limit?: number;
}
