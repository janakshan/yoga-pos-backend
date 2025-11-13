import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMenuModifiersAndEnhancedProducts1699900000006
  implements MigrationInterface
{
  name = 'AddMenuModifiersAndEnhancedProducts1699900000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create ENUMs for modifier types
    await queryRunner.query(`
      CREATE TYPE "public"."modifier_group_type_enum" AS ENUM('required', 'optional');
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."modifier_selection_type_enum" AS ENUM('single', 'multiple');
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."price_adjustment_type_enum" AS ENUM('fixed', 'percentage');
    `);

    // Create modifier_groups table
    await queryRunner.query(`
      CREATE TABLE "modifier_groups" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "description" text,
        "branch_id" uuid NOT NULL,
        "type" "public"."modifier_group_type_enum" NOT NULL DEFAULT 'optional',
        "selection_type" "public"."modifier_selection_type_enum" NOT NULL DEFAULT 'multiple',
        "min_selections" integer NOT NULL DEFAULT 0,
        "max_selections" integer,
        "display_name" character varying,
        "sort_order" integer NOT NULL DEFAULT 0,
        "is_active" boolean NOT NULL DEFAULT true,
        "show_in_pos" boolean NOT NULL DEFAULT true,
        "show_in_online_menu" boolean NOT NULL DEFAULT true,
        "category" character varying,
        "free_modifier_count" integer NOT NULL DEFAULT 0,
        "charge_above_free" boolean NOT NULL DEFAULT false,
        "availability" jsonb,
        "conditional_rules" jsonb,
        "ui_config" jsonb,
        "metadata" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "fk_modifier_groups_branch" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE
      );
    `);

    // Create modifiers table
    await queryRunner.query(`
      CREATE TABLE "modifiers" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "description" text,
        "modifier_group_id" uuid NOT NULL,
        "branch_id" uuid NOT NULL,
        "price_adjustment_type" "public"."price_adjustment_type_enum" NOT NULL DEFAULT 'fixed',
        "price_adjustment" numeric(10,2) NOT NULL DEFAULT 0,
        "is_active" boolean NOT NULL DEFAULT true,
        "is_available" boolean NOT NULL DEFAULT true,
        "is_default" boolean NOT NULL DEFAULT false,
        "sort_order" integer NOT NULL DEFAULT 0,
        "sku" character varying,
        "image_url" character varying,
        "nutritional_info" jsonb,
        "availability" jsonb,
        "track_inventory" boolean NOT NULL DEFAULT false,
        "stock_quantity" integer,
        "out_of_stock_action" character varying,
        "cost" numeric(10,2),
        "metadata" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "fk_modifiers_modifier_group" FOREIGN KEY ("modifier_group_id") REFERENCES "modifier_groups"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_modifiers_branch" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE
      );
    `);

    // Create product_modifier_groups junction table
    await queryRunner.query(`
      CREATE TABLE "product_modifier_groups" (
        "product_id" uuid NOT NULL,
        "modifier_group_id" uuid NOT NULL,
        CONSTRAINT "pk_product_modifier_groups" PRIMARY KEY ("product_id", "modifier_group_id"),
        CONSTRAINT "fk_product_modifier_groups_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_product_modifier_groups_modifier_group" FOREIGN KEY ("modifier_group_id") REFERENCES "modifier_groups"("id") ON DELETE CASCADE
      );
    `);

    // Add restaurant-specific columns to products table
    await queryRunner.query(`
      ALTER TABLE "products"
        ADD COLUMN "kitchen_station" character varying,
        ADD COLUMN "restaurant_category" character varying,
        ADD COLUMN "preparation_time" integer,
        ADD COLUMN "cooking_instructions" text,
        ADD COLUMN "is_popular" boolean NOT NULL DEFAULT false,
        ADD COLUMN "is_recommended" boolean NOT NULL DEFAULT false,
        ADD COLUMN "is_new" boolean NOT NULL DEFAULT false,
        ADD COLUMN "is_seasonal" boolean NOT NULL DEFAULT false,
        ADD COLUMN "is_spicy" boolean NOT NULL DEFAULT false,
        ADD COLUMN "spiciness_level" integer,
        ADD COLUMN "allergens" text,
        ADD COLUMN "dietary_restrictions" text,
        ADD COLUMN "nutritional_info" jsonb,
        ADD COLUMN "is_available" boolean NOT NULL DEFAULT true,
        ADD COLUMN "availability" jsonb,
        ADD COLUMN "has_size_variations" boolean NOT NULL DEFAULT false,
        ADD COLUMN "size_variations" jsonb,
        ADD COLUMN "available_for_takeaway" boolean NOT NULL DEFAULT true,
        ADD COLUMN "available_for_delivery" boolean NOT NULL DEFAULT true,
        ADD COLUMN "available_for_dine_in" boolean NOT NULL DEFAULT true,
        ADD COLUMN "tags" text,
        ADD COLUMN "is_combo" boolean NOT NULL DEFAULT false,
        ADD COLUMN "combo_items" jsonb,
        ADD COLUMN "menu_sort_order" integer NOT NULL DEFAULT 0;
    `);

    // Create indexes for modifier_groups
    await queryRunner.query(`
      CREATE INDEX "idx_modifier_groups_branch_id" ON "modifier_groups" ("branch_id");
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_modifier_groups_branch_id_is_active" ON "modifier_groups" ("branch_id", "is_active");
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_modifier_groups_branch_id_category" ON "modifier_groups" ("branch_id", "category");
    `);

    // Create indexes for modifiers
    await queryRunner.query(`
      CREATE INDEX "idx_modifiers_modifier_group_id" ON "modifiers" ("modifier_group_id");
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_modifiers_modifier_group_id_sort_order" ON "modifiers" ("modifier_group_id", "sort_order");
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_modifiers_branch_id_is_active" ON "modifiers" ("branch_id", "is_active");
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_modifiers_sku" ON "modifiers" ("sku") WHERE "sku" IS NOT NULL;
    `);

    // Create indexes for product_modifier_groups
    await queryRunner.query(`
      CREATE INDEX "idx_product_modifier_groups_product_id" ON "product_modifier_groups" ("product_id");
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_product_modifier_groups_modifier_group_id" ON "product_modifier_groups" ("modifier_group_id");
    `);

    // Create indexes for products restaurant fields
    await queryRunner.query(`
      CREATE INDEX "idx_products_restaurant_category" ON "products" ("restaurant_category") WHERE "restaurant_category" IS NOT NULL;
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_products_kitchen_station" ON "products" ("kitchen_station") WHERE "kitchen_station" IS NOT NULL;
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_products_is_available" ON "products" ("is_available");
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_products_is_popular" ON "products" ("is_popular") WHERE "is_popular" = true;
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_products_menu_sort_order" ON "products" ("menu_sort_order");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes for products
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_products_menu_sort_order"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_products_is_popular"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_products_is_available"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_products_kitchen_station"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_products_restaurant_category"`);

    // Drop indexes for product_modifier_groups
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_product_modifier_groups_modifier_group_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_product_modifier_groups_product_id"`);

    // Drop indexes for modifiers
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_modifiers_sku"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_modifiers_branch_id_is_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_modifiers_modifier_group_id_sort_order"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_modifiers_modifier_group_id"`);

    // Drop indexes for modifier_groups
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_modifier_groups_branch_id_category"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_modifier_groups_branch_id_is_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_modifier_groups_branch_id"`);

    // Remove restaurant-specific columns from products table
    await queryRunner.query(`
      ALTER TABLE "products"
        DROP COLUMN "menu_sort_order",
        DROP COLUMN "combo_items",
        DROP COLUMN "is_combo",
        DROP COLUMN "tags",
        DROP COLUMN "available_for_dine_in",
        DROP COLUMN "available_for_delivery",
        DROP COLUMN "available_for_takeaway",
        DROP COLUMN "size_variations",
        DROP COLUMN "has_size_variations",
        DROP COLUMN "availability",
        DROP COLUMN "is_available",
        DROP COLUMN "nutritional_info",
        DROP COLUMN "dietary_restrictions",
        DROP COLUMN "allergens",
        DROP COLUMN "spiciness_level",
        DROP COLUMN "is_spicy",
        DROP COLUMN "is_seasonal",
        DROP COLUMN "is_new",
        DROP COLUMN "is_recommended",
        DROP COLUMN "is_popular",
        DROP COLUMN "cooking_instructions",
        DROP COLUMN "preparation_time",
        DROP COLUMN "restaurant_category",
        DROP COLUMN "kitchen_station";
    `);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "product_modifier_groups"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "modifiers"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "modifier_groups"`);

    // Drop ENUMs
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."price_adjustment_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."modifier_selection_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."modifier_group_type_enum"`);
  }
}
