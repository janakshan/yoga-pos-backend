import { PartialType } from '@nestjs/swagger';
import { CreateServerTipDto } from './create-server-tip.dto';

export class UpdateServerTipDto extends PartialType(CreateServerTipDto) {}
