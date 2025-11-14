import { PartialType } from '@nestjs/swagger';
import { CreateServerAssignmentDto } from './create-server-assignment.dto';

export class UpdateServerAssignmentDto extends PartialType(CreateServerAssignmentDto) {}
