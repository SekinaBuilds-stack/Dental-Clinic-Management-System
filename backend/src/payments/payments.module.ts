// backend/src/payments/payments.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { Payment } from './entities/payment.entity';
import { PaymentPlan } from './entities/payment-plan.entity';
import { InsuranceClaim } from './entities/insurance-claim.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Payment,
      PaymentPlan,
      InsuranceClaim,
    ]),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}