import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule } from '@nestjs/config';
import { SettingsModule } from '../settings/settings.module';
import { BranchesModule } from '../branches/branches.module';
import { UsersModule } from '../users/users.module';
import { CustomersModule } from '../customers/customers.module';
import { ProductsModule } from '../products/products.module';
import { ModifiersModule } from './modifiers/modifiers.module';
import { ModifierGroup } from './modifiers/entities/modifier-group.entity';
import { Product } from '../products/entities/product.entity';
import { Category } from '../products/entities/category.entity';

// Entities
import { Table } from './entities/table.entity';
import { FloorPlan } from './entities/floor-plan.entity';
import { TableSection } from './entities/table-section.entity';
import { RestaurantOrder } from './entities/restaurant-order.entity';
import { OrderItem } from './entities/order-item.entity';
import { TableQRCode } from './entities/table-qr-code.entity';
import { QROrderSession } from './entities/qr-order-session.entity';

// Services
import {
  TablesService,
  FloorPlanService,
  TableSectionService,
  RestaurantOrdersService,
} from './services';
import { QrCodeService } from './services/qr-code.service';
import { QrOrderingService } from './services/qr-ordering.service';
import { QrSessionCleanupService } from './services/qr-session-cleanup.service';

// Controllers
import {
  TablesController,
  FloorPlanController,
  TableSectionController,
  RestaurantOrdersController,
} from './controllers';
import { QrOrderingController } from './controllers/qr-ordering.controller';
import { PublicMenuController } from './controllers/public-menu.controller';

// Gateways
import { RestaurantOrdersGateway } from './gateways/restaurant-orders.gateway';
import { QrGuestGateway } from './gateways/qr-guest.gateway';

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
 * - Menu management with modifiers (Phase 2 - Implemented)
 * - Modifier pricing calculation (Phase 2 - Implemented)
 * - Menu availability rules engine (Phase 2 - Implemented)
 * - Kitchen display system (Phase 4 - Planned)
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
 * Phase 2: Menu Management & Modifiers ✅
 * - Complete CRUD operations for modifiers and modifier groups
 * - Product-to-modifier-group relationships
 * - Enhanced Product entity with restaurant-specific fields
 * - Modifier pricing calculation (fixed and percentage)
 * - Modifier validation (min/max selections, required/optional)
 * - Time-based and day-based availability rules
 * - Conditional display rules for modifiers
 * - Free modifier counts and charging logic
 * - Inventory tracking for modifiers
 * - Bulk operations for modifier availability and stock
 *
 * Phase 3: Order Management ✅
 * - Order creation with table validation
 * - Order status workflow (pending → confirmed → preparing → ready → served → completed)
 * - Service type handling (dine-in, takeaway, delivery)
 * - Order modification (add/remove/update items)
 * - Kitchen station routing
 * - Order history queries with filtering
 * - Audit logging for all order changes
 *
 * Phase 4: QR Code Ordering System ✅
 * - QR code generation for tables
 * - Deep link generation for menu access
 * - Guest session management
 * - Session token generation and validation
 * - Public menu API (no authentication required)
 * - Guest order creation
 * - Shopping cart management
 * - Call server functionality
 * - Request bill functionality
 * - Order tracking for guests
 * - Real-time updates via WebSocket
 * - Session timeout and cleanup
 * - QR analytics and reporting
 * - Rate limiting for public endpoints
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Table,
      FloorPlan,
      TableSection,
      RestaurantOrder,
      OrderItem,
      TableQRCode,
      QROrderSession,
      Product,
      Category,
      ModifierGroup,
    ]),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        name: 'qr-short',
        ttl: 1000, // 1 second
        limit: 10, // 10 requests per second
      },
      {
        name: 'qr-medium',
        ttl: 60000, // 1 minute
        limit: 60, // 60 requests per minute
      },
      {
        name: 'qr-long',
        ttl: 3600000, // 1 hour
        limit: 500, // 500 requests per hour
      },
    ]),
    ConfigModule,
    SettingsModule,
    BranchesModule,
    UsersModule,
    CustomersModule,
    ProductsModule,
    ModifiersModule,
  ],
  controllers: [
    TablesController,
    FloorPlanController,
    TableSectionController,
    RestaurantOrdersController,
    QrOrderingController,
    PublicMenuController,
  ],
  providers: [
    TablesService,
    FloorPlanService,
    TableSectionService,
    RestaurantOrdersService,
    QrCodeService,
    QrOrderingService,
    QrSessionCleanupService,
    RestaurantOrdersGateway,
    QrGuestGateway,
  ],
  exports: [
    TablesService,
    FloorPlanService,
    TableSectionService,
    RestaurantOrdersService,
    QrCodeService,
    QrOrderingService,
  ],
})
export class RestaurantModule {}
