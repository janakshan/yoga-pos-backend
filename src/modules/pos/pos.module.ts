import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PosService } from './pos.service';
import { PosController } from './pos.controller';
import { Sale } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { Product } from '../products/entities/product.entity';
import { InventoryTransaction } from '../inventory/entities/inventory-transaction.entity';
import { Payment } from '../payments/entities/payment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Sale,
      SaleItem,
      Product,
      InventoryTransaction,
      Payment,
    ]),
  ],
  controllers: [PosController],
  providers: [PosService],
  exports: [PosService],
})
export class PosModule {}
