# Database Migrations and Seeds

This document provides information about database migrations and seed data for the Yoga POS Backend application.

## Overview

The application uses TypeORM for database management with PostgreSQL. All migrations and seed data are located in the `src/database` directory.

## Directory Structure

```
src/database/
├── data-source.ts              # TypeORM CLI configuration
├── database.config.ts          # NestJS TypeORM configuration
├── migrations/                 # Database migration files
│   └── 1699900000000-InitialSchema.ts
└── seeds/                      # Database seed files
    ├── 1-permissions.seed.ts
    ├── 2-roles.seed.ts
    ├── 3-branches.seed.ts
    ├── 4-users.seed.ts
    ├── 5-suppliers.seed.ts
    ├── 6-categories.seed.ts
    ├── 7-products.seed.ts
    ├── 8-customers.seed.ts
    └── run-seed.ts             # Seed runner script
```

## Prerequisites

1. PostgreSQL database installed and running
2. Environment variables configured in `.env` file:
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=postgres
   DB_DATABASE=yoga_pos_db
   DB_SYNC=false
   DB_LOGGING=true
   ```

## Database Setup

### Step 1: Create Database

Create a new PostgreSQL database:

```bash
# Using psql
psql -U postgres
CREATE DATABASE yoga_pos_db;
\q
```

Or using SQL client of your choice.

### Step 2: Run Migrations

Run all pending migrations to create the database schema:

```bash
npm run migration:run
```

This will create all tables, relationships, indexes, and enums defined in the migration files.

### Step 3: Seed Database

Populate the database with test data:

```bash
npm run seed
```

This will create:
- **Permissions**: 64 permissions covering all resources
- **Roles**: 6 roles (Admin, Manager, Cashier, Inventory Manager, Sales Associate, Accountant)
- **Branches**: 3 branches (Headquarters, Westside, Hollywood)
- **Users**: 7 users with different roles
- **Suppliers**: 4 suppliers
- **Categories**: 5 main categories with 10 subcategories
- **Products**: 15 products across different categories
- **Customers**: 10 customers with loyalty information

## Available NPM Scripts

### Migration Commands

```bash
# Run all pending migrations
npm run migration:run

# Revert the last migration
npm run migration:revert

# Generate a new migration based on entity changes
npm run migration:generate -- src/database/migrations/MigrationName

# Create a blank migration file
npm run migration:create -- src/database/migrations/MigrationName
```

### Seed Commands

```bash
# Run all seed files
npm run seed
```

## Test User Credentials

After seeding, you can use these credentials to test the application:

| Username      | Password        | Role              | PIN  |
|---------------|-----------------|-------------------|------|
| admin         | Admin123!       | Administrator     | 1234 |
| manager1      | Manager123!     | Manager           | 2345 |
| cashier1      | Cashier123!     | Cashier           | 3456 |
| cashier2      | Cashier123!     | Cashier           | 4567 |
| inventory1    | Inventory123!   | Inventory Manager | 5678 |
| sales1        | Sales123!       | Sales Associate   | 6789 |
| accountant1   | Accountant123!  | Accountant        | 7890 |

## Database Schema

### Core Entities

1. **Users & Authentication**
   - `users` - System users with authentication
   - `roles` - User roles with permissions
   - `permissions` - Granular permissions for resources
   - `user_roles` - Many-to-many join table
   - `role_permissions` - Many-to-many join table

2. **Inventory Management**
   - `products` - Product catalog
   - `product_categories` - Product categories (supports subcategories)
   - `suppliers` - Supplier information
   - `stock_levels` - Inventory levels per location
   - `inventory_transactions` - Inventory movement history

3. **Sales & Customers**
   - `customers` - Customer information with loyalty data
   - `sales` - Sales transactions
   - `sale_items` - Individual items in sales
   - `invoices` - Customer invoices
   - `invoice_items` - Individual items in invoices
   - `payments` - Payment records

4. **Operations**
   - `branches` - Store locations
   - `expenses` - Business expenses
   - `purchase_orders` - Orders to suppliers
   - `purchase_order_items` - Items in purchase orders

### Enums

The schema includes several PostgreSQL enums:
- `user_status_enum` - User account status
- `invoice_status_enum` - Invoice statuses
- `payment_status_enum` - Payment statuses
- `sale_type_enum` - Types of sales
- `payment_method_enum` - Payment methods
- `transaction_type_enum` - Inventory transaction types
- `transaction_status_enum` - Transaction statuses
- `expense_category_enum` - Expense categories
- `po_status_enum` - Purchase order statuses

## Seed Data Details

### Permissions (64 total)

Permissions are organized by resource and action:
- Users: read, create, update, delete
- Roles: read, create, update, delete
- Products: read, create, update, delete
- Categories: read, create, update, delete
- Sales: read, create, update, delete
- Customers: read, create, update, delete
- Invoices: read, create, update, delete
- Payments: read, create, update, delete
- Inventory: read, update, transfer
- Suppliers: read, create, update, delete
- Purchase Orders: read, create, update, delete
- Branches: read, create, update, delete
- Expenses: read, create, update, delete
- Reports: sales, inventory, financial

### Roles (6 total)

1. **Administrator** - Full system access
2. **Manager** - Most permissions except system administration
3. **Cashier** - POS operations and basic customer management
4. **Inventory Manager** - Inventory and stock management
5. **Sales Associate** - Sales and customer service
6. **Accountant** - Financial and reporting permissions

### Products (15 total)

Products are organized into categories:
- **Yoga Mats**: Premium, Travel, Eco-friendly (4 products)
- **Yoga Apparel**: Women's and Men's clothing (3 products)
- **Accessories**: Blocks, Straps, Bolsters (3 products)
- **Meditation**: Cushions, Incense (2 products)
- **Wellness**: Supplements (1 product)

## Troubleshooting

### Migration fails with "relation already exists"

This means tables already exist. Either:
1. Drop the database and recreate it
2. Or revert migrations first: `npm run migration:revert`

### Seed fails with "duplicate key value"

Seeds are idempotent and check for existing records. If you see this error:
1. Check your database for existing data
2. Seeds will skip existing records and continue

### Connection refused error

Ensure PostgreSQL is running:
```bash
# On macOS with Homebrew
brew services start postgresql

# On Linux with systemd
sudo systemctl start postgresql

# Check status
pg_isready
```

## Best Practices

1. **Never use `synchronize: true` in production** - Always use migrations
2. **Review migrations before running** - Especially in production
3. **Backup before migrations** - Always backup production data first
4. **Test migrations locally first** - Run migrations in development before production
5. **Keep migrations reversible** - Always implement the `down` method

## Development Workflow

1. Make changes to entity files
2. Generate migration: `npm run migration:generate -- src/database/migrations/DescriptiveName`
3. Review generated migration file
4. Run migration: `npm run migration:run`
5. Test changes
6. If issues, revert: `npm run migration:revert`

## Production Deployment

1. Backup production database
2. Review all pending migrations
3. Test migrations in staging environment
4. Run migrations in production: `npm run migration:run`
5. Verify application functionality
6. Monitor for issues

## Additional Resources

- [TypeORM Documentation](https://typeorm.io/)
- [TypeORM Migrations Guide](https://typeorm.io/migrations)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
