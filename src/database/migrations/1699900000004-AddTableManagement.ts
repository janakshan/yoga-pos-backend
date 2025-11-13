import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTableManagement1699900000004 implements MigrationInterface {
  name = 'AddTableManagement1699900000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type for table status
    await queryRunner.query(`
      CREATE TYPE "table_status_enum" AS ENUM (
        'available',
        'occupied',
        'reserved',
        'cleaning',
        'out_of_service'
      )
    `);

    // Create floor_plans table
    await queryRunner.query(`
      CREATE TABLE "floor_plans" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" varchar NOT NULL,
        "description" text,
        "branch_id" uuid NOT NULL,
        "display_order" int NOT NULL DEFAULT 0,
        "layout" jsonb,
        "is_active" boolean NOT NULL DEFAULT true,
        "is_default" boolean NOT NULL DEFAULT false,
        "settings" jsonb,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_floor_plans_branch" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_floor_plans_branch_name" UNIQUE ("branch_id", "name")
      )
    `);

    // Create index on floor_plans
    await queryRunner.query(`
      CREATE INDEX "IDX_floor_plans_branch_id" ON "floor_plans" ("branch_id")
    `);

    // Create table_sections table
    await queryRunner.query(`
      CREATE TABLE "table_sections" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" varchar NOT NULL,
        "description" text,
        "branch_id" uuid NOT NULL,
        "floor_plan_id" uuid,
        "color" varchar,
        "display_order" int NOT NULL DEFAULT 0,
        "is_active" boolean NOT NULL DEFAULT true,
        "settings" jsonb,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_table_sections_branch" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_table_sections_floor_plan" FOREIGN KEY ("floor_plan_id") REFERENCES "floor_plans"("id") ON DELETE SET NULL,
        CONSTRAINT "UQ_table_sections_branch_name" UNIQUE ("branch_id", "name")
      )
    `);

    // Create indexes on table_sections
    await queryRunner.query(`
      CREATE INDEX "IDX_table_sections_branch_id" ON "table_sections" ("branch_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_table_sections_floor_plan_id" ON "table_sections" ("floor_plan_id")
    `);

    // Create tables table
    await queryRunner.query(`
      CREATE TABLE "tables" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "table_number" varchar NOT NULL,
        "capacity" int NOT NULL,
        "min_capacity" int NOT NULL DEFAULT 1,
        "status" "table_status_enum" NOT NULL DEFAULT 'available',
        "branch_id" uuid NOT NULL,
        "floor_plan_id" uuid,
        "section_id" uuid,
        "assigned_server_id" uuid,
        "current_order_id" varchar,
        "reservation_id" varchar,
        "position" jsonb,
        "shape" jsonb,
        "is_active" boolean NOT NULL DEFAULT true,
        "qr_code" varchar,
        "notes" text,
        "metadata" jsonb,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        "last_occupied_at" timestamp,
        "last_cleaned_at" timestamp,
        CONSTRAINT "FK_tables_branch" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_tables_floor_plan" FOREIGN KEY ("floor_plan_id") REFERENCES "floor_plans"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_tables_section" FOREIGN KEY ("section_id") REFERENCES "table_sections"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_tables_assigned_server" FOREIGN KEY ("assigned_server_id") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "UQ_tables_branch_table_number" UNIQUE ("branch_id", "table_number")
      )
    `);

    // Create indexes on tables
    await queryRunner.query(`
      CREATE INDEX "IDX_tables_branch_id" ON "tables" ("branch_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_tables_floor_plan_id" ON "tables" ("floor_plan_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_tables_section_id" ON "tables" ("section_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_tables_status" ON "tables" ("status")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_tables_assigned_server_id" ON "tables" ("assigned_server_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables table and indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tables_assigned_server_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tables_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tables_section_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tables_floor_plan_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tables_branch_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tables"`);

    // Drop table_sections table and indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_table_sections_floor_plan_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_table_sections_branch_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "table_sections"`);

    // Drop floor_plans table and indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_floor_plans_branch_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "floor_plans"`);

    // Drop table_status enum
    await queryRunner.query(`DROP TYPE IF EXISTS "table_status_enum"`);
  }
}
