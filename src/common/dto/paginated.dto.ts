import { ApiProperty } from '@nestjs/swagger';

export class PaginationMetaDto {
  @ApiProperty({ example: 1, description: 'Current page number' })
  page: number;

  @ApiProperty({ example: 20, description: 'Number of items per page' })
  limit: number;

  @ApiProperty({ example: 100, description: 'Total number of items' })
  totalItems: number;

  @ApiProperty({ example: 5, description: 'Total number of pages' })
  totalPages: number;

  @ApiProperty({ example: true, description: 'Whether there is a next page' })
  hasNextPage: boolean;

  @ApiProperty({ example: false, description: 'Whether there is a previous page' })
  hasPreviousPage: boolean;
}

export class PaginatedDto<T> {
  @ApiProperty({ isArray: true })
  data: T[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
