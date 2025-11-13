import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsUUID,
  IsOptional,
  IsBoolean,
  Min,
  Max,
  IsArray,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

class IngredientSubstitutionDto {
  @ApiProperty({ description: 'Substitute product ID' })
  @IsUUID()
  productId: string;

  @ApiProperty({ description: 'Substitute product name' })
  @IsString()
  productName: string;

  @ApiProperty({ description: 'Quantity of substitute' })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({ description: 'Unit of measurement' })
  @IsString()
  unit: string;

  @ApiPropertyOptional({ description: 'Substitution notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateRecipeIngredientDto {
  @ApiProperty({ description: 'Ingredient product ID' })
  @IsUUID()
  ingredientId: string;

  @ApiProperty({ description: 'Quantity required', example: 2.5 })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({ description: 'Unit of measurement', example: 'kg' })
  @IsString()
  unit: string;

  @ApiPropertyOptional({ description: 'Ingredient preparation instructions' })
  @IsOptional()
  @IsString()
  preparation?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Display order', default: 0 })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'Ingredient group/section', example: 'Sauce' })
  @IsOptional()
  @IsString()
  ingredientGroup?: string;

  @ApiPropertyOptional({ description: 'Is this ingredient required?', default: true })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({ description: 'Is this ingredient optional?', default: false })
  @IsOptional()
  @IsBoolean()
  isOptional?: boolean;

  @ApiPropertyOptional({ description: 'Expected waste percentage (0-100)', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  wastePercentage?: number;

  @ApiPropertyOptional({ description: 'Available substitutions', type: [IngredientSubstitutionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IngredientSubstitutionDto)
  substitutions?: IngredientSubstitutionDto[];

  @ApiPropertyOptional({ description: 'Unit conversion factors' })
  @IsOptional()
  @IsObject()
  conversionFactors?: Record<string, number>;

  @ApiPropertyOptional({ description: 'Custom fields' })
  @IsOptional()
  @IsObject()
  customFields?: Record<string, any>;
}
