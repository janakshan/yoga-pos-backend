import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsUUID,
  ValidateNested,
  IsString,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

class SelectedModifierDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  modifierId: string;

  @ApiProperty({ example: 'Extra Cheese' })
  @IsString()
  name: string;

  @ApiProperty({ example: 2.5 })
  @IsNumber()
  priceAdjustment: number;
}

class ModifierGroupSelectionDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001' })
  @IsUUID()
  modifierGroupId: string;

  @ApiProperty({ type: [SelectedModifierDto] })
  @ValidateNested({ each: true })
  @Type(() => SelectedModifierDto)
  @IsArray()
  selectedModifiers: SelectedModifierDto[];
}

export class ValidateModifierSelectionDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174002' })
  @IsUUID()
  productId: string;

  @ApiProperty({ type: [ModifierGroupSelectionDto] })
  @ValidateNested({ each: true })
  @Type(() => ModifierGroupSelectionDto)
  @IsArray()
  selections: ModifierGroupSelectionDto[];
}
