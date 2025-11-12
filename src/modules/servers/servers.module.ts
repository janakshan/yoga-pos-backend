import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { ServerSection } from './entities/server-section.entity';
import { ServerShift } from './entities/server-shift.entity';
import { ServerAssignment } from './entities/server-assignment.entity';
import { ServerTip } from './entities/server-tip.entity';
import { User } from '../users/entities/user.entity';
import { Invoice } from '../invoices/entities/invoice.entity';
import { Sale } from '../pos/entities/sale.entity';

// Services
import { ServersSectionsService } from './servers-sections.service';
import { ServersShiftsService } from './servers-shifts.service';
import { ServersAssignmentsService } from './servers-assignments.service';
import { ServersTipsService } from './servers-tips.service';
import { ServersPerformanceService } from './servers-performance.service';
import { ServersReportsService } from './servers-reports.service';

// Controller
import { ServersController } from './servers.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ServerSection,
      ServerShift,
      ServerAssignment,
      ServerTip,
      User,
      Invoice,
      Sale,
    ]),
  ],
  controllers: [ServersController],
  providers: [
    ServersSectionsService,
    ServersShiftsService,
    ServersAssignmentsService,
    ServersTipsService,
    ServersPerformanceService,
    ServersReportsService,
  ],
  exports: [
    ServersSectionsService,
    ServersShiftsService,
    ServersAssignmentsService,
    ServersTipsService,
    ServersPerformanceService,
    ServersReportsService,
  ],
})
export class ServersModule {}
