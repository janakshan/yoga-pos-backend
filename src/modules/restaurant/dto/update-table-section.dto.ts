import { PartialType } from '@nestjs/mapped-types';
import { CreateTableSectionDto } from './create-table-section.dto';

export class UpdateTableSectionDto extends PartialType(CreateTableSectionDto) {}
