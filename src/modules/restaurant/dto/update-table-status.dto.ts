import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { TableStatus } from '../common/restaurant.constants';

export class UpdateTableStatusDto {
  @ApiProperty({
    example: TableStatus.OCCUPIED,
    enum: TableStatus,
    description: 'New table status',
  })
  @IsEnum(TableStatus)
  status: TableStatus;
}
