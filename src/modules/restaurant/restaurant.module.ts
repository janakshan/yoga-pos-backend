import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsModule } from '../settings/settings.module';
import { BranchesModule } from '../branches/branches.module';
import { UsersModule } from '../users/users.module';
import { CustomersModule } from '../customers/customers.module';
import { ProductsModule } from '../products/products.module';

// Entities
import { Table } from './entities/table.entity';
import { FloorPlan } from './entities/floor-plan.entity';
import { TableSection } from './entities/table-section.entity';
import { RestaurantOrder } from './entities/restaurant-order.entity';
import { OrderItem } from './entities/order-item.entity';

// Services
import {
  TablesService,
  FloorPlanService,
  TableSectionService,
  RestaurantOrdersService,
} from './services';

// Controllers
import {
  TablesController,
  FloorPlanController,
  TableSectionController,
  RestaurantOrdersController,
} from './controllers';

// Gateways
import { RestaurantOrdersGateway } from './gateways/restaurant-orders.gateway';

/**
 * Restaurant Module
 *
 * This module handles all restaurant-specific functionality including:
 * - Table management (Phase 1 - Implemented)
 * - Floor plan management (Phase 1 - Implemented)
 * - Section management (Phase 1 - Implemented)
 * - Order management for dine-in, takeaway, and delivery (Phase 3 - Implemented)
 * - Order status workflow and state machine (Phase 3 - Implemented)
 * - Kitchen station routing (Phase 3 - Implemented)
 * - Order modification and audit logging (Phase 3 - Implemented)
 * - Kitchen display system (Phase 2 - Planned)
 * - Menu management with modifiers (Phase 2 - Planned)
 * - Real-time order updates via WebSocket (Phase 3 - In Progress)
 * - Reservations (Phase 4 - Planned)
 * - Waiter app functionality (Phase 4 - Planned)
 *
 * Phase 1: Table Management ✅
 * - Complete CRUD operations for tables, floor plans, and sections
 * - Table status management
 * - Server assignment to tables
 * - Table availability checking
 *
 * Phase 3: Order Management ✅
 * - Order creation with table validation
 * - Order status workflow (pending → confirmed → preparing → ready → served → completed)
 * - Service type handling (dine-in, takeaway, delivery)
 * - Order modification (add/remove/update items)
 * - Kitchen station routing
 * - Order history queries with filtering
 * - Audit logging for all order changes
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Table,
      FloorPlan,
      TableSection,
      RestaurantOrder,
      OrderItem,
    ]),
    SettingsModule,
    BranchesModule,
    UsersModule,
    CustomersModule,
    ProductsModule,
  ],
  controllers: [
    TablesController,
    FloorPlanController,
    TableSectionController,
    RestaurantOrdersController,
  ],
  providers: [
    TablesService,
    FloorPlanService,
    TableSectionService,
    RestaurantOrdersService,
    RestaurantOrdersGateway,
  ],
  exports: [
    TablesService,
    FloorPlanService,
    TableSectionService,
    RestaurantOrdersService,
  ],
})
export class RestaurantModule {}
