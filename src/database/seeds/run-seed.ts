import { AppDataSource } from '../data-source';
import { seedPermissions } from './1-permissions.seed';
import { seedRoles } from './2-roles.seed';
import { seedBranches } from './3-branches.seed';
import { seedUsers } from './4-users.seed';
import { seedSuppliers } from './5-suppliers.seed';
import { seedCategories } from './6-categories.seed';
import { seedProducts } from './7-products.seed';
import { seedCustomers } from './8-customers.seed';

async function runSeeds() {
  console.log('🌱 Starting database seeding...\n');

  try {
    // Initialize data source
    await AppDataSource.initialize();
    console.log('✓ Database connection established\n');

    // Run seeds in order (respecting dependencies)
    console.log('📋 Seeding Permissions...');
    await seedPermissions(AppDataSource);
    console.log('');

    console.log('👥 Seeding Roles...');
    await seedRoles(AppDataSource);
    console.log('');

    console.log('🏢 Seeding Branches...');
    await seedBranches(AppDataSource);
    console.log('');

    console.log('👤 Seeding Users...');
    await seedUsers(AppDataSource);
    console.log('');

    console.log('🏭 Seeding Suppliers...');
    await seedSuppliers(AppDataSource);
    console.log('');

    console.log('📂 Seeding Categories...');
    await seedCategories(AppDataSource);
    console.log('');

    console.log('📦 Seeding Products...');
    await seedProducts(AppDataSource);
    console.log('');

    console.log('🛍️  Seeding Customers...');
    await seedCustomers(AppDataSource);
    console.log('');

    console.log('✅ Database seeding completed successfully!\n');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  } finally {
    // Close database connection
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('✓ Database connection closed');
    }
  }
}

// Run the seeder
runSeeds();
