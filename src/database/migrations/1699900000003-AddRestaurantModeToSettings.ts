import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRestaurantModeToSettings1699900000003 implements MigrationInterface {
  name = 'AddRestaurantModeToSettings1699900000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type for business_type if it doesn't exist
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "business_type_enum" AS ENUM ('retail', 'restaurant', 'hybrid');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Add businessType column to settings table
    await queryRunner.query(`
      ALTER TABLE "settings"
      ADD COLUMN IF NOT EXISTS "businessType" "business_type_enum" DEFAULT 'retail'
    `);

    // Add restaurantSettings JSONB column to settings table
    await queryRunner.query(`
      ALTER TABLE "settings"
      ADD COLUMN IF NOT EXISTS "restaurantSettings" jsonb
    `);

    // Update setting_category enum to include 'restaurant'
    await queryRunner.query(`
      ALTER TYPE "settings_category_enum" ADD VALUE IF NOT EXISTS 'restaurant'
    `);

    // Insert default restaurant settings
    await queryRunner.query(`
      INSERT INTO "settings" ("key", "value", "dataType", "category", "label", "description", "isPublic", "isReadOnly", "businessType", "restaurantSettings")
      VALUES
        (
          'business_type',
          'retail',
          'string',
          'business',
          'Business Type',
          'Type of business: retail, restaurant, or hybrid',
          false,
          false,
          'retail',
          NULL
        ),
        (
          'restaurant_mode_enabled',
          'false',
          'boolean',
          'restaurant',
          'Restaurant Mode Enabled',
          'Enable restaurant-specific features',
          false,
          false,
          'retail',
          NULL
        )
      ON CONFLICT (key) DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove default restaurant settings
    await queryRunner.query(`
      DELETE FROM "settings"
      WHERE "key" IN ('business_type', 'restaurant_mode_enabled')
    `);

    // Remove restaurantSettings column
    await queryRunner.query(`
      ALTER TABLE "settings"
      DROP COLUMN IF EXISTS "restaurantSettings"
    `);

    // Remove businessType column
    await queryRunner.query(`
      ALTER TABLE "settings"
      DROP COLUMN IF EXISTS "businessType"
    `);

    // Drop business_type enum (be careful with this in production)
    await queryRunner.query(`
      DROP TYPE IF EXISTS "business_type_enum"
    `);
  }
}
