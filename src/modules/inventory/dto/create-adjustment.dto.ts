import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateAdjustmentDto {
  @IsString()
  productId: string;

  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsString()
  locationId?: string;

  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
