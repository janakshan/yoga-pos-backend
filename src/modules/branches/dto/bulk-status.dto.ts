import { IsArray, IsBoolean, IsNotEmpty, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BulkStatusUpdateDto {
  @ApiProperty({
    description: 'Array of branch IDs to update',
    example: [
      '123e4567-e89b-12d3-a456-426614174000',
      '123e4567-e89b-12d3-a456-426614174001',
    ],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsNotEmpty()
  branchIds: string[];

  @ApiProperty({
    description: 'Active status to set for all branches',
    example: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  isActive: boolean;
}
