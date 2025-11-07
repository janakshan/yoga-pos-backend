import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from './entities/customer.entity';
import { CustomerSegment } from './entities/customer-segment.entity';
import { CustomerNote } from './entities/customer-note.entity';
import { CreditTransaction } from './entities/credit-transaction.entity';
import { StoreCreditTransaction } from './entities/store-credit-transaction.entity';
import { CustomersService } from './customers.service';
import { CustomerSegmentsService } from './services/customer-segments.service';
import { CustomerNotesService } from './services/customer-notes.service';
import { CreditManagementService } from './services/credit-management.service';
import { StoreCreditService } from './services/store-credit.service';
import { CustomersController } from './customers.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Customer,
      CustomerSegment,
      CustomerNote,
      CreditTransaction,
      StoreCreditTransaction,
    ]),
  ],
  controllers: [CustomersController],
  providers: [
    CustomersService,
    CustomerSegmentsService,
    CustomerNotesService,
    CreditManagementService,
    StoreCreditService,
  ],
  exports: [CustomersService, TypeOrmModule],
})
export class CustomersModule {}
