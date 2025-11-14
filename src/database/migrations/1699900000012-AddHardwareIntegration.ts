import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHardwareIntegration1699900000012 implements MigrationInterface {
  name = 'AddHardwareIntegration1699900000012';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enums for hardware integration
    await queryRunner.query(`
      CREATE TYPE "printer_connection_type_enum" AS ENUM (
        'network', 'usb', 'bluetooth', 'cloud'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "printer_protocol_enum" AS ENUM (
        'esc_pos', 'star', 'raw', 'pdf'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "printer_status_enum" AS ENUM (
        'online', 'offline', 'error', 'low_paper', 'out_of_paper', 'busy', 'unknown'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "print_job_status_enum" AS ENUM (
        'pending', 'queued', 'printing', 'completed', 'failed', 'cancelled', 'retry'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "print_job_priority_enum" AS ENUM (
        'low', 'normal', 'high', 'urgent'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "notification_device_type_enum" AS ENUM (
        'pager', 'buzzer', 'light', 'screen'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "notification_status_enum" AS ENUM (
        'pending', 'sent', 'delivered', 'acknowledged', 'failed', 'expired'
      )
    `);

    // Create printer_configs table
    await queryRunner.query(`
      CREATE TABLE "printer_configs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "branch_id" uuid NOT NULL,
        "name" character varying(100) NOT NULL,
        "description" text,
        "connection_type" "printer_connection_type_enum" NOT NULL,
        "protocol" "printer_protocol_enum" NOT NULL DEFAULT 'esc_pos',
        "ip_address" character varying(45),
        "port" integer,
        "device_path" character varying(255),
        "mac_address" character varying(100),
        "status" "printer_status_enum" NOT NULL DEFAULT 'unknown',
        "is_active" boolean NOT NULL DEFAULT true,
        "is_default" boolean NOT NULL DEFAULT false,
        "paper_width" integer NOT NULL DEFAULT 80,
        "characters_per_line" integer NOT NULL DEFAULT 48,
        "encoding" character varying(20) NOT NULL DEFAULT 'UTF-8',
        "timeout" integer NOT NULL DEFAULT 5000,
        "reconnect_attempts" integer NOT NULL DEFAULT 3,
        "reconnect_delay" integer NOT NULL DEFAULT 2000,
        "supports_cutting" boolean NOT NULL DEFAULT true,
        "supports_cash_drawer" boolean NOT NULL DEFAULT false,
        "supports_barcode" boolean NOT NULL DEFAULT false,
        "supports_qr_code" boolean NOT NULL DEFAULT false,
        "supports_logo" boolean NOT NULL DEFAULT false,
        "max_copies" integer NOT NULL DEFAULT 5,
        "last_check_at" timestamp,
        "last_print_at" timestamp,
        "last_error" text,
        "total_jobs" integer NOT NULL DEFAULT 0,
        "successful_jobs" integer NOT NULL DEFAULT 0,
        "failed_jobs" integer NOT NULL DEFAULT 0,
        "cloud_config" jsonb,
        "station_mappings" jsonb,
        "metadata" jsonb,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_printer_configs" PRIMARY KEY ("id")
      )
    `);

    // Create indexes for printer_configs
    await queryRunner.query(`
      CREATE INDEX "IDX_printer_configs_branchId_isActive"
      ON "printer_configs" ("branch_id", "is_active")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_printer_configs_branchId_name"
      ON "printer_configs" ("branch_id", "name")
    `);

    // Create printer_jobs table
    await queryRunner.query(`
      CREATE TABLE "printer_jobs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "branch_id" uuid NOT NULL,
        "order_id" uuid,
        "order_number" character varying(50),
        "printer_id" uuid NOT NULL,
        "printer_name" character varying(100) NOT NULL,
        "status" "print_job_status_enum" NOT NULL DEFAULT 'pending',
        "priority" "print_job_priority_enum" NOT NULL DEFAULT 'normal',
        "content" text NOT NULL,
        "copies" integer NOT NULL DEFAULT 1,
        "retry_count" integer NOT NULL DEFAULT 0,
        "max_retries" integer NOT NULL DEFAULT 3,
        "started_at" timestamp,
        "completed_at" timestamp,
        "failed_at" timestamp,
        "next_retry_at" timestamp,
        "error_message" text,
        "error_code" character varying(50),
        "print_duration_ms" integer,
        "metadata" jsonb,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_printer_jobs" PRIMARY KEY ("id")
      )
    `);

    // Create indexes for printer_jobs
    await queryRunner.query(`
      CREATE INDEX "IDX_printer_jobs_branchId_status_priority"
      ON "printer_jobs" ("branch_id", "status", "priority")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_printer_jobs_branchId_createdAt"
      ON "printer_jobs" ("branch_id", "created_at")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_printer_jobs_printerId_status"
      ON "printer_jobs" ("printer_id", "status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_printer_jobs_orderId"
      ON "printer_jobs" ("order_id")
    `);

    // Create notification_logs table
    await queryRunner.query(`
      CREATE TABLE "notification_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "branch_id" uuid NOT NULL,
        "order_id" uuid,
        "order_number" character varying(50),
        "device_id" character varying(100) NOT NULL,
        "device_name" character varying(100),
        "device_type" "notification_device_type_enum" NOT NULL,
        "status" "notification_status_enum" NOT NULL DEFAULT 'pending',
        "message" character varying(255) NOT NULL,
        "retry_count" integer NOT NULL DEFAULT 0,
        "max_retries" integer NOT NULL DEFAULT 3,
        "sent_at" timestamp,
        "delivered_at" timestamp,
        "acknowledged_at" timestamp,
        "expired_at" timestamp,
        "expires_at" timestamp,
        "error_message" text,
        "error_code" character varying(50),
        "device_settings" jsonb,
        "metadata" jsonb,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notification_logs" PRIMARY KEY ("id")
      )
    `);

    // Create indexes for notification_logs
    await queryRunner.query(`
      CREATE INDEX "IDX_notification_logs_branchId_createdAt"
      ON "notification_logs" ("branch_id", "created_at")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_notification_logs_branchId_status"
      ON "notification_logs" ("branch_id", "status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_notification_logs_orderId"
      ON "notification_logs" ("order_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_notification_logs_deviceId_status"
      ON "notification_logs" ("device_id", "status")
    `);

    // Add foreign key constraints for printer_configs
    await queryRunner.query(`
      ALTER TABLE "printer_configs"
      ADD CONSTRAINT "FK_printer_configs_branch"
      FOREIGN KEY ("branch_id")
      REFERENCES "branches"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);

    // Add foreign key constraints for printer_jobs
    await queryRunner.query(`
      ALTER TABLE "printer_jobs"
      ADD CONSTRAINT "FK_printer_jobs_branch"
      FOREIGN KEY ("branch_id")
      REFERENCES "branches"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "printer_jobs"
      ADD CONSTRAINT "FK_printer_jobs_order"
      FOREIGN KEY ("order_id")
      REFERENCES "restaurant_orders"("id")
      ON DELETE SET NULL
      ON UPDATE NO ACTION
    `);

    // Add foreign key constraints for notification_logs
    await queryRunner.query(`
      ALTER TABLE "notification_logs"
      ADD CONSTRAINT "FK_notification_logs_branch"
      FOREIGN KEY ("branch_id")
      REFERENCES "branches"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "notification_logs"
      ADD CONSTRAINT "FK_notification_logs_order"
      FOREIGN KEY ("order_id")
      REFERENCES "restaurant_orders"("id")
      ON DELETE SET NULL
      ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "notification_logs"
      DROP CONSTRAINT "FK_notification_logs_order"
    `);

    await queryRunner.query(`
      ALTER TABLE "notification_logs"
      DROP CONSTRAINT "FK_notification_logs_branch"
    `);

    await queryRunner.query(`
      ALTER TABLE "printer_jobs"
      DROP CONSTRAINT "FK_printer_jobs_order"
    `);

    await queryRunner.query(`
      ALTER TABLE "printer_jobs"
      DROP CONSTRAINT "FK_printer_jobs_branch"
    `);

    await queryRunner.query(`
      ALTER TABLE "printer_configs"
      DROP CONSTRAINT "FK_printer_configs_branch"
    `);

    // Drop indexes for notification_logs
    await queryRunner.query(`
      DROP INDEX "IDX_notification_logs_deviceId_status"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_notification_logs_orderId"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_notification_logs_branchId_status"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_notification_logs_branchId_createdAt"
    `);

    // Drop indexes for printer_jobs
    await queryRunner.query(`
      DROP INDEX "IDX_printer_jobs_orderId"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_printer_jobs_printerId_status"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_printer_jobs_branchId_createdAt"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_printer_jobs_branchId_status_priority"
    `);

    // Drop indexes for printer_configs
    await queryRunner.query(`
      DROP INDEX "IDX_printer_configs_branchId_name"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_printer_configs_branchId_isActive"
    `);

    // Drop tables
    await queryRunner.query(`DROP TABLE "notification_logs"`);
    await queryRunner.query(`DROP TABLE "printer_jobs"`);
    await queryRunner.query(`DROP TABLE "printer_configs"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE "notification_status_enum"`);
    await queryRunner.query(`DROP TYPE "notification_device_type_enum"`);
    await queryRunner.query(`DROP TYPE "print_job_priority_enum"`);
    await queryRunner.query(`DROP TYPE "print_job_status_enum"`);
    await queryRunner.query(`DROP TYPE "printer_status_enum"`);
    await queryRunner.query(`DROP TYPE "printer_protocol_enum"`);
    await queryRunner.query(`DROP TYPE "printer_connection_type_enum"`);
  }
}
