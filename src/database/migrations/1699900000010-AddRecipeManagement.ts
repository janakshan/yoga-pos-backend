import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRecipeManagement1699900000010 implements MigrationInterface {
  name = 'AddRecipeManagement1699900000010';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create recipes table
    await queryRunner.query(`
      CREATE TABLE "recipes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(255) NOT NULL,
        "description" text,
        "code" character varying(100) NOT NULL,
        "productId" uuid,
        "prepTime" integer NOT NULL,
        "cookTime" integer NOT NULL,
        "totalTime" integer GENERATED ALWAYS AS ("prepTime" + "cookTime") STORED,
        "yieldQuantity" decimal(10,2) NOT NULL,
        "yieldUnit" character varying(50) NOT NULL,
        "servingSize" decimal(10,2) NOT NULL DEFAULT 1,
        "ingredientCost" decimal(10,2) NOT NULL DEFAULT 0,
        "laborCost" decimal(10,2) NOT NULL DEFAULT 0,
        "overheadCost" decimal(10,2) NOT NULL DEFAULT 0,
        "totalCost" decimal(10,2) GENERATED ALWAYS AS ("ingredientCost" + "laborCost" + "overheadCost") STORED,
        "costPerServing" decimal(10,2) NOT NULL DEFAULT 0,
        "wastePercentage" decimal(5,2) NOT NULL DEFAULT 0,
        "instructions" text,
        "steps" jsonb,
        "notes" text,
        "category" character varying(100),
        "tags" text,
        "difficultyLevel" character varying NOT NULL DEFAULT 'medium',
        "kitchenStation" character varying(100),
        "allergens" text,
        "dietaryRestrictions" text,
        "isActive" boolean NOT NULL DEFAULT true,
        "isPublished" boolean NOT NULL DEFAULT false,
        "version" integer NOT NULL DEFAULT 1,
        "parentRecipeId" uuid,
        "imageUrl" character varying(500),
        "images" jsonb,
        "videos" jsonb,
        "nutritionalInfo" jsonb,
        "customFields" jsonb,
        "createdBy" uuid,
        "updatedBy" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_recipes" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_recipes_code" UNIQUE ("code"),
        CONSTRAINT "CHK_recipes_difficulty" CHECK ("difficultyLevel" IN ('easy', 'medium', 'hard', 'expert')),
        CONSTRAINT "CHK_recipes_waste_percentage" CHECK ("wastePercentage" >= 0 AND "wastePercentage" <= 100)
      )
    `);

    // Add comments to columns
    await queryRunner.query(`
      COMMENT ON COLUMN "recipes"."prepTime" IS 'Preparation time in minutes'
    `);
    await queryRunner.query(`
      COMMENT ON COLUMN "recipes"."cookTime" IS 'Cooking time in minutes'
    `);
    await queryRunner.query(`
      COMMENT ON COLUMN "recipes"."totalTime" IS 'Total time in minutes (computed)'
    `);
    await queryRunner.query(`
      COMMENT ON COLUMN "recipes"."yieldUnit" IS 'Unit of measurement for yield (e.g., portions, kg, liters)'
    `);
    await queryRunner.query(`
      COMMENT ON COLUMN "recipes"."servingSize" IS 'Default serving size'
    `);
    await queryRunner.query(`
      COMMENT ON COLUMN "recipes"."ingredientCost" IS 'Total cost of all ingredients'
    `);
    await queryRunner.query(`
      COMMENT ON COLUMN "recipes"."laborCost" IS 'Labor cost per recipe'
    `);
    await queryRunner.query(`
      COMMENT ON COLUMN "recipes"."overheadCost" IS 'Overhead cost per recipe'
    `);
    await queryRunner.query(`
      COMMENT ON COLUMN "recipes"."totalCost" IS 'Total recipe cost (computed)'
    `);
    await queryRunner.query(`
      COMMENT ON COLUMN "recipes"."costPerServing" IS 'Cost per serving'
    `);
    await queryRunner.query(`
      COMMENT ON COLUMN "recipes"."wastePercentage" IS 'Expected waste percentage (0-100)'
    `);
    await queryRunner.query(`
      COMMENT ON COLUMN "recipes"."steps" IS 'Step-by-step instructions array'
    `);
    await queryRunner.query(`
      COMMENT ON COLUMN "recipes"."kitchenStation" IS 'Kitchen station assigned to this recipe'
    `);
    await queryRunner.query(`
      COMMENT ON COLUMN "recipes"."parentRecipeId" IS 'Parent recipe ID for versioning'
    `);

    // Create recipe_ingredients table
    await queryRunner.query(`
      CREATE TABLE "recipe_ingredients" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "recipeId" uuid NOT NULL,
        "ingredientId" uuid NOT NULL,
        "ingredientName" character varying(255) NOT NULL,
        "ingredientSku" character varying(100),
        "quantity" decimal(10,4) NOT NULL,
        "unit" character varying(50) NOT NULL,
        "unitCost" decimal(10,2) NOT NULL DEFAULT 0,
        "totalCost" decimal(10,2) GENERATED ALWAYS AS (quantity * "unitCost") STORED,
        "preparation" text,
        "notes" text,
        "sortOrder" integer NOT NULL DEFAULT 0,
        "ingredientGroup" character varying(100),
        "isRequired" boolean NOT NULL DEFAULT true,
        "isOptional" boolean NOT NULL DEFAULT false,
        "substitutions" jsonb,
        "wastePercentage" decimal(5,2) NOT NULL DEFAULT 0,
        "conversionFactors" jsonb,
        "customFields" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_recipe_ingredients" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_recipe_ingredients_waste" CHECK ("wastePercentage" >= 0 AND "wastePercentage" <= 100)
      )
    `);

    // Add comments to columns
    await queryRunner.query(`
      COMMENT ON COLUMN "recipe_ingredients"."unit" IS 'Unit of measurement (e.g., kg, g, ml, l, pieces, cups)'
    `);
    await queryRunner.query(`
      COMMENT ON COLUMN "recipe_ingredients"."unitCost" IS 'Unit cost of ingredient at time of recipe creation'
    `);
    await queryRunner.query(`
      COMMENT ON COLUMN "recipe_ingredients"."totalCost" IS 'Total cost for this ingredient (computed)'
    `);
    await queryRunner.query(`
      COMMENT ON COLUMN "recipe_ingredients"."preparation" IS 'Preparation method for this ingredient'
    `);
    await queryRunner.query(`
      COMMENT ON COLUMN "recipe_ingredients"."notes" IS 'Any notes or substitutions'
    `);
    await queryRunner.query(`
      COMMENT ON COLUMN "recipe_ingredients"."sortOrder" IS 'Order in which ingredient is used'
    `);
    await queryRunner.query(`
      COMMENT ON COLUMN "recipe_ingredients"."ingredientGroup" IS 'Group ingredients by section (e.g., Sauce, Base, Garnish)'
    `);
    await queryRunner.query(`
      COMMENT ON COLUMN "recipe_ingredients"."wastePercentage" IS 'Expected waste percentage for this ingredient (0-100)'
    `);
    await queryRunner.query(`
      COMMENT ON COLUMN "recipe_ingredients"."conversionFactors" IS 'Conversion ratios to other units'
    `);

    // Create foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "recipes"
      ADD CONSTRAINT "FK_recipes_product"
      FOREIGN KEY ("productId")
      REFERENCES "products"("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "recipes"
      ADD CONSTRAINT "FK_recipes_createdBy"
      FOREIGN KEY ("createdBy")
      REFERENCES "users"("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "recipes"
      ADD CONSTRAINT "FK_recipes_updatedBy"
      FOREIGN KEY ("updatedBy")
      REFERENCES "users"("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "recipe_ingredients"
      ADD CONSTRAINT "FK_recipe_ingredients_recipe"
      FOREIGN KEY ("recipeId")
      REFERENCES "recipes"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "recipe_ingredients"
      ADD CONSTRAINT "FK_recipe_ingredients_ingredient"
      FOREIGN KEY ("ingredientId")
      REFERENCES "products"("id")
      ON DELETE RESTRICT
      ON UPDATE CASCADE
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_recipes_code" ON "recipes" ("code")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_recipes_productId" ON "recipes" ("productId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_recipes_category" ON "recipes" ("category")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_recipes_difficultyLevel" ON "recipes" ("difficultyLevel")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_recipes_isActive" ON "recipes" ("isActive")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_recipes_isPublished" ON "recipes" ("isPublished")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_recipes_kitchenStation" ON "recipes" ("kitchenStation")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_recipes_createdAt" ON "recipes" ("createdAt")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_recipe_ingredients_recipeId" ON "recipe_ingredients" ("recipeId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_recipe_ingredients_ingredientId" ON "recipe_ingredients" ("ingredientId")
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_recipe_ingredients_recipe_ingredient"
      ON "recipe_ingredients" ("recipeId", "ingredientId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_recipe_ingredients_sortOrder" ON "recipe_ingredients" ("sortOrder")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_recipe_ingredients_sortOrder"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_recipe_ingredients_recipe_ingredient"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_recipe_ingredients_ingredientId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_recipe_ingredients_recipeId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_recipes_createdAt"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_recipes_kitchenStation"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_recipes_isPublished"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_recipes_isActive"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_recipes_difficultyLevel"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_recipes_category"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_recipes_productId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_recipes_code"`);

    // Drop foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "recipe_ingredients"
      DROP CONSTRAINT IF EXISTS "FK_recipe_ingredients_ingredient"
    `);

    await queryRunner.query(`
      ALTER TABLE "recipe_ingredients"
      DROP CONSTRAINT IF EXISTS "FK_recipe_ingredients_recipe"
    `);

    await queryRunner.query(`
      ALTER TABLE "recipes"
      DROP CONSTRAINT IF EXISTS "FK_recipes_updatedBy"
    `);

    await queryRunner.query(`
      ALTER TABLE "recipes"
      DROP CONSTRAINT IF EXISTS "FK_recipes_createdBy"
    `);

    await queryRunner.query(`
      ALTER TABLE "recipes"
      DROP CONSTRAINT IF EXISTS "FK_recipes_product"
    `);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "recipe_ingredients"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "recipes"`);
  }
}
