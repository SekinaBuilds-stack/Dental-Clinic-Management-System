import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Payment } from '../payments/entities/payment.entity';
import { Bill } from '../billing/entities/bill.entity';
import { TreatmentPlanItem } from '../emr/entities/treatment-plan-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Payment,
      Bill,
      TreatmentPlanItem,
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}