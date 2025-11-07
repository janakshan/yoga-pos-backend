import { IsArray, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CompareBranchesDto {
  @ApiProperty({
    description: 'Array of branch IDs to compare (minimum 2, maximum 5)',
    example: [
      '123e4567-e89b-12d3-a456-426614174000',
      '123e4567-e89b-12d3-a456-426614174001',
    ],
  })
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(5)
  branchIds: string[];
}
