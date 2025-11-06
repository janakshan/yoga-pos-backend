import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateWriteOffDto {
  @IsString()
  productId: string;

  @IsOptional()
  @IsString()
  productName?: string;

  @IsOptional()
  @IsString()
  productSku?: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  unitCost: number;

  @IsOptional()
  @IsString()
  locationId?: string;

  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
