import { IsString, IsNumber, IsOptional } from 'class-validator';

export class TransferStockDto {
  @IsString()
  productId: string;

  @IsString()
  fromLocationId: string;

  @IsString()
  toLocationId: string;

  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
