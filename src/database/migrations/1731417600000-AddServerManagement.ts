import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddServerManagement1731417600000 implements MigrationInterface {
  name = 'AddServerManagement1731417600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add server-related columns to users table
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "isServer" boolean DEFAULT false,
      ADD COLUMN "serverCode" character varying UNIQUE,
      ADD COLUMN "serverProfile" jsonb
    `);

    // Add server tracking columns to invoices table
    await queryRunner.query(`
      ALTER TABLE "invoices"
      ADD COLUMN "server_id" uuid,
      ADD COLUMN "tableNumber" character varying,
      ADD COLUMN "sectionName" character varying,
      ADD CONSTRAINT "FK_invoices_server" FOREIGN KEY ("server_id") REFERENCES "users"("id") ON DELETE SET NULL
    `);

    // Add server tracking columns to sales table
    await queryRunner.query(`
      ALTER TABLE "sales"
      ADD COLUMN "server_id" uuid,
      ADD COLUMN "tableNumber" character varying,
      ADD COLUMN "sectionName" character varying,
      ADD CONSTRAINT "FK_sales_server" FOREIGN KEY ("server_id") REFERENCES "users"("id") ON DELETE SET NULL
    `);

    // Create server_sections table
    await queryRunner.query(`
      CREATE TABLE "server_sections" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "description" text,
        "tableCount" integer DEFAULT 0,
        "tables" jsonb,
        "branch_id" uuid NOT NULL,
        "status" character varying DEFAULT 'active',
        "metadata" jsonb,
        "createdAt" TIMESTAMP DEFAULT now(),
        "updatedAt" TIMESTAMP DEFAULT now(),
        CONSTRAINT "FK_server_sections_branch" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE
      )
    `);

    // Create server_shifts table
    await queryRunner.query(`
      CREATE TABLE "server_shifts" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "server_id" uuid NOT NULL,
        "branch_id" uuid NOT NULL,
        "scheduledStart" TIMESTAMP NOT NULL,
        "scheduledEnd" TIMESTAMP NOT NULL,
        "actualStart" TIMESTAMP,
        "actualEnd" TIMESTAMP,
        "status" character varying DEFAULT 'scheduled',
        "totalSales" numeric(10,2) DEFAULT 0,
        "totalTips" numeric(10,2) DEFAULT 0,
        "orderCount" integer DEFAULT 0,
        "customerCount" integer DEFAULT 0,
        "notes" text,
        "breakTimes" jsonb,
        "metadata" jsonb,
        "createdAt" TIMESTAMP DEFAULT now(),
        "updatedAt" TIMESTAMP DEFAULT now(),
        CONSTRAINT "FK_server_shifts_server" FOREIGN KEY ("server_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_server_shifts_branch" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE
      )
    `);

    // Create server_assignments table
    await queryRunner.query(`
      CREATE TABLE "server_assignments" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "server_id" uuid NOT NULL,
        "section_id" uuid NOT NULL,
        "shift_id" uuid,
        "startTime" TIMESTAMP NOT NULL,
        "endTime" TIMESTAMP,
        "status" character varying DEFAULT 'active',
        "isPrimary" boolean DEFAULT false,
        "assignedTables" jsonb,
        "notes" text,
        "metadata" jsonb,
        "createdAt" TIMESTAMP DEFAULT now(),
        "updatedAt" TIMESTAMP DEFAULT now(),
        CONSTRAINT "FK_server_assignments_server" FOREIGN KEY ("server_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_server_assignments_section" FOREIGN KEY ("section_id") REFERENCES "server_sections"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_server_assignments_shift" FOREIGN KEY ("shift_id") REFERENCES "server_shifts"("id") ON DELETE SET NULL
      )
    `);

    // Create server_tips table
    await queryRunner.query(`
      CREATE TABLE "server_tips" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "server_id" uuid NOT NULL,
        "invoice_id" uuid,
        "shift_id" uuid,
        "amount" numeric(10,2) NOT NULL,
        "type" character varying DEFAULT 'cash',
        "status" character varying DEFAULT 'pending',
        "tipDate" TIMESTAMP NOT NULL,
        "paidDate" TIMESTAMP,
        "tipPercentage" numeric(5,2),
        "orderTotal" numeric(10,2),
        "isPooled" boolean DEFAULT false,
        "pooledSharePercentage" numeric(5,2),
        "notes" text,
        "metadata" jsonb,
        "createdAt" TIMESTAMP DEFAULT now(),
        "updatedAt" TIMESTAMP DEFAULT now(),
        CONSTRAINT "FK_server_tips_server" FOREIGN KEY ("server_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_server_tips_invoice" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_server_tips_shift" FOREIGN KEY ("shift_id") REFERENCES "server_shifts"("id") ON DELETE SET NULL
      )
    `);

    // Create indexes for better query performance
    await queryRunner.query(`CREATE INDEX "IDX_users_isServer" ON "users"("isServer")`);
    await queryRunner.query(`CREATE INDEX "IDX_users_serverCode" ON "users"("serverCode")`);
    await queryRunner.query(`CREATE INDEX "IDX_invoices_server_id" ON "invoices"("server_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_sales_server_id" ON "sales"("server_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_server_sections_branch_id" ON "server_sections"("branch_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_server_sections_status" ON "server_sections"("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_server_shifts_server_id" ON "server_shifts"("server_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_server_shifts_branch_id" ON "server_shifts"("branch_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_server_shifts_status" ON "server_shifts"("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_server_assignments_server_id" ON "server_assignments"("server_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_server_assignments_section_id" ON "server_assignments"("section_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_server_assignments_shift_id" ON "server_assignments"("shift_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_server_assignments_status" ON "server_assignments"("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_server_tips_server_id" ON "server_tips"("server_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_server_tips_invoice_id" ON "server_tips"("invoice_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_server_tips_shift_id" ON "server_tips"("shift_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_server_tips_status" ON "server_tips"("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_server_tips_tipDate" ON "server_tips"("tipDate")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_server_tips_tipDate"`);
    await queryRunner.query(`DROP INDEX "IDX_server_tips_status"`);
    await queryRunner.query(`DROP INDEX "IDX_server_tips_shift_id"`);
    await queryRunner.query(`DROP INDEX "IDX_server_tips_invoice_id"`);
    await queryRunner.query(`DROP INDEX "IDX_server_tips_server_id"`);
    await queryRunner.query(`DROP INDEX "IDX_server_assignments_status"`);
    await queryRunner.query(`DROP INDEX "IDX_server_assignments_shift_id"`);
    await queryRunner.query(`DROP INDEX "IDX_server_assignments_section_id"`);
    await queryRunner.query(`DROP INDEX "IDX_server_assignments_server_id"`);
    await queryRunner.query(`DROP INDEX "IDX_server_shifts_status"`);
    await queryRunner.query(`DROP INDEX "IDX_server_shifts_branch_id"`);
    await queryRunner.query(`DROP INDEX "IDX_server_shifts_server_id"`);
    await queryRunner.query(`DROP INDEX "IDX_server_sections_status"`);
    await queryRunner.query(`DROP INDEX "IDX_server_sections_branch_id"`);
    await queryRunner.query(`DROP INDEX "IDX_sales_server_id"`);
    await queryRunner.query(`DROP INDEX "IDX_invoices_server_id"`);
    await queryRunner.query(`DROP INDEX "IDX_users_serverCode"`);
    await queryRunner.query(`DROP INDEX "IDX_users_isServer"`);

    // Drop tables in reverse order
    await queryRunner.query(`DROP TABLE "server_tips"`);
    await queryRunner.query(`DROP TABLE "server_assignments"`);
    await queryRunner.query(`DROP TABLE "server_shifts"`);
    await queryRunner.query(`DROP TABLE "server_sections"`);

    // Remove columns from sales table
    await queryRunner.query(`
      ALTER TABLE "sales"
      DROP CONSTRAINT "FK_sales_server",
      DROP COLUMN "sectionName",
      DROP COLUMN "tableNumber",
      DROP COLUMN "server_id"
    `);

    // Remove columns from invoices table
    await queryRunner.query(`
      ALTER TABLE "invoices"
      DROP CONSTRAINT "FK_invoices_server",
      DROP COLUMN "sectionName",
      DROP COLUMN "tableNumber",
      DROP COLUMN "server_id"
    `);

    // Remove server-related columns from users table
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "serverProfile",
      DROP COLUMN "serverCode",
      DROP COLUMN "isServer"
    `);
  }
}
