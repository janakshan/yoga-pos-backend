import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { RestaurantReportsController } from './controllers/restaurant-reports.controller';
import { RestaurantReportsService } from './services/restaurant-reports.service';
import { ReportExportService } from './services/report-export.service';
import { RestaurantOrder } from '../restaurant/entities/restaurant-order.entity';
import { OrderItem } from '../restaurant/entities/order-item.entity';
import { Table } from '../restaurant/entities/table.entity';
import { ServerShift } from '../server-management/entities/server-shift.entity';
import { Product } from '../products/entities/product.entity';
import { Recipe } from '../recipes/entities/recipe.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RestaurantOrder,
      OrderItem,
      Table,
      ServerShift,
      Product,
      Recipe,
    ]),
    CacheModule.register({
      ttl: 1800, // Default TTL: 30 minutes (in seconds)
      max: 100, // Maximum number of items in cache
    }),
  ],
  controllers: [RestaurantReportsController],
  providers: [RestaurantReportsService, ReportExportService],
  exports: [RestaurantReportsService, ReportExportService],
})
export class RestaurantReportsModule {}
