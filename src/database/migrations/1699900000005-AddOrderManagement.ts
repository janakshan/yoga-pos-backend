import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrderManagement1699900000005 implements MigrationInterface {
  name = 'AddOrderManagement1699900000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create ENUMs for order management
    await queryRunner.query(`
      CREATE TYPE "kitchen_station_enum" AS ENUM (
        'grill',
        'fryer',
        'salad',
        'dessert',
        'bar',
        'hot_kitchen',
        'cold_kitchen',
        'pastry',
        'general'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "restaurant_order_status_enum" AS ENUM (
        'pending',
        'confirmed',
        'preparing',
        'ready',
        'served',
        'completed',
        'cancelled'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "dining_type_enum" AS ENUM (
        'dine_in',
        'takeaway',
        'delivery'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "order_priority_enum" AS ENUM (
        'low',
        'normal',
        'high',
        'urgent'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "order_payment_status_enum" AS ENUM (
        'unpaid',
        'partial',
        'paid',
        'refunded'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "course_timing_enum" AS ENUM (
        'appetizer',
        'main_course',
        'dessert',
        'beverage'
      )
    `);

    // Create restaurant_orders table
    await queryRunner.query(`
      CREATE TABLE "restaurant_orders" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "order_number" varchar NOT NULL UNIQUE,
        "branch_id" uuid NOT NULL,
        "table_id" uuid,
        "customer_id" uuid,
        "server_id" uuid NOT NULL,
        "service_type" dining_type_enum NOT NULL,
        "status" restaurant_order_status_enum NOT NULL DEFAULT 'pending',
        "priority" order_priority_enum NOT NULL DEFAULT 'normal',
        "payment_status" order_payment_status_enum NOT NULL DEFAULT 'unpaid',
        "subtotal" decimal(10,2) NOT NULL DEFAULT 0,
        "tax" decimal(10,2) NOT NULL DEFAULT 0,
        "discount" decimal(10,2) NOT NULL DEFAULT 0,
        "total" decimal(10,2) NOT NULL DEFAULT 0,
        "amount_paid" decimal(10,2) NOT NULL DEFAULT 0,
        "special_instructions" text,
        "notes" text,
        "guest_count" int,
        "estimated_prep_time" int,
        "confirmed_at" timestamp,
        "preparing_at" timestamp,
        "ready_at" timestamp,
        "served_at" timestamp,
        "completed_at" timestamp,
        "cancelled_at" timestamp,
        "cancellation_reason" text,
        "delivery_address" text,
        "delivery_phone" varchar(20),
        "delivery_fee" decimal(10,2) NOT NULL DEFAULT 0,
        "delivery_driver_id" varchar,
        "metadata" jsonb,
        "audit_log" jsonb,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_restaurant_orders_branch"
          FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_restaurant_orders_table"
          FOREIGN KEY ("table_id") REFERENCES "tables"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_restaurant_orders_customer"
          FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_restaurant_orders_server"
          FOREIGN KEY ("server_id") REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);

    // Create order_items table
    await queryRunner.query(`
      CREATE TABLE "order_items" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "order_id" uuid NOT NULL,
        "product_id" uuid NOT NULL,
        "product_name" varchar NOT NULL,
        "quantity" decimal(10,3) NOT NULL,
        "unit_price" decimal(10,2) NOT NULL,
        "discount" decimal(10,2) NOT NULL DEFAULT 0,
        "tax" decimal(10,2) NOT NULL DEFAULT 0,
        "subtotal" decimal(10,2) NOT NULL,
        "total" decimal(10,2) NOT NULL,
        "kitchen_station" kitchen_station_enum NOT NULL DEFAULT 'general',
        "course" course_timing_enum,
        "status" restaurant_order_status_enum NOT NULL DEFAULT 'pending',
        "notes" text,
        "special_instructions" text,
        "modifiers" jsonb,
        "is_combo" boolean NOT NULL DEFAULT false,
        "combo_group_id" varchar,
        "preparation_time" int,
        "sent_to_kitchen_at" timestamp,
        "started_preparing_at" timestamp,
        "completed_at" timestamp,
        "is_modified" boolean NOT NULL DEFAULT false,
        "parent_item_id" varchar,
        "modification_type" varchar,
        "metadata" jsonb,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_order_items_order"
          FOREIGN KEY ("order_id") REFERENCES "restaurant_orders"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_order_items_product"
          FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT
      )
    `);

    // Create indexes for performance
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_restaurant_orders_branch_order_number"
        ON "restaurant_orders" ("branch_id", "order_number")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_restaurant_orders_branch_status"
        ON "restaurant_orders" ("branch_id", "status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_restaurant_orders_branch_service_type"
        ON "restaurant_orders" ("branch_id", "service_type")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_restaurant_orders_created_at"
        ON "restaurant_orders" ("created_at")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_restaurant_orders_table_id"
        ON "restaurant_orders" ("table_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_restaurant_orders_customer_id"
        ON "restaurant_orders" ("customer_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_restaurant_orders_server_id"
        ON "restaurant_orders" ("server_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_order_items_order_product"
        ON "order_items" ("order_id", "product_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_order_items_kitchen_station_status"
        ON "order_items" ("kitchen_station", "status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_order_items_order_id"
        ON "order_items" ("order_id")
    `);

    // Update tables to add foreign key to restaurant_orders
    await queryRunner.query(`
      ALTER TABLE "tables"
        ADD CONSTRAINT "FK_tables_current_order"
        FOREIGN KEY ("current_order_id") REFERENCES "restaurant_orders"("id")
        ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraint from tables
    await queryRunner.query(`
      ALTER TABLE "tables" DROP CONSTRAINT IF EXISTS "FK_tables_current_order"
    `);

    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_order_items_order_id"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_order_items_kitchen_station_status"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_order_items_order_product"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_restaurant_orders_server_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_restaurant_orders_customer_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_restaurant_orders_table_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_restaurant_orders_created_at"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_restaurant_orders_branch_service_type"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_restaurant_orders_branch_status"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_restaurant_orders_branch_order_number"`,
    );

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "order_items"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "restaurant_orders"`);

    // Drop ENUMs
    await queryRunner.query(`DROP TYPE IF EXISTS "course_timing_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "order_payment_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "order_priority_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "dining_type_enum"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "restaurant_order_status_enum"`,
    );
    await queryRunner.query(`DROP TYPE IF EXISTS "kitchen_station_enum"`);
  }
}
