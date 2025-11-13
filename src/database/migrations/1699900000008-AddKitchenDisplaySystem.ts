import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddKitchenDisplaySystem1699900000008
  implements MigrationInterface
{
  name = 'AddKitchenDisplaySystem1699900000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create kitchen_stations table
    await queryRunner.query(`
      CREATE TABLE "kitchen_stations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "branch_id" uuid NOT NULL,
        "station_type" "kitchen_station_enum" NOT NULL,
        "name" character varying(100) NOT NULL,
        "description" text,
        "is_active" boolean NOT NULL DEFAULT true,
        "display_order" integer NOT NULL DEFAULT 1,
        "color" character varying(7),
        "default_prep_time" integer NOT NULL DEFAULT 15,
        "warning_threshold" integer NOT NULL DEFAULT 10,
        "critical_threshold" integer NOT NULL DEFAULT 5,
        "sound_alerts_enabled" boolean NOT NULL DEFAULT true,
        "visual_alerts_enabled" boolean NOT NULL DEFAULT true,
        "alert_sound_url" character varying,
        "auto_print_enabled" boolean NOT NULL DEFAULT false,
        "printer_name" character varying,
        "printer_ip" character varying,
        "printer_port" integer,
        "target_completion_time" integer NOT NULL DEFAULT 20,
        "track_performance" boolean NOT NULL DEFAULT true,
        "max_concurrent_orders" integer,
        "max_items_per_order" integer,
        "enable_course_sequencing" boolean NOT NULL DEFAULT false,
        "course_delays" jsonb,
        "assigned_staff" jsonb,
        "metadata" jsonb,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_kitchen_stations" PRIMARY KEY ("id")
      )
    `);

    // Create indexes for kitchen_stations
    await queryRunner.query(`
      CREATE INDEX "IDX_kitchen_stations_branchId_stationType"
      ON "kitchen_stations" ("branch_id", "station_type")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_kitchen_stations_branchId_isActive"
      ON "kitchen_stations" ("branch_id", "is_active")
    `);

    // Add foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "kitchen_stations"
      ADD CONSTRAINT "FK_kitchen_stations_branch"
      FOREIGN KEY ("branch_id")
      REFERENCES "branches"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "kitchen_stations"
      DROP CONSTRAINT "FK_kitchen_stations_branch"
    `);

    // Drop indexes
    await queryRunner.query(`
      DROP INDEX "IDX_kitchen_stations_branchId_isActive"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_kitchen_stations_branchId_stationType"
    `);

    // Drop table
    await queryRunner.query(`
      DROP TABLE "kitchen_stations"
    `);
  }
}
