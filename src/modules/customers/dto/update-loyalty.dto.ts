import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional } from 'class-validator';

export class UpdateLoyaltyPointsDto {
  @ApiProperty({ example: 100, description: 'Points to add or subtract' })
  @IsNumber()
  points: number;

  @ApiPropertyOptional({
    example: 'Points earned from purchase',
    description: 'Reason for point adjustment',
  })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class UpdateLoyaltyTierDto {
  @ApiProperty({ example: 'gold', description: 'New loyalty tier' })
  @IsString()
  tier: string;

  @ApiPropertyOptional({
    example: 'Upgraded due to spending threshold',
    description: 'Reason for tier change',
  })
  @IsString()
  @IsOptional()
  reason?: string;
}
