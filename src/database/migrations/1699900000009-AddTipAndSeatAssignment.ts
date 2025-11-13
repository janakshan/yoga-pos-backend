import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTipAndSeatAssignment1699900000009
  implements MigrationInterface
{
  name = 'AddTipAndSeatAssignment1699900000009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add tip fields to restaurant_orders table
    await queryRunner.query(`
      ALTER TABLE "restaurant_orders"
      ADD COLUMN "tip_amount" decimal(10,2) NOT NULL DEFAULT 0,
      ADD COLUMN "tip_percentage" decimal(5,2),
      ADD COLUMN "tip_method" character varying(20)
    `);

    // Add comment to tip_method column
    await queryRunner.query(`
      COMMENT ON COLUMN "restaurant_orders"."tip_method"
      IS 'How tip was calculated: percentage, fixed, custom, none'
    `);

    // Add seat assignment to order_items table
    await queryRunner.query(`
      ALTER TABLE "order_items"
      ADD COLUMN "seat_number" integer
    `);

    // Create index for seat_number for faster queries
    await queryRunner.query(`
      CREATE INDEX "IDX_order_items_seat_number"
      ON "order_items" ("seat_number")
      WHERE "seat_number" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_order_items_seat_number"
    `);

    // Remove seat_number from order_items
    await queryRunner.query(`
      ALTER TABLE "order_items"
      DROP COLUMN IF EXISTS "seat_number"
    `);

    // Remove tip fields from restaurant_orders
    await queryRunner.query(`
      ALTER TABLE "restaurant_orders"
      DROP COLUMN IF EXISTS "tip_method",
      DROP COLUMN IF EXISTS "tip_percentage",
      DROP COLUMN IF EXISTS "tip_amount"
    `);
  }
}
