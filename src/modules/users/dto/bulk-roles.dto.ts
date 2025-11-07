import { IsArray, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BulkRolesUpdateDto {
  @ApiProperty({ description: 'Array of user IDs to update', type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  userIds: string[];

  @ApiProperty({ description: 'Array of role IDs to assign', type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  roleIds: string[];
}
