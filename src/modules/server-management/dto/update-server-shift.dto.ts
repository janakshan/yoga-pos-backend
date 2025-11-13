import { PartialType } from '@nestjs/swagger';
import { CreateServerShiftDto } from './create-server-shift.dto';

export class UpdateServerShiftDto extends PartialType(CreateServerShiftDto) {}
