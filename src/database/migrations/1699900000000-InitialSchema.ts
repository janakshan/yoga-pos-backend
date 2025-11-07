import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1699900000000 implements MigrationInterface {
  name = 'InitialSchema1699900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enums
    await queryRunner.query(`
      CREATE TYPE "user_status_enum" AS ENUM('active', 'inactive', 'suspended')
    `);
    await queryRunner.query(`
      CREATE TYPE "invoice_status_enum" AS ENUM('draft', 'pending', 'paid', 'overdue', 'cancelled')
    `);
    await queryRunner.query(`
      CREATE TYPE "payment_status_enum" AS ENUM('pending', 'completed', 'failed', 'refunded')
    `);
    await queryRunner.query(`
      CREATE TYPE "sale_type_enum" AS ENUM('pos', 'online', 'phone', 'walk-in')
    `);
    await queryRunner.query(`
      CREATE TYPE "payment_method_enum" AS ENUM('cash', 'card', 'bank_transfer', 'mobile_payment', 'check', 'other')
    `);
    await queryRunner.query(`
      CREATE TYPE "transaction_type_enum" AS ENUM('purchase', 'sale', 'return', 'adjustment', 'transfer', 'damage', 'loss')
    `);
    await queryRunner.query(`
      CREATE TYPE "transaction_status_enum" AS ENUM('pending', 'completed', 'cancelled')
    `);
    await queryRunner.query(`
      CREATE TYPE "expense_category_enum" AS ENUM('rent', 'utilities', 'salaries', 'supplies', 'marketing', 'maintenance', 'insurance', 'taxes', 'other')
    `);
    await queryRunner.query(`
      CREATE TYPE "po_status_enum" AS ENUM('draft', 'pending', 'approved', 'ordered', 'received', 'cancelled')
    `);

    // Create permissions table
    await queryRunner.query(`
      CREATE TABLE "permissions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code" character varying NOT NULL,
        "name" character varying NOT NULL,
        "description" text,
        "resource" character varying NOT NULL,
        "action" character varying NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_permissions_code" UNIQUE ("code"),
        CONSTRAINT "PK_permissions" PRIMARY KEY ("id")
      )
    `);

    // Create roles table
    await queryRunner.query(`
      CREATE TABLE "roles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code" character varying NOT NULL,
        "name" character varying NOT NULL,
        "description" text,
        "isSystem" boolean NOT NULL DEFAULT false,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_roles_code" UNIQUE ("code"),
        CONSTRAINT "PK_roles" PRIMARY KEY ("id")
      )
    `);

    // Create role_permissions join table
    await queryRunner.query(`
      CREATE TABLE "role_permissions" (
        "role_id" uuid NOT NULL,
        "permission_id" uuid NOT NULL,
        CONSTRAINT "PK_role_permissions" PRIMARY KEY ("role_id", "permission_id")
      )
    `);

    // Create branches table
    await queryRunner.query(`
      CREATE TABLE "branches" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code" character varying NOT NULL,
        "name" character varying NOT NULL,
        "address" text,
        "city" character varying,
        "state" character varying,
        "country" character varying,
        "postalCode" character varying,
        "phone" character varying,
        "email" character varying,
        "manager_id" uuid,
        "isActive" boolean NOT NULL DEFAULT true,
        "settings" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_branches_code" UNIQUE ("code"),
        CONSTRAINT "PK_branches" PRIMARY KEY ("id")
      )
    `);

    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "username" character varying NOT NULL,
        "email" character varying NOT NULL,
        "password" character varying NOT NULL,
        "pin" character varying,
        "firstName" character varying,
        "lastName" character varying,
        "phone" character varying,
        "avatar" character varying,
        "status" "user_status_enum" NOT NULL DEFAULT 'active',
        "branch_id" uuid,
        "preferences" jsonb,
        "staffProfile" jsonb,
        "lastLogin" TIMESTAMP,
        "refreshToken" character varying,
        "pinAttempts" integer NOT NULL DEFAULT 0,
        "pinLockedUntil" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_username" UNIQUE ("username"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    // Create user_roles join table
    await queryRunner.query(`
      CREATE TABLE "user_roles" (
        "user_id" uuid NOT NULL,
        "role_id" uuid NOT NULL,
        CONSTRAINT "PK_user_roles" PRIMARY KEY ("user_id", "role_id")
      )
    `);

    // Create customers table
    await queryRunner.query(`
      CREATE TABLE "customers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code" character varying NOT NULL,
        "firstName" character varying NOT NULL,
        "lastName" character varying,
        "email" character varying,
        "phone" character varying,
        "dateOfBirth" TIMESTAMP,
        "address" jsonb,
        "loyaltyInfo" jsonb,
        "totalPurchases" numeric(10,2) NOT NULL DEFAULT 0,
        "isActive" boolean NOT NULL DEFAULT true,
        "notes" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_customers_code" UNIQUE ("code"),
        CONSTRAINT "UQ_customers_email" UNIQUE ("email"),
        CONSTRAINT "PK_customers" PRIMARY KEY ("id")
      )
    `);

    // Create suppliers table
    await queryRunner.query(`
      CREATE TABLE "suppliers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code" character varying NOT NULL,
        "name" character varying NOT NULL,
        "contactPerson" character varying,
        "email" character varying,
        "phone" character varying,
        "address" jsonb,
        "taxId" character varying,
        "paymentTerms" jsonb,
        "bankDetails" jsonb,
        "isActive" boolean NOT NULL DEFAULT true,
        "rating" numeric(3,1),
        "totalPurchased" numeric(12,2) NOT NULL DEFAULT 0,
        "totalOwed" numeric(12,2) NOT NULL DEFAULT 0,
        "averageDeliveryDays" numeric(5,2),
        "notes" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_suppliers_code" UNIQUE ("code"),
        CONSTRAINT "PK_suppliers" PRIMARY KEY ("id")
      )
    `);

    // Create product_categories table
    await queryRunner.query(`
      CREATE TABLE "product_categories" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "code" character varying NOT NULL,
        "description" text,
        "parent_id" uuid,
        "displayOrder" integer,
        "isActive" boolean NOT NULL DEFAULT true,
        "imageUrl" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_categories_code" UNIQUE ("code"),
        CONSTRAINT "PK_product_categories" PRIMARY KEY ("id")
      )
    `);

    // Create products table
    await queryRunner.query(`
      CREATE TABLE "products" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "sku" character varying NOT NULL,
        "name" character varying NOT NULL,
        "description" text,
        "category_id" uuid,
        "subcategory_id" uuid,
        "supplier_id" uuid,
        "barcode" character varying,
        "price" numeric(10,2) NOT NULL,
        "cost" numeric(10,2),
        "taxRate" numeric(5,2) NOT NULL DEFAULT 0,
        "unit" character varying,
        "reorderLevel" integer NOT NULL DEFAULT 0,
        "reorderQuantity" integer NOT NULL DEFAULT 0,
        "isActive" boolean NOT NULL DEFAULT true,
        "isFeatured" boolean NOT NULL DEFAULT false,
        "trackInventory" boolean NOT NULL DEFAULT true,
        "allowBackorder" boolean NOT NULL DEFAULT false,
        "imageUrl" character varying,
        "images" jsonb,
        "attributes" jsonb,
        "dimensions" jsonb,
        "seo" jsonb,
        "customFields" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_products_sku" UNIQUE ("sku"),
        CONSTRAINT "PK_products" PRIMARY KEY ("id")
      )
    `);

    // Create sales table
    await queryRunner.query(`
      CREATE TABLE "sales" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "saleNumber" character varying NOT NULL,
        "customer_id" uuid,
        "user_id" uuid NOT NULL,
        "branch_id" uuid NOT NULL,
        "saleDate" TIMESTAMP NOT NULL DEFAULT now(),
        "saleType" "sale_type_enum" NOT NULL DEFAULT 'pos',
        "subtotal" numeric(10,2) NOT NULL,
        "taxAmount" numeric(10,2) NOT NULL DEFAULT 0,
        "discountAmount" numeric(10,2) NOT NULL DEFAULT 0,
        "totalAmount" numeric(10,2) NOT NULL,
        "paidAmount" numeric(10,2) NOT NULL DEFAULT 0,
        "changeAmount" numeric(10,2) NOT NULL DEFAULT 0,
        "paymentStatus" "payment_status_enum" NOT NULL DEFAULT 'pending',
        "paymentMethod" "payment_method_enum",
        "notes" text,
        "metadata" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_sales_saleNumber" UNIQUE ("saleNumber"),
        CONSTRAINT "PK_sales" PRIMARY KEY ("id")
      )
    `);

    // Create sale_items table
    await queryRunner.query(`
      CREATE TABLE "sale_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "sale_id" uuid NOT NULL,
        "product_id" uuid NOT NULL,
        "quantity" integer NOT NULL,
        "unitPrice" numeric(10,2) NOT NULL,
        "discount" numeric(10,2) NOT NULL DEFAULT 0,
        "taxRate" numeric(5,2) NOT NULL DEFAULT 0,
        "taxAmount" numeric(10,2) NOT NULL DEFAULT 0,
        "total" numeric(10,2) NOT NULL,
        "notes" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sale_items" PRIMARY KEY ("id")
      )
    `);

    // Create invoices table
    await queryRunner.query(`
      CREATE TABLE "invoices" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "invoiceNumber" character varying NOT NULL,
        "customer_id" uuid NOT NULL,
        "sale_id" uuid,
        "user_id" uuid NOT NULL,
        "branch_id" uuid NOT NULL,
        "invoiceDate" TIMESTAMP NOT NULL DEFAULT now(),
        "dueDate" TIMESTAMP NOT NULL,
        "status" "invoice_status_enum" NOT NULL DEFAULT 'draft',
        "subtotal" numeric(10,2) NOT NULL,
        "taxAmount" numeric(10,2) NOT NULL DEFAULT 0,
        "discountAmount" numeric(10,2) NOT NULL DEFAULT 0,
        "totalAmount" numeric(10,2) NOT NULL,
        "paidAmount" numeric(10,2) NOT NULL DEFAULT 0,
        "balanceAmount" numeric(10,2) NOT NULL,
        "notes" text,
        "terms" text,
        "metadata" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_invoices_invoiceNumber" UNIQUE ("invoiceNumber"),
        CONSTRAINT "PK_invoices" PRIMARY KEY ("id")
      )
    `);

    // Create invoice_items table
    await queryRunner.query(`
      CREATE TABLE "invoice_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "invoice_id" uuid NOT NULL,
        "product_id" uuid NOT NULL,
        "description" text,
        "quantity" integer NOT NULL,
        "unitPrice" numeric(10,2) NOT NULL,
        "discount" numeric(10,2) NOT NULL DEFAULT 0,
        "taxRate" numeric(5,2) NOT NULL DEFAULT 0,
        "taxAmount" numeric(10,2) NOT NULL DEFAULT 0,
        "total" numeric(10,2) NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_invoice_items" PRIMARY KEY ("id")
      )
    `);

    // Create payments table
    await queryRunner.query(`
      CREATE TABLE "payments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "paymentNumber" character varying NOT NULL,
        "invoice_id" uuid,
        "sale_id" uuid,
        "customer_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "paymentDate" TIMESTAMP NOT NULL DEFAULT now(),
        "amount" numeric(10,2) NOT NULL,
        "paymentMethod" "payment_method_enum" NOT NULL,
        "paymentStatus" "payment_status_enum" NOT NULL DEFAULT 'completed',
        "referenceNumber" character varying,
        "notes" text,
        "metadata" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_payments_paymentNumber" UNIQUE ("paymentNumber"),
        CONSTRAINT "PK_payments" PRIMARY KEY ("id")
      )
    `);

    // Create expenses table
    await queryRunner.query(`
      CREATE TABLE "expenses" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "expenseNumber" character varying NOT NULL,
        "branch_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "category" "expense_category_enum" NOT NULL,
        "amount" numeric(10,2) NOT NULL,
        "expenseDate" TIMESTAMP NOT NULL DEFAULT now(),
        "vendor" character varying,
        "description" text,
        "receiptUrl" character varying,
        "notes" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_expenses_expenseNumber" UNIQUE ("expenseNumber"),
        CONSTRAINT "PK_expenses" PRIMARY KEY ("id")
      )
    `);

    // Create purchase_orders table
    await queryRunner.query(`
      CREATE TABLE "purchase_orders" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "orderNumber" character varying NOT NULL,
        "supplier_id" uuid NOT NULL,
        "orderDate" TIMESTAMP NOT NULL DEFAULT now(),
        "expectedDeliveryDate" TIMESTAMP,
        "actualDeliveryDate" TIMESTAMP,
        "status" "po_status_enum" NOT NULL DEFAULT 'draft',
        "subtotal" numeric(12,2) NOT NULL,
        "taxAmount" numeric(12,2) NOT NULL DEFAULT 0,
        "shippingCost" numeric(12,2) NOT NULL DEFAULT 0,
        "totalAmount" numeric(12,2) NOT NULL,
        "notes" text,
        "metadata" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_po_orderNumber" UNIQUE ("orderNumber"),
        CONSTRAINT "PK_purchase_orders" PRIMARY KEY ("id")
      )
    `);

    // Create purchase_order_items table
    await queryRunner.query(`
      CREATE TABLE "purchase_order_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "po_id" uuid NOT NULL,
        "product_id" uuid NOT NULL,
        "quantity" integer NOT NULL,
        "unitCost" numeric(12,2) NOT NULL,
        "taxRate" numeric(5,2) NOT NULL DEFAULT 0,
        "taxAmount" numeric(12,2) NOT NULL DEFAULT 0,
        "total" numeric(12,2) NOT NULL,
        "receivedQuantity" integer NOT NULL DEFAULT 0,
        "notes" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_purchase_order_items" PRIMARY KEY ("id")
      )
    `);

    // Create stock_levels table
    await queryRunner.query(`
      CREATE TABLE "stock_levels" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "product_id" uuid NOT NULL,
        "location_id" uuid NOT NULL,
        "quantityOnHand" integer NOT NULL DEFAULT 0,
        "quantityReserved" integer NOT NULL DEFAULT 0,
        "quantityAvailable" integer NOT NULL DEFAULT 0,
        "lastRestocked" TIMESTAMP,
        "lastCounted" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_stock_levels_product_location" UNIQUE ("product_id", "location_id"),
        CONSTRAINT "PK_stock_levels" PRIMARY KEY ("id")
      )
    `);

    // Create inventory_transactions table
    await queryRunner.query(`
      CREATE TABLE "inventory_transactions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "transactionNumber" character varying NOT NULL,
        "product_id" uuid NOT NULL,
        "location_id" uuid NOT NULL,
        "type" "transaction_type_enum" NOT NULL,
        "quantity" integer NOT NULL,
        "previousQuantity" integer NOT NULL,
        "newQuantity" integer NOT NULL,
        "unitCost" numeric(10,2),
        "totalCost" numeric(10,2),
        "referenceType" character varying,
        "referenceId" uuid,
        "user_id" uuid NOT NULL,
        "transactionDate" TIMESTAMP NOT NULL DEFAULT now(),
        "status" "transaction_status_enum" NOT NULL DEFAULT 'completed',
        "notes" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_inventory_transactionNumber" UNIQUE ("transactionNumber"),
        CONSTRAINT "PK_inventory_transactions" PRIMARY KEY ("id")
      )
    `);

    // Add foreign keys for branches
    await queryRunner.query(`
      ALTER TABLE "branches"
      ADD CONSTRAINT "FK_branches_manager"
      FOREIGN KEY ("manager_id")
      REFERENCES "users"("id")
      ON DELETE SET NULL
    `);

    // Add foreign keys for users
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD CONSTRAINT "FK_users_branch"
      FOREIGN KEY ("branch_id")
      REFERENCES "branches"("id")
      ON DELETE SET NULL
    `);

    // Add foreign keys for join tables
    await queryRunner.query(`
      ALTER TABLE "user_roles"
      ADD CONSTRAINT "FK_user_roles_user"
      FOREIGN KEY ("user_id")
      REFERENCES "users"("id")
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "user_roles"
      ADD CONSTRAINT "FK_user_roles_role"
      FOREIGN KEY ("role_id")
      REFERENCES "roles"("id")
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "role_permissions"
      ADD CONSTRAINT "FK_role_permissions_role"
      FOREIGN KEY ("role_id")
      REFERENCES "roles"("id")
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "role_permissions"
      ADD CONSTRAINT "FK_role_permissions_permission"
      FOREIGN KEY ("permission_id")
      REFERENCES "permissions"("id")
      ON DELETE CASCADE
    `);

    // Add foreign keys for product_categories
    await queryRunner.query(`
      ALTER TABLE "product_categories"
      ADD CONSTRAINT "FK_categories_parent"
      FOREIGN KEY ("parent_id")
      REFERENCES "product_categories"("id")
      ON DELETE SET NULL
    `);

    // Add foreign keys for products
    await queryRunner.query(`
      ALTER TABLE "products"
      ADD CONSTRAINT "FK_products_category"
      FOREIGN KEY ("category_id")
      REFERENCES "product_categories"("id")
      ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "products"
      ADD CONSTRAINT "FK_products_subcategory"
      FOREIGN KEY ("subcategory_id")
      REFERENCES "product_categories"("id")
      ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "products"
      ADD CONSTRAINT "FK_products_supplier"
      FOREIGN KEY ("supplier_id")
      REFERENCES "suppliers"("id")
      ON DELETE SET NULL
    `);

    // Add foreign keys for sales
    await queryRunner.query(`
      ALTER TABLE "sales"
      ADD CONSTRAINT "FK_sales_customer"
      FOREIGN KEY ("customer_id")
      REFERENCES "customers"("id")
      ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "sales"
      ADD CONSTRAINT "FK_sales_user"
      FOREIGN KEY ("user_id")
      REFERENCES "users"("id")
      ON DELETE RESTRICT
    `);

    await queryRunner.query(`
      ALTER TABLE "sales"
      ADD CONSTRAINT "FK_sales_branch"
      FOREIGN KEY ("branch_id")
      REFERENCES "branches"("id")
      ON DELETE RESTRICT
    `);

    // Add foreign keys for sale_items
    await queryRunner.query(`
      ALTER TABLE "sale_items"
      ADD CONSTRAINT "FK_sale_items_sale"
      FOREIGN KEY ("sale_id")
      REFERENCES "sales"("id")
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "sale_items"
      ADD CONSTRAINT "FK_sale_items_product"
      FOREIGN KEY ("product_id")
      REFERENCES "products"("id")
      ON DELETE RESTRICT
    `);

    // Add foreign keys for invoices
    await queryRunner.query(`
      ALTER TABLE "invoices"
      ADD CONSTRAINT "FK_invoices_customer"
      FOREIGN KEY ("customer_id")
      REFERENCES "customers"("id")
      ON DELETE RESTRICT
    `);

    await queryRunner.query(`
      ALTER TABLE "invoices"
      ADD CONSTRAINT "FK_invoices_sale"
      FOREIGN KEY ("sale_id")
      REFERENCES "sales"("id")
      ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "invoices"
      ADD CONSTRAINT "FK_invoices_user"
      FOREIGN KEY ("user_id")
      REFERENCES "users"("id")
      ON DELETE RESTRICT
    `);

    await queryRunner.query(`
      ALTER TABLE "invoices"
      ADD CONSTRAINT "FK_invoices_branch"
      FOREIGN KEY ("branch_id")
      REFERENCES "branches"("id")
      ON DELETE RESTRICT
    `);

    // Add foreign keys for invoice_items
    await queryRunner.query(`
      ALTER TABLE "invoice_items"
      ADD CONSTRAINT "FK_invoice_items_invoice"
      FOREIGN KEY ("invoice_id")
      REFERENCES "invoices"("id")
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "invoice_items"
      ADD CONSTRAINT "FK_invoice_items_product"
      FOREIGN KEY ("product_id")
      REFERENCES "products"("id")
      ON DELETE RESTRICT
    `);

    // Add foreign keys for payments
    await queryRunner.query(`
      ALTER TABLE "payments"
      ADD CONSTRAINT "FK_payments_invoice"
      FOREIGN KEY ("invoice_id")
      REFERENCES "invoices"("id")
      ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "payments"
      ADD CONSTRAINT "FK_payments_sale"
      FOREIGN KEY ("sale_id")
      REFERENCES "sales"("id")
      ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "payments"
      ADD CONSTRAINT "FK_payments_customer"
      FOREIGN KEY ("customer_id")
      REFERENCES "customers"("id")
      ON DELETE RESTRICT
    `);

    await queryRunner.query(`
      ALTER TABLE "payments"
      ADD CONSTRAINT "FK_payments_user"
      FOREIGN KEY ("user_id")
      REFERENCES "users"("id")
      ON DELETE RESTRICT
    `);

    // Add foreign keys for expenses
    await queryRunner.query(`
      ALTER TABLE "expenses"
      ADD CONSTRAINT "FK_expenses_branch"
      FOREIGN KEY ("branch_id")
      REFERENCES "branches"("id")
      ON DELETE RESTRICT
    `);

    await queryRunner.query(`
      ALTER TABLE "expenses"
      ADD CONSTRAINT "FK_expenses_user"
      FOREIGN KEY ("user_id")
      REFERENCES "users"("id")
      ON DELETE RESTRICT
    `);

    // Add foreign keys for purchase_orders
    await queryRunner.query(`
      ALTER TABLE "purchase_orders"
      ADD CONSTRAINT "FK_purchase_orders_supplier"
      FOREIGN KEY ("supplier_id")
      REFERENCES "suppliers"("id")
      ON DELETE RESTRICT
    `);

    // Add foreign keys for purchase_order_items
    await queryRunner.query(`
      ALTER TABLE "purchase_order_items"
      ADD CONSTRAINT "FK_purchase_order_items_po"
      FOREIGN KEY ("po_id")
      REFERENCES "purchase_orders"("id")
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "purchase_order_items"
      ADD CONSTRAINT "FK_purchase_order_items_product"
      FOREIGN KEY ("product_id")
      REFERENCES "products"("id")
      ON DELETE RESTRICT
    `);

    // Add foreign keys for stock_levels
    await queryRunner.query(`
      ALTER TABLE "stock_levels"
      ADD CONSTRAINT "FK_stock_levels_product"
      FOREIGN KEY ("product_id")
      REFERENCES "products"("id")
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "stock_levels"
      ADD CONSTRAINT "FK_stock_levels_location"
      FOREIGN KEY ("location_id")
      REFERENCES "branches"("id")
      ON DELETE CASCADE
    `);

    // Add foreign keys for inventory_transactions
    await queryRunner.query(`
      ALTER TABLE "inventory_transactions"
      ADD CONSTRAINT "FK_inventory_transactions_product"
      FOREIGN KEY ("product_id")
      REFERENCES "products"("id")
      ON DELETE RESTRICT
    `);

    await queryRunner.query(`
      ALTER TABLE "inventory_transactions"
      ADD CONSTRAINT "FK_inventory_transactions_location"
      FOREIGN KEY ("location_id")
      REFERENCES "branches"("id")
      ON DELETE RESTRICT
    `);

    await queryRunner.query(`
      ALTER TABLE "inventory_transactions"
      ADD CONSTRAINT "FK_inventory_transactions_user"
      FOREIGN KEY ("user_id")
      REFERENCES "users"("id")
      ON DELETE RESTRICT
    `);

    // Create indexes for better performance
    await queryRunner.query(`CREATE INDEX "IDX_users_email" ON "users" ("email")`);
    await queryRunner.query(`CREATE INDEX "IDX_users_username" ON "users" ("username")`);
    await queryRunner.query(`CREATE INDEX "IDX_users_status" ON "users" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_products_sku" ON "products" ("sku")`);
    await queryRunner.query(`CREATE INDEX "IDX_products_category" ON "products" ("category_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_sales_saleNumber" ON "sales" ("saleNumber")`);
    await queryRunner.query(`CREATE INDEX "IDX_sales_customer" ON "sales" ("customer_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_sales_date" ON "sales" ("saleDate")`);
    await queryRunner.query(`CREATE INDEX "IDX_invoices_invoiceNumber" ON "invoices" ("invoiceNumber")`);
    await queryRunner.query(`CREATE INDEX "IDX_invoices_customer" ON "invoices" ("customer_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_invoices_status" ON "invoices" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_payments_paymentNumber" ON "payments" ("paymentNumber")`);
    await queryRunner.query(`CREATE INDEX "IDX_stock_levels_product" ON "stock_levels" ("product_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_inventory_transactions_product" ON "inventory_transactions" ("product_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_inventory_transactions_date" ON "inventory_transactions" ("transactionDate")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_inventory_transactions_date"`);
    await queryRunner.query(`DROP INDEX "IDX_inventory_transactions_product"`);
    await queryRunner.query(`DROP INDEX "IDX_stock_levels_product"`);
    await queryRunner.query(`DROP INDEX "IDX_payments_paymentNumber"`);
    await queryRunner.query(`DROP INDEX "IDX_invoices_status"`);
    await queryRunner.query(`DROP INDEX "IDX_invoices_customer"`);
    await queryRunner.query(`DROP INDEX "IDX_invoices_invoiceNumber"`);
    await queryRunner.query(`DROP INDEX "IDX_sales_date"`);
    await queryRunner.query(`DROP INDEX "IDX_sales_customer"`);
    await queryRunner.query(`DROP INDEX "IDX_sales_saleNumber"`);
    await queryRunner.query(`DROP INDEX "IDX_products_category"`);
    await queryRunner.query(`DROP INDEX "IDX_products_sku"`);
    await queryRunner.query(`DROP INDEX "IDX_users_status"`);
    await queryRunner.query(`DROP INDEX "IDX_users_username"`);
    await queryRunner.query(`DROP INDEX "IDX_users_email"`);

    // Drop foreign keys and tables in reverse order
    await queryRunner.query(`DROP TABLE "inventory_transactions"`);
    await queryRunner.query(`DROP TABLE "stock_levels"`);
    await queryRunner.query(`DROP TABLE "purchase_order_items"`);
    await queryRunner.query(`DROP TABLE "purchase_orders"`);
    await queryRunner.query(`DROP TABLE "expenses"`);
    await queryRunner.query(`DROP TABLE "payments"`);
    await queryRunner.query(`DROP TABLE "invoice_items"`);
    await queryRunner.query(`DROP TABLE "invoices"`);
    await queryRunner.query(`DROP TABLE "sale_items"`);
    await queryRunner.query(`DROP TABLE "sales"`);
    await queryRunner.query(`DROP TABLE "products"`);
    await queryRunner.query(`DROP TABLE "product_categories"`);
    await queryRunner.query(`DROP TABLE "suppliers"`);
    await queryRunner.query(`DROP TABLE "customers"`);
    await queryRunner.query(`DROP TABLE "user_roles"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "branches"`);
    await queryRunner.query(`DROP TABLE "role_permissions"`);
    await queryRunner.query(`DROP TABLE "roles"`);
    await queryRunner.query(`DROP TABLE "permissions"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE "po_status_enum"`);
    await queryRunner.query(`DROP TYPE "expense_category_enum"`);
    await queryRunner.query(`DROP TYPE "transaction_status_enum"`);
    await queryRunner.query(`DROP TYPE "transaction_type_enum"`);
    await queryRunner.query(`DROP TYPE "payment_method_enum"`);
    await queryRunner.query(`DROP TYPE "sale_type_enum"`);
    await queryRunner.query(`DROP TYPE "payment_status_enum"`);
    await queryRunner.query(`DROP TYPE "invoice_status_enum"`);
    await queryRunner.query(`DROP TYPE "user_status_enum"`);
  }
}
