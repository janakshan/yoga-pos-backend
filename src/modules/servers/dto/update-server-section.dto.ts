import { PartialType } from '@nestjs/swagger';
import { CreateServerSectionDto } from './create-server-section.dto';

export class UpdateServerSectionDto extends PartialType(
  CreateServerSectionDto,
) {}
