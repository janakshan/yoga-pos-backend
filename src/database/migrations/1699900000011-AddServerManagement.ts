import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddServerManagement1699900000011 implements MigrationInterface {
  name = 'AddServerManagement1699900000011';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`
      CREATE TYPE "assignment_status_enum" AS ENUM ('active', 'inactive', 'on_break', 'completed')
    `);

    await queryRunner.query(`
      CREATE TYPE "shift_status_enum" AS ENUM ('scheduled', 'clocked_in', 'on_break', 'clocked_out', 'missed', 'cancelled')
    `);

    await queryRunner.query(`
      CREATE TYPE "shift_type_enum" AS ENUM ('morning', 'afternoon', 'evening', 'night', 'double', 'split')
    `);

    await queryRunner.query(`
      CREATE TYPE "metric_period_enum" AS ENUM ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')
    `);

    await queryRunner.query(`
      CREATE TYPE "tip_distribution_method_enum" AS ENUM ('individual', 'pooled_equal', 'pooled_weighted', 'pooled_points', 'hybrid')
    `);

    await queryRunner.query(`
      CREATE TYPE "tip_distribution_status_enum" AS ENUM ('pending', 'calculated', 'distributed', 'disputed', 'finalized')
    `);

    // Create server_assignments table
    await queryRunner.query(`
      CREATE TABLE "server_assignments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "server_id" uuid NOT NULL,
        "branch_id" uuid NOT NULL,
        "section_id" uuid,
        "status" assignment_status_enum NOT NULL DEFAULT 'active',
        "assignment_date" date NOT NULL,
        "start_time" time,
        "end_time" time,
        "table_limit" integer,
        "current_table_count" integer NOT NULL DEFAULT 0,
        "priority_order" integer NOT NULL DEFAULT 0,
        "settings" jsonb,
        "notes" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_server_assignments" PRIMARY KEY ("id")
      )
    `);

    // Create server_shifts table
    await queryRunner.query(`
      CREATE TABLE "server_shifts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "server_id" uuid NOT NULL,
        "branch_id" uuid NOT NULL,
        "shift_date" date NOT NULL,
        "shift_type" shift_type_enum NOT NULL,
        "status" shift_status_enum NOT NULL DEFAULT 'scheduled',
        "scheduled_start" TIMESTAMP NOT NULL,
        "scheduled_end" TIMESTAMP NOT NULL,
        "actual_clock_in" TIMESTAMP,
        "actual_clock_out" TIMESTAMP,
        "breaks" jsonb,
        "total_break_minutes" integer NOT NULL DEFAULT 0,
        "scheduled_duration_minutes" integer,
        "actual_duration_minutes" integer,
        "overtime_minutes" integer,
        "orders_served" integer NOT NULL DEFAULT 0,
        "tables_served" integer NOT NULL DEFAULT 0,
        "total_sales" decimal(10,2) NOT NULL DEFAULT 0,
        "total_tips" decimal(10,2) NOT NULL DEFAULT 0,
        "notes" text,
        "metadata" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_server_shifts" PRIMARY KEY ("id")
      )
    `);

    // Create server_performance_metrics table
    await queryRunner.query(`
      CREATE TABLE "server_performance_metrics" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "server_id" uuid NOT NULL,
        "branch_id" uuid NOT NULL,
        "period_type" metric_period_enum NOT NULL,
        "period_start" date NOT NULL,
        "period_end" date NOT NULL,
        "total_orders" integer NOT NULL DEFAULT 0,
        "completed_orders" integer NOT NULL DEFAULT 0,
        "cancelled_orders" integer NOT NULL DEFAULT 0,
        "tables_served" integer NOT NULL DEFAULT 0,
        "guests_served" integer NOT NULL DEFAULT 0,
        "total_sales" decimal(12,2) NOT NULL DEFAULT 0,
        "average_order_value" decimal(10,2) NOT NULL DEFAULT 0,
        "total_tips" decimal(10,2) NOT NULL DEFAULT 0,
        "average_tip_amount" decimal(10,2) NOT NULL DEFAULT 0,
        "average_tip_percentage" decimal(5,2) NOT NULL DEFAULT 0,
        "tips_from_pool" decimal(10,2) NOT NULL DEFAULT 0,
        "total_hours_worked" integer NOT NULL DEFAULT 0,
        "number_of_shifts" integer NOT NULL DEFAULT 0,
        "average_shift_duration" decimal(10,2) NOT NULL DEFAULT 0,
        "overtime_minutes" integer NOT NULL DEFAULT 0,
        "late_clock_ins" integer NOT NULL DEFAULT 0,
        "average_table_turn_time" decimal(5,2),
        "average_service_time" decimal(5,2),
        "customer_satisfaction_score" decimal(5,2),
        "customer_complaints" integer NOT NULL DEFAULT 0,
        "customer_compliments" integer NOT NULL DEFAULT 0,
        "sales_per_hour" decimal(10,2) NOT NULL DEFAULT 0,
        "tips_per_hour" decimal(10,2) NOT NULL DEFAULT 0,
        "orders_per_hour" decimal(5,2) NOT NULL DEFAULT 0,
        "average_guests_per_table" decimal(5,2) NOT NULL DEFAULT 0,
        "upsell_count" integer NOT NULL DEFAULT 0,
        "upsell_revenue" decimal(10,2) NOT NULL DEFAULT 0,
        "addon_attachment_rate" decimal(5,2) NOT NULL DEFAULT 0,
        "detailed_metrics" jsonb,
        "rankings" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_server_performance_metrics" PRIMARY KEY ("id")
      )
    `);

    // Create tip_distributions table
    await queryRunner.query(`
      CREATE TABLE "tip_distributions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "branch_id" uuid NOT NULL,
        "server_id" uuid NOT NULL,
        "shift_id" uuid,
        "order_id" uuid,
        "distribution_date" date NOT NULL,
        "distribution_method" tip_distribution_method_enum NOT NULL,
        "status" tip_distribution_status_enum NOT NULL DEFAULT 'pending',
        "original_tip_amount" decimal(10,2) NOT NULL DEFAULT 0,
        "pooled_tip_contribution" decimal(10,2) NOT NULL DEFAULT 0,
        "pooled_tip_received" decimal(10,2) NOT NULL DEFAULT 0,
        "final_tip_amount" decimal(10,2) NOT NULL DEFAULT 0,
        "tip_out_amount" decimal(10,2) NOT NULL DEFAULT 0,
        "house_fee" decimal(10,2) NOT NULL DEFAULT 0,
        "calculation_details" jsonb,
        "tip_out_breakdown" jsonb,
        "pool_id" character varying(100),
        "pool_metadata" jsonb,
        "manual_adjustment" decimal(10,2) NOT NULL DEFAULT 0,
        "adjustment_reason" text,
        "adjusted_by" character varying,
        "is_disputed" boolean NOT NULL DEFAULT false,
        "dispute_reason" text,
        "dispute_filed_at" TIMESTAMP,
        "dispute_resolved_at" TIMESTAMP,
        "paid_at" TIMESTAMP,
        "payment_method" character varying(50),
        "payment_reference" character varying(100),
        "notes" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tip_distributions" PRIMARY KEY ("id")
      )
    `);

    // Create foreign key constraints for server_assignments
    await queryRunner.query(`
      ALTER TABLE "server_assignments"
      ADD CONSTRAINT "FK_server_assignments_server"
      FOREIGN KEY ("server_id")
      REFERENCES "users"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "server_assignments"
      ADD CONSTRAINT "FK_server_assignments_branch"
      FOREIGN KEY ("branch_id")
      REFERENCES "branches"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "server_assignments"
      ADD CONSTRAINT "FK_server_assignments_section"
      FOREIGN KEY ("section_id")
      REFERENCES "table_sections"("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE
    `);

    // Create foreign key constraints for server_shifts
    await queryRunner.query(`
      ALTER TABLE "server_shifts"
      ADD CONSTRAINT "FK_server_shifts_server"
      FOREIGN KEY ("server_id")
      REFERENCES "users"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "server_shifts"
      ADD CONSTRAINT "FK_server_shifts_branch"
      FOREIGN KEY ("branch_id")
      REFERENCES "branches"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE
    `);

    // Create foreign key constraints for server_performance_metrics
    await queryRunner.query(`
      ALTER TABLE "server_performance_metrics"
      ADD CONSTRAINT "FK_server_performance_metrics_server"
      FOREIGN KEY ("server_id")
      REFERENCES "users"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "server_performance_metrics"
      ADD CONSTRAINT "FK_server_performance_metrics_branch"
      FOREIGN KEY ("branch_id")
      REFERENCES "branches"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE
    `);

    // Create foreign key constraints for tip_distributions
    await queryRunner.query(`
      ALTER TABLE "tip_distributions"
      ADD CONSTRAINT "FK_tip_distributions_branch"
      FOREIGN KEY ("branch_id")
      REFERENCES "branches"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "tip_distributions"
      ADD CONSTRAINT "FK_tip_distributions_server"
      FOREIGN KEY ("server_id")
      REFERENCES "users"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "tip_distributions"
      ADD CONSTRAINT "FK_tip_distributions_shift"
      FOREIGN KEY ("shift_id")
      REFERENCES "server_shifts"("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "tip_distributions"
      ADD CONSTRAINT "FK_tip_distributions_order"
      FOREIGN KEY ("order_id")
      REFERENCES "restaurant_orders"("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE
    `);

    // Create indexes for server_assignments
    await queryRunner.query(`
      CREATE INDEX "IDX_server_assignments_server_date" ON "server_assignments" ("server_id", "assignment_date")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_server_assignments_branch_date" ON "server_assignments" ("branch_id", "assignment_date")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_server_assignments_section_status" ON "server_assignments" ("section_id", "status")
    `);

    // Create indexes for server_shifts
    await queryRunner.query(`
      CREATE INDEX "IDX_server_shifts_server_date" ON "server_shifts" ("server_id", "shift_date")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_server_shifts_branch_date_status" ON "server_shifts" ("branch_id", "shift_date", "status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_server_shifts_status_date" ON "server_shifts" ("status", "shift_date")
    `);

    // Create indexes for server_performance_metrics
    await queryRunner.query(`
      CREATE INDEX "IDX_server_performance_metrics_server_period" ON "server_performance_metrics" ("server_id", "period_type", "period_start")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_server_performance_metrics_branch_period" ON "server_performance_metrics" ("branch_id", "period_type", "period_start")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_server_performance_metrics_period_range" ON "server_performance_metrics" ("period_type", "period_start", "period_end")
    `);

    // Create indexes for tip_distributions
    await queryRunner.query(`
      CREATE INDEX "IDX_tip_distributions_branch_date" ON "tip_distributions" ("branch_id", "distribution_date")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_tip_distributions_server_date" ON "tip_distributions" ("server_id", "distribution_date")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_tip_distributions_shift" ON "tip_distributions" ("shift_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_tip_distributions_status_date" ON "tip_distributions" ("status", "distribution_date")
    `);

    // Add comments
    await queryRunner.query(`
      COMMENT ON TABLE "server_assignments" IS 'Tracks server section assignments for each shift'
    `);

    await queryRunner.query(`
      COMMENT ON TABLE "server_shifts" IS 'Records server work shifts with clock in/out times and performance'
    `);

    await queryRunner.query(`
      COMMENT ON TABLE "server_performance_metrics" IS 'Aggregated performance metrics for servers by period'
    `);

    await queryRunner.query(`
      COMMENT ON TABLE "tip_distributions" IS 'Tracks tip distribution and pooling for servers'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tip_distributions_status_date"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tip_distributions_shift"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tip_distributions_server_date"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tip_distributions_branch_date"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_server_performance_metrics_period_range"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_server_performance_metrics_branch_period"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_server_performance_metrics_server_period"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_server_shifts_status_date"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_server_shifts_branch_date_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_server_shifts_server_date"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_server_assignments_section_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_server_assignments_branch_date"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_server_assignments_server_date"`);

    // Drop foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "tip_distributions"
      DROP CONSTRAINT IF EXISTS "FK_tip_distributions_order"
    `);
    await queryRunner.query(`
      ALTER TABLE "tip_distributions"
      DROP CONSTRAINT IF EXISTS "FK_tip_distributions_shift"
    `);
    await queryRunner.query(`
      ALTER TABLE "tip_distributions"
      DROP CONSTRAINT IF EXISTS "FK_tip_distributions_server"
    `);
    await queryRunner.query(`
      ALTER TABLE "tip_distributions"
      DROP CONSTRAINT IF EXISTS "FK_tip_distributions_branch"
    `);
    await queryRunner.query(`
      ALTER TABLE "server_performance_metrics"
      DROP CONSTRAINT IF EXISTS "FK_server_performance_metrics_branch"
    `);
    await queryRunner.query(`
      ALTER TABLE "server_performance_metrics"
      DROP CONSTRAINT IF EXISTS "FK_server_performance_metrics_server"
    `);
    await queryRunner.query(`
      ALTER TABLE "server_shifts"
      DROP CONSTRAINT IF EXISTS "FK_server_shifts_branch"
    `);
    await queryRunner.query(`
      ALTER TABLE "server_shifts"
      DROP CONSTRAINT IF EXISTS "FK_server_shifts_server"
    `);
    await queryRunner.query(`
      ALTER TABLE "server_assignments"
      DROP CONSTRAINT IF EXISTS "FK_server_assignments_section"
    `);
    await queryRunner.query(`
      ALTER TABLE "server_assignments"
      DROP CONSTRAINT IF EXISTS "FK_server_assignments_branch"
    `);
    await queryRunner.query(`
      ALTER TABLE "server_assignments"
      DROP CONSTRAINT IF EXISTS "FK_server_assignments_server"
    `);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "tip_distributions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "server_performance_metrics"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "server_shifts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "server_assignments"`);

    // Drop enum types
    await queryRunner.query(`DROP TYPE IF EXISTS "tip_distribution_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "tip_distribution_method_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "metric_period_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "shift_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "shift_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "assignment_status_enum"`);
  }
}
