import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMissingColumns1699900000002 implements MigrationInterface {
  name = 'AddMissingColumns1699900000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add missing columns to suppliers table
    await queryRunner.query(`
      ALTER TABLE "suppliers"
      ADD COLUMN "status" character varying DEFAULT 'active',
      ADD COLUMN "averageRating" numeric(3,1),
      ADD COLUMN "totalSpent" numeric(12,2) DEFAULT 0,
      ADD COLUMN "totalOrders" integer DEFAULT 0,
      ADD COLUMN "onTimeDeliveryRate" numeric(5,2),
      ADD COLUMN "lastOrderDate" TIMESTAMP
    `);

    // Add missing columns to customers table
    await queryRunner.query(`
      ALTER TABLE "customers"
      ADD COLUMN "customerType" character varying,
      ADD COLUMN "status" character varying DEFAULT 'active',
      ADD COLUMN "creditBalance" numeric(10,2) DEFAULT 0,
      ADD COLUMN "creditLimit" numeric(10,2),
      ADD COLUMN "storeCreditBalance" numeric(10,2) DEFAULT 0
    `);

    // Add missing columns to products table
    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN "stockQuantity" integer DEFAULT 0
    `);

    // Add missing columns to product_categories table
    await queryRunner.query(`
      ALTER TABLE "product_categories"
      ADD COLUMN "sortOrder" integer
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove columns from product_categories table
    await queryRunner.query(`
      ALTER TABLE "product_categories"
      DROP COLUMN "sortOrder"
    `);

    // Remove columns from products table
    await queryRunner.query(`
      ALTER TABLE "products"
      DROP COLUMN "stockQuantity"
    `);

    // Remove columns from customers table
    await queryRunner.query(`
      ALTER TABLE "customers"
      DROP COLUMN "storeCreditBalance",
      DROP COLUMN "creditLimit",
      DROP COLUMN "creditBalance",
      DROP COLUMN "status",
      DROP COLUMN "customerType"
    `);

    // Remove columns from suppliers table
    await queryRunner.query(`
      ALTER TABLE "suppliers"
      DROP COLUMN "lastOrderDate",
      DROP COLUMN "onTimeDeliveryRate",
      DROP COLUMN "totalOrders",
      DROP COLUMN "totalSpent",
      DROP COLUMN "averageRating",
      DROP COLUMN "status"
    `);
  }
}
