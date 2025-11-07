import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotificationsBackupSettings1699900000001
  implements MigrationInterface
{
  name = 'AddNotificationsBackupSettings1699900000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enums for notifications
    await queryRunner.query(`
      CREATE TYPE "notification_channel_enum" AS ENUM('email', 'sms', 'push', 'whatsapp')
    `);
    await queryRunner.query(`
      CREATE TYPE "notification_status_enum" AS ENUM('pending', 'sent', 'failed', 'scheduled')
    `);
    await queryRunner.query(`
      CREATE TYPE "notification_type_enum" AS ENUM('low_stock', 'order_update', 'payment_received', 'marketing', 'system', 'custom')
    `);

    // Create enums for backup
    await queryRunner.query(`
      CREATE TYPE "backup_status_enum" AS ENUM('pending', 'in_progress', 'completed', 'failed', 'uploading', 'uploaded')
    `);
    await queryRunner.query(`
      CREATE TYPE "backup_type_enum" AS ENUM('manual', 'automatic', 'scheduled')
    `);
    await queryRunner.query(`
      CREATE TYPE "backup_storage_location_enum" AS ENUM('local', 'google_drive', 'aws_s3', 'dropbox')
    `);

    // Create enums for settings
    await queryRunner.query(`
      CREATE TYPE "setting_category_enum" AS ENUM('general', 'business', 'branding', 'hardware', 'notification', 'payment', 'tax', 'security', 'integration')
    `);
    await queryRunner.query(`
      CREATE TYPE "setting_data_type_enum" AS ENUM('string', 'number', 'boolean', 'json', 'array')
    `);

    // Create notifications table
    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "type" "notification_type_enum" NOT NULL DEFAULT 'system',
        "channel" "notification_channel_enum" NOT NULL,
        "status" "notification_status_enum" NOT NULL DEFAULT 'pending',
        "subject" character varying,
        "message" text NOT NULL,
        "recipient" character varying,
        "user_id" uuid,
        "metadata" jsonb,
        "scheduledFor" TIMESTAMP,
        "sentAt" TIMESTAMP,
        "errorMessage" text,
        "retryCount" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notifications" PRIMARY KEY ("id")
      )
    `);

    // Create backups table
    await queryRunner.query(`
      CREATE TABLE "backups" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "filename" character varying NOT NULL,
        "type" "backup_type_enum" NOT NULL DEFAULT 'manual',
        "status" "backup_status_enum" NOT NULL DEFAULT 'pending',
        "storageLocation" "backup_storage_location_enum" NOT NULL DEFAULT 'local',
        "size" bigint,
        "filePath" character varying,
        "cloudUrl" character varying,
        "cloudFileId" character varying,
        "metadata" jsonb,
        "startedAt" TIMESTAMP,
        "completedAt" TIMESTAMP,
        "errorMessage" text,
        "retryCount" integer NOT NULL DEFAULT 0,
        "scheduledFor" TIMESTAMP,
        "isAutoDeleteEnabled" boolean NOT NULL DEFAULT false,
        "retentionDays" integer,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_backups_filename" UNIQUE ("filename"),
        CONSTRAINT "PK_backups" PRIMARY KEY ("id")
      )
    `);

    // Create settings table
    await queryRunner.query(`
      CREATE TABLE "settings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "key" character varying NOT NULL,
        "value" text NOT NULL,
        "dataType" "setting_data_type_enum" NOT NULL DEFAULT 'string',
        "category" "setting_category_enum" NOT NULL DEFAULT 'general',
        "label" character varying,
        "description" text,
        "isPublic" boolean NOT NULL DEFAULT false,
        "isReadOnly" boolean NOT NULL DEFAULT false,
        "metadata" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_settings_key" UNIQUE ("key"),
        CONSTRAINT "PK_settings" PRIMARY KEY ("id")
      )
    `);

    // Add foreign key for notifications
    await queryRunner.query(`
      ALTER TABLE "notifications"
      ADD CONSTRAINT "FK_notifications_user"
      FOREIGN KEY ("user_id")
      REFERENCES "users"("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_notifications_user_id" ON "notifications"("user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_notifications_status" ON "notifications"("status")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_notifications_channel" ON "notifications"("channel")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_notifications_type" ON "notifications"("type")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_backups_status" ON "backups"("status")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_backups_type" ON "backups"("type")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_settings_category" ON "settings"("category")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_settings_key" ON "settings"("key")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_settings_key"`);
    await queryRunner.query(`DROP INDEX "IDX_settings_category"`);
    await queryRunner.query(`DROP INDEX "IDX_backups_type"`);
    await queryRunner.query(`DROP INDEX "IDX_backups_status"`);
    await queryRunner.query(`DROP INDEX "IDX_notifications_type"`);
    await queryRunner.query(`DROP INDEX "IDX_notifications_channel"`);
    await queryRunner.query(`DROP INDEX "IDX_notifications_status"`);
    await queryRunner.query(`DROP INDEX "IDX_notifications_user_id"`);

    // Drop foreign keys
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP CONSTRAINT "FK_notifications_user"`,
    );

    // Drop tables
    await queryRunner.query(`DROP TABLE "settings"`);
    await queryRunner.query(`DROP TABLE "backups"`);
    await queryRunner.query(`DROP TABLE "notifications"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE "setting_data_type_enum"`);
    await queryRunner.query(`DROP TYPE "setting_category_enum"`);
    await queryRunner.query(`DROP TYPE "backup_storage_location_enum"`);
    await queryRunner.query(`DROP TYPE "backup_type_enum"`);
    await queryRunner.query(`DROP TYPE "backup_status_enum"`);
    await queryRunner.query(`DROP TYPE "notification_type_enum"`);
    await queryRunner.query(`DROP TYPE "notification_status_enum"`);
    await queryRunner.query(`DROP TYPE "notification_channel_enum"`);
  }
}
