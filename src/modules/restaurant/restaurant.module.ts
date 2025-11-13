import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsModule } from '../settings/settings.module';
import { BranchesModule } from '../branches/branches.module';
import { UsersModule } from '../users/users.module';

// Entities
import { Table } from './entities/table.entity';
import { FloorPlan } from './entities/floor-plan.entity';
import { TableSection } from './entities/table-section.entity';

// Services
import {
  TablesService,
  FloorPlanService,
  TableSectionService,
} from './services';

// Controllers
import {
  TablesController,
  FloorPlanController,
  TableSectionController,
} from './controllers';

/**
 * Restaurant Module
 *
 * This module handles all restaurant-specific functionality including:
 * - Table management (Phase 1 - Implemented)
 * - Floor plan management (Phase 1 - Implemented)
 * - Section management (Phase 1 - Implemented)
 * - Kitchen display system (Phase 2 - Planned)
 * - Menu management with modifiers (Phase 2 - Planned)
 * - Order management for dine-in, takeaway, and delivery (Phase 3 - Planned)
 * - Reservations (Phase 4 - Planned)
 * - Waiter app functionality (Phase 4 - Planned)
 *
 * Phase 1: Table Management
 * - Complete CRUD operations for tables, floor plans, and sections
 * - Table status management
 * - Server assignment to tables
 * - Table availability checking
 * - Real-time updates (requires WebSocket packages)
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Table, FloorPlan, TableSection]),
    SettingsModule,
    BranchesModule,
    UsersModule,
  ],
  controllers: [TablesController, FloorPlanController, TableSectionController],
  providers: [TablesService, FloorPlanService, TableSectionService],
  exports: [TablesService, FloorPlanService, TableSectionService],
})
export class RestaurantModule {}
