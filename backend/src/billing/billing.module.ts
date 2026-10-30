// backend/src/billing/billing.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { ProcedurePrice } from './entities/procedure-price.entity';
import { Bill, BillItem } from './entities/bill.entity';
import { Estimate } from './entities/estimate.entity';
import { DayBook } from './entities/day-book.entity';
import { TreatmentPlan } from '../emr/entities/treatment-plan.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProcedurePrice,
      Bill,
      BillItem,
      Estimate,
      DayBook,
      TreatmentPlan,
    ]),
  ],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}