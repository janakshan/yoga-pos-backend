import { IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CloneSettingsDto {
  @ApiProperty({
    description: 'ID of the source branch to clone settings from',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  sourceBranchId: string;

  @ApiProperty({
    description: 'ID of the target branch to clone settings to',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  @IsNotEmpty()
  targetBranchId: string;
}
