import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServerAssignment } from './entities/server-assignment.entity';
import { ServerShift } from './entities/server-shift.entity';
import { ServerPerformanceMetrics } from './entities/server-performance-metrics.entity';
import { TipDistribution } from './entities/tip-distribution.entity';
import { RestaurantOrder } from '../restaurant/entities/restaurant-order.entity';
import { ServerAssignmentsService } from './services/server-assignments.service';
import { ServerShiftsService } from './services/server-shifts.service';
import { ServerPerformanceService } from './services/server-performance.service';
import { TipDistributionService } from './services/tip-distribution.service';
import { ServerAssignmentsController } from './controllers/server-assignments.controller';
import { ServerShiftsController } from './controllers/server-shifts.controller';
import { ServerPerformanceController } from './controllers/server-performance.controller';
import { TipDistributionController } from './controllers/tip-distribution.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ServerAssignment,
      ServerShift,
      ServerPerformanceMetrics,
      TipDistribution,
      RestaurantOrder,
    ]),
  ],
  controllers: [
    ServerAssignmentsController,
    ServerShiftsController,
    ServerPerformanceController,
    TipDistributionController,
  ],
  providers: [
    ServerAssignmentsService,
    ServerShiftsService,
    ServerPerformanceService,
    TipDistributionService,
  ],
  exports: [
    ServerAssignmentsService,
    ServerShiftsService,
    ServerPerformanceService,
    TipDistributionService,
    TypeOrmModule,
  ],
})
export class ServerManagementModule {}
