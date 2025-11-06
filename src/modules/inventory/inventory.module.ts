import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryTransaction } from './entities/inventory-transaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([InventoryTransaction])],
  controllers: [],
  providers: [],
  exports: [],
})
export class InventoryModule {}
