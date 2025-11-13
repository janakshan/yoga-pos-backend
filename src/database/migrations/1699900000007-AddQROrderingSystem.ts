import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQROrderingSystem1699900000007 implements MigrationInterface {
  name = 'AddQROrderingSystem1699900000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create table_qr_codes table
    await queryRunner.query(`
      CREATE TYPE "table_qr_code_status_enum" AS ENUM('ACTIVE', 'INACTIVE', 'EXPIRED', 'DISABLED')
    `);

    await queryRunner.query(`
      CREATE TYPE "table_qr_code_type_enum" AS ENUM('MENU_ONLY', 'ORDER_ENABLED', 'FULL_SERVICE')
    `);

    await queryRunner.query(`
      CREATE TABLE "table_qr_codes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "branchId" uuid NOT NULL,
        "tableId" uuid,
        "qrCode" character varying(500) NOT NULL,
        "qrCodeImage" text,
        "deepLink" character varying(500) NOT NULL,
        "type" "table_qr_code_type_enum" NOT NULL DEFAULT 'FULL_SERVICE',
        "status" "table_qr_code_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "scanCount" integer NOT NULL DEFAULT 0,
        "lastScannedAt" timestamp,
        "expiresAt" timestamp,
        "metadata" jsonb,
        "secretKey" character varying(100),
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_table_qr_codes_qrCode" UNIQUE ("qrCode"),
        CONSTRAINT "UQ_table_qr_codes_branch_table" UNIQUE ("branchId", "tableId"),
        CONSTRAINT "PK_table_qr_codes" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_table_qr_codes_branchId" ON "table_qr_codes" ("branchId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_table_qr_codes_tableId" ON "table_qr_codes" ("tableId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_table_qr_codes_branchId_status" ON "table_qr_codes" ("branchId", "status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_table_qr_codes_qrCode" ON "table_qr_codes" ("qrCode")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_table_qr_codes_status" ON "table_qr_codes" ("status")
    `);

    // Create qr_order_sessions table
    await queryRunner.query(`
      CREATE TYPE "qr_order_session_status_enum" AS ENUM('ACTIVE', 'EXPIRED', 'COMPLETED', 'ABANDONED')
    `);

    await queryRunner.query(`
      CREATE TABLE "qr_order_sessions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "branchId" uuid NOT NULL,
        "tableId" uuid,
        "qrCodeId" uuid,
        "sessionToken" character varying(500) NOT NULL,
        "status" "qr_order_session_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "expiresAt" timestamp NOT NULL,
        "guestName" character varying(255),
        "guestPhone" character varying(20),
        "guestEmail" character varying(255),
        "guestCount" integer,
        "deviceId" character varying(500),
        "userAgent" character varying(255),
        "ipAddress" character varying(45),
        "firstAccessAt" timestamp NOT NULL,
        "lastAccessAt" timestamp NOT NULL,
        "accessCount" integer NOT NULL DEFAULT 0,
        "actions" jsonb,
        "cart" jsonb,
        "orderIds" text,
        "callServerCount" integer NOT NULL DEFAULT 0,
        "lastCallServerAt" timestamp,
        "billRequested" boolean NOT NULL DEFAULT false,
        "billRequestedAt" timestamp,
        "paymentCompleted" boolean NOT NULL DEFAULT false,
        "paymentCompletedAt" timestamp,
        "paymentMethod" character varying(100),
        "metadata" jsonb,
        "totalSpent" integer,
        "totalOrders" integer,
        "sessionDuration" integer,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        "completedAt" timestamp,
        "abandonedAt" timestamp,
        CONSTRAINT "UQ_qr_order_sessions_sessionToken" UNIQUE ("sessionToken"),
        CONSTRAINT "PK_qr_order_sessions" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_qr_order_sessions_branchId" ON "qr_order_sessions" ("branchId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_qr_order_sessions_tableId" ON "qr_order_sessions" ("tableId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_qr_order_sessions_branchId_status" ON "qr_order_sessions" ("branchId", "status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_qr_order_sessions_tableId_status" ON "qr_order_sessions" ("tableId", "status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_qr_order_sessions_sessionToken" ON "qr_order_sessions" ("sessionToken")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_qr_order_sessions_expiresAt" ON "qr_order_sessions" ("expiresAt")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_qr_order_sessions_status" ON "qr_order_sessions" ("status")
    `);

    // Add qr_session_id column to restaurant_orders table
    await queryRunner.query(`
      ALTER TABLE "restaurant_orders" ADD "qr_session_id" uuid
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_restaurant_orders_qr_session_id" ON "restaurant_orders" ("qr_session_id")
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "table_qr_codes"
      ADD CONSTRAINT "FK_table_qr_codes_branchId"
      FOREIGN KEY ("branchId")
      REFERENCES "branches"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "table_qr_codes"
      ADD CONSTRAINT "FK_table_qr_codes_tableId"
      FOREIGN KEY ("tableId")
      REFERENCES "tables"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "qr_order_sessions"
      ADD CONSTRAINT "FK_qr_order_sessions_branchId"
      FOREIGN KEY ("branchId")
      REFERENCES "branches"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "qr_order_sessions"
      ADD CONSTRAINT "FK_qr_order_sessions_tableId"
      FOREIGN KEY ("tableId")
      REFERENCES "tables"("id")
      ON DELETE SET NULL
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "qr_order_sessions"
      ADD CONSTRAINT "FK_qr_order_sessions_qrCodeId"
      FOREIGN KEY ("qrCodeId")
      REFERENCES "table_qr_codes"("id")
      ON DELETE SET NULL
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "restaurant_orders"
      ADD CONSTRAINT "FK_restaurant_orders_qr_session_id"
      FOREIGN KEY ("qr_session_id")
      REFERENCES "qr_order_sessions"("id")
      ON DELETE SET NULL
      ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "restaurant_orders" DROP CONSTRAINT "FK_restaurant_orders_qr_session_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "qr_order_sessions" DROP CONSTRAINT "FK_qr_order_sessions_qrCodeId"
    `);

    await queryRunner.query(`
      ALTER TABLE "qr_order_sessions" DROP CONSTRAINT "FK_qr_order_sessions_tableId"
    `);

    await queryRunner.query(`
      ALTER TABLE "qr_order_sessions" DROP CONSTRAINT "FK_qr_order_sessions_branchId"
    `);

    await queryRunner.query(`
      ALTER TABLE "table_qr_codes" DROP CONSTRAINT "FK_table_qr_codes_tableId"
    `);

    await queryRunner.query(`
      ALTER TABLE "table_qr_codes" DROP CONSTRAINT "FK_table_qr_codes_branchId"
    `);

    // Remove qr_session_id column from restaurant_orders
    await queryRunner.query(`
      DROP INDEX "IDX_restaurant_orders_qr_session_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "restaurant_orders" DROP COLUMN "qr_session_id"
    `);

    // Drop qr_order_sessions table
    await queryRunner.query(`DROP INDEX "IDX_qr_order_sessions_status"`);
    await queryRunner.query(`DROP INDEX "IDX_qr_order_sessions_expiresAt"`);
    await queryRunner.query(`DROP INDEX "IDX_qr_order_sessions_sessionToken"`);
    await queryRunner.query(`DROP INDEX "IDX_qr_order_sessions_tableId_status"`);
    await queryRunner.query(`DROP INDEX "IDX_qr_order_sessions_branchId_status"`);
    await queryRunner.query(`DROP INDEX "IDX_qr_order_sessions_tableId"`);
    await queryRunner.query(`DROP INDEX "IDX_qr_order_sessions_branchId"`);
    await queryRunner.query(`DROP TABLE "qr_order_sessions"`);
    await queryRunner.query(`DROP TYPE "qr_order_session_status_enum"`);

    // Drop table_qr_codes table
    await queryRunner.query(`DROP INDEX "IDX_table_qr_codes_status"`);
    await queryRunner.query(`DROP INDEX "IDX_table_qr_codes_qrCode"`);
    await queryRunner.query(`DROP INDEX "IDX_table_qr_codes_branchId_status"`);
    await queryRunner.query(`DROP INDEX "IDX_table_qr_codes_tableId"`);
    await queryRunner.query(`DROP INDEX "IDX_table_qr_codes_branchId"`);
    await queryRunner.query(`DROP TABLE "table_qr_codes"`);
    await queryRunner.query(`DROP TYPE "table_qr_code_type_enum"`);
    await queryRunner.query(`DROP TYPE "table_qr_code_status_enum"`);
  }
}
