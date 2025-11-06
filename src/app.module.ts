import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseConfig } from './database/database.config';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import authConfig from './config/auth.config';

// Import modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { BranchesModule } from './modules/branches/branches.module';
import { ProductsModule } from './modules/products/products.module';
import { CustomersModule } from './modules/customers/customers.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { POSModule } from './modules/pos/pos.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { PurchaseOrdersModule } from './modules/purchase-orders/purchase-orders.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, authConfig],
      envFilePath: ['.env.local', '.env'],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      useClass: DatabaseConfig,
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 3600000, // 1 hour in milliseconds
        limit: 1000, // 1000 requests per hour
      },
    ]),

    // Feature modules
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    BranchesModule,
    ProductsModule,
    CustomersModule,
    InventoryModule,
    POSModule,
    InvoicesModule,
    PaymentsModule,
    ExpensesModule,
    SuppliersModule,
    PurchaseOrdersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
