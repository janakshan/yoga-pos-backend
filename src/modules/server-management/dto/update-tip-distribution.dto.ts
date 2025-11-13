import { PartialType } from '@nestjs/swagger';
import { CreateTipDistributionDto } from './create-tip-distribution.dto';

export class UpdateTipDistributionDto extends PartialType(CreateTipDistributionDto) {}
