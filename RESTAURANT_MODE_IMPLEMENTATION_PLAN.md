# Multi-Purpose POS System - Backend Implementation Plan
## Restaurant Mode Feature Addition

**Version:** 1.0
**Date:** 2025-11-12
**Status:** Planning Phase
**Target:** Backend API Development

---

## Executive Summary

This document outlines the comprehensive **backend implementation plan** to transform the current yoga/wellness POS backend into a **multi-purpose POS platform** that supports both retail operations and restaurant operations through a configurable business type system.

### Goal
Develop backend REST APIs, database schema, TypeORM entities, business logic, and database migrations to enable restaurant mode functionality. This includes endpoints for table management, kitchen operations, order management, menu modifiers, QR ordering, recipes, and server management while maintaining all existing retail functionality.

### Technology Stack
- **Framework:** NestJS 10.3
- **Database:** PostgreSQL with TypeORM 0.3.19
- **Authentication:** JWT with Passport
- **API Documentation:** Swagger/OpenAPI
- **Language:** TypeScript 5.3

### Key Benefits
- Single backend codebase serving multiple business types
- Modular feature activation through database-driven settings
- No impact on existing retail API functionality
- RESTful API design with OpenAPI/Swagger documentation
- Type-safe database entities with TypeORM
- Backward-compatible database migrations
- Guard-based feature access control
- Scalable architecture for future business types

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Architecture Design](#2-architecture-design)
3. [Data Model Extensions](#3-data-model-extensions)
4. [Backend Feature Specifications](#4-feature-specifications)
5. [Implementation Phases](#5-implementation-phases)
6. [Technical Implementation Details](#6-technical-implementation-details)
7. [API Endpoints Specification](#7-api-response-formats--dtos)
8. [API Endpoints Specification](#8-api-endpoints-specification)
9. [Testing Strategy](#9-testing-strategy)
10. [Migration & Deployment](#10-migration--rollout)

---

## 1. Current State Analysis

### 1.1 Existing Features (Retail Mode)
- ✅ Advanced POS checkout with split payments
- ✅ Product management with categories
- ✅ Inventory tracking and management
- ✅ Customer management with loyalty
- ✅ Multi-branch support
- ✅ Financial reporting
- ✅ User roles & permissions
- ✅ Hardware integration (printers, scanners)
- ✅ Multi-currency support
- ✅ Backup & recovery

### 1.2 Current Backend Architecture

**Framework & Core:**
- **Framework:** NestJS 10.3 (Node.js framework)
- **Language:** TypeScript 5.3
- **Database:** PostgreSQL
- **ORM:** TypeORM 0.3.19
- **Authentication:** JWT with Passport strategies
- **API Docs:** Swagger/OpenAPI
- **Validation:** class-validator & class-transformer

**Module Structure:**
```
src/
├── modules/
│   ├── auth/              # Authentication & authorization
│   ├── users/             # User management
│   ├── roles/             # Role-based access control
│   ├── permissions/       # Permissions management
│   ├── branches/          # Multi-branch support
│   ├── products/          # Product catalog
│   ├── customers/         # Customer management
│   ├── suppliers/         # Supplier management
│   ├── inventory/         # Stock management
│   ├── pos/               # Point of sale operations
│   ├── invoices/          # Invoice management
│   ├── payments/          # Payment processing
│   ├── expenses/          # Expense tracking
│   ├── purchase-orders/   # Purchase order management
│   ├── settings/          # System settings
│   ├── notifications/     # Notification system
│   ├── backup/            # Backup management
│   └── export/            # Data export
├── database/
│   ├── migrations/        # Database migrations
│   └── seeds/             # Seed data
├── common/
│   ├── decorators/        # Custom decorators
│   ├── filters/           # Exception filters
│   ├── guards/            # Auth guards
│   ├── interceptors/      # Response interceptors
│   └── dto/               # Common DTOs
└── config/                # Configuration files
```

### 1.3 Existing Database Entities

**Core Tables:**
- `users` - System users with authentication
- `roles` - User roles
- `permissions` - Granular permissions
- `branches` - Store locations
- `products` - Product catalog
- `product_categories` - Categories with subcategories
- `customers` - Customer information with loyalty
- `suppliers` - Supplier information
- `stock_levels` - Inventory per location
- `inventory_transactions` - Stock movements
- `sales` - Sales transactions
- `sale_items` - Sale line items
- `invoices` - Customer invoices
- `invoice_items` - Invoice line items
- `payments` - Payment records
- `expenses` - Business expenses
- `purchase_orders` - Orders to suppliers
- `purchase_order_items` - PO line items

**Current Enums:**
- `user_status_enum`
- `invoice_status_enum`
- `payment_status_enum`
- `sale_type_enum`
- `payment_method_enum`
- `transaction_type_enum`
- `transaction_status_enum`
- `expense_category_enum`
- `po_status_enum`

### 1.4 Settings Module
Located at: `src/modules/settings/`

Current settings entity stores:
- Currency & localization
- Branding configuration
- Business information
- Hardware configuration
- Receipt settings
- Backup settings
- Notification preferences

---

## 2. Architecture Design

### 2.1 Business Type System - Backend

**Current Settings Architecture:**
The existing system uses a key-value based settings table. We'll add new setting keys for restaurant mode:

```typescript
// New setting keys to be added:
// - business.type: 'retail' | 'restaurant'
// - restaurant.enabled: boolean
// - restaurant.features.tableManagement: boolean
// - restaurant.features.kitchenDisplay: boolean
// - restaurant.features.orderManagement: boolean
// - restaurant.features.modifiers: boolean
// - restaurant.features.tipping: boolean
// - restaurant.features.courseSequencing: boolean
// - restaurant.features.serverManagement: boolean
// - restaurant.features.recipes: boolean
// - restaurant.features.qrOrdering: boolean
// - restaurant.config: JSON (full restaurant configuration)
```

**Settings Service Extension:**
```typescript
// src/modules/settings/settings.service.ts
export class SettingsService {
  // New methods to add:

  async getBusinessType(): Promise<'retail' | 'restaurant'> {
    const setting = await this.findByKey('business.type');
    return setting?.value || 'retail';
  }

  async setBusinessType(type: 'retail' | 'restaurant'): Promise<Setting> {
    return this.updateByKey('business.type', type);
  }

  async isRestaurantModeEnabled(): Promise<boolean> {
    const businessType = await this.getBusinessType();
    const enabled = await this.findByKey('restaurant.enabled');
    return businessType === 'restaurant' && enabled?.value === 'true';
  }

  async getRestaurantFeatures(): Promise<Record<string, boolean>> {
    const features = await this.findByKeyPattern('restaurant.features.%');
    return features.reduce((acc, setting) => {
      const featureName = setting.key.split('.').pop();
      acc[featureName] = setting.value === 'true';
      return acc;
    }, {});
  }

  async getRestaurantConfig(): Promise<any> {
    const setting = await this.findByKey('restaurant.config');
    return setting ? JSON.parse(setting.value) : null;
  }
}
```

**Settings DTOs:**
```typescript
// src/modules/settings/dto/restaurant-settings.dto.ts
export class UpdateBusinessTypeDto {
  @IsEnum(['retail', 'restaurant'])
  businessType: 'retail' | 'restaurant';
}

export class RestaurantFeatureDto {
  @IsString()
  feature: string;

  @IsBoolean()
  enabled: boolean;
}

export class RestaurantConfigDto {
  @IsOptional()
  @IsObject()
  tables?: {
    enabled: boolean;
    autoAssignServer: boolean;
    requireTableForDineIn: boolean;
  };

  @IsOptional()
  @IsObject()
  orderManagement?: {
    enableKDS: boolean;
    enableCourseSequencing: boolean;
    stations: Array<{ id: string; name: string; color: string }>;
    defaultPrepTime: number;
  };

  @IsOptional()
  @IsObject()
  tipping?: {
    enabled: boolean;
    defaultTipPercentages: number[];
    allowCustomTip: boolean;
  };

  @IsOptional()
  @IsObject()
  qrOrdering?: {
    enabled: boolean;
    requireGuestInfo: boolean;
    sessionTimeout: number;
  };
}
```

### 2.2 NestJS Module Structure

```
src/modules/
├── restaurant/              # NEW - Restaurant features module
│   ├── tables/
│   │   ├── tables.module.ts
│   │   ├── tables.controller.ts
│   │   ├── tables.service.ts
│   │   ├── entities/
│   │   │   ├── table.entity.ts
│   │   │   ├── floor-plan.entity.ts
│   │   │   └── section.entity.ts
│   │   └── dto/
│   │       ├── create-table.dto.ts
│   │       ├── update-table.dto.ts
│   │       └── table-status.dto.ts
│   ├── kitchen/
│   │   ├── kitchen.module.ts
│   │   ├── kitchen.controller.ts
│   │   ├── kitchen.service.ts
│   │   ├── entities/
│   │   │   └── kitchen-station.entity.ts
│   │   └── dto/
│   ├── orders/
│   │   ├── restaurant-orders.module.ts
│   │   ├── restaurant-orders.controller.ts
│   │   ├── restaurant-orders.service.ts
│   │   ├── entities/
│   │   │   ├── restaurant-order.entity.ts
│   │   │   └── order-item.entity.ts
│   │   └── dto/
│   ├── modifiers/
│   │   ├── modifiers.module.ts
│   │   ├── modifiers.controller.ts
│   │   ├── modifiers.service.ts
│   │   ├── entities/
│   │   │   ├── modifier.entity.ts
│   │   │   └── modifier-group.entity.ts
│   │   └── dto/
│   ├── recipes/
│   │   ├── recipes.module.ts
│   │   ├── recipes.controller.ts
│   │   ├── recipes.service.ts
│   │   ├── entities/
│   │   │   ├── recipe.entity.ts
│   │   │   └── recipe-ingredient.entity.ts
│   │   └── dto/
│   ├── servers/
│   │   ├── servers.module.ts
│   │   ├── servers.controller.ts
│   │   ├── servers.service.ts
│   │   ├── entities/
│   │   │   └── server-assignment.entity.ts
│   │   └── dto/
│   └── qr-ordering/
│       ├── qr-ordering.module.ts
│       ├── qr-ordering.controller.ts
│       ├── qr-ordering.service.ts
│       ├── entities/
│       │   ├── qr-session.entity.ts
│       │   └── table-qr-code.entity.ts
│       └── dto/
├── products/                # ENHANCED (add restaurant fields)
├── pos/                     # ENHANCED (restaurant POS logic)
└── settings/                # ENHANCED (business type settings)
```

### 2.3 Database Migration Strategy

**Migration Workflow:**
```typescript
// Create new migration for restaurant features
npm run migration:generate -- src/database/migrations/AddRestaurantFeatures

// Migration will include:
// - New restaurant-specific tables
// - Enums for restaurant operations
// - Foreign key relationships
// - Indexes for performance
// - Default values for existing data
```

**Key Principles:**
- Backward compatible migrations
- Existing retail data unaffected
- Feature flags at database level
- Nullable columns for restaurant features on existing tables

---

## 3. Data Model Extensions

### 3.1 New TypeORM Entities

#### **Table Entity**
```typescript
// src/modules/restaurant/tables/entities/table.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Branch } from '../../../branches/entities/branch.entity';
import { User } from '../../../users/entities/user.entity';
import { RestaurantOrder } from '../../orders/entities/restaurant-order.entity';

export enum TableStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  RESERVED = 'reserved',
  CLEANING = 'cleaning'
}

export enum TableShape {
  SQUARE = 'square',
  RECTANGLE = 'rectangle',
  CIRCLE = 'circle',
  OVAL = 'oval'
}

@Entity('tables')
export class Table {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  number: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  name?: string;

  @Column({ type: 'int' })
  capacity: number;

  @Column({
    type: 'enum',
    enum: TableStatus,
    default: TableStatus.AVAILABLE
  })
  status: TableStatus;

  @Column({ type: 'varchar', length: 100 })
  floor: string;

  @Column({ type: 'varchar', length: 100 })
  section: string;

  @Column({ type: 'jsonb' })
  position: { x: number; y: number };

  @Column({
    type: 'enum',
    enum: TableShape,
    default: TableShape.SQUARE
  })
  shape: TableShape;

  @OneToOne(() => RestaurantOrder, { nullable: true })
  currentOrder?: RestaurantOrder;

  @ManyToOne(() => User, { nullable: true })
  server?: User;

  @Column({ type: 'timestamp', nullable: true })
  lastSeated?: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastCleared?: Date;

  @ManyToOne(() => Branch, { nullable: false })
  branch: Branch;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

#### **Floor Plan Entity**
```typescript
// src/modules/restaurant/tables/entities/floor-plan.entity.ts
@Entity('floor_plans')
export class FloorPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @ManyToOne(() => Branch, { nullable: false })
  branch: Branch;

  @Column({ type: 'boolean', default: false })
  isActive: boolean;

  @Column({ type: 'jsonb' })
  dimensions: { width: number; height: number };

  @OneToMany(() => Table, table => table.floorPlan, { cascade: true })
  tables: Table[];

  @Column({ type: 'jsonb', default: [] })
  sections: Section[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// Section is stored as JSONB
export interface Section {
  id: string;
  name: string;
  color: string;
  bounds: { x: number; y: number; width: number; height: number };
}
```

#### **Restaurant Order**
```typescript
interface RestaurantOrder {
  id: string;
  orderNumber: string;
  table?: string; // table ID
  serviceType: 'dine-in' | 'takeout' | 'delivery';
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';

  items: OrderItem[];

  customer?: string; // customer ID
  server?: string; // user ID

  courses: Course[];

  timing: {
    orderPlaced: Date;
    confirmedAt?: Date;
    preparingAt?: Date;
    readyAt?: Date;
    servedAt?: Date;
    completedAt?: Date;
  };

  kitchen: {
    stations: string[]; // kitchen, bar, grill, dessert
    priority: 'low' | 'normal' | 'high' | 'urgent';
    notes: string;
  };

  payment: {
    subtotal: number;
    tax: number;
    tip?: number;
    discount?: number;
    total: number;
    tipPercentage?: number;
    splitType?: 'none' | 'by-seat' | 'by-item' | 'even';
    payments: Payment[];
  };

  branch: string;
  metadata?: Record<string, any>;
}
```

#### **Order Item (Enhanced)**
```typescript
interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;

  // Restaurant-specific fields
  modifiers?: Modifier[];
  course?: 'appetizer' | 'main' | 'dessert' | 'beverage';
  seat?: number;
  status?: 'pending' | 'preparing' | 'ready' | 'served';
  station?: string; // kitchen, bar, grill
  specialInstructions?: string;

  subtotal: number;
}
```

#### **Menu Modifier**
```typescript
interface Modifier {
  id: string;
  name: string;
  price: number; // additional cost (can be 0)
  selected: boolean;
}

interface ModifierGroup {
  id: string;
  name: string;
  type: 'single' | 'multiple';
  required: boolean;
  minSelections: number;
  maxSelections: number;
  modifiers: Modifier[];
}

interface Product {
  // ...existing fields

  // Restaurant-specific fields
  modifierGroups?: ModifierGroup[];
  station?: string; // default kitchen station
  prepTime?: number; // minutes
  recipe?: Recipe;
  availability?: {
    schedule?: { start: string; end: string }[]; // time-based
    daysOfWeek?: number[]; // 0-6
    dateRange?: { start: Date; end: Date };
  };
}
```

#### **Recipe**
```typescript
interface Recipe {
  id: string;
  productId: string;
  name: string;
  ingredients: RecipeIngredient[];
  prepTime: number; // minutes
  cookTime: number; // minutes
  instructions?: string;
  servings: number;
  costPerServing: number;
}

interface RecipeIngredient {
  inventoryItemId: string;
  name: string;
  quantity: number;
  unit: string;
  cost: number;
}
```

#### **Kitchen Station**
```typescript
interface KitchenStation {
  id: string;
  name: string;
  code: string; // 'kitchen', 'bar', 'grill', 'dessert'
  branch: string;
  printerConfig?: {
    enabled: boolean;
    printerName: string;
    copies: number;
  };
  displayConfig?: {
    enabled: boolean;
    displayId: string;
  };
  isActive: boolean;
}
```

#### **Server Assignment**
```typescript
interface ServerAssignment {
  id: string;
  serverId: string;
  serverName: string;
  tables: string[]; // table IDs
  section: string;
  shift: {
    start: Date;
    end?: Date;
  };
  status: 'active' | 'break' | 'ended';
  branch: string;
}
```

### 3.2 Enhanced Entities

#### **Product/Menu Item Categories**
```typescript
// Restaurant-specific categories
const restaurantCategories = [
  'Appetizers',
  'Salads',
  'Soups',
  'Main Course',
  'Sides',
  'Desserts',
  'Beverages',
  'Alcoholic Beverages',
  'Coffee & Tea',
  'Kids Menu',
  'Specials',
  'Combo Meals',
];
```

#### **Customer Entity Enhancement**
```typescript
interface Customer {
  // ...existing fields

  // Restaurant-specific fields
  restaurantPreferences?: {
    favoriteTable?: string;
    dietaryRestrictions?: string[];
    allergies?: string[];
    favoriteItems?: string[]; // product IDs
    averagePartySize?: number;
    reservationHistory?: Reservation[];
  };
}
```

#### **User/Staff Enhancement**
```typescript
interface User {
  // ...existing fields

  // Restaurant-specific fields
  restaurantRole?: 'server' | 'chef' | 'bartender' | 'host' | 'kitchen_staff';
  serverInfo?: {
    sections: string[];
    tipPoolPercentage?: number;
    performanceMetrics?: {
      averageOrderValue: number;
      tablesTurnedToday: number;
      customerRating: number;
    };
  };
}
```

---

## 4. Backend Feature Specifications

### 4.1 Table Management System

#### Backend Features
- **Table Entity Management**
  - TypeORM entities for tables, floor plans, and sections
  - CRUD operations for tables
  - Table status management (available, occupied, reserved, cleaning)
  - Server assignment logic
  - Table merging/splitting business logic

- **Table Business Logic**
  - Real-time status updates via WebSocket
  - Table availability checking
  - Automatic status transitions
  - Server assignment algorithms
  - Table occupancy time tracking

- **Data Models**
  - Table entity with position, capacity, status
  - FloorPlan entity with dimensions and layout data
  - Section configuration stored as JSONB
  - Relationships with Branch and User (server) entities

### 4.2 Kitchen Display System (KDS)

#### Backend Features
- **Kitchen Station Management**
  - TypeORM entities for kitchen stations
  - Station-based order routing logic
  - Order queue management per station
  - Priority assignment algorithms

- **Order Processing Logic**
  - Order status transitions (pending → preparing → ready)
  - Timer calculations and tracking
  - Auto-aging logic for overdue orders
  - Course sequencing business rules

- **API Endpoints**
  - Get orders by station
  - Update order item status
  - Bump/complete order operations
  - Kitchen printer integration endpoints
  - Performance metrics calculations

- **Data Models**
  - KitchenStation entity with configuration
  - Order routing rules
  - Station assignments for menu items
  - Printer configuration data

### 4.3 Enhanced POS for Restaurant

#### Backend Features
- **Order Creation Logic**
  - Service type handling (dine-in/takeout/delivery)
  - Table validation and assignment
  - Automatic server assignment logic
  - Guest count tracking

- **Modifier Processing**
  - Modifier validation and pricing calculations
  - Modifier group constraints enforcement
  - Special instructions storage and validation
  - Price recalculation with modifiers

- **Course Management Logic**
  - Course assignment business rules
  - Course sequencing validation
  - Course-based order firing to kitchen
  - Priority and timing logic for courses

- **Tipping Calculations**
  - Tip percentage calculations
  - Pre-tax/post-tax tip logic
  - Auto-gratuity rules for large parties
  - Tip pooling calculations

- **Split Payment Logic**
  - Split by seat algorithm
  - Split by item calculations
  - Even split calculations
  - Custom split validation
  - Multiple payment processing

- **API Enhancements**
  - Enhanced order creation endpoint with restaurant fields
  - Modifier selection validation
  - Course assignment endpoints
  - Tip calculation endpoints
  - Split payment processing endpoints

### 4.4 Menu Management (Enhanced Products)

#### Backend Features
- **Modifier Groups Management**
  - TypeORM entities for modifiers and modifier groups
  - CRUD operations for modifier groups
  - Product-to-modifier-group relationships
  - Pricing calculation logic with modifiers
  - Validation for required vs optional modifiers
  - Min/max selection constraints

- **Recipe Management**
  - Recipe entity with ingredient relationships
  - Cost calculation algorithms
  - Recipe ingredient tracking
  - Prep/cook time storage
  - Yield and serving size calculations
  - Integration with inventory for ingredient tracking

- **Menu Categories**
  - Restaurant-specific category types
  - Category hierarchy and ordering
  - Time-based availability rules engine
  - Dynamic pricing (happy hour) logic
  - Day-of-week availability rules

- **Product Enhancements**
  - Enhanced Product entity with restaurant fields
  - Station assignment for menu items
  - Dietary tags and allergen information
  - Availability schedules stored as JSONB
  - Recipe associations

- **API Endpoints**
  - Modifier group CRUD endpoints
  - Recipe management endpoints
  - Menu item availability checking
  - Category management endpoints
  - Product search with filters (dietary, category, etc.)

### 4.5 Order Management System

#### Backend Features
- **Order History & Querying**
  - Advanced order filtering and searching
  - Pagination and sorting capabilities
  - Status-based queries
  - Time-range filtering
  - Server/table filtering

- **Order Status Management**
  - State machine for order status transitions
  - Status validation and business rules
  - Estimated completion time calculations
  - WebSocket events for status updates
  - SMS/email notification integration

- **Order Modification Logic**
  - In-progress order editing validation
  - Item cancellation with inventory updates
  - Adding items to active orders
  - Void/comp authorization and audit logging
  - Reason tracking for all modifications

- **API Endpoints**
  - Order history with advanced filters
  - Order status update endpoints
  - Order modification endpoints
  - Order timeline and audit trail
  - Notification trigger endpoints

- **Data Models**
  - RestaurantOrder entity with full relationships
  - OrderItem entity with modifiers
  - Order audit log for tracking changes
  - Status transition history

### 4.6 QR Code Table Ordering System

#### Backend Features
- **QR Code Management**
  - QR code generation service using qrcode library
  - Unique QR code per table entity
  - QR code regeneration logic
  - Deep link generation for table-specific URLs
  - QR code image storage and retrieval
  - Scan tracking and analytics

- **Public Menu API**
  - Public endpoints (no authentication required)
  - Menu data retrieval by branch
  - Category-based menu organization
  - Product details with modifiers
  - Availability checking based on time/day
  - Allergen and dietary information

- **Session Management**
  - Session token generation and validation
  - Table detection from QR scan
  - Session state management
  - Session timeout handling
  - Multiple orders per session tracking
  - Session heartbeat mechanism

- **Order Processing**
  - Guest order creation (no user account required)
  - Session-based authentication
  - Modifier validation for QR orders
  - Special instructions handling
  - Order total calculations
  - Integration with main order system

- **Service Request Handling**
  - Call server notification system
  - Request bill workflow
  - Staff notification via WebSocket
  - Request tracking and status

- **Payment Integration**
  - Online payment processing endpoints
  - Payment method validation
  - Split payment calculations for QR orders
  - Tip processing for online payments
  - Payment confirmation and receipts

- **Order Tracking API**
  - Real-time order status for session
  - Estimated preparation time calculations
  - WebSocket/SSE for live updates
  - Order history within session

- **Security & Validation**
  - Session token expiration
  - Rate limiting on order submissions
  - Table ID validation
  - CAPTCHA integration (optional)
  - Request sanitization and validation

#### Data Models

**QR Code Session**
```typescript
interface QROrderSession {
  id: string;
  tableId: string;
  tableNumber: string;
  sessionToken: string; // UUID for this dining session
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'requesting-bill' | 'closed';
  orders: string[]; // order IDs
  totalSpent: number;
  guestCount?: number;
}
```

**QR Code Configuration**
```typescript
interface TableQRCode {
  id: string;
  tableId: string;
  qrCodeUrl: string; // Generated QR code image
  deepLink: string; // URL encoded in QR: https://yourapp.com/order/table/{tableId}
  isActive: boolean;
  createdAt: Date;
  lastScanned?: Date;
  scanCount: number;
}
```

#### QR System API Endpoints
- QR code generation and management
- Public menu API (no auth)
- Session management endpoints
- Guest order creation
- Service request endpoints (call server, request bill)
- Payment processing for QR orders
- Order tracking with real-time updates
- Analytics endpoints for QR usage

#### Configuration & Settings
- Global QR ordering enable/disable
- Per-table QR ordering control
- Session timeout configuration
- Rate limiting rules
- Payment integration settings
- Notification preferences for staff

### 4.7 Reservation System (Optional - Future)

#### Features
- Online reservation management
- Table assignment
- Party size management
- Wait list
- SMS/email confirmations

### 4.8 Restaurant Reports & Analytics

#### Backend Analytics Services
- **Table Performance Analytics**
  - SQL queries for average table turnover time
  - Revenue per table calculations
  - Occupancy rate calculations by time slot
  - Table performance rankings
  - Historical trend analysis

- **Menu Performance Analytics**
  - Top selling items queries
  - Slow-moving item identification
  - Food cost percentage calculations
  - Profit margin analysis per item
  - Category performance aggregations
  - Time-based sales patterns

- **Server Performance Metrics**
  - Orders per server aggregations
  - Average order value calculations
  - Table turnover rate by server
  - Tips earned summaries
  - Performance rankings and comparisons

- **Kitchen Performance Metrics**
  - Average preparation time calculations by station
  - Order accuracy rate tracking
  - Peak hours identification
  - Station efficiency metrics
  - Late order analytics

- **Service Type Analytics**
  - Revenue breakdown by service type
  - Order volume by service type
  - Popular items analysis per service type
  - Service type trend analysis

#### API Endpoints
- Restaurant analytics summary endpoint
- Table performance report endpoints
- Menu performance endpoints
- Server performance endpoints
- Kitchen metrics endpoints
- Service type analysis endpoints
- Custom date range filtering
- Export endpoints for reports (CSV, PDF)

---

## 5. Implementation Phases

### Phase 1: Foundation (Week 1-2)
**Goal:** Setup business type configuration and backend infrastructure

#### Tasks
- [ ] Update Settings entity with `businessType` and `restaurantSettings` fields
- [ ] Create database migration for settings updates
- [ ] Implement restaurant settings DTOs and validation
- [ ] Create RestaurantModeGuard and RestaurantFeatureGuard
- [ ] Update SettingsService with restaurant mode methods
- [ ] Create restaurant module structure in NestJS
- [ ] Add restaurant-specific TypeScript interfaces and enums
- [ ] Create restaurant constants file
- [ ] Update Swagger documentation with restaurant tags
- [ ] Setup API versioning if needed

**Deliverables:**
- Settings entity updated with restaurant configuration
- Migration successfully applied
- Guards and decorators ready for use
- Restaurant module structure created
- Type definitions complete
- API documentation updated

**Estimated Effort:** 30-40 hours

---

### Phase 2: Table Management (Week 3-4)
**Goal:** Complete table management backend functionality

#### Tasks
- [ ] Create Table entity with TypeORM
- [ ] Create FloorPlan entity with TypeORM
- [ ] Generate database migration for table entities
- [ ] Implement TablesService with CRUD operations
- [ ] Implement TablesController with REST endpoints
- [ ] Add table status update logic
- [ ] Create section management DTOs and validation
- [ ] Implement table assignment business logic
- [ ] Add server assignment to tables
- [ ] Implement table filtering and search queries
- [ ] Setup WebSocket gateway for real-time table updates
- [ ] Add table availability checking logic
- [ ] Write unit tests for table services
- [ ] Update Swagger documentation for table endpoints

**Deliverables:**
- Table and FloorPlan entities created
- Database migration applied
- Complete CRUD API for tables
- Table status management working
- WebSocket real-time updates functioning
- Unit tests passing
- API documentation complete

**Estimated Effort:** 50-60 hours

---

### Phase 3: Order Management & Status Workflow (Week 5-6)
**Goal:** Restaurant order lifecycle and status tracking backend

#### Tasks
- [ ] Create RestaurantOrder entity with TypeORM
- [ ] Create OrderItem entity with restaurant fields
- [ ] Generate database migration for order entities
- [ ] Implement order status enum and state machine
- [ ] Create RestaurantOrdersService with business logic
- [ ] Create RestaurantOrdersController with endpoints
- [ ] Implement order creation with table validation
- [ ] Add service type handling logic
- [ ] Implement order status transition validations
- [ ] Create order history queries with filtering
- [ ] Add order modification endpoints and validation
- [ ] Implement order routing logic to kitchen stations
- [ ] Setup WebSocket events for order status updates
- [ ] Integrate email/SMS notification service
- [ ] Add order audit logging
- [ ] Write unit tests for order services
- [ ] Update Swagger documentation

**Deliverables:**
- RestaurantOrder entities created
- Database migration applied
- Complete order API with status workflow
- Order modification endpoints working
- Real-time status updates via WebSocket
- Notification system integrated
- Unit tests passing
- API documentation complete

**Estimated Effort:** 50-60 hours

---

### Phase 4: Menu Modifiers & Enhanced Products (Week 7-8)
**Goal:** Menu item customization and modifiers backend

#### Tasks
- [ ] Create Modifier entity with TypeORM
- [ ] Create ModifierGroup entity with TypeORM
- [ ] Generate database migration for modifier entities
- [ ] Update Product entity with restaurant-specific fields
- [ ] Create ModifiersService with CRUD operations
- [ ] Create ModifiersController with REST endpoints
- [ ] Implement modifier pricing calculation logic
- [ ] Add modifier validation (min/max selections)
- [ ] Create product-to-modifier-group relationships
- [ ] Add restaurant category types to database
- [ ] Implement menu availability rules engine
- [ ] Add time-based and day-based availability logic
- [ ] Create DTOs for modifier operations
- [ ] Write unit tests for modifier services
- [ ] Update Swagger documentation

**Deliverables:**
- Modifier entities created
- Database migration applied
- Complete modifier API
- Product entity enhanced with restaurant fields
- Modifier pricing logic implemented
- Availability rules engine working
- Unit tests passing
- API documentation complete

**Estimated Effort:** 40-50 hours

---

### Phase 5: QR Code Table Ordering System (Week 9-11)
**Goal:** Backend for QR code ordering system

#### Tasks
- [ ] Create QROrderSession entity with TypeORM
- [ ] Create TableQRCode entity with TypeORM
- [ ] Generate database migration for QR entities
- [ ] Implement QR code generation service (using qrcode library)
- [ ] Create QrOrderingService for session management
- [ ] Create QrOrderingController with endpoints
- [ ] Implement deep link generation for tables
- [ ] Build public menu API (no authentication)
- [ ] Implement session token generation and validation
- [ ] Add session timeout and cleanup logic
- [ ] Create guest order creation endpoint
- [ ] Implement session-based authentication middleware
- [ ] Add "Call Server" notification endpoint
- [ ] Add "Request Bill" endpoint
- [ ] Integrate online payment processing API
- [ ] Implement order tracking endpoints for guests
- [ ] Setup WebSocket/SSE for real-time updates to customers
- [ ] Add rate limiting middleware for QR endpoints
- [ ] Implement CAPTCHA integration (optional)
- [ ] Create QR analytics queries and endpoints
- [ ] Add scan tracking logic
- [ ] Write unit tests for QR services
- [ ] Update Swagger documentation

**Deliverables:**
- QR entities created
- Database migration applied
- QR code generation service working
- Public menu API functional
- Session management complete
- Guest ordering endpoints working
- Real-time updates via WebSocket
- Rate limiting and security implemented
- Analytics endpoints ready
- Unit tests passing
- API documentation complete

**Estimated Effort:** 60-70 hours

---

### Phase 6: Kitchen Display System (Week 12-13)
**Goal:** Backend for KDS functionality

#### Tasks
- [ ] Create KitchenStation entity with TypeORM
- [ ] Generate database migration for kitchen entities
- [ ] Create KitchenService with business logic
- [ ] Create KitchenController with endpoints
- [ ] Implement order queue queries by station
- [ ] Add order timer calculations
- [ ] Implement order aging logic (overdue detection)
- [ ] Create mark ready/bump endpoints
- [ ] Add station filtering and routing logic
- [ ] Integrate kitchen printer service
- [ ] Implement performance metrics calculations
- [ ] Add course sequencing logic
- [ ] Implement priority sorting algorithms
- [ ] Setup WebSocket for KDS real-time updates
- [ ] Integrate QR orders into kitchen workflow
- [ ] Write unit tests for kitchen services
- [ ] Update Swagger documentation

**Deliverables:**
- KitchenStation entity created
- Database migration applied
- Kitchen order queue API functional
- Order status management for kitchen
- Printer integration working
- Performance metrics endpoints ready
- WebSocket real-time updates working
- Unit tests passing
- API documentation complete

**Estimated Effort:** 50-60 hours

---

### Phase 7: Enhanced POS for Restaurant (Week 14-15)
**Goal:** Backend enhancements for restaurant POS

#### Tasks
- [ ] Update POS service with table selection logic
- [ ] Add service type validation in order creation
- [ ] Integrate modifier validation in POS endpoints
- [ ] Implement course assignment validation
- [ ] Create tip calculation service
- [ ] Add tip configuration endpoints
- [ ] Implement split payment algorithms
- [ ] Add seat assignment logic to order items
- [ ] Create server performance query endpoints
- [ ] Implement reorder functionality
- [ ] Add special instructions to order items
- [ ] Update order DTOs with restaurant fields
- [ ] Write unit tests for POS enhancements
- [ ] Update Swagger documentation

**Deliverables:**
- POS endpoints enhanced for restaurant mode
- Tip calculation service working
- Split payment logic implemented
- Server endpoints functional
- Unit tests passing
- API documentation complete

**Estimated Effort:** 40-50 hours

---

### Phase 8: Recipe Management (Week 16)
**Goal:** Backend for recipe and ingredient tracking

#### Tasks
- [ ] Create Recipe entity with TypeORM
- [ ] Create RecipeIngredient entity with TypeORM
- [ ] Generate database migration for recipe entities
- [ ] Create RecipesService with business logic
- [ ] Create RecipesController with endpoints
- [ ] Implement cost calculation algorithms
- [ ] Link recipes to products in database
- [ ] Add prep/cook time fields
- [ ] Implement recipe costing calculations
- [ ] Create inventory integration for ingredients
- [ ] Add recipe scaling logic
- [ ] Write unit tests for recipe services
- [ ] Update Swagger documentation

**Deliverables:**
- Recipe entities created
- Database migration applied
- Recipe CRUD API functional
- Cost calculation working
- Inventory integration complete
- Unit tests passing
- API documentation complete

**Estimated Effort:** 30-40 hours

---

### Phase 9: Server Management (Week 17)
**Goal:** Backend for server assignment and performance tracking

#### Tasks
- [ ] Create ServerAssignment entity with TypeORM
- [ ] Update User entity with server-specific fields
- [ ] Generate database migration for server entities
- [ ] Create ServersService with business logic
- [ ] Create ServersController with endpoints
- [ ] Implement section assignment logic
- [ ] Add shift management endpoints
- [ ] Create server performance query logic
- [ ] Implement tip tracking and calculations
- [ ] Add tip pooling algorithms
- [ ] Create server report endpoints
- [ ] Write unit tests for server services
- [ ] Update Swagger documentation

**Deliverables:**
- ServerAssignment entity created
- Database migration applied
- Server management API functional
- Performance tracking working
- Tip tracking implemented
- Unit tests passing
- API documentation complete

**Estimated Effort:** 30-40 hours

---

### Phase 10: Restaurant Reports & Analytics (Week 18-19)
**Goal:** Backend for restaurant analytics and reporting

#### Tasks
- [ ] Create ReportsService for restaurant analytics
- [ ] Implement table performance SQL queries
- [ ] Create menu analytics aggregation queries
- [ ] Implement server performance calculations
- [ ] Add kitchen metrics queries
- [ ] Create service type analysis queries
- [ ] Build food cost percentage calculations
- [ ] Add table turnover calculations
- [ ] Implement peak hours analysis queries
- [ ] Create profit margin analysis logic
- [ ] Add QR ordering analytics queries
- [ ] Implement report export service (CSV, PDF)
- [ ] Create ReportsController with endpoints
- [ ] Add date range filtering logic
- [ ] Implement report caching for performance
- [ ] Write unit tests for report services
- [ ] Update Swagger documentation

**Deliverables:**
- Restaurant analytics service complete
- All report endpoints functional
- Export functionality working
- Query optimization complete
- Unit tests passing
- API documentation complete

**Estimated Effort:** 40-50 hours

---

### Phase 11: Hardware Integration (Week 20)
**Goal:** Backend for kitchen hardware support

#### Tasks
- [ ] Create printer configuration in settings
- [ ] Implement printer service for kitchen orders
- [ ] Add multi-printer routing logic
- [ ] Create printer job queue system
- [ ] Add customer display API endpoints
- [ ] Implement pager/buzzer notification service
- [ ] Create hardware configuration DTOs
- [ ] Add printer status monitoring
- [ ] Implement retry logic for failed prints
- [ ] Write unit tests for hardware services
- [ ] Update Swagger documentation

**Deliverables:**
- Printer service implemented
- Multi-printer routing working
- Hardware configuration endpoints ready
- Notification services integrated
- Unit tests passing
- API documentation complete

**Estimated Effort:** 30-40 hours

---

### Phase 12: Testing & QA (Week 21-22)
**Goal:** Comprehensive backend testing

#### Tasks
- [ ] Complete unit tests for all restaurant services
- [ ] Write integration tests for API endpoints
- [ ] Create end-to-end API tests
- [ ] Test QR ordering API flows
- [ ] Perform load testing on endpoints
- [ ] Conduct security audit for QR sessions
- [ ] Test database migrations on staging
- [ ] Test WebSocket connections under load
- [ ] Perform API response time optimization
- [ ] Test concurrent order processing
- [ ] Validate all DTOs and input validation
- [ ] Test error handling and edge cases
- [ ] Bug fixes based on test results
- [ ] Update API documentation

**Deliverables:**
- Test coverage > 80%
- All integration tests passing
- Load testing results documented
- Security vulnerabilities addressed
- Performance benchmarks met
- Bug-free release candidate
- Updated API documentation

**Estimated Effort:** 40-50 hours

---

### Phase 13: Polish & Launch (Week 23)
**Goal:** Final optimization and production deployment

#### Tasks
- [ ] API response time optimizations
- [ ] Database query optimizations
- [ ] Add database indexes for performance
- [ ] Final bug fixes
- [ ] API documentation review and finalization
- [ ] Create database backup strategy
- [ ] Prepare production environment
- [ ] Setup monitoring and logging
- [ ] Configure production database
- [ ] Deploy database migrations to production
- [ ] Production release
- [ ] Post-deployment verification

**Deliverables:**
- Production-ready backend
- Optimized database queries
- Complete API documentation
- Monitoring and logging configured
- Production deployment successful
- Backup strategy in place

**Estimated Effort:** 20-30 hours

---

## 6. Technical Implementation Details

### 6.1 Settings Service Implementation

**File:** `src/modules/settings/settings.service.ts`

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Settings } from './entities/settings.entity';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Settings)
    private settingsRepository: Repository<Settings>,
  ) {}

  async getSettings(): Promise<Settings> {
    const settings = await this.settingsRepository.findOne({ where: {} });
    if (!settings) {
      throw new NotFoundException('Settings not found');
    }
    return settings;
  }

  async updateSettings(updateDto: UpdateSettingsDto): Promise<Settings> {
    const settings = await this.getSettings();

    // Merge restaurant settings
    if (updateDto.restaurantSettings) {
      settings.restaurantSettings = {
        ...settings.restaurantSettings,
        ...updateDto.restaurantSettings,
      };
    }

    if (updateDto.businessType) {
      settings.businessType = updateDto.businessType;
    }

    return this.settingsRepository.save(settings);
  }

  async isRestaurantModeEnabled(): Promise<boolean> {
    const settings = await this.getSettings();
    return settings.businessType === 'restaurant' &&
           settings.restaurantSettings?.enabled === true;
  }

  async getRestaurantFeatures(): Promise<Record<string, boolean>> {
    const settings = await this.getSettings();
    return settings.restaurantSettings?.features || {};
  }
}
```

**Settings Entity with Restaurant Configuration:**

```typescript
@Entity('settings')
export class Settings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Business Type Configuration
  @Column({
    type: 'enum',
    enum: ['retail', 'restaurant'],
    default: 'retail'
  })
  businessType: 'retail' | 'restaurant';

  // Restaurant Settings (stored as JSONB)
  @Column({ type: 'jsonb', nullable: true, default: {} })
  restaurantSettings: {
    enabled: false,

    // Feature Flags
    features: {
      tableManagement: true,
      kitchenDisplay: true,
      orderManagement: true,
      modifiers: true,
      tipping: true,
      courseSequencing: true,
      serverManagement: true,
      recipes: true,
      qrOrdering: true,
      reservations: false, // Future feature
    },

    // Table Configuration
    tables: {
      enabled: true,
      autoAssignServer: false,
      requireTableForDineIn: true,
      defaultFloorPlan: null,
    },

    // Order Configuration
    orderManagement: {
      enableKDS: true,
      enableCourseSequencing: true,
      stations: [
        { id: 'kitchen', name: 'Kitchen', color: '#3B82F6' },
        { id: 'bar', name: 'Bar', color: '#10B981' },
        { id: 'grill', name: 'Grill', color: '#F59E0B' },
        { id: 'dessert', name: 'Dessert', color: '#EC4899' },
      ],
      defaultPrepTime: 15, // minutes
      autoSendToKitchen: true,
      printToKitchen: true,
    },

    // Service Types
    serviceTypes: {
      dineIn: { enabled: true, label: 'Dine In' },
      takeout: { enabled: true, label: 'Takeout' },
      delivery: { enabled: true, label: 'Delivery' },
    },
    defaultServiceType: 'dineIn',

    // Menu Configuration
    menu: {
      enableModifiers: true,
      enableComboDeals: true,
      enableHappyHour: false,
      enableTimeBasedPricing: false,
      showNutritionalInfo: false,
      showCalories: false,
    },

    // Tipping Configuration
    tipping: {
      enabled: true,
      defaultTipPercentages: [15, 18, 20, 25],
      allowCustomTip: true,
      tipOnPreTax: false,
      suggestedTipCalculation: 'total', // 'subtotal' | 'total'
      autoGratuity: {
        enabled: false,
        partySize: 6,
        percentage: 18,
      },
    },

    // Kitchen Hardware
    kitchenHardware: {
      kitchenPrinters: [],
      expeditorDisplay: {
        enabled: false,
        displayId: null,
      },
      pagerSystem: {
        enabled: false,
        type: 'vibrating', // 'vibrating' | 'beeper'
      },
    },

    // Server Configuration
    servers: {
      enableServerAssignment: true,
      requireServerForOrders: false,
      enableTipPooling: false,
      tipPoolPercentage: 0,
    },

    // Dining Options
    dining: {
      coursesEnabled: true,
      availableCourses: [
        { id: 'appetizer', name: 'Appetizer', order: 1 },
        { id: 'soup-salad', name: 'Soup/Salad', order: 2 },
        { id: 'main', name: 'Main Course', order: 3 },
        { id: 'dessert', name: 'Dessert', order: 4 },
        { id: 'beverage', name: 'Beverage', order: 5 },
      ],
    },

    // QR Code Ordering Configuration
    qrOrdering: {
      enabled: true,
      requireGuestInfo: false, // Require name/phone before ordering
      enableOnlinePayment: true,
      enableCallServer: true,
      enableRequestBill: true,
      sessionTimeout: 240, // minutes (4 hours)
      allowReorders: true,
      showItemImages: true,
      showNutritionalInfo: false,
      showAllergens: true,
      enableRatings: false,
      minimumOrderAmount: 0,
      publicMenuUrl: '', // Auto-generated: https://yourapp.com/menu/{branch-id}
    },
  },

  // Actions
  setBusinessType: (type) =>
    set((state) => {
      state.businessType = type;
      if (type === 'restaurant') {
        state.restaurantSettings.enabled = true;
      }
    }),

  toggleRestaurantMode: () =>
    set((state) => {
      if (state.businessType === 'retail') {
        state.businessType = 'restaurant';
        state.restaurantSettings.enabled = true;
      } else {
        state.businessType = 'retail';
        state.restaurantSettings.enabled = false;
      }
    }),

  updateRestaurantSettings: (updates) =>
    set((state) => {
      state.restaurantSettings = {
        ...state.restaurantSettings,
        ...updates,
      };
    }),

  toggleRestaurantFeature: (feature) =>
    set((state) => {
      if (state.restaurantSettings.features[feature] !== undefined) {
        state.restaurantSettings.features[feature] =
          !state.restaurantSettings.features[feature];
      }
    }),

  updateKitchenStations: (stations) =>
    set((state) => {
      state.restaurantSettings.orderManagement.stations = stations;
    }),

  updateTippingConfig: (config) =>
    set((state) => {
      state.restaurantSettings.tipping = {
        ...state.restaurantSettings.tipping,
        ...config,
      };
    }),

  // ...existing actions
});
```

### 6.2 Custom Guards and Decorators

**Restaurant Mode Guard:**

**File:** `src/common/guards/restaurant-mode.guard.ts`

```typescript
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { SettingsService } from '../../modules/settings/settings.service';

@Injectable()
export class RestaurantModeGuard implements CanActivate {
  constructor(private settingsService: SettingsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isEnabled = await this.settingsService.isRestaurantModeEnabled();

    if (!isEnabled) {
      throw new ForbiddenException('Restaurant mode is not enabled');
    }

    return true;
  }
}
```

**Restaurant Feature Guard:**

**File:** `src/common/guards/restaurant-feature.guard.ts`

```typescript
import { Injectable, CanActivate, ExecutionContext, ForbiddenException, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SettingsService } from '../../modules/settings/settings.service';

export const RESTAURANT_FEATURE_KEY = 'restaurantFeature';
export const RequireRestaurantFeature = (feature: string) =>
  SetMetadata(RESTAURANT_FEATURE_KEY, feature);

@Injectable()
export class RestaurantFeatureGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private settingsService: SettingsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeature = this.reflector.getAllAndOverride<string>(
      RESTAURANT_FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredFeature) {
      return true;
    }

    const features = await this.settingsService.getRestaurantFeatures();

    if (!features[requiredFeature]) {
      throw new ForbiddenException(
        `Restaurant feature '${requiredFeature}' is not enabled`,
      );
    }

    return true;
  }
}
```

**Usage Example in Controller:**

```typescript
import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { RestaurantModeGuard } from '../../common/guards/restaurant-mode.guard';
import { RestaurantFeatureGuard, RequireRestaurantFeature } from '../../common/guards/restaurant-feature.guard';

@Controller('tables')
@UseGuards(RestaurantModeGuard, RestaurantFeatureGuard)
@RequireRestaurantFeature('tableManagement')
export class TablesController {
  @Get()
  async findAll() {
    // This endpoint only works if restaurant mode is enabled
    // AND tableManagement feature is enabled
  }

  @Post()
  async create() {
    // Protected by same guards
  }
}
```

### 6.3 TypeScript Enums and Types

**File:** `src/modules/restaurant/types/enums.ts`

```typescript
/**
 * Restaurant Type Definitions - Backend Enums
 */

// Table Status
export enum TableStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  RESERVED = 'reserved',
  CLEANING = 'cleaning',
}

// Order Status
export enum RestaurantOrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  READY = 'ready',
  SERVED = 'served',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

// Service Type
export enum ServiceType {
  DINE_IN = 'dine-in',
  TAKEOUT = 'takeout',
  DELIVERY = 'delivery',
}

// Course Type
export enum CourseType {
  APPETIZER = 'appetizer',
  SOUP_SALAD = 'soup-salad',
  MAIN = 'main',
  DESSERT = 'dessert',
  BEVERAGE = 'beverage',
}

// Kitchen Station Type
export enum KitchenStationType {
  KITCHEN = 'kitchen',
  BAR = 'bar',
  GRILL = 'grill',
  DESSERT = 'dessert',
}

// Order Priority
export enum OrderPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

// Table Shape
export enum TableShape {
  SQUARE = 'square',
  RECTANGLE = 'rectangle',
  CIRCLE = 'circle',
  OVAL = 'oval',
}

// Split Type
export enum SplitType {
  NONE = 'none',
  BY_SEAT = 'by-seat',
  BY_ITEM = 'by-item',
  EVEN = 'even',
}

// Server Status
export enum ServerStatus {
  ACTIVE = 'active',
  BREAK = 'break',
  ENDED = 'ended',
}

// Modifier Type
export enum ModifierType {
  SINGLE = 'single',
  MULTIPLE = 'multiple',
}
```

**File:** `src/modules/restaurant/types/interfaces.ts`

```typescript
/**
 * TypeScript Interfaces for Restaurant Entities
 */

export interface Section {
  id: string;
  name: string;
  color: string;
  bounds: { x: number; y: number; width: number; height: number };
}

export interface TablePosition {
  x: number;
  y: number;
}

export interface FloorPlanDimensions {
  width: number;
  height: number;
}
```

### 6.4 API Module Registration

**File:** `src/modules/restaurant/restaurant.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TablesModule } from './tables/tables.module';
import { KitchenModule } from './kitchen/kitchen.module';
import { RestaurantOrdersModule } from './orders/restaurant-orders.module';
import { ModifiersModule } from './modifiers/modifiers.module';
import { RecipesModule } from './recipes/recipes.module';
import { ServersModule } from './servers/servers.module';
import { QrOrderingModule } from './qr-ordering/qr-ordering.module';

@Module({
  imports: [
    TablesModule,
    KitchenModule,
    RestaurantOrdersModule,
    ModifiersModule,
    RecipesModule,
    ServersModule,
    QrOrderingModule,
  ],
  exports: [
    TablesModule,
    KitchenModule,
    RestaurantOrdersModule,
    ModifiersModule,
    RecipesModule,
    ServersModule,
    QrOrderingModule,
  ],
})
export class RestaurantModule {}
```

**File:** `src/app.module.ts` (Main Application Module)

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

// Existing modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProductsModule } from './modules/products/products.module';
// ... other existing modules

// New Restaurant Module
import { RestaurantModule } from './modules/restaurant/restaurant.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      // database config
    }),

    // Existing modules
    AuthModule,
    UsersModule,
    ProductsModule,
    // ... other modules

    // Restaurant features (conditionally loaded based on settings)
    RestaurantModule,
  ],
})
export class AppModule {}
```

**Swagger API Grouping:**

```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Yoga POS API')
    .setDescription('Multi-purpose POS System API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Users', 'User management')
    .addTag('Products', 'Product/Menu management')
    .addTag('POS', 'Point of Sale operations')

    // Restaurant-specific tags
    .addTag('Restaurant - Tables', 'Table management (Restaurant mode)')
    .addTag('Restaurant - Kitchen', 'Kitchen Display System (Restaurant mode)')
    .addTag('Restaurant - Orders', 'Restaurant order management')
    .addTag('Restaurant - Modifiers', 'Menu modifiers (Restaurant mode)')
    .addTag('Restaurant - QR Ordering', 'QR code ordering system')
    .addTag('Restaurant - Recipes', 'Recipe management')
    .addTag('Restaurant - Servers', 'Server management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}
bootstrap();
```

---

## 7. API Response Formats & DTOs

### 7.1 Standard API Response Format

**Success Response:**
```typescript
{
  success: true,
  data: T, // Generic type for the response data
  message?: string,
  meta?: {
    page?: number,
    limit?: number,
    total?: number,
    totalPages?: number
  }
}
```

**Error Response:**
```typescript
{
  success: false,
  error: {
    code: string, // Error code (e.g., 'RESTAURANT_MODE_DISABLED')
    message: string, // Human-readable error message
    details?: any, // Additional error details
    timestamp: string,
    path: string
  }
}
```

### 7.2 Common DTOs for Restaurant Features

**Table Response DTO:**
```typescript
export class TableResponseDto {
  id: string;
  number: string;
  name?: string;
  capacity: number;
  status: TableStatus;
  floor: string;
  section: string;
  position: { x: number; y: number };
  shape: TableShape;
  currentOrder?: {
    id: string;
    orderNumber: string;
    totalAmount: number;
  };
  server?: {
    id: string;
    name: string;
  };
  lastSeated?: Date;
  lastCleared?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

**Restaurant Order Response DTO:**
```typescript
export class RestaurantOrderResponseDto {
  id: string;
  orderNumber: string;
  table?: TableResponseDto;
  serviceType: ServiceType;
  status: RestaurantOrderStatus;
  items: OrderItemDto[];
  customer?: CustomerSummaryDto;
  server?: UserSummaryDto;
  timing: {
    orderPlaced: Date;
    confirmedAt?: Date;
    preparingAt?: Date;
    readyAt?: Date;
    servedAt?: Date;
    completedAt?: Date;
  };
  payment: {
    subtotal: number;
    tax: number;
    tip?: number;
    discount?: number;
    total: number;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

**Pagination DTO:**
```typescript
export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
```

### 7.3 API Versioning Strategy

**Version 1 (v1):**
- All existing retail endpoints
- New restaurant endpoints

**URL Structure:**
```
/api/v1/products          # Existing endpoint
/api/v1/tables            # New restaurant endpoint
/api/v1/restaurant-orders # New restaurant endpoint
/api/v1/modifiers         # New restaurant endpoint
```

**Header-based versioning (alternative):**
```
GET /api/products
Headers:
  Accept-Version: v1
```

### 7.4 WebSocket Events for Real-time Updates

**Table Status Updates:**
```typescript
// Event: 'table:status:updated'
{
  tableId: string;
  oldStatus: TableStatus;
  newStatus: TableStatus;
  timestamp: Date;
}
```

**Order Status Updates:**
```typescript
// Event: 'order:status:updated'
{
  orderId: string;
  orderNumber: string;
  oldStatus: RestaurantOrderStatus;
  newStatus: RestaurantOrderStatus;
  station?: string;
  timestamp: Date;
}
```

**Kitchen Order Queue Updates:**
```typescript
// Event: 'kitchen:order:new'
{
  orderId: string;
  station: string;
  priority: OrderPriority;
  items: OrderItemDto[];
  timestamp: Date;
}
```

---

## 8. API Endpoints Specification

### 8.1 New Endpoints

#### Tables
```
GET    /api/tables                     # List all tables
POST   /api/tables                     # Create table
GET    /api/tables/:id                 # Get table details
PUT    /api/tables/:id                 # Update table
DELETE /api/tables/:id                 # Delete table
PATCH  /api/tables/:id/status          # Update table status
GET    /api/tables/available           # Get available tables
```

#### Floor Plans
```
GET    /api/floor-plans                # List floor plans
POST   /api/floor-plans                # Create floor plan
GET    /api/floor-plans/:id            # Get floor plan
PUT    /api/floor-plans/:id            # Update floor plan
DELETE /api/floor-plans/:id            # Delete floor plan
PATCH  /api/floor-plans/:id/activate   # Set as active
```

#### Restaurant Orders
```
GET    /api/restaurant-orders          # List orders
POST   /api/restaurant-orders          # Create order
GET    /api/restaurant-orders/:id      # Get order details
PUT    /api/restaurant-orders/:id      # Update order
DELETE /api/restaurant-orders/:id      # Cancel order
PATCH  /api/restaurant-orders/:id/status # Update status
POST   /api/restaurant-orders/:id/items # Add items to order
DELETE /api/restaurant-orders/:id/items/:itemId # Remove item
GET    /api/restaurant-orders/kitchen  # Get kitchen queue
GET    /api/restaurant-orders/table/:tableId # Get orders by table
```

#### Modifiers
```
GET    /api/modifiers                  # List all modifiers
POST   /api/modifiers                  # Create modifier
GET    /api/modifiers/:id              # Get modifier
PUT    /api/modifiers/:id              # Update modifier
DELETE /api/modifiers/:id              # Delete modifier
```

#### Modifier Groups
```
GET    /api/modifier-groups            # List groups
POST   /api/modifier-groups            # Create group
GET    /api/modifier-groups/:id        # Get group
PUT    /api/modifier-groups/:id        # Update group
DELETE /api/modifier-groups/:id        # Delete group
```

#### Recipes
```
GET    /api/recipes                    # List recipes
POST   /api/recipes                    # Create recipe
GET    /api/recipes/:id                # Get recipe
PUT    /api/recipes/:id                # Update recipe
DELETE /api/recipes/:id                # Delete recipe
GET    /api/recipes/product/:productId # Get recipe by product
POST   /api/recipes/:id/cost           # Calculate recipe cost
```

#### Kitchen Stations
```
GET    /api/kitchen-stations           # List stations
POST   /api/kitchen-stations           # Create station
GET    /api/kitchen-stations/:id       # Get station
PUT    /api/kitchen-stations/:id       # Update station
DELETE /api/kitchen-stations/:id       # Delete station
GET    /api/kitchen-stations/:id/orders # Get orders for station
```

#### Servers
```
GET    /api/servers                    # List servers
POST   /api/servers                    # Create server
GET    /api/servers/:id                # Get server
PUT    /api/servers/:id                # Update server
GET    /api/servers/:id/assignments    # Get server assignments
POST   /api/servers/:id/assignments    # Assign server
GET    /api/servers/:id/performance    # Get performance metrics
GET    /api/servers/:id/tips           # Get tip history
```

#### QR Code Ordering
```
# QR Code Management (Admin)
GET    /api/qr-codes                   # List all QR codes
POST   /api/qr-codes/generate          # Generate QR codes for tables
GET    /api/qr-codes/table/:tableId    # Get QR code for specific table
POST   /api/qr-codes/regenerate/:tableId # Regenerate QR code
DELETE /api/qr-codes/:id               # Delete QR code
GET    /api/qr-codes/download/:tableId # Download QR code image
POST   /api/qr-codes/bulk-download     # Download all QR codes as ZIP

# Customer-Facing Menu API (Public/No Auth)
GET    /api/public/menu/:branchId      # Get public menu for branch
GET    /api/public/menu/:branchId/categories # Get menu categories
GET    /api/public/menu/:branchId/items # Get menu items
GET    /api/public/menu/item/:itemId   # Get item details with modifiers

# QR Order Session Management
POST   /api/qr-sessions/start          # Start new session (on QR scan)
GET    /api/qr-sessions/:sessionToken  # Get session details
PATCH  /api/qr-sessions/:sessionToken/heartbeat # Keep session alive
POST   /api/qr-sessions/:sessionToken/close # Close session
GET    /api/qr-sessions/:sessionToken/orders # Get all orders in session

# Customer Order Placement (Session-based auth)
POST   /api/qr-orders                  # Create order from QR
GET    /api/qr-orders/:orderId         # Get order status
GET    /api/qr-orders/:orderId/track   # Track order with real-time updates
POST   /api/qr-orders/:orderId/rate    # Rate order/items (optional)

# Customer Actions
POST   /api/qr-sessions/:sessionToken/call-server  # Request server assistance
POST   /api/qr-sessions/:sessionToken/request-bill # Request bill
POST   /api/qr-sessions/:sessionToken/payment      # Submit online payment

# QR Analytics (Admin)
GET    /api/qr-analytics/sessions      # Active/past sessions
GET    /api/qr-analytics/orders        # Orders from QR
GET    /api/qr-analytics/popular-items # Popular items via QR
GET    /api/qr-analytics/usage         # QR scan statistics
```

### 8.2 Enhanced Endpoints

#### Products (now Menu Items in restaurant mode)
```
GET    /api/products?businessType=restaurant
POST   /api/products (include restaurant fields)
```

#### Settings
```
GET    /api/settings
PUT    /api/settings (include businessType and restaurantSettings)
```

### 8.3 Real-time Updates (WebSocket/SSE)

For real-time features (optional but recommended):
```
WS     /api/ws/tables                  # Table status updates
WS     /api/ws/orders                  # Order status updates
WS     /api/ws/kitchen/:station        # Kitchen order updates
```

---

## 9. Testing Strategy

### 9.1 Unit Tests

Test coverage for:
- All service methods (TablesService, RestaurantOrdersService, etc.)
- Business logic functions
- Utility functions
- DTO validation
- Calculations (tip, split payment, recipe cost)
- Guard implementations
- Decorators

**Target:** 80%+ code coverage

### 9.2 Integration Tests

Test:
- Business type switching via API
- Feature flag toggling via settings endpoints
- Settings persistence in database
- Entity relationships (orders, tables, modifiers)
- Authentication and authorization guards
- WebSocket connections

### 9.3 API Endpoint Tests

Test:
- All CRUD operations for each entity
- Input validation and error handling
- Response format and status codes
- Pagination and filtering
- Sorting and searching
- Authentication requirements
- Authorization based on restaurant mode

### 9.4 End-to-End API Tests

Test complete workflows via API:
1. **Dine-in Order Flow**
   - Create table via API
   - Create order with table assignment
   - Add items with modifiers
   - Update order status through workflow
   - Process payment with tip

2. **Takeout Order Flow**
   - Create takeout order
   - Add items
   - Process payment
   - Complete order

3. **Table Management Flow**
   - Create floor plan
   - Add tables to floor plan
   - Update table status
   - Assign server to table

4. **Kitchen Workflow**
   - Order routing to stations
   - Status updates from kitchen
   - Order completion

5. **QR Ordering Flow**
   - Generate QR code
   - Start session
   - Place guest order
   - Track order status

### 9.5 Performance Tests

- Load testing with concurrent requests
- Database query performance
- WebSocket connection handling under load
- API response time benchmarks
- Order processing throughput
- Concurrent order creation

### 9.6 Database Tests

- Migration execution on clean database
- Data integrity after migrations
- Rollback scenarios
- Index effectiveness
- Constraint validation

---

## 10. Migration & Rollout

### 10.1 Data Migration

**No migration needed for existing users** - they continue in retail mode by default.

Database migration will add new settings fields with sensible defaults:
```typescript
// Migration will set:
businessType: 'retail' // Default for existing users
restaurantSettings: {
  enabled: false, // Default
  features: {
    tableManagement: true,
    kitchenDisplay: true,
    // ... other features set to true
  }
}
```

**Migration Steps:**
1. Create migration file for Settings entity updates
2. Add new restaurant-specific tables (tables, floor_plans, etc.)
3. Add enums for restaurant operations
4. Test migration on development database
5. Test migration on staging database
6. Execute migration on production with backup

### 10.2 Feature Flags

Use feature flags in settings for gradual rollout:
```typescript
// Settings table configuration
{
  restaurantMode: {
    enabled: true,
    rolloutPercentage: 0, // Start at 0%, increase gradually
    betaOrganizations: ['org-id-1', 'org-id-2'], // Early access
  }
}
```

Backend guards will check these flags before allowing access to restaurant endpoints.

### 10.3 Rollout Plan

**Phase 1: Internal Testing (Week 1-2)**
- Enable for development team
- Internal QA testing
- Bug fixes

**Phase 2: Beta Testing (Week 3-4)**
- Enable for selected beta users (5-10 restaurants)
- Gather feedback
- Iterate on issues

**Phase 3: Limited Release (Week 5-6)**
- Enable for 25% of new users
- Monitor performance and errors
- Collect user feedback

**Phase 4: General Availability (Week 7+)**
- Enable for all users
- Marketing announcement
- Documentation release
- Training materials

### 10.4 Documentation

**API Documentation:**
- OpenAPI/Swagger documentation for all endpoints
- Authentication and authorization guide
- WebSocket event documentation
- Error codes and handling
- Rate limiting policies
- Example requests and responses

**Developer Documentation:**
- Backend architecture overview
- Database schema documentation
- Entity relationship diagrams
- Business logic documentation
- Guards and decorators guide
- Testing guide
- Migration guide
- Deployment guide
- Contributing guide

### 10.5 Monitoring & Support

**Monitoring:**
- API endpoint monitoring
- Database performance monitoring
- Error tracking and logging
- WebSocket connection monitoring
- Response time tracking
- Server resource utilization

**Support:**
- API support documentation
- Integration troubleshooting guide
- Error code reference
- Support ticket system
- Developer community forum

---

## 11. Success Metrics

### 11.1 Technical Metrics

- Zero critical bugs in production
- < 100ms API response time for most endpoints
- < 500ms for complex queries
- 99.9% uptime
- 80%+ test coverage
- Database query performance < 50ms average
- WebSocket message latency < 100ms

### 11.2 Business Metrics

- Number of restaurants using the system
- Average orders per day
- Customer satisfaction score (CSAT)
- Feature adoption rates
- User retention

### 11.3 API Usage Metrics

- API requests per minute
- Order creation throughput
- Concurrent user capacity
- Error rate per endpoint (< 0.1%)
- Average order processing time
- Kitchen order completion time via API
- QR ordering API usage
- WebSocket connection stability

---

## 12. Future Enhancements

### 12.1 Phase 2 Features (Post-Launch)

1. **Reservation System Backend**
   - Reservation entity and management
   - Table booking API
   - Wait list management API
   - SMS/email notification integration
   - Reservation conflict detection

2. **Enhanced QR Ordering Features**
   - Customer account system (optional login)
   - Loyalty points calculation API
   - Advanced split payment for QR orders
   - Group order session management
   - Multi-language menu content support
   - Voice order processing integration
   - Advanced allergen filtering

3. **Delivery Platform Integration**
   - Third-party delivery API integration (UberEats, DoorDash, GrubHub)
   - Unified order aggregation service
   - Commission tracking and reporting
   - Menu synchronization with platforms

4. **Advanced Analytics Backend**
   - Predictive analytics algorithms
   - Demand forecasting models
   - Machine learning for menu optimization
   - Inventory prediction
   - Staff scheduling optimization

5. **Customer Account System**
   - Customer authentication API
   - Loyalty program backend
   - Saved payment methods
   - Order history and favorites

6. **Multi-language Support**
   - Internationalization (i18n) for menu data
   - Multi-language product descriptions
   - Language preference handling

### 12.2 Other Business Types

Consider adding support for:
- Coffee shops / Cafes
- Bars / Nightclubs
- Food trucks
- Salons / Spas
- Gyms / Fitness centers

---

## 13. Risk Assessment & Mitigation

### 13.1 Technical Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Database performance with high load | High | Medium | Query optimization, indexing, caching |
| Performance with many concurrent orders | High | Medium | Pagination, database optimization, load balancing |
| Real-time sync issues | Medium | Medium | WebSocket fallback, message queuing |
| Hardware integration issues | Medium | Low | Thorough hardware testing, fallback options |
| Data consistency in distributed system | High | Medium | Transaction management, proper locking strategies |

### 13.2 Business Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| API adoption challenges | High | Medium | Comprehensive documentation, example code |
| Feature complexity | Medium | High | Well-documented endpoints, clear API design |
| Restaurant adoption | High | Medium | Beta testing, feedback iteration |
| Support burden | Medium | High | Good API documentation, troubleshooting guides |

### 13.3 Integration Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Complex API workflows | High | High | Clear documentation, well-designed endpoints |
| Learning curve for developers | Medium | High | API documentation, examples, SDK (future) |
| Third-party integration issues | High | Medium | Webhook support, flexible API design |

---

## 14. Appendices

### Appendix A: Restaurant Categories
```javascript
const restaurantCategories = [
  { id: 'appetizers', name: 'Appetizers', icon: '🥗' },
  { id: 'salads', name: 'Salads', icon: '🥙' },
  { id: 'soups', name: 'Soups', icon: '🍲' },
  { id: 'main-course', name: 'Main Course', icon: '🍽️' },
  { id: 'seafood', name: 'Seafood', icon: '🦞' },
  { id: 'meat', name: 'Meat', icon: '🥩' },
  { id: 'poultry', name: 'Poultry', icon: '🍗' },
  { id: 'pasta', name: 'Pasta', icon: '🍝' },
  { id: 'pizza', name: 'Pizza', icon: '🍕' },
  { id: 'sides', name: 'Sides', icon: '🍟' },
  { id: 'desserts', name: 'Desserts', icon: '🍰' },
  { id: 'beverages', name: 'Beverages', icon: '🥤' },
  { id: 'alcoholic', name: 'Alcoholic Beverages', icon: '🍷' },
  { id: 'coffee-tea', name: 'Coffee & Tea', icon: '☕' },
  { id: 'kids', name: 'Kids Menu', icon: '🧒' },
  { id: 'specials', name: 'Specials', icon: '⭐' },
];
```

### Appendix B: Dietary Tags
```javascript
const dietaryTags = [
  { id: 'vegetarian', name: 'Vegetarian', icon: '🥬', color: '#10B981' },
  { id: 'vegan', name: 'Vegan', icon: '🌱', color: '#10B981' },
  { id: 'gluten-free', name: 'Gluten Free', icon: '🌾', color: '#F59E0B' },
  { id: 'dairy-free', name: 'Dairy Free', icon: '🥛', color: '#3B82F6' },
  { id: 'nut-free', name: 'Nut Free', icon: '🥜', color: '#EF4444' },
  { id: 'spicy', name: 'Spicy', icon: '🌶️', color: '#DC2626' },
  { id: 'halal', name: 'Halal', icon: '🕌', color: '#8B5CF6' },
  { id: 'kosher', name: 'Kosher', icon: '✡️', color: '#6366F1' },
  { id: 'organic', name: 'Organic', icon: '🌿', color: '#059669' },
];
```

### Appendix C: Order Status Colors
```javascript
const orderStatusColors = {
  pending: { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' },
  confirmed: { bg: '#DBEAFE', text: '#1E40AF', border: '#93C5FD' },
  preparing: { bg: '#FED7AA', text: '#9A3412', border: '#FDBA74' },
  ready: { bg: '#D1FAE5', text: '#065F46', border: '#6EE7B7' },
  served: { bg: '#E0E7FF', text: '#3730A3', border: '#C7D2FE' },
  completed: { bg: '#D1D5DB', text: '#1F2937', border: '#9CA3AF' },
  cancelled: { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' },
};
```

### Appendix D: Table Status Colors
```javascript
const tableStatusColors = {
  available: { bg: '#D1FAE5', text: '#065F46', border: '#6EE7B7' },
  occupied: { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' },
  reserved: { bg: '#DBEAFE', text: '#1E40AF', border: '#93C5FD' },
  cleaning: { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' },
};
```

---

## 15. Glossary

- **Business Type**: The operational mode of the POS system (retail or restaurant)
- **Course**: A stage in a multi-course meal (appetizer, main, dessert)
- **Dine-in**: Service type where customers eat at the restaurant
- **Floor Plan**: Visual layout of tables and sections in a restaurant
- **KDS**: Kitchen Display System - screen showing orders for kitchen staff
- **Modifier**: Customization option for menu items (e.g., add cheese, no onions)
- **Service Type**: How the order is fulfilled (dine-in, takeout, delivery)
- **Split Payment**: Dividing the bill among multiple payers
- **Station**: Kitchen work area (e.g., grill, bar, dessert)
- **Table Turnover**: Time between seating and clearing a table
- **Takeout**: Service type where customers order food to go
- **Tip Pool**: Shared tips distributed among staff

---

## Document Control

**Version History:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-12 | System | Initial plan created |

**Approval:**

- [ ] Product Owner
- [ ] Technical Lead
- [ ] UX Lead
- [ ] QA Lead

**Next Review Date:** TBD after Phase 1 completion

---

**End of Document**
