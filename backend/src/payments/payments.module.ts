// backend/src/payments/payments.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { Payment } from './entities/payment.entity';
import { PaymentReversal } from './entities/payment-reversal.entity'; // <-- Ensure this is imported
import { InsuranceClaim } from './entities/insurance-claim.entity';
import { InsurancePolicy } from './entities/insurance-policy.entity';
import { PaymentPlan } from './entities/payment-plan.entity';
import { Bill } from '../billing/entities/bill.entity';
import { DayBook } from '../billing/entities/day-book.entity'; 

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Payment,
      PaymentReversal,      // <-- Add PaymentReversal here!
      InsuranceClaim,
      InsurancePolicy,
      PaymentPlan,
      Bill,
      DayBook,
    ]),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}