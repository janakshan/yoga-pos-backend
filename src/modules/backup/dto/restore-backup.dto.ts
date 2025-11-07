import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsArray, IsString } from 'class-validator';

export class RestoreBackupDto {
  @ApiPropertyOptional({
    example: false,
    description: 'Force restore even if there are warnings',
  })
  @IsBoolean()
  @IsOptional()
  force?: boolean;

  @ApiPropertyOptional({
    example: ['users', 'products'],
    description: 'Specific tables to restore (if not provided, all tables will be restored)',
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tablesIncluded?: string[];

  @ApiPropertyOptional({
    example: false,
    description: 'Create a backup before restoring',
  })
  @IsBoolean()
  @IsOptional()
  createBackupBeforeRestore?: boolean;
}
