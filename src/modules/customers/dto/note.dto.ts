import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNoteDto {
  @ApiProperty({ description: 'Note content' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: 'Note category (general, complaint, preference, reminder)' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ description: 'Username or ID of note creator' })
  @IsString()
  @IsOptional()
  createdBy?: string;

  @ApiPropertyOptional({ description: 'Pin note to top', default: false })
  @IsBoolean()
  @IsOptional()
  isPinned?: boolean;
}

export class UpdateNoteDto {
  @ApiPropertyOptional({ description: 'Note content' })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({ description: 'Note category' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ description: 'Pin note to top' })
  @IsBoolean()
  @IsOptional()
  isPinned?: boolean;
}
