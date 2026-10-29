// backend/src/emr/emr.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmrController } from './emr.controller';
import { EmrService } from './emr.service';
import { Odontogram } from './entities/odontogram.entity';
import { TreatmentPlan } from './entities/treatment-plan.entity';
import { TreatmentPlanItem } from './entities/treatment-plan-item.entity';
import { ProcedureCatalog } from './entities/procedure-catalog.entity';
import { ProcedurePrice } from './entities/procedure-price.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Odontogram,
      TreatmentPlan,
      TreatmentPlanItem,
      ProcedureCatalog,
      ProcedurePrice,
    ]),
  ],
  controllers: [EmrController],
  providers: [EmrService],
  exports: [EmrService],
})
export class EmrModule {}