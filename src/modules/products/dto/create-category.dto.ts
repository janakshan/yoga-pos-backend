import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, IsUUID } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Yoga Mats', description: 'Category name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: 'Premium yoga mats for all levels',
    description: 'Category description',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/images/category.jpg',
    description: 'Category image URL',
  })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({
    example: 'active',
    description: 'Category status',
    enum: ['active', 'inactive'],
  })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Sort order for display',
  })
  @IsInt()
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Parent category ID for subcategories',
  })
  @IsUUID()
  @IsOptional()
  parentId?: string;
}
